from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response

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


class VendorShopView(generics.GenericAPIView):
    serializer_class = ShopSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _ensure_vendor(self, request):
        if not request.user.is_vendor:
            return Response({"detail": "Vendor account required"}, status=status.HTTP_403_FORBIDDEN)
        return None

    def get(self, request):
        vendor_err = self._ensure_vendor(request)
        if vendor_err:
            return vendor_err
        shop = Shop.objects.filter(owner=request.user).order_by("id").first()
        if not shop:
            return Response({"detail": "Shop not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(self.get_serializer(shop).data)

    def post(self, request):
        vendor_err = self._ensure_vendor(request)
        if vendor_err:
            return vendor_err
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(owner=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def patch(self, request):
        vendor_err = self._ensure_vendor(request)
        if vendor_err:
            return vendor_err
        shop = Shop.objects.filter(owner=request.user).order_by("id").first()
        if not shop:
            return Response({"detail": "Shop not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(shop, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
