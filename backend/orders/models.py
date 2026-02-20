from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from catalog.models import Product
from shops.models import Shop


INTEGER_UNITS = {Product.Unit.PIECE, Product.Unit.BUNDLE}


class Cart(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart")


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    qty = models.DecimalField(max_digits=12, decimal_places=3)

    def clean(self):
        qty = Decimal(self.qty)
        min_qty = Decimal(self.product.min_order_qty)
        step = Decimal(self.product.qty_step)
        if qty < min_qty:
            raise ValidationError("Quantity below min_order_qty")
        if step <= 0:
            raise ValidationError("qty_step must be positive")
        steps = (qty - min_qty) / step
        if steps != steps.quantize(Decimal("1")):
            raise ValidationError("Quantity must follow qty_step")
        if self.product.unit in INTEGER_UNITS and qty != qty.quantize(Decimal("1")):
            raise ValidationError("Quantity must be whole number for this unit")


class Order(models.Model):
    class OrderStatus(models.TextChoices):
        PENDING_PAYMENT = "PENDING_PAYMENT"
        PAID = "PAID"
        FAILED_PAYMENT = "FAILED_PAYMENT"
        CANCELLED = "CANCELLED"
        FULFILLED = "FULFILLED"

    class PaymentMethod(models.TextChoices):
        WALLET = "WALLET"
        FINCRA = "FINCRA"

    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")
    total_ngn_cents = models.BigIntegerField()
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING_PAYMENT)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    conversion_reference = models.CharField(max_length=128, blank=True, default="")
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
    qty = models.DecimalField(max_digits=12, decimal_places=3)
    line_total_ngn_cents = models.BigIntegerField()
