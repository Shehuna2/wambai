from django import forms
from django.contrib import admin

from .models import LedgerEntry, Wallet, WalletAdjustment, WalletBalance
from .services import apply_admin_adjustment


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
    readonly_fields = (
        "wallet",
        "currency",
        "amount_cents",
        "type",
        "status",
        "reference",
        "meta",
        "created_at",
        "updated_at",
    )
    ordering = ("-id",)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class WalletAdjustmentAdminForm(forms.ModelForm):
    class Meta:
        model = WalletAdjustment
        fields = ("wallet", "currency", "amount_cents", "reason")


@admin.register(WalletAdjustment)
class WalletAdjustmentAdmin(admin.ModelAdmin):
    form = WalletAdjustmentAdminForm
    list_display = ("id", "wallet", "currency", "amount_cents", "reference", "created_by", "created_at")
    list_filter = ("currency", "created_at")
    search_fields = ("reference", "wallet__user__email", "reason")
    autocomplete_fields = ("wallet", "created_by")
    readonly_fields = ("reference", "created_at")
    ordering = ("-id",)

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return (
                "wallet",
                "currency",
                "amount_cents",
                "reason",
                "reference",
                "created_by",
                "created_at",
            )
        return self.readonly_fields

    def save_model(self, request, obj, form, change):
        if change:
            return
        adjustment = apply_admin_adjustment(
            wallet=obj.wallet,
            currency=obj.currency,
            amount_cents=obj.amount_cents,
            reason=obj.reason,
            created_by=request.user,
        )
        obj.id = adjustment.id
        obj.reference = adjustment.reference
        obj.created_by = adjustment.created_by
        obj.created_at = adjustment.created_at

    def has_delete_permission(self, request, obj=None):
        return False
