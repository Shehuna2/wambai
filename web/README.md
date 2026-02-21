# Wambai Web

## Setup

```bash
cd web
npm install
cp .env.local.example .env.local
npm run dev
```

Environment:

```env
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000/api
```

## Vendor routes

- `/vendor`
- `/vendor/shop`
- `/vendor/products`
- `/vendor/products/new`
- `/vendor/products/[id]`
- `/vendor/orders`
- `/vendor/orders/[id]`
