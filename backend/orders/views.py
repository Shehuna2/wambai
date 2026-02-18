from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from payments.fincra import FincraClient

from .models import Cart, CartItem, Order, VendorOrder
from .permissions import IsVendorOrderOwner
from .serializers import (
    CartItemSerializer,
    CartSerializer,
    CheckoutSerializer,
    OrderSerializer,
    VendorOrderSerializer,
)
from .services import cart_total_ngn_cents, wallet_checkout


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        grouped = {}
        for item in cart.items.select_related("product", "product__shop"):
            shop_id = item.product.shop_id
            shop_group = grouped.setdefault(
                str(shop_id),
                {
                    "shop": {
                        "id": shop_id,
                        "name": item.product.shop.name,
                        "location": item.product.shop.location,
                    },
                    "items": [],
                },
            )
            shop_group["items"].append(
                {
                    "id": item.id,
                    "qty": item.qty,
                    "product": {
                        "id": item.product_id,
                        "title": item.product.title,
                        "price_cents": item.product.price_cents,
                        "currency": item.product.currency,
                    },
                }
            )
        return Response({"cart": CartSerializer(cart).data, "grouped_by_shop": grouped})


class CartItemCreateView(generics.CreateAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        product = serializer.validated_data["product"]
        qty = serializer.validated_data["qty"]
        existing = CartItem.objects.filter(cart=cart, product=product).first()
        if existing:
            existing.qty = qty
            existing.full_clean()
            existing.save(update_fields=["qty"])
            return
        serializer.save(cart=cart)


class CartItemUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        return CartItem.objects.filter(cart=cart)


class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        method = serializer.validated_data["payment_method"]

        if method == Order.PaymentMethod.WALLET:
            order = wallet_checkout(
                request.user,
                wallet_currency=serializer.validated_data.get("wallet_currency", "NGN"),
                use_wallet_amount_cents=serializer.validated_data.get("use_wallet_amount_cents"),
            )
            return Response(OrderSerializer(order).data)

        cart, _ = Cart.objects.get_or_create(user=request.user)
        total = cart_total_ngn_cents(cart)
        if total <= 0:
            return Response({"detail": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)
        order = Order.objects.create(
            buyer=request.user,
            total_ngn_cents=total,
            status=Order.OrderStatus.PENDING_PAYMENT,
            payment_method=Order.PaymentMethod.FINCRA,
        )
        checkout_url = FincraClient().initialize_checkout(
            reference=f"order-{order.id}",
            amount_cents=total,
            currency="NGN",
            customer_email=request.user.email,
        )
        return Response({"order_id": order.id, "checkout_url": checkout_url}, status=status.HTTP_202_ACCEPTED)


class OrdersView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(buyer=self.request.user).order_by("-created_at")


class VendorOrdersView(generics.ListAPIView):
    serializer_class = VendorOrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return VendorOrder.objects.filter(shop__owner=self.request.user).order_by("-id")


class VendorOrderViewSet(viewsets.ModelViewSet):
    serializer_class = VendorOrderSerializer
    permission_classes = [IsVendorOrderOwner]
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        return VendorOrder.objects.filter(shop__owner=self.request.user)
