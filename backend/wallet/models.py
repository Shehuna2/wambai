import uuid

from django.conf import settings
from django.db import models


class Wallet(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wallet")
    created_at = models.DateTimeField(auto_now_add=True)


class WalletBalance(models.Model):
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name="balances")
    currency = models.CharField(max_length=3)
    # Stored in minor units for the currency (e.g. kobo for NGN, whole units for XOF/XAF).
    available_cents = models.BigIntegerField(default=0)

    class Meta:
        unique_together = ("wallet", "currency")


class LedgerEntry(models.Model):
    class EntryType(models.TextChoices):
        TOPUP = "TOPUP"
        PURCHASE = "PURCHASE"
        REFUND = "REFUND"
        CONVERSION = "CONVERSION"
        ADJUSTMENT = "ADJUSTMENT"

    class EntryStatus(models.TextChoices):
        PENDING = "PENDING"
        POSTED = "POSTED"
        FAILED = "FAILED"

    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name="entries")
    currency = models.CharField(max_length=3)
    # Stored in minor units for the currency.
    amount_cents = models.BigIntegerField()
    type = models.CharField(max_length=20, choices=EntryType.choices)
    status = models.CharField(max_length=20, choices=EntryStatus.choices, default=EntryStatus.PENDING)
    reference = models.CharField(max_length=128, unique=True)
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class WalletAdjustment(models.Model):
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name="adjustments")
    currency = models.CharField(max_length=3)
    amount_cents = models.BigIntegerField(help_text="Signed minor units: positive credit, negative debit")
    reason = models.TextField()
    reference = models.CharField(max_length=128, unique=True, default="", blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="wallet_adjustments")
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = f"adj-{uuid.uuid4()}"
        super().save(*args, **kwargs)
