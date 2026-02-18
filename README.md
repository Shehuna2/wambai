# Wambai Marketplace MVP

Monorepo structure:

- `backend/` Django + DRF API
- `mobile/` Expo React Native (TypeScript)

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
