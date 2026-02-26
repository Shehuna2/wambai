from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from catalog.models import Product
from payments.models import FxConversion
from shops.models import Shop
from wallet.models import LedgerEntry
from wallet.services import create_pending_entry, get_or_create_wallet, post_ledger_entry

from .models import Cart, CartItem, Order, OrderItem, VendorOrder
from .serializers import CartItemSerializer
from .services import wallet_checkout


class OrderWalletCheckoutTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(email="b@example.com", password="pass")
        self.vendor = get_user_model().objects.create_user(email="v@example.com", password="pass", is_vendor=True)
        self.shop = Shop.objects.create(owner=self.vendor, name="My Shop")
        self.fabric = Product.objects.create(
            shop=self.shop,
            title="Fabric",
            unit=Product.Unit.YARD,
            price_cents=1000,
            stock_qty=Decimal("100"),
            min_order_qty=Decimal("1.0"),
            qty_step=Decimal("0.5"),
        )
        self.cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=self.cart, product=self.fabric, qty=Decimal("1.5"))

    def _fund_wallet(self, currency, amount):
        wallet = get_or_create_wallet(self.user)
        entry = create_pending_entry(wallet, currency, amount, LedgerEntry.EntryType.TOPUP)
        post_ledger_entry(entry)

    def test_wallet_checkout_ngn_marks_paid(self):
        self._fund_wallet("NGN", 2000)
        order = wallet_checkout(self.user, wallet_currency="NGN")
        self.assertEqual(order.status, Order.OrderStatus.PAID)
        self.assertEqual(order.vendor_orders.count(), 1)

    @patch("orders.services.FincraClient")
    def test_wallet_checkout_non_ngn_pending_until_conversion_webhook(self, fincra_cls):
        self._fund_wallet("USD", 5000)
        fincra = fincra_cls.return_value
        fincra.generate_quote.return_value = {"source_amount_minor": 2000, "target_amount_minor": 1500, "meta": {"rate": 750}}

        order = wallet_checkout(self.user, wallet_currency="USD")
        self.assertEqual(order.status, Order.OrderStatus.PENDING_PAYMENT)
        self.assertTrue(order.conversion_reference)

        conversion = FxConversion.objects.get(reference=order.conversion_reference)
        self.assertEqual(conversion.status, FxConversion.Status.PENDING)
        self.assertEqual(conversion.destination_amount_cents, order.total_ngn_cents)
        self.assertFalse(LedgerEntry.objects.filter(type=LedgerEntry.EntryType.PURCHASE, status=LedgerEntry.EntryStatus.POSTED).exists())


class CartQtyValidationTests(TestCase):
    def test_decimal_qty_validation_min_and_step(self):
        user = get_user_model().objects.create_user(email="b2@example.com", password="pass")
        vendor = get_user_model().objects.create_user(email="v2@example.com", password="pass", is_vendor=True)
        shop = Shop.objects.create(owner=vendor, name="Shop")
        product = Product.objects.create(
            shop=shop,
            title="Fabric",
            unit=Product.Unit.YARD,
            price_cents=1000,
            min_order_qty=Decimal("1"),
            qty_step=Decimal("0.5"),
            stock_qty=Decimal("10"),
        )
        Cart.objects.create(user=user)

        self.assertTrue(CartItemSerializer(data={"product": product.id, "qty": "1.0"}).is_valid())
        self.assertTrue(CartItemSerializer(data={"product": product.id, "qty": "1.5"}).is_valid())
        self.assertTrue(CartItemSerializer(data={"product": product.id, "qty": 1.5}).is_valid())
        self.assertTrue(CartItemSerializer(data={"product": product.id, "qty": "2.0"}).is_valid())
        self.assertFalse(CartItemSerializer(data={"product": product.id, "qty": "1.2"}).is_valid())

    def test_piece_unit_rejects_fractional_qty(self):
        user = get_user_model().objects.create_user(email="b3@example.com", password="pass")
        vendor = get_user_model().objects.create_user(email="v3@example.com", password="pass", is_vendor=True)
        shop = Shop.objects.create(owner=vendor, name="Shop")
        piece = Product.objects.create(
            shop=shop,
            title="Shirt",
            unit=Product.Unit.PIECE,
            price_cents=1000,
            min_order_qty=Decimal("1"),
            qty_step=Decimal("1"),
            stock_qty=Decimal("10"),
        )
        self.assertFalse(CartItemSerializer(data={"product": piece.id, "qty": "1.5"}).is_valid())


class OrderDetailApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.buyer = get_user_model().objects.create_user(email="detail-buyer@example.com", password="pass")
        self.other = get_user_model().objects.create_user(email="detail-other@example.com", password="pass")
        self.vendor = get_user_model().objects.create_user(email="detail-vendor@example.com", password="pass", is_vendor=True)
        shop = Shop.objects.create(owner=self.vendor, name="Detail Shop")
        self.order = Order.objects.create(
            buyer=self.buyer,
            total_ngn_cents=1500,
            status=Order.OrderStatus.PAID,
            payment_method=Order.PaymentMethod.WALLET,
        )
        vendor_order = VendorOrder.objects.create(
            order=self.order,
            shop=shop,
            subtotal_ngn_cents=1500,
        )
        OrderItem.objects.create(
            vendor_order=vendor_order,
            product_snapshot={"title": "Fabric", "unit": "yard"},
            qty=Decimal("1.5"),
            line_total_ngn_cents=1500,
        )

    def test_buyer_can_fetch_own_order_detail(self):
        self.client.force_authenticate(user=self.buyer)
        response = self.client.get(f"/api/orders/{self.order.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["id"], self.order.id)
        self.assertEqual(len(response.data["vendor_orders"]), 1)
        self.assertEqual(len(response.data["vendor_orders"][0]["items"]), 1)

    def test_other_user_cannot_fetch_order_detail(self):
        self.client.force_authenticate(user=self.other)
        response = self.client.get(f"/api/orders/{self.order.id}/")
        self.assertEqual(response.status_code, 404)
