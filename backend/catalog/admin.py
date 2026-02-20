from django.contrib import admin

from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "shop",
        "category",
        "unit",
        "currency",
        "price_cents",
        "stock_qty",
        "is_active",
        "created_at",
    )
    list_filter = ("is_active", "category", "unit", "currency", "created_at")
    search_fields = ("title", "description", "shop__name", "shop__owner__email")
    autocomplete_fields = ("shop",)
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-id",)
