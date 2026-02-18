import hashlib
import hmac
import os

import requests
from django.conf import settings


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

    def initialize_checkout(self, reference, amount_cents, currency, customer_email):
        if not self.secret:
            return f"https://mock.fincra.local/checkout/{reference}"
        payload = {
            "currency": currency,
            "amount": amount_cents / 100,
            "reference": reference,
            "redirectUrl": settings.FINCRA_REDIRECT_URL,
            "customer": {"email": customer_email},
        }
        response = requests.post(f"{self.base_url}/checkout/payments", json=payload, headers=self._headers(), timeout=30)
        response.raise_for_status()
        data = response.json()
        return data.get("data", {}).get("link")

    def generate_quote(self, source_currency, target_currency, amount_cents):
        if not self.secret:
            return {"source_amount_cents": amount_cents, "target_amount_cents": amount_cents}
        payload = {
            "sourceCurrency": source_currency,
            "destinationCurrency": target_currency,
            "amount": amount_cents / 100,
        }
        resp = requests.post(f"{self.base_url}/quotes", json=payload, headers=self._headers(), timeout=30)
        resp.raise_for_status()
        data = resp.json().get("data", {})
        return {
            "source_amount_cents": int(float(data.get("sourceAmount", amount_cents / 100)) * 100),
            "target_amount_cents": int(float(data.get("destinationAmount", amount_cents / 100)) * 100),
        }


def verify_fincra_signature(raw_body: bytes, signature: str):
    secret = os.getenv("FINCRA_WEBHOOK_SECRET", settings.FINCRA_WEBHOOK_SECRET)
    digest = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha512).hexdigest()
    return hmac.compare_digest(digest, signature or "")
