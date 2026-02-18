from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = "__all__"

    def validate(self, attrs):
        min_qty = attrs.get("min_order_qty", getattr(self.instance, "min_order_qty", 1))
        step = attrs.get("qty_step", getattr(self.instance, "qty_step", 1))
        if min_qty < 1 or step < 1:
            raise serializers.ValidationError("min_order_qty and qty_step must be >= 1")
        return attrs
