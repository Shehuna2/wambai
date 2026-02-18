from django.urls import path
from .views import FincraWebhookView

urlpatterns = [
    path("payments/webhooks/fincra/", FincraWebhookView.as_view()),
]
