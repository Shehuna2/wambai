# Backend API (Django + DRF)

## Features

- Custom user auth with buyer/vendor roles.
- Multi-vendor shops and products.
- Multi-currency wallet with immutable ledger entries.
- Fincra top-up init and signed webhook processing.
- Checkout in NGN only, including wallet currency conversion path.
- Split marketplace orders by vendor.

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
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

## Key Endpoints

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `GET /api/auth/me/`
- `GET/POST /api/shops/`
- `GET/POST /api/products/`
- `GET /api/cart/`
- `POST /api/cart/items/`
- `PATCH/DELETE /api/cart/items/:id/`
- `GET /api/wallet/`
- `POST /api/wallet/topup/init/`
- `POST /api/checkout/`
- `GET /api/orders/`
- `GET /api/vendor/orders/`
- `POST /api/payments/webhooks/fincra/`

## Tests

```bash
python manage.py test
```
