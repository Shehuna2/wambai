import hashlib
import hmac
import json

from django.conf import settings
from django.test import TestCase
from rest_framework.test import APIClient


class WebhookSignatureTests(TestCase):
    def test_missing_signature_rejected(self):
        client = APIClient()
        payload = {"id": "evt_1", "data": {"reference": "abc", "status": "successful"}}
        response = client.post("/api/payments/webhooks/fincra/", payload, format="json")
        self.assertEqual(response.status_code, 400)

    def test_invalid_signature_rejected(self):
        client = APIClient()
        payload = {"id": "evt_1", "data": {"reference": "abc", "status": "successful"}}
        response = client.post(
            "/api/payments/webhooks/fincra/",
            payload,
            format="json",
            HTTP_X_SIGNATURE="bad",
        )
        self.assertEqual(response.status_code, 400)

    def test_valid_signature_accepted(self):
        client = APIClient()
        body = json.dumps({"id": "evt_1", "data": {"reference": "abc", "status": "successful"}}).encode()
        signature = hmac.new(settings.FINCRA_WEBHOOK_SECRET.encode(), body, hashlib.sha512).hexdigest()
        response = client.post(
            "/api/payments/webhooks/fincra/",
            data=body,
            content_type="application/json",
            HTTP_X_SIGNATURE=signature,
        )
        self.assertEqual(response.status_code, 200)
