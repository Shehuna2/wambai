from django.db import models

from wallet.models import Wallet


class FxConversion(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING"
        COMPLETED = "COMPLETED"
        FAILED = "FAILED"

    reference = models.CharField(max_length=128, unique=True)
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name="fx_conversions")
    source_currency = models.CharField(max_length=3)
    destination_currency = models.CharField(max_length=3)
    source_amount_cents = models.BigIntegerField(null=True, blank=True)
    destination_amount_cents = models.BigIntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    quote_meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class WebhookEvent(models.Model):
    provider = models.CharField(max_length=32)
    event_id = models.CharField(max_length=128, unique=True)
    received_at = models.DateTimeField(auto_now_add=True)
    payload = models.JSONField(default=dict, blank=True)
