from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import serializers

from wallet.models import Wallet, WalletBalance

from .models import UserProfile

User = get_user_model()


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["full_name", "avatar_url", "default_currency", "created_at", "updated_at"]


class WalletBalanceMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletBalance
        fields = ["currency", "available_cents"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    is_vendor = serializers.BooleanField(required=False, default=False)

    class Meta:
        model = User
        fields = ["id", "email", "password", "phone", "is_vendor"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data.setdefault("is_buyer", True)
        user = User.objects.create_user(password=password, **validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    wallet_balances = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "phone", "is_vendor", "is_buyer", "created_at", "profile", "wallet_balances"]

    def get_wallet_balances(self, obj):
        wallet, _ = Wallet.objects.get_or_create(user=obj)
        for code in settings.SUPPORTED_CURRENCIES:
            WalletBalance.objects.get_or_create(wallet=wallet, currency=code, defaults={"available_cents": 0})
        balances = wallet.balances.order_by("currency")
        return WalletBalanceMiniSerializer(balances, many=True).data
