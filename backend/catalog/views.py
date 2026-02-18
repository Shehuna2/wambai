from rest_framework import viewsets
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
        return super().get_queryset().select_related("shop")
