import hashlib
import hmac
import os
from decimal import Decimal

import requests
from django.conf import settings
from rest_framework.exceptions import ValidationError

from wallet.currency import to_major, to_minor


class FincraClient:
    @staticmethod
    def _normalize_path(path: str) -> str:
        if not path:
            return ""
        return path if path.startswith("/") else f"/{path}"

    def __init__(self):
        self.base_url = settings.FINCRA_BASE_URL.rstrip("/")
        self.secret = settings.FINCRA_SECRET_KEY
        self.public_key = settings.FINCRA_PUBLIC_KEY
        self.business_id = settings.FINCRA_BUSINESS_ID
        self.checkout_path = self._normalize_path(settings.FINCRA_CHECKOUT_PATH)
        self.quotes_path = self._normalize_path(settings.FINCRA_QUOTES_PATH)
        self.conversions_path = self._normalize_path(settings.FINCRA_CONVERSIONS_PATH)

    def _headers(self):
        headers = {
            "accept": "application/json",
            "api-key": self.secret,
            "content-type": "application/json",
        }
        if self.public_key:
            headers["x-pub-key"] = self.public_key
        if self.business_id:
            headers["x-business-id"] = self.business_id
        return headers

    def _ensure_configured(self):
        if not self.secret:
            raise ValidationError("Fincra is not configured: FINCRA_SECRET_KEY is missing")

    @staticmethod
    def _raise_for_http_error(response: requests.Response):
        try:
            response.raise_for_status()
        except requests.exceptions.HTTPError as exc:
            try:
                payload = response.json()
            except ValueError:
                payload = {"detail": response.text}
            raise ValidationError({"fincra_error": payload, "status_code": response.status_code}) from exc

    def initialize_checkout(self, reference, amount_minor, currency, customer_email):
        self._ensure_configured()
        if not self.public_key:
            raise ValidationError("Fincra checkout requires FINCRA_PUBLIC_KEY (x-pub-key)")
        payload = {
            "currency": currency,
            "amount": str(to_major(amount_minor, currency)),
            "reference": reference,
            "redirectUrl": settings.FINCRA_REDIRECT_URL,
            "customer": {"email": customer_email},
        }
        response = requests.post(
            f"{self.base_url}{self.checkout_path}",
            json=payload,
            headers=self._headers(),
            timeout=30,
        )
        self._raise_for_http_error(response)
        data = response.json()
        payload_data = data.get("data", {})
        return payload_data.get("link") or payload_data.get("checkoutLink") or payload_data.get("url")

    def generate_quote(self, source_currency, target_currency, amount_minor, amount_is="source"):
        amount_currency = source_currency if amount_is == "source" else target_currency
        amount_major = to_major(amount_minor, amount_currency)
        self._ensure_configured()

        payload = {
            "sourceCurrency": source_currency,
            "destinationCurrency": target_currency,
        }
        if amount_is == "destination":
            payload["destinationAmount"] = str(amount_major)
        else:
            payload["amount"] = str(amount_major)

        response = requests.post(
            f"{self.base_url}{self.quotes_path}",
            json=payload,
            headers=self._headers(),
            timeout=30,
        )
        self._raise_for_http_error(response)
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
        self._ensure_configured()
        payload = {
            "reference": reference,
            "sourceCurrency": source_currency,
            "destinationCurrency": target_currency,
            "sourceAmount": str(to_major(source_amount_minor, source_currency)),
            "destinationAmount": str(to_major(destination_amount_minor, target_currency)),
        }
        response = requests.post(
            f"{self.base_url}{self.conversions_path}",
            json=payload,
            headers=self._headers(),
            timeout=30,
        )
        self._raise_for_http_error(response)
        return response.json().get("data", {})


def verify_fincra_signature(raw_body: bytes, signature: str):
    secret = os.getenv("FINCRA_WEBHOOK_SECRET", settings.FINCRA_WEBHOOK_SECRET)
    if not secret or not signature:
        return False
    if signature.startswith("sha512="):
        signature = signature.split("=", 1)[1].strip()
    digest = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha512).hexdigest()
    return hmac.compare_digest(digest, signature)
