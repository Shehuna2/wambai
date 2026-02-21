from rest_framework import generics, permissions, viewsets
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
        return qs.filter(is_active=True, shop__is_active=True, shop__is_approved=True)

    def perform_create(self, serializer):
        shop = serializer.validated_data.get("shop")
        if not Shop.objects.filter(id=shop.id, owner=self.request.user).exists():
            raise PermissionDenied("You can only add products to your own shop")
        serializer.save()


class VendorProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(shop__owner=self.request.user).select_related("shop").order_by("-id")

    def perform_create(self, serializer):
        if not self.request.user.is_vendor:
            raise PermissionDenied("Vendor account required")
        shop = serializer.validated_data.get("shop")
        if not shop or shop.owner_id != self.request.user.id:
            raise PermissionDenied("You can only add products to your own shop")
        serializer.save()


class VendorProductDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(shop__owner=self.request.user).select_related("shop")

    def perform_update(self, serializer):
        if not self.request.user.is_vendor:
            raise PermissionDenied("Vendor account required")
        shop = serializer.validated_data.get("shop")
        if shop and shop.owner_id != self.request.user.id:
            raise PermissionDenied("You can only move products to your own shop")
        serializer.save()
