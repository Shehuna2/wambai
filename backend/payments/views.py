import json

from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order
from orders.services import post_conversion_and_finalize_order
from wallet.models import LedgerEntry
from wallet.services import fail_entries_by_reference, post_ledger_entry

from .fincra import verify_fincra_signature
from .models import FxConversion, WebhookEvent


def _extract_reference(data):
    return (
        data.get("reference")
        or data.get("payment", {}).get("reference")
        or data.get("transaction", {}).get("reference")
        or data.get("conversion", {}).get("reference")
    )


class FincraWebhookView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        signature = request.headers.get("x-signature") or request.headers.get("x-fincra-signature")
        if not verify_fincra_signature(request.body, signature):
            return Response({"detail": "Invalid or missing signature"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = json.loads(request.body.decode("utf-8"))
        except json.JSONDecodeError:
            return Response({"detail": "Invalid JSON payload"}, status=status.HTTP_400_BAD_REQUEST)

        event_id = str(payload.get("id") or payload.get("eventId") or "")
        data = payload.get("data", {}) if isinstance(payload.get("data", {}), dict) else {}
        reference = _extract_reference(data)
        status_value = str(data.get("status") or payload.get("status") or "").upper()

        if event_id:
            _, created = WebhookEvent.objects.get_or_create(
                provider="FINCRA",
                event_id=event_id,
                defaults={"payload": payload},
            )
            if not created:
                return Response({"duplicate": True}, status=status.HTTP_200_OK)

        if not reference:
            return Response({"ignored": True}, status=status.HTTP_200_OK)

        success = status_value in {"SUCCESSFUL", "COMPLETED", "SUCCESS"}

        with transaction.atomic():
            entry = LedgerEntry.objects.select_for_update().filter(reference=reference).first()
            if entry and success and entry.status == LedgerEntry.EntryStatus.PENDING:
                post_ledger_entry(entry)

            conversion = FxConversion.objects.select_for_update().filter(reference=reference).first()
            if conversion:
                if success:
                    post_conversion_and_finalize_order(reference)
                else:
                    conversion.status = FxConversion.Status.FAILED
                    conversion.save(update_fields=["status", "updated_at"])
                    fail_entries_by_reference(reference)
                    Order.objects.filter(conversion_reference=reference).update(status=Order.OrderStatus.FAILED_PAYMENT)

        return Response({"ok": True}, status=status.HTTP_200_OK)
