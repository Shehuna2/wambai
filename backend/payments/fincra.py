import hashlib
import hmac
import os
from decimal import Decimal

import requests
from django.conf import settings

from wallet.currency import to_major, to_minor


class FincraClient:
    def __init__(self):
        self.base_url = settings.FINCRA_BASE_URL
        self.secret = settings.FINCRA_SECRET_KEY

    def _headers(self):
        return {
            "accept": "application/json",
            "api-key": self.secret,
            "content-type": "application/json",
        }

    def initialize_checkout(self, reference, amount_minor, currency, customer_email):
        if not self.secret:
            return f"https://mock.fincra.local/checkout/{reference}"
        payload = {
            "currency": currency,
            "amount": str(to_major(amount_minor, currency)),
            "reference": reference,
            "redirectUrl": settings.FINCRA_REDIRECT_URL,
            "customer": {"email": customer_email},
        }
        response = requests.post(
            f"{self.base_url}/checkout/payments",
            json=payload,
            headers=self._headers(),
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        return data.get("data", {}).get("link")

    def generate_quote(self, source_currency, target_currency, amount_minor, amount_is="source"):
        amount_currency = source_currency if amount_is == "source" else target_currency
        amount_major = to_major(amount_minor, amount_currency)

        if not self.secret:
            return {
                "source_amount_minor": amount_minor if amount_is == "source" else amount_minor,
                "target_amount_minor": amount_minor if amount_is == "destination" else amount_minor,
                "meta": {"mock": True, "amount_is": amount_is},
            }

        payload = {
            "sourceCurrency": source_currency,
            "destinationCurrency": target_currency,
        }
        if amount_is == "destination":
            payload["destinationAmount"] = str(amount_major)
        else:
            payload["amount"] = str(amount_major)

        response = requests.post(
            f"{self.base_url}/quotes",
            json=payload,
            headers=self._headers(),
            timeout=30,
        )
        response.raise_for_status()
        data = response.json().get("data", {})

        source_major = Decimal(str(data.get("sourceAmount") or data.get("amount") or "0"))
        destination_major = Decimal(str(data.get("destinationAmount") or "0"))
        if amount_is == "source" and destination_major == 0:
            destination_major = amount_major
        if amount_is == "destination" and source_major == 0:
            source_major = amount_major

        return {
            "source_amount_minor": to_minor(source_major, source_currency),
            "target_amount_minor": to_minor(destination_major, target_currency),
            "meta": data,
        }

    def initiate_conversion(
        self,
        reference,
        source_currency,
        target_currency,
        source_amount_minor,
        destination_amount_minor,
    ):
        if not self.secret:
            return {"reference": reference, "status": "mocked"}
        payload = {
            "reference": reference,
            "sourceCurrency": source_currency,
            "destinationCurrency": target_currency,
            "sourceAmount": str(to_major(source_amount_minor, source_currency)),
            "destinationAmount": str(to_major(destination_amount_minor, target_currency)),
        }
        response = requests.post(
            f"{self.base_url}/conversions",
            json=payload,
            headers=self._headers(),
            timeout=30,
        )
        response.raise_for_status()
        return response.json().get("data", {})


def verify_fincra_signature(raw_body: bytes, signature: str):
    secret = os.getenv("FINCRA_WEBHOOK_SECRET", settings.FINCRA_WEBHOOK_SECRET)
    if not secret or not signature:
        return False
    digest = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha512).hexdigest()
    return hmac.compare_digest(digest, signature)
