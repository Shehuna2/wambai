from rest_framework import serializers
from .models import WalletBalance, LedgerEntry


class WalletBalanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletBalance
        fields = ["currency", "available_cents"]


class LedgerEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LedgerEntry
        fields = ["currency", "amount_cents", "type", "status", "reference", "meta", "created_at"]


class TopUpInitSerializer(serializers.Serializer):
    currency = serializers.CharField(max_length=3)
    amount_cents = serializers.IntegerField(min_value=1)
