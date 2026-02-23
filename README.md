# Wambai Marketplace MVP

Monorepo structure:

- `backend/` Django + DRF API
- `mobile/` Expo React Native (TypeScript)
- `web/` Next.js web frontend (buyer-first)

## Backend quick start

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

## Web quick start

```bash
cd web
npm install
cp .env.local.example .env.local
npm run dev
```

Web expects API base:

```bash
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000/api
```

## Mobile quick start

```bash
cd mobile
npm install
npm run start
```

Set API base URL in Expo env if needed:

```bash
EXPO_PUBLIC_API_URL=http://<host>:8000/api
```
