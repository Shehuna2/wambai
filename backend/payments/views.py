import json

from django.db import transaction
from django.http import HttpResponseBadRequest
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order
from wallet.models import LedgerEntry
from wallet.services import post_ledger_entry

from .fincra import verify_fincra_signature


class FincraWebhookView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        signature = request.headers.get("x-signature") or request.headers.get("x-fincra-signature")
        if not verify_fincra_signature(request.body, signature):
            return HttpResponseBadRequest("Invalid signature")

        payload = json.loads(request.body.decode("utf-8"))
        event_id = payload.get("id") or payload.get("eventId")
        reference = payload.get("data", {}).get("reference")
        status_value = payload.get("data", {}).get("status", "").upper()

        if not reference or status_value not in {"SUCCESSFUL", "COMPLETED", "SUCCESS"}:
            return Response({"ignored": True}, status=status.HTTP_200_OK)

        with transaction.atomic():
            if LedgerEntry.objects.filter(meta__event_id=event_id).exists() and event_id:
                return Response({"duplicate": True})

            entry = LedgerEntry.objects.select_for_update().filter(reference=reference).first()
            if entry and entry.status == LedgerEntry.EntryStatus.PENDING:
                entry.meta = {**entry.meta, "event_id": event_id}
                entry.save(update_fields=["meta", "updated_at"])
                post_ledger_entry(entry)

            if reference.startswith("order-"):
                order_id = reference.split("order-")[-1]
                Order.objects.filter(id=order_id, status=Order.OrderStatus.PENDING_PAYMENT).update(status=Order.OrderStatus.PAID)

        return Response({"ok": True})
