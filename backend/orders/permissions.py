from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsVendorOrderOwner(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_vendor

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return obj.shop.owner_id == request.user.id
        if request.method in {"PATCH", "PUT"}:
            return obj.shop.owner_id == request.user.id
        return False
