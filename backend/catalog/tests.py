from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase

from shops.models import Shop

from .serializers import ProductSerializer


class ProductValidationTests(TestCase):
    def setUp(self):
        owner = get_user_model().objects.create_user(email="vendor-catalog@example.com", password="pass", is_vendor=True)
        self.shop = Shop.objects.create(owner=owner, name="Catalog Shop")

    def test_piece_rejects_fractional_stock(self):
        serializer = ProductSerializer(
            data={
                "shop": self.shop.id,
                "title": "Piece Item",
                "category": "clothing",
                "unit": "piece",
                "price_cents": 1000,
                "currency": "NGN",
                "stock_qty": "1.5",
                "min_order_qty": "1",
                "qty_step": "1",
                "image_urls": [],
                "is_active": True,
            }
        )
        self.assertFalse(serializer.is_valid())

    def test_fabric_allows_fractional_stock(self):
        serializer = ProductSerializer(
            data={
                "shop": self.shop.id,
                "title": "Fabric",
                "category": "fabric",
                "unit": "yard",
                "price_cents": 1000,
                "currency": "NGN",
                "stock_qty": str(Decimal("10.125")),
                "min_order_qty": "1.0",
                "qty_step": "0.5",
                "image_urls": [],
                "is_active": True,
            }
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
