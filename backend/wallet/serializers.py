from django.conf import settings
from rest_framework import serializers

from .models import LedgerEntry, WalletBalance


class WalletBalanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletBalance
        fields = ["currency", "available_cents"]


class LedgerEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LedgerEntry
        fields = ["currency", "amount_cents", "type", "status", "reference", "meta", "created_at"]


class TopUpInitSerializer(serializers.Serializer):
    currency = serializers.ChoiceField(choices=settings.SUPPORTED_CURRENCIES)
    amount_cents = serializers.IntegerField(min_value=1)
