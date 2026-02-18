from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.exceptions import ValidationError

from .models import LedgerEntry, WalletBalance
from .services import create_pending_entry, get_or_create_wallet, post_ledger_entry


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
