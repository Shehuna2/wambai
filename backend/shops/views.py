from rest_framework import viewsets
from .models import Shop
from .permissions import IsVendorAndOwnerOrReadOnly
from .serializers import ShopSerializer


class ShopViewSet(viewsets.ModelViewSet):
    queryset = Shop.objects.filter(is_active=True)
    serializer_class = ShopSerializer
    permission_classes = [IsVendorAndOwnerOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_authenticated and self.request.user.is_vendor and self.action in ["update", "partial_update", "destroy"]:
            return qs.filter(owner=self.request.user)
        return qs
