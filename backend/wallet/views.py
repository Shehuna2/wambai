from rest_framework import permissions
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from payments.models import WebhookEvent
from payments.fincra import FincraClient
from .models import LedgerEntry, WalletAdjustment
from .serializers import LedgerEntrySerializer, TopUpInitSerializer, WalletBalanceSerializer
from .services import create_pending_entry, get_or_create_wallet


class WalletView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        wallet = get_or_create_wallet(request.user)
        balances = wallet.balances.all().order_by("currency")
        entries = wallet.entries.order_by("-created_at")[:20]
        return Response(
            {
                "balances": WalletBalanceSerializer(balances, many=True).data,
                "recent_ledger": LedgerEntrySerializer(entries, many=True).data,
            }
        )


class TopUpInitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        payload = TopUpInitSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        wallet = get_or_create_wallet(request.user)
        entry = create_pending_entry(
            wallet=wallet,
            currency=payload.validated_data["currency"],
            amount_cents=payload.validated_data["amount_cents"],
            entry_type=LedgerEntry.EntryType.TOPUP,
            meta={"user_id": request.user.id},
        )
        fincra = FincraClient()
        checkout_url = fincra.initialize_checkout(
            reference=entry.reference,
            amount_minor=entry.amount_cents,
            currency=entry.currency,
            customer_email=request.user.email,
        )
        return Response({"reference": entry.reference, "checkout_url": checkout_url})


class WalletAdjustmentAuditView(ListAPIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, *args, **kwargs):
        rows = (
            WalletAdjustment.objects.select_related("wallet__user", "created_by")
            .order_by("-created_at")[:100]
        )
        return Response(
            [
                {
                    "id": row.id,
                    "reference": row.reference,
                    "wallet_user_email": row.wallet.user.email,
                    "currency": row.currency,
                    "amount_cents": row.amount_cents,
                    "reason": row.reason,
                    "created_by_email": row.created_by.email,
                    "created_at": row.created_at,
                }
                for row in rows
            ]
        )


class WebhookEventAuditView(ListAPIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, *args, **kwargs):
        rows = WebhookEvent.objects.order_by("-received_at")[:100]
        return Response(
            [
                {
                    "id": row.id,
                    "provider": row.provider,
                    "event_id": row.event_id,
                    "received_at": row.received_at,
                    "payload": row.payload,
                }
                for row in rows
            ]
        )
