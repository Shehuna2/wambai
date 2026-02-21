# Wambai Web (Next.js)

Buyer-first web frontend built with Next.js App Router, TypeScript, Tailwind, and Zustand.

## Install

```bash
cd web
npm install
```

## Environment setup

```bash
cp .env.local.example .env.local
```

Default:

```env
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000/api
```

## Run development server

```bash
npm run dev
```

Open http://localhost:3000.

## Common issues

- **401 / auth errors**: confirm you are logged in and backend is running.
- **CORS errors**: ensure backend has `django-cors-headers` and allows `http://localhost:3000` / `http://127.0.0.1:3000`.
- **Wrong API base**: verify `NEXT_PUBLIC_API_BASE` points to backend `/api` root.
