from django.contrib import admin

from .models import LedgerEntry, Wallet, WalletBalance


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "created_at")
    search_fields = ("user__email",)
    autocomplete_fields = ("user",)
    readonly_fields = ("created_at",)
    ordering = ("-id",)


@admin.register(WalletBalance)
class WalletBalanceAdmin(admin.ModelAdmin):
    list_display = ("id", "wallet", "currency", "available_cents")
    list_filter = ("currency",)
    search_fields = ("wallet__user__email", "currency")
    autocomplete_fields = ("wallet",)
    readonly_fields = ("available_cents",)
    ordering = ("-id",)


@admin.register(LedgerEntry)
class LedgerEntryAdmin(admin.ModelAdmin):
    list_display = ("id", "wallet", "currency", "amount_cents", "type", "status", "reference", "created_at")
    list_filter = ("status", "type", "currency", "created_at")
    search_fields = ("reference", "wallet__user__email")
    autocomplete_fields = ("wallet",)
    readonly_fields = ("reference", "amount_cents", "currency", "type", "wallet", "meta", "created_at", "updated_at")
    ordering = ("-id",)
