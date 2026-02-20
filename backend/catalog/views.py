from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from shops.models import Shop

from .models import Product
from .permissions import IsVendorProductOwnerOrReadOnly
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsVendorProductOwnerOrReadOnly]
    filterset_fields = ["shop", "category"]
    search_fields = ["title", "description"]

    def get_queryset(self):
        qs = Product.objects.all().select_related("shop")
        user = self.request.user
        if user.is_authenticated and user.is_staff:
            return qs
        if user.is_authenticated and user.is_vendor:
            return qs.filter(shop__owner=user)
        return qs.filter(is_active=True, is_approved=True, shop__is_active=True, shop__is_approved=True)

    def perform_create(self, serializer):
        shop = serializer.validated_data.get("shop")
        if not Shop.objects.filter(id=shop.id, owner=self.request.user).exists():
            raise PermissionDenied("You can only add products to your own shop")
        serializer.save()
