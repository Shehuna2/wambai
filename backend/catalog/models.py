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

    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="products")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.OTHER)
    unit = models.CharField(max_length=20, choices=Unit.choices, default=Unit.PIECE)
    price_cents = models.IntegerField()
    currency = models.CharField(max_length=3, default="NGN")
    stock_qty = models.IntegerField(default=0)
    min_order_qty = models.IntegerField(default=1)
    qty_step = models.IntegerField(default=1)
    image_urls = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
