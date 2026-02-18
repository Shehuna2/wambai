from django.conf import settings
from rest_framework import serializers

from .models import Cart, CartItem, Order, VendorOrder


class CartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = ["id", "product", "qty"]

    def validate(self, attrs):
        product = attrs.get("product") or self.instance.product
        qty = attrs.get("qty", self.instance.qty if self.instance else None)
        if qty is None:
            return attrs
        if qty < product.min_order_qty:
            raise serializers.ValidationError("Quantity below minimum")
        if (qty - product.min_order_qty) % product.qty_step != 0:
            raise serializers.ValidationError("Quantity does not match step")
        return attrs


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "items"]


class CheckoutSerializer(serializers.Serializer):
    payment_method = serializers.ChoiceField(choices=[Order.PaymentMethod.WALLET, Order.PaymentMethod.FINCRA])
    wallet_currency = serializers.ChoiceField(choices=settings.SUPPORTED_CURRENCIES, required=False)
    use_wallet_amount_cents = serializers.IntegerField(required=False, min_value=1)


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = "__all__"


class VendorOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorOrder
        fields = "__all__"
        read_only_fields = ["order", "shop", "subtotal_ngn_cents"]
