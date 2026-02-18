from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from catalog.models import Product
from shops.models import Shop


class Cart(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart")


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    qty = models.IntegerField()

    def clean(self):
        if self.qty < self.product.min_order_qty:
            raise ValidationError("Quantity below min_order_qty")
        if (self.qty - self.product.min_order_qty) % self.product.qty_step != 0:
            raise ValidationError("Quantity must follow qty_step")


class Order(models.Model):
    class OrderStatus(models.TextChoices):
        PENDING_PAYMENT = "PENDING_PAYMENT"
        PAID = "PAID"
        CANCELLED = "CANCELLED"
        FULFILLED = "FULFILLED"

    class PaymentMethod(models.TextChoices):
        WALLET = "WALLET"
        FINCRA = "FINCRA"

    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")
    total_ngn_cents = models.BigIntegerField()
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING_PAYMENT)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class VendorOrder(models.Model):
    class VendorOrderStatus(models.TextChoices):
        NEW = "NEW"
        PROCESSING = "PROCESSING"
        SHIPPED = "SHIPPED"
        DELIVERED = "DELIVERED"
        CANCELLED = "CANCELLED"

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="vendor_orders")
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="vendor_orders")
    subtotal_ngn_cents = models.BigIntegerField()
    status = models.CharField(max_length=20, choices=VendorOrderStatus.choices, default=VendorOrderStatus.NEW)


class OrderItem(models.Model):
    vendor_order = models.ForeignKey(VendorOrder, on_delete=models.CASCADE, related_name="items")
    product_snapshot = models.JSONField(default=dict)
    qty = models.IntegerField()
    line_total_ngn_cents = models.BigIntegerField()
