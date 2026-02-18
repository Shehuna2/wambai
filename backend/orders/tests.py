from django.contrib.auth import get_user_model
from django.test import TestCase
from shops.models import Shop
from catalog.models import Product
from .models import Cart
from .serializers import CartItemSerializer


class CartQtyValidationTests(TestCase):
    def test_qty_validation_min_and_step(self):
        user = get_user_model().objects.create_user(email="b@example.com", password="pass")
        vendor = get_user_model().objects.create_user(email="v@example.com", password="pass", is_vendor=True)
        shop = Shop.objects.create(owner=vendor, name="My Shop")
        product = Product.objects.create(shop=shop, title="Fabric", price_cents=1000, min_order_qty=2, qty_step=3)
        cart = Cart.objects.create(user=user)

        bad_min = CartItemSerializer(data={"product": product.id, "qty": 1})
        self.assertFalse(bad_min.is_valid())

        bad_step = CartItemSerializer(data={"product": product.id, "qty": 4})
        self.assertFalse(bad_step.is_valid())

        good = CartItemSerializer(data={"product": product.id, "qty": 5})
        self.assertTrue(good.is_valid())
