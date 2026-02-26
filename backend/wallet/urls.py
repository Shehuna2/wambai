from django.urls import path
from .views import TopUpInitView, WalletAdjustmentAuditView, WalletView, WebhookEventAuditView

urlpatterns = [
    path("wallet/", WalletView.as_view()),
    path("wallet/topup/init/", TopUpInitView.as_view()),
    path("admin/audit/wallet-adjustments/", WalletAdjustmentAuditView.as_view()),
    path("admin/audit/webhooks/", WebhookEventAuditView.as_view()),
]
