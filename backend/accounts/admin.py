from django.contrib import admin

from .models import User, UserProfile


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "phone", "is_vendor", "is_buyer", "is_active", "is_staff", "created_at")
    list_filter = ("is_vendor", "is_buyer", "is_active", "is_staff", "is_superuser")
    search_fields = ("email", "phone")
    readonly_fields = ("created_at", "updated_at", "last_login")
    ordering = ("-id",)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "full_name", "default_currency", "created_at")
    list_filter = ("default_currency", "created_at")
    search_fields = ("user__email", "full_name")
    autocomplete_fields = ("user",)
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-id",)
