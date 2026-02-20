from django.contrib import admin

from .models import Shop


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "owner", "location", "is_active", "created_at")
    list_filter = ("is_active", "created_at")
    search_fields = ("name", "location", "owner__email")
    autocomplete_fields = ("owner",)
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-id",)
