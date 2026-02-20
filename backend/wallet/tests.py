from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.exceptions import ValidationError

from .models import LedgerEntry, WalletBalance
from .services import apply_admin_adjustment, create_pending_entry, get_or_create_wallet, post_ledger_entry


class WalletAtomicityTests(TestCase):
    def test_double_debit_prevented(self):
        user = get_user_model().objects.create_user(email="u@example.com", password="pass")
        wallet = get_or_create_wallet(user)
        credit = create_pending_entry(wallet, "NGN", 5000, LedgerEntry.EntryType.TOPUP)
        post_ledger_entry(credit)

        debit1 = create_pending_entry(wallet, "NGN", -4000, LedgerEntry.EntryType.PURCHASE)
        debit2 = create_pending_entry(wallet, "NGN", -4000, LedgerEntry.EntryType.PURCHASE)
        post_ledger_entry(debit1)
        with self.assertRaises(ValidationError):
            post_ledger_entry(debit2)

        balance = WalletBalance.objects.get(wallet=wallet, currency="NGN")
        self.assertEqual(balance.available_cents, 1000)


class WalletAdjustmentTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(email="adj-user@example.com", password="pass")
        self.admin = get_user_model().objects.create_user(email="adj-admin@example.com", password="pass", is_staff=True)
        self.wallet = get_or_create_wallet(self.user)

    def test_apply_admin_adjustment_credit_and_debit(self):
        credit = apply_admin_adjustment(
            wallet=self.wallet,
            currency="NGN",
            amount_cents=5000,
            reason="manual credit",
            created_by=self.admin,
        )
        debit = apply_admin_adjustment(
            wallet=self.wallet,
            currency="NGN",
            amount_cents=-2000,
            reason="manual debit",
            created_by=self.admin,
        )

        balance = WalletBalance.objects.get(wallet=self.wallet, currency="NGN")
        self.assertEqual(balance.available_cents, 3000)
        self.assertTrue(LedgerEntry.objects.filter(reference=credit.reference, type=LedgerEntry.EntryType.ADJUSTMENT).exists())
        self.assertTrue(LedgerEntry.objects.filter(reference=debit.reference, type=LedgerEntry.EntryType.ADJUSTMENT).exists())

    def test_apply_admin_adjustment_prevents_negative(self):
        with self.assertRaises(ValidationError):
            apply_admin_adjustment(
                wallet=self.wallet,
                currency="NGN",
                amount_cents=-1000,
                reason="invalid debit",
                created_by=self.admin,
            )
