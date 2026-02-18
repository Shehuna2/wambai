from django.urls import path
from .views import CartItemCreateView, CartItemUpdateDeleteView, CartView, CheckoutView, OrdersView, VendorOrdersView

urlpatterns = [
    path("cart/", CartView.as_view()),
    path("cart/items/", CartItemCreateView.as_view()),
    path("cart/items/<int:pk>/", CartItemUpdateDeleteView.as_view()),
    path("checkout/", CheckoutView.as_view()),
    path("orders/", OrdersView.as_view()),
    path("vendor/orders/", VendorOrdersView.as_view()),
]
