# Wambai Marketplace MVP

Monorepo structure:

- `backend/` Django + DRF API
- `mobile/` React Native (Expo) app

## Backend quick start

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

## Mobile quick start

```bash
cd mobile
npm install
npm run start
```
