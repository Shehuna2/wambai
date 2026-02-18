import uuid
from django.db import transaction
from rest_framework.exceptions import ValidationError

from .models import LedgerEntry, Wallet, WalletBalance


def get_or_create_wallet(user):
    wallet, _ = Wallet.objects.get_or_create(user=user)
    return wallet


def create_pending_entry(wallet, currency, amount_cents, entry_type, meta=None):
    return LedgerEntry.objects.create(
        wallet=wallet,
        currency=currency,
        amount_cents=amount_cents,
        type=entry_type,
        status=LedgerEntry.EntryStatus.PENDING,
        reference=str(uuid.uuid4()),
        meta=meta or {},
    )


def post_ledger_entry(entry: LedgerEntry):
    with transaction.atomic():
        locked = LedgerEntry.objects.select_for_update().get(id=entry.id)
        if locked.status != LedgerEntry.EntryStatus.PENDING:
            return locked

        balance, _ = WalletBalance.objects.select_for_update().get_or_create(
            wallet=locked.wallet, currency=locked.currency, defaults={"available_cents": 0}
        )
        next_amount = balance.available_cents + locked.amount_cents
        if next_amount < 0:
            locked.status = LedgerEntry.EntryStatus.FAILED
            locked.save(update_fields=["status", "updated_at"])
            raise ValidationError("Insufficient balance")

        balance.available_cents = next_amount
        balance.save(update_fields=["available_cents"])
        locked.status = LedgerEntry.EntryStatus.POSTED
        locked.save(update_fields=["status", "updated_at"])
        return locked


def transfer_between_currencies(wallet, source_currency, source_amount_cents, target_currency, target_amount_cents, reference):
    with transaction.atomic():
        debit = LedgerEntry.objects.create(
            wallet=wallet,
            currency=source_currency,
            amount_cents=-abs(source_amount_cents),
            type=LedgerEntry.EntryType.CONVERSION,
            status=LedgerEntry.EntryStatus.PENDING,
            reference=f"{reference}:debit",
        )
        credit = LedgerEntry.objects.create(
            wallet=wallet,
            currency=target_currency,
            amount_cents=abs(target_amount_cents),
            type=LedgerEntry.EntryType.CONVERSION,
            status=LedgerEntry.EntryStatus.PENDING,
            reference=f"{reference}:credit",
        )
        post_ledger_entry(debit)
        post_ledger_entry(credit)
        return debit, credit
