from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import ProductViewSet, VendorProductDetailView, VendorProductListCreateView

router = DefaultRouter()
router.register("products", ProductViewSet, basename="products")
urlpatterns = router.urls + [
    path("vendor/products/", VendorProductListCreateView.as_view()),
    path("vendor/products/<int:pk>/", VendorProductDetailView.as_view()),
]
