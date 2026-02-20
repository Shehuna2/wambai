from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from shops.models import Shop

from .models import Product
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


class ProductApprovalVisibilityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.vendor = get_user_model().objects.create_user(email="vendor-prod@example.com", password="pass", is_vendor=True)
        self.buyer = get_user_model().objects.create_user(email="buyer-prod@example.com", password="pass", is_buyer=True)
        self.admin = get_user_model().objects.create_user(email="admin-prod@example.com", password="pass", is_staff=True)

        self.shop = Shop.objects.create(owner=self.vendor, name="Vendor Shop", is_active=True, is_approved=False)
        self.product = Product.objects.create(
            shop=self.shop,
            title="Hidden Fabric",
            unit=Product.Unit.YARD,
            price_cents=1000,
            stock_qty=Decimal("10"),
            min_order_qty=Decimal("1"),
            qty_step=Decimal("0.5"),
            is_active=True,
            is_approved=False,
        )

    def test_buyer_cannot_see_unapproved_product(self):
        self.client.force_authenticate(user=self.buyer)
        response = self.client.get("/api/products/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 0)

    def test_vendor_can_see_own_unapproved_product(self):
        self.client.force_authenticate(user=self.vendor)
        response = self.client.get("/api/products/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_admin_can_see_unapproved_product(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/products/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
