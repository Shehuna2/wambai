from django.urls import path
from .views import (
    CartItemCreateView,
    CartItemUpdateDeleteView,
    CartView,
    CheckoutView,
    OrdersView,
    VendorOrdersView,
    VendorOrderViewSet,
)

vendor_order_detail = VendorOrderViewSet.as_view({"get": "retrieve", "patch": "partial_update"})

urlpatterns = [
    path("cart/", CartView.as_view()),
    path("cart/items/", CartItemCreateView.as_view()),
    path("cart/items/<int:pk>/", CartItemUpdateDeleteView.as_view()),
    path("checkout/", CheckoutView.as_view()),
    path("orders/", OrdersView.as_view()),
    path("vendor/orders/", VendorOrdersView.as_view()),
    path("vendor/orders/<int:pk>/", vendor_order_detail),
]
