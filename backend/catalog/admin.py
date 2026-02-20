from django.contrib import admin
from django.utils import timezone

from .models import Product


@admin.action(description="Approve selected products")
def approve_products(modeladmin, request, queryset):
    queryset.update(is_approved=True, approved_at=timezone.now(), approved_by=request.user)


@admin.action(description="Unapprove selected products")
def unapprove_products(modeladmin, request, queryset):
    queryset.update(is_approved=False, approved_at=None, approved_by=None)


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
        "is_approved",
        "approved_by",
        "created_at",
    )
    list_filter = ("is_active", "is_approved", "category", "unit", "currency", "created_at")
    search_fields = ("title", "description", "shop__name", "shop__owner__email")
    autocomplete_fields = ("shop", "approved_by")
    readonly_fields = ("created_at", "updated_at", "approved_at")
    ordering = ("-id",)
    actions = (approve_products, unapprove_products)
