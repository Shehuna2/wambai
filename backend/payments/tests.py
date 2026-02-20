import hashlib
import hmac
import json
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from decimal import Decimal

from catalog.models import Product
from orders.models import Cart, CartItem, Order
from payments.models import FxConversion
from shops.models import Shop
from wallet.models import LedgerEntry, WalletBalance
from wallet.services import create_pending_conversion_entries, create_pending_entry, get_or_create_wallet, post_ledger_entry


@override_settings(FINCRA_WEBHOOK_SECRET="testsecret")
class WebhookSignatureTests(TestCase):
    def test_invalid_signature_rejected(self):
        client = APIClient()
        payload = {"id": "evt_1", "data": {"reference": "abc", "status": "successful"}}
        response = client.post(
            "/api/payments/webhooks/fincra/",
            payload,
            format="json",
            HTTP_X_SIGNATURE="bad",
        )
        self.assertEqual(response.status_code, 400)

    def test_topup_idempotent_posting(self):
        user = get_user_model().objects.create_user(email="u@example.com", password="pass")
        wallet = get_or_create_wallet(user)
        entry = create_pending_entry(wallet, "NGN", 1000, LedgerEntry.EntryType.TOPUP, reference="topup-ref")

        payload = {"id": "evt_1", "data": {"reference": "topup-ref", "status": "successful"}}
        raw = json.dumps(payload).encode()
        signature = hmac.new(b"testsecret", raw, hashlib.sha512).hexdigest()

        client = APIClient()
        first = client.post(
            "/api/payments/webhooks/fincra/",
            data=raw,
            content_type="application/json",
            HTTP_X_SIGNATURE=signature,
        )
        self.assertEqual(first.status_code, 200)

        second = client.post(
            "/api/payments/webhooks/fincra/",
            data=raw,
            content_type="application/json",
            HTTP_X_SIGNATURE=signature,
        )
        self.assertEqual(second.status_code, 200)

        entry.refresh_from_db()
        balance = WalletBalance.objects.get(wallet=wallet, currency="NGN")
        self.assertEqual(entry.status, LedgerEntry.EntryStatus.POSTED)
        self.assertEqual(balance.available_cents, 1000)


@override_settings(FINCRA_WEBHOOK_SECRET="testsecret")
class ConversionWebhookTests(TestCase):
    def test_conversion_webhook_posts_conversion_and_purchase_and_marks_paid(self):
        user = get_user_model().objects.create_user(email="buyer@example.com", password="pass")
        vendor = get_user_model().objects.create_user(email="vendor@example.com", password="pass", is_vendor=True)
        shop = Shop.objects.create(owner=vendor, name="Shop")
        product = Product.objects.create(shop=shop, title="Fabric", unit="yard", price_cents=1000, stock_qty=Decimal("10"), min_order_qty=Decimal("1"), qty_step=Decimal("0.5"))

        cart = Cart.objects.create(user=user)
        CartItem.objects.create(cart=cart, product=product, qty=Decimal("1.5"))

        wallet = get_or_create_wallet(user)
        topup = create_pending_entry(wallet, "USD", 10000, LedgerEntry.EntryType.TOPUP)
        post_ledger_entry(topup)

        ref = "conv-test-ref"
        FxConversion.objects.create(reference=ref, wallet=wallet, source_currency="USD", destination_currency="NGN", source_amount_cents=2000, destination_amount_cents=1500)
        create_pending_conversion_entries(wallet, ref, "USD", 2000, "NGN", 1500)
        Order.objects.create(buyer=user, total_ngn_cents=1500, status=Order.OrderStatus.PENDING_PAYMENT, payment_method=Order.PaymentMethod.WALLET, conversion_reference=ref)

        payload = {"id": "evt_conv_1", "data": {"reference": ref, "status": "completed"}}
        raw = json.dumps(payload).encode()
        signature = hmac.new(b"testsecret", raw, hashlib.sha512).hexdigest()

        response = APIClient().post('/api/payments/webhooks/fincra/', data=raw, content_type='application/json', HTTP_X_SIGNATURE=signature)
        self.assertEqual(response.status_code, 200)

        order = Order.objects.get(conversion_reference=ref)
        self.assertEqual(order.status, Order.OrderStatus.PAID)
        self.assertTrue(LedgerEntry.objects.filter(reference=f"{ref}:debit", status=LedgerEntry.EntryStatus.POSTED).exists())
        self.assertTrue(LedgerEntry.objects.filter(reference=f"{ref}:credit", status=LedgerEntry.EntryStatus.POSTED).exists())
        self.assertTrue(LedgerEntry.objects.filter(reference=f"purchase-{order.id}", status=LedgerEntry.EntryStatus.POSTED).exists())

