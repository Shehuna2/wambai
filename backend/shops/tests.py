from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Shop


class ShopApprovalVisibilityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.vendor = get_user_model().objects.create_user(email="vendor@example.com", password="pass", is_vendor=True)
        self.buyer = get_user_model().objects.create_user(email="buyer@example.com", password="pass", is_buyer=True)
        self.admin = get_user_model().objects.create_user(email="admin@example.com", password="pass", is_staff=True)

        self.shop = Shop.objects.create(owner=self.vendor, name="Hidden Shop", is_active=True, is_approved=False)

    def test_buyer_cannot_see_unapproved_shop(self):
        self.client.force_authenticate(user=self.buyer)
        response = self.client.get("/api/shops/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 0)

    def test_buyer_cannot_see_inactive_shop(self):
        self.shop.is_approved = True
        self.shop.is_active = False
        self.shop.save(update_fields=["is_approved", "is_active"])
        self.client.force_authenticate(user=self.buyer)
        response = self.client.get("/api/shops/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 0)

    def test_vendor_can_see_own_unapproved_shop(self):
        self.client.force_authenticate(user=self.vendor)
        response = self.client.get("/api/shops/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_admin_can_see_unapproved_shop(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/shops/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)


class VendorShopEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.vendor = get_user_model().objects.create_user(email="vendor-shop@example.com", password="pass", is_vendor=True)

    def test_vendor_can_create_and_toggle_shop_active(self):
        self.client.force_authenticate(user=self.vendor)
        create_resp = self.client.post(
            "/api/vendor/shop/",
            {"name": "My Shop", "description": "Desc", "location": "Kano", "logo_url": "", "is_active": True},
            format="json",
        )
        self.assertEqual(create_resp.status_code, 201)

        patch_resp = self.client.patch("/api/vendor/shop/", {"is_active": False}, format="json")
        self.assertEqual(patch_resp.status_code, 200)
        self.assertEqual(patch_resp.data["is_active"], False)
