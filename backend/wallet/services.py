import uuid

from django.db import transaction
from rest_framework.exceptions import ValidationError

from .models import LedgerEntry, Wallet, WalletAdjustment, WalletBalance


def get_or_create_wallet(user):
    wallet, _ = Wallet.objects.get_or_create(user=user)
    return wallet


def create_pending_entry(wallet, currency, amount_cents, entry_type, meta=None, reference=None):
    return LedgerEntry.objects.create(
        wallet=wallet,
        currency=currency,
        amount_cents=amount_cents,
        type=entry_type,
        status=LedgerEntry.EntryStatus.PENDING,
        reference=reference or str(uuid.uuid4()),
        meta=meta or {},
    )


def post_ledger_entry(entry: LedgerEntry):
    with transaction.atomic():
        locked = LedgerEntry.objects.select_for_update().get(id=entry.id)
        if locked.status != LedgerEntry.EntryStatus.PENDING:
            return locked

        balance, _ = WalletBalance.objects.select_for_update().get_or_create(
            wallet=locked.wallet,
            currency=locked.currency,
            defaults={"available_cents": 0},
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


def apply_admin_adjustment(*, wallet, currency, amount_cents, reason, created_by):
    if amount_cents == 0:
        raise ValidationError("Adjustment amount cannot be zero")

    with transaction.atomic():
        balance, _ = WalletBalance.objects.select_for_update().get_or_create(
            wallet=wallet,
            currency=currency,
            defaults={"available_cents": 0},
        )
        next_amount = balance.available_cents + amount_cents
        if next_amount < 0:
            raise ValidationError("Insufficient balance for debit adjustment")

        adjustment = WalletAdjustment.objects.create(
            wallet=wallet,
            currency=currency,
            amount_cents=amount_cents,
            reason=reason,
            created_by=created_by,
        )
        LedgerEntry.objects.create(
            wallet=wallet,
            currency=currency,
            amount_cents=amount_cents,
            type=LedgerEntry.EntryType.ADJUSTMENT,
            status=LedgerEntry.EntryStatus.POSTED,
            reference=adjustment.reference,
            meta={
                "reason": reason,
                "created_by": created_by.id,
                "adjustment_id": adjustment.id,
            },
        )
        balance.available_cents = next_amount
        balance.save(update_fields=["available_cents"])
        return adjustment


def create_pending_conversion_entries(wallet, ref, source_currency, source_minor, dest_currency, dest_minor):
    return (
        create_pending_entry(
            wallet=wallet,
            currency=source_currency,
            amount_cents=-abs(source_minor),
            entry_type=LedgerEntry.EntryType.CONVERSION,
            reference=f"{ref}:debit",
        ),
        create_pending_entry(
            wallet=wallet,
            currency=dest_currency,
            amount_cents=abs(dest_minor),
            entry_type=LedgerEntry.EntryType.CONVERSION,
            reference=f"{ref}:credit",
        ),
    )


def post_entries_by_reference(ref):
    with transaction.atomic():
        entries = list(LedgerEntry.objects.select_for_update().filter(reference__in=[f"{ref}:debit", f"{ref}:credit"]))
        if len(entries) != 2:
            raise ValidationError("Conversion entries missing")
        for entry in entries:
            post_ledger_entry(entry)
        return entries


def fail_entries_by_reference(ref):
    with transaction.atomic():
        LedgerEntry.objects.select_for_update().filter(
            reference__in=[f"{ref}:debit", f"{ref}:credit"],
            status=LedgerEntry.EntryStatus.PENDING,
        ).update(status=LedgerEntry.EntryStatus.FAILED)
