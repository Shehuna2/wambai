from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from payments.fincra import FincraClient
from .models import LedgerEntry
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
