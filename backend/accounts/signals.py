from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from wallet.models import Wallet, WalletBalance

from .models import UserProfile


@receiver(post_save, sender=get_user_model())
def bootstrap_user_profile_wallet(sender, instance, created, **kwargs):
    if not created:
        return

    UserProfile.objects.get_or_create(user=instance)
    wallet, _ = Wallet.objects.get_or_create(user=instance)
    for code in settings.SUPPORTED_CURRENCIES:
        WalletBalance.objects.get_or_create(wallet=wallet, currency=code, defaults={"available_cents": 0})
