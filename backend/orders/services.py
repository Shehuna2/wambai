from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP
from uuid import uuid4

from django.db import transaction
from rest_framework.exceptions import ValidationError

from catalog.models import Product
from payments.fincra import FincraClient
from payments.models import FxConversion
from wallet.models import LedgerEntry
from wallet.services import (
    create_pending_conversion_entries,
    create_pending_entry,
    get_or_create_wallet,
    post_entries_by_reference,
    post_ledger_entry,
)

from .models import Cart, Order, OrderItem, VendorOrder


def _line_total_minor(price_minor: int, qty: Decimal) -> int:
    return int((Decimal(price_minor) * qty).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def cart_total_ngn_cents(cart: Cart) -> int:
    return sum(
        _line_total_minor(item.product.price_cents, Decimal(item.qty))
        for item in cart.items.select_related("product", "product__shop")
    )


def _create_vendor_orders_and_decrement_stock(order: Order, items):
    grouped = defaultdict(list)
    for item in items:
        grouped[item.product.shop_id].append(item)

    for group_items in grouped.values():
        shop = group_items[0].product.shop
        subtotal = sum(_line_total_minor(item.product.price_cents, Decimal(item.qty)) for item in group_items)
        vendor_order = VendorOrder.objects.create(order=order, shop=shop, subtotal_ngn_cents=subtotal)
        for cart_item in group_items:
            product = Product.objects.select_for_update().get(pk=cart_item.product_id)
            if product.stock_qty < cart_item.qty:
                raise ValidationError(f"Insufficient stock for {product.title}")
            product.stock_qty = Decimal(product.stock_qty) - Decimal(cart_item.qty)
            product.save(update_fields=["stock_qty"])

            OrderItem.objects.create(
                vendor_order=vendor_order,
                qty=cart_item.qty,
                line_total_ngn_cents=_line_total_minor(cart_item.product.price_cents, Decimal(cart_item.qty)),
                product_snapshot={
                    "title": cart_item.product.title,
                    "unit": cart_item.product.unit,
                    "price_cents": cart_item.product.price_cents,
                    "currency": cart_item.product.currency,
                },
            )


def finalize_wallet_order(order: Order):
    cart, _ = Cart.objects.get_or_create(user=order.buyer)
    items = list(cart.items.select_related("product", "product__shop"))
    if not items:
        raise ValidationError("Cart is empty")

    with transaction.atomic():
        locked_order = Order.objects.select_for_update().get(id=order.id)
        if locked_order.status == Order.OrderStatus.PAID:
            return locked_order
        purchase_entry = LedgerEntry.objects.filter(reference=f"purchase-{locked_order.id}").first()
        if not purchase_entry:
            purchase_entry = create_pending_entry(
                wallet=get_or_create_wallet(order.buyer),
                currency="NGN",
                amount_cents=-locked_order.total_ngn_cents,
                entry_type=LedgerEntry.EntryType.PURCHASE,
                reference=f"purchase-{locked_order.id}",
                meta={"order_id": locked_order.id, "buyer_id": order.buyer_id},
            )
        if purchase_entry.status == LedgerEntry.EntryStatus.PENDING:
            post_ledger_entry(purchase_entry)
        _create_vendor_orders_and_decrement_stock(locked_order, items)
        locked_order.status = Order.OrderStatus.PAID
        locked_order.save(update_fields=["status", "updated_at"])
        cart.items.all().delete()
        return locked_order


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

    with transaction.atomic():
        order = Order.objects.create(
            buyer=user,
            total_ngn_cents=total_ngn_cents,
            payment_method=Order.PaymentMethod.WALLET,
            status=Order.OrderStatus.PENDING_PAYMENT,
        )

        if wallet_currency == "NGN":
            return finalize_wallet_order(order)

        fincra = FincraClient()
        quote = fincra.generate_quote(
            source_currency=wallet_currency,
            target_currency="NGN",
            amount_minor=target_ngn_cents,
            amount_is="destination",
        )
        conversion_ref = f"conv-{uuid4()}"
        FxConversion.objects.create(
            reference=conversion_ref,
            wallet=wallet,
            source_currency=wallet_currency,
            destination_currency="NGN",
            source_amount_cents=quote["source_amount_minor"],
            destination_amount_cents=target_ngn_cents,
            status=FxConversion.Status.PENDING,
            quote_meta=quote.get("meta", {}),
        )
        create_pending_conversion_entries(
            wallet=wallet,
            ref=conversion_ref,
            source_currency=wallet_currency,
            source_minor=quote["source_amount_minor"],
            dest_currency="NGN",
            dest_minor=target_ngn_cents,
        )
        fincra.initiate_conversion(
            reference=conversion_ref,
            source_currency=wallet_currency,
            target_currency="NGN",
            source_amount_minor=quote["source_amount_minor"],
            destination_amount_minor=target_ngn_cents,
        )
        order.conversion_reference = conversion_ref
        order.save(update_fields=["conversion_reference"])
        return order


def post_conversion_and_finalize_order(conversion_reference: str):
    with transaction.atomic():
        conversion = FxConversion.objects.select_for_update().get(reference=conversion_reference)
        if conversion.status == FxConversion.Status.COMPLETED:
            return
        conversion.status = FxConversion.Status.COMPLETED
        conversion.save(update_fields=["status", "updated_at"])
        post_entries_by_reference(conversion_reference)

    order = Order.objects.filter(conversion_reference=conversion_reference).first()
    if order and order.status == Order.OrderStatus.PENDING_PAYMENT:
        finalize_wallet_order(order)
