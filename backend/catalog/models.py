from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models

from shops.models import Shop


class Product(models.Model):
    class Category(models.TextChoices):
        CLOTHING = "clothing", "Clothing"
        WOOL = "wool", "Wool"
        FABRIC = "fabric", "Fabric"
        OTHER = "other", "Other"

    class Unit(models.TextChoices):
        PIECE = "piece", "Piece"
        YARD = "yard", "Yard"
        METER = "meter", "Meter"
        KG = "kg", "Kg"
        BUNDLE = "bundle", "Bundle"

    WHOLE_NUMBER_UNITS = {Unit.PIECE, Unit.BUNDLE}

    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="products")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.OTHER)
    unit = models.CharField(max_length=20, choices=Unit.choices, default=Unit.PIECE)
    price_cents = models.IntegerField()
    currency = models.CharField(max_length=3, default="NGN")
    stock_qty = models.DecimalField(max_digits=14, decimal_places=3, default=0)
    min_order_qty = models.DecimalField(max_digits=12, decimal_places=3, default=1)
    qty_step = models.DecimalField(max_digits=12, decimal_places=3, default=1)
    image_urls = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @staticmethod
    def _is_whole_number(value: Decimal) -> bool:
        return value == value.quantize(Decimal("1"))

    def clean(self):
        min_qty = Decimal(self.min_order_qty)
        step = Decimal(self.qty_step)
        stock = Decimal(self.stock_qty)
        if min_qty <= 0 or step <= 0:
            raise ValidationError("min_order_qty and qty_step must be > 0")
        if stock < 0:
            raise ValidationError("stock_qty cannot be negative")
        if self.unit in self.WHOLE_NUMBER_UNITS:
            if not self._is_whole_number(min_qty) or not self._is_whole_number(step):
                raise ValidationError("piece and bundle units require whole-number qty rules")
            if not self._is_whole_number(stock):
                raise ValidationError("piece and bundle units require whole-number stock")

    def __str__(self):
        return self.title
