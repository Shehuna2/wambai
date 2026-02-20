from django.conf import settings
from django.db import models
from django.utils import timezone


class Shop(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="shops")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    logo_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    is_approved = models.BooleanField(default=False)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_shops",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def set_approval(self, approved: bool, actor=None):
        self.is_approved = approved
        self.approved_at = timezone.now() if approved else None
        self.approved_by = actor if approved else None

    def __str__(self):
        return self.name
