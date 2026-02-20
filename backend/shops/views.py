from rest_framework import viewsets

from .models import Shop
from .permissions import IsVendorAndOwnerOrReadOnly
from .serializers import ShopSerializer


class ShopViewSet(viewsets.ModelViewSet):
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer
    permission_classes = [IsVendorAndOwnerOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def get_queryset(self):
        qs = Shop.objects.all()
        user = self.request.user
        if user.is_authenticated and user.is_staff:
            return qs
        if user.is_authenticated and user.is_vendor:
            return qs.filter(owner=user)
        return qs.filter(is_active=True, is_approved=True)
