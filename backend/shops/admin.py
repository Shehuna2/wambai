from django.contrib import admin
from django.utils import timezone

from .models import Shop


@admin.action(description="Approve selected shops")
def approve_shops(modeladmin, request, queryset):
    queryset.update(is_approved=True, approved_at=timezone.now(), approved_by=request.user)


@admin.action(description="Unapprove selected shops")
def unapprove_shops(modeladmin, request, queryset):
    queryset.update(is_approved=False, approved_at=None, approved_by=None)


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "owner", "location", "is_active", "is_approved", "approved_by", "created_at")
    list_filter = ("is_active", "is_approved", "created_at")
    search_fields = ("name", "location", "owner__email")
    autocomplete_fields = ("owner", "approved_by")
    readonly_fields = ("created_at", "updated_at", "approved_at")
    ordering = ("-id",)
    actions = (approve_shops, unapprove_shops)
