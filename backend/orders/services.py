from collections import defaultdict

from django.db import transaction
from rest_framework.exceptions import ValidationError

from catalog.models import Product
from payments.fincra import FincraClient
from wallet.models import LedgerEntry
from wallet.services import create_pending_entry, get_or_create_wallet, post_ledger_entry, transfer_between_currencies

from .models import Cart, Order, OrderItem, VendorOrder


def cart_total_ngn_cents(cart: Cart):
    total = 0
    for item in cart.items.select_related("product", "product__shop"):
        total += item.product.price_cents * item.qty
    return total


def create_paid_order_from_cart(user, payment_method):
    cart, _ = Cart.objects.get_or_create(user=user)
    items = list(cart.items.select_related("product", "product__shop"))
    if not items:
        raise ValidationError("Cart is empty")

    with transaction.atomic():
        total = sum(i.product.price_cents * i.qty for i in items)
        order = Order.objects.create(buyer=user, total_ngn_cents=total, payment_method=payment_method, status=Order.OrderStatus.PAID)

        grouped = defaultdict(list)
        for item in items:
            grouped[item.product.shop_id].append(item)

        for _, group_items in grouped.items():
            shop = group_items[0].product.shop
            subtotal = sum(i.product.price_cents * i.qty for i in group_items)
            vendor_order = VendorOrder.objects.create(order=order, shop=shop, subtotal_ngn_cents=subtotal)
            for ci in group_items:
                OrderItem.objects.create(
                    vendor_order=vendor_order,
                    qty=ci.qty,
                    line_total_ngn_cents=ci.product.price_cents * ci.qty,
                    product_snapshot={
                        "title": ci.product.title,
                        "unit": ci.product.unit,
                        "price_cents": ci.product.price_cents,
                        "currency": ci.product.currency,
                    },
                )
                product = Product.objects.select_for_update().get(pk=ci.product_id)
                if product.stock_qty < ci.qty:
                    raise ValidationError(f"Insufficient stock for {product.title}")
                product.stock_qty -= ci.qty
                product.save(update_fields=["stock_qty"])

        cart.items.all().delete()
        return order


def wallet_checkout(user, wallet_currency=None):
    wallet = get_or_create_wallet(user)
    cart, _ = Cart.objects.get_or_create(user=user)
    total = cart_total_ngn_cents(cart)
    wallet_currency = wallet_currency or "NGN"

    if wallet_currency != "NGN":
        fincra = FincraClient()
        quote = fincra.generate_quote(source_currency=wallet_currency, target_currency="NGN", amount_cents=total)
        source_amount = quote["source_amount_cents"]
        transfer_between_currencies(
            wallet=wallet,
            source_currency=wallet_currency,
            source_amount_cents=source_amount,
            target_currency="NGN",
            target_amount_cents=total,
            reference=f"conv-{user.id}-{total}",
        )

    purchase_entry = create_pending_entry(
        wallet=wallet,
        currency="NGN",
        amount_cents=-total,
        entry_type=LedgerEntry.EntryType.PURCHASE,
        meta={"buyer_id": user.id},
    )
    post_ledger_entry(purchase_entry)
    return create_paid_order_from_cart(user, payment_method=Order.PaymentMethod.WALLET)
