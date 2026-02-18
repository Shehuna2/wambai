from django.urls import path
from .views import TopUpInitView, WalletView

urlpatterns = [
    path("wallet/", WalletView.as_view()),
    path("wallet/topup/init/", TopUpInitView.as_view()),
]
