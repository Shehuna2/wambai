# Backend API (Django + DRF)

## Features

- Custom user auth with buyer/vendor roles.
- Multi-vendor shops/products with ownership permissions.
- Multi-currency wallet + immutable ledger with atomic posting and row locking.
- Fincra top-up init, HMAC SHA512 webhook verification, and idempotent webhook processing.
- Checkout always settles in NGN, including quote + conversion initiation for non-NGN wallet balances.
- Marketplace order splitting into per-vendor `VendorOrder` records.

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

## Environment Variables

- `DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- `FINCRA_BASE_URL`
- `FINCRA_SECRET_KEY`
- `FINCRA_PUBLIC_KEY`
- `FINCRA_WEBHOOK_SECRET`
- `FINCRA_REDIRECT_URL`
- `FINCRA_WEBHOOK_PATH`

## Postman / HTTP Examples

```http
POST /api/auth/register/
Content-Type: application/json

{
  "email": "buyer@example.com",
  "password": "password123",
  "is_buyer": true
}
```

```http
POST /api/wallet/topup/init/
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "currency": "GHS",
  "amount_cents": 250000
}
```

```http
POST /api/checkout/
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "payment_method": "WALLET",
  "wallet_currency": "USD",
  "use_wallet_amount_cents": 500000
}
```

```http
PATCH /api/vendor/orders/12/
Authorization: Bearer <jwt_vendor>
Content-Type: application/json

{
  "status": "PROCESSING"
}
```

## Webhook Testing Notes

Use a standard tunneling tool to expose your local Django server and configure the generated HTTPS URL in your Fincra webhook settings. Ensure the callback path maps to:

`/api/payments/webhooks/fincra/`

Verify signature handling by sending requests with and without `x-signature`; requests without valid HMAC SHA512 signatures are rejected.

## Tests

```bash
python manage.py test
```
