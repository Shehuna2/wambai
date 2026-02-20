from django.contrib import admin

from .models import Cart, CartItem, Order, OrderItem, VendorOrder


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("id", "user")
    search_fields = ("user__email",)
    autocomplete_fields = ("user",)
    ordering = ("-id",)


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ("id", "cart", "product", "qty")
    search_fields = ("cart__user__email", "product__title")
    autocomplete_fields = ("cart", "product")
    ordering = ("-id",)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "buyer", "payment_method", "status", "total_ngn_cents", "conversion_reference", "created_at")
    list_filter = ("status", "payment_method", "created_at")
    search_fields = ("id", "buyer__email", "conversion_reference")
    autocomplete_fields = ("buyer",)
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-id",)


@admin.register(VendorOrder)
class VendorOrderAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "shop", "status", "subtotal_ngn_cents")
    list_filter = ("status",)
    search_fields = ("id", "order__id", "shop__name", "order__buyer__email")
    autocomplete_fields = ("order", "shop")
    ordering = ("-id",)


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("id", "vendor_order", "qty", "line_total_ngn_cents")
    search_fields = ("id", "vendor_order__order__id", "vendor_order__order__buyer__email")
    autocomplete_fields = ("vendor_order",)
    readonly_fields = ("product_snapshot",)
    ordering = ("-id",)
