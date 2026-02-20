# Backend API (Django + DRF)

## Features

- Custom user auth with buyer/vendor roles.
- Multi-vendor shops/products with ownership permissions.
- Multi-currency wallet ledger stored in **minor units** per currency.
- Fincra top-up init, HMAC SHA512 webhook verification, webhook idempotency via `WebhookEvent`.
- Async-safe wallet FX checkout: non-NGN wallet payments stay `PENDING_PAYMENT` until conversion webhook confirmation.
- Decimal quantities for cart/order flow (`qty_step`, `min_order_qty`, and stock support fractional units like yard/meter/kg).

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

## Currency Minor-Unit Notes

Wallet/ledger/order math uses minor units; do not assume `/100` for every currency.

- exponent 2: `NGN`, `GHS`, `USD`, `GBP`, `EUR`
- exponent 0: `XOF`, `XAF`

Fincra payload amounts are converted to major units with this exponent map.

## Webhook Testing Notes

- Endpoint: `/api/payments/webhooks/fincra/`
- Sign each request with HMAC SHA512 using `FINCRA_WEBHOOK_SECRET`.
- Duplicate events (same provider + `event_id`) are ignored.
- Conversion success event flow:
  1. mark `FxConversion` completed
  2. post pending conversion ledger entries
  3. post purchase entry
  4. create vendor orders and decrement stock
  5. mark order `PAID`

## Tests

```bash
python manage.py test
```
