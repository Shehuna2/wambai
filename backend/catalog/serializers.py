from decimal import Decimal

from rest_framework import serializers

from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    stock_qty = serializers.DecimalField(max_digits=14, decimal_places=3, coerce_to_string=True)
    min_order_qty = serializers.DecimalField(max_digits=12, decimal_places=3, coerce_to_string=True)
    qty_step = serializers.DecimalField(max_digits=12, decimal_places=3, coerce_to_string=True)

    class Meta:
        model = Product
        fields = "__all__"

    def validate(self, attrs):
        min_qty = Decimal(attrs.get("min_order_qty", getattr(self.instance, "min_order_qty", 1)))
        step = Decimal(attrs.get("qty_step", getattr(self.instance, "qty_step", 1)))
        stock_qty = Decimal(attrs.get("stock_qty", getattr(self.instance, "stock_qty", 0)))
        unit = attrs.get("unit", getattr(self.instance, "unit", Product.Unit.PIECE))

        if min_qty <= 0 or step <= 0:
            raise serializers.ValidationError("min_order_qty and qty_step must be > 0")
        if stock_qty < 0:
            raise serializers.ValidationError("stock_qty cannot be negative")
        if unit in Product.WHOLE_NUMBER_UNITS:
            if min_qty != min_qty.quantize(Decimal("1")) or step != step.quantize(Decimal("1")):
                raise serializers.ValidationError("piece and bundle units require whole-number qty rules")
            if stock_qty != stock_qty.quantize(Decimal("1")):
                raise serializers.ValidationError("piece and bundle units require whole-number stock")
        return attrs
