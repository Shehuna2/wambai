from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from shops.models import Shop

from .models import Product
from .permissions import IsVendorProductOwnerOrReadOnly
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [IsVendorProductOwnerOrReadOnly]
    filterset_fields = ["shop", "category"]
    search_fields = ["title", "description"]

    def get_queryset(self):
        qs = super().get_queryset().select_related("shop")
        if self.request.user.is_authenticated and self.request.user.is_vendor and self.action in {
            "create",
            "update",
            "partial_update",
            "destroy",
        }:
            return qs.filter(shop__owner=self.request.user)
        return qs

    def perform_create(self, serializer):
        shop = serializer.validated_data.get("shop")
        if not Shop.objects.filter(id=shop.id, owner=self.request.user).exists():
            raise PermissionDenied("You can only add products to your own shop")
        serializer.save()
