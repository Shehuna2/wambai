from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import UserProfile
from wallet.models import Wallet, WalletBalance


class UserBootstrapTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_creates_profile_wallet_and_all_currency_balances_once(self):
        payload = {
            "email": "newuser@example.com",
            "phone": "123456789",
            "password": "StrongPass123",
            "is_vendor": True,
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, 201)

        user = get_user_model().objects.get(email=payload["email"])
        self.assertEqual(UserProfile.objects.filter(user=user).count(), 1)
        self.assertEqual(Wallet.objects.filter(user=user).count(), 1)

        wallet = Wallet.objects.get(user=user)
        balances = WalletBalance.objects.filter(wallet=wallet)
        self.assertEqual(balances.count(), len(settings.SUPPORTED_CURRENCIES))
        self.assertSetEqual(set(balances.values_list("currency", flat=True)), set(settings.SUPPORTED_CURRENCIES))
        self.assertTrue(all(v == 0 for v in balances.values_list("available_cents", flat=True)))

    def test_register_returns_tokens_and_user_payload_with_balances(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "email": "tokens@example.com",
                "phone": "09000",
                "password": "StrongPass123",
                "is_vendor": False,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertIn("user", response.data)
        self.assertIn("profile", response.data["user"])
        self.assertEqual(len(response.data["user"]["wallet_balances"]), len(settings.SUPPORTED_CURRENCIES))

    def test_me_returns_profile_and_wallet_balances(self):
        register = self.client.post(
            "/api/auth/register/",
            {
                "email": "me@example.com",
                "phone": "0999",
                "password": "StrongPass123",
                "is_vendor": False,
            },
            format="json",
        )
        access = register.data["access"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("profile", response.data)
        self.assertEqual(len(response.data["wallet_balances"]), len(settings.SUPPORTED_CURRENCIES))

    def test_resaving_same_user_does_not_duplicate_profile_or_wallet(self):
        user = get_user_model().objects.create_user(email="resave@example.com", password="StrongPass123")
        self.assertEqual(UserProfile.objects.filter(user=user).count(), 1)
        self.assertEqual(Wallet.objects.filter(user=user).count(), 1)

        user.phone = "111"
        user.save()

        self.assertEqual(UserProfile.objects.filter(user=user).count(), 1)
        self.assertEqual(Wallet.objects.filter(user=user).count(), 1)
        wallet = Wallet.objects.get(user=user)
        self.assertEqual(WalletBalance.objects.filter(wallet=wallet).count(), len(settings.SUPPORTED_CURRENCIES))
