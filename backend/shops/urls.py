from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import ShopViewSet, VendorShopView

router = DefaultRouter()
router.register("shops", ShopViewSet, basename="shops")
urlpatterns = router.urls + [
    path("vendor/shop/", VendorShopView.as_view()),
]
