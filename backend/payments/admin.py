from django.contrib import admin

from .models import FxConversion, WebhookEvent


@admin.register(FxConversion)
class FxConversionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "reference",
        "wallet",
        "source_currency",
        "destination_currency",
        "source_amount_cents",
        "destination_amount_cents",
        "status",
        "created_at",
    )
    list_filter = ("status", "source_currency", "destination_currency", "created_at")
    search_fields = ("reference", "wallet__user__email")
    autocomplete_fields = ("wallet",)
    readonly_fields = (
        "reference",
        "wallet",
        "source_currency",
        "destination_currency",
        "source_amount_cents",
        "destination_amount_cents",
        "quote_meta",
        "created_at",
        "updated_at",
    )
    ordering = ("-id",)


@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = ("id", "provider", "event_id", "received_at")
    list_filter = ("provider", "received_at")
    search_fields = ("event_id", "provider")
    readonly_fields = ("provider", "event_id", "payload", "received_at")
    ordering = ("-id",)
