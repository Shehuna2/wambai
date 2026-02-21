from decimal import Decimal

from django.conf import settings
from rest_framework import serializers

from catalog.models import Product

from .models import Cart, CartItem, Order, OrderItem, VendorOrder


class CartItemSerializer(serializers.ModelSerializer):
    qty = serializers.DecimalField(max_digits=12, decimal_places=3, coerce_to_string=True)

    class Meta:
        model = CartItem
        fields = ["id", "product", "qty"]

    def validate(self, attrs):
        product = attrs.get("product") or self.instance.product
        qty = attrs.get("qty", self.instance.qty if self.instance else None)
        if qty is None:
            return attrs

        qty = Decimal(qty)
        min_qty = Decimal(product.min_order_qty)
        step = Decimal(product.qty_step)
        if qty < min_qty:
            raise serializers.ValidationError("Quantity below minimum")
        steps = (qty - min_qty) / step
        if steps != steps.quantize(Decimal("1")):
            raise serializers.ValidationError("Quantity does not match step")
        if product.unit in {Product.Unit.PIECE, Product.Unit.BUNDLE} and qty != qty.quantize(Decimal("1")):
            raise serializers.ValidationError("Quantity must be whole number for this unit")
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




class OrderItemSerializer(serializers.ModelSerializer):
    qty = serializers.DecimalField(max_digits=12, decimal_places=3, coerce_to_string=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product_snapshot", "qty", "line_total_ngn_cents"]


class VendorOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    shop_name = serializers.CharField(source="shop.name", read_only=True)
    order_created_at = serializers.DateTimeField(source="order.created_at", read_only=True)

    class Meta:
        model = VendorOrder
        fields = [
            "id",
            "order",
            "shop",
            "shop_name",
            "subtotal_ngn_cents",
            "status",
            "order_created_at",
            "items",
        ]
        read_only_fields = ["order", "shop", "shop_name", "subtotal_ngn_cents", "order_created_at", "items"]
