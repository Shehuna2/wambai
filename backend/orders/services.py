from collections import defaultdict
from uuid import uuid4

from django.db import transaction
from rest_framework.exceptions import ValidationError

from catalog.models import Product
from payments.fincra import FincraClient
from wallet.models import LedgerEntry
from wallet.services import (
    create_pending_entry,
    get_or_create_wallet,
    post_ledger_entry,
    transfer_between_currencies,
)

from .models import Cart, Order, OrderItem, VendorOrder


def cart_total_ngn_cents(cart: Cart) -> int:
    return sum(item.product.price_cents * item.qty for item in cart.items.select_related("product", "product__shop"))


def create_paid_order_from_cart(user, payment_method):
    cart, _ = Cart.objects.get_or_create(user=user)
    items = list(cart.items.select_related("product", "product__shop"))
    if not items:
        raise ValidationError("Cart is empty")

    with transaction.atomic():
        total = sum(item.product.price_cents * item.qty for item in items)
        order = Order.objects.create(
            buyer=user,
            total_ngn_cents=total,
            payment_method=payment_method,
            status=Order.OrderStatus.PAID,
        )

        grouped = defaultdict(list)
        for item in items:
            grouped[item.product.shop_id].append(item)

        for group_items in grouped.values():
            shop = group_items[0].product.shop
            subtotal = sum(item.product.price_cents * item.qty for item in group_items)
            vendor_order = VendorOrder.objects.create(order=order, shop=shop, subtotal_ngn_cents=subtotal)
            for cart_item in group_items:
                product = Product.objects.select_for_update().get(pk=cart_item.product_id)
                if product.stock_qty < cart_item.qty:
                    raise ValidationError(f"Insufficient stock for {product.title}")
                product.stock_qty -= cart_item.qty
                product.save(update_fields=["stock_qty"])

                OrderItem.objects.create(
                    vendor_order=vendor_order,
                    qty=cart_item.qty,
                    line_total_ngn_cents=cart_item.product.price_cents * cart_item.qty,
                    product_snapshot={
                        "title": cart_item.product.title,
                        "unit": cart_item.product.unit,
                        "price_cents": cart_item.product.price_cents,
                        "currency": cart_item.product.currency,
                    },
                )

        cart.items.all().delete()
        return order


def wallet_checkout(user, wallet_currency="NGN", use_wallet_amount_cents=None):
    wallet = get_or_create_wallet(user)
    cart, _ = Cart.objects.get_or_create(user=user)
    total_ngn_cents = cart_total_ngn_cents(cart)
    if total_ngn_cents <= 0:
        raise ValidationError("Cart is empty")

    wallet_currency = wallet_currency or "NGN"
    target_ngn_cents = use_wallet_amount_cents or total_ngn_cents
    if target_ngn_cents < total_ngn_cents:
        raise ValidationError("Wallet payment must cover full checkout total")

    if wallet_currency != "NGN":
        fincra = FincraClient()
        quote = fincra.generate_quote(
            source_currency=wallet_currency,
            target_currency="NGN",
            amount_cents=target_ngn_cents,
        )
        conversion_ref = f"conv-{user.id}-{uuid4()}"
        fincra.initiate_conversion(
            reference=conversion_ref,
            source_currency=wallet_currency,
            target_currency="NGN",
            source_amount_cents=quote["source_amount_cents"],
            target_amount_cents=target_ngn_cents,
        )
        transfer_between_currencies(
            wallet=wallet,
            source_currency=wallet_currency,
            source_amount_cents=quote["source_amount_cents"],
            target_currency="NGN",
            target_amount_cents=target_ngn_cents,
            reference=conversion_ref,
        )

    purchase_entry = create_pending_entry(
        wallet=wallet,
        currency="NGN",
        amount_cents=-total_ngn_cents,
        entry_type=LedgerEntry.EntryType.PURCHASE,
        meta={"buyer_id": user.id},
    )
    post_ledger_entry(purchase_entry)

    if target_ngn_cents > total_ngn_cents:
        refund = create_pending_entry(
            wallet=wallet,
            currency="NGN",
            amount_cents=target_ngn_cents - total_ngn_cents,
            entry_type=LedgerEntry.EntryType.REFUND,
            meta={"buyer_id": user.id, "reason": "wallet_overfund_refund"},
        )
        post_ledger_entry(refund)

    return create_paid_order_from_cart(user, payment_method=Order.PaymentMethod.WALLET)
