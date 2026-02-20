from rest_framework import serializers

from .models import Shop


class ShopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = "__all__"
        read_only_fields = ["owner", "is_approved", "approved_at", "approved_by", "created_at", "updated_at"]
