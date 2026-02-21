# Backend API (Django + DRF)

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

## Media uploads (dev)

- Uploaded images are stored locally under `backend/media/uploads/<user_id>/...`.
- API endpoint: `POST /api/uploads/images/` (`multipart/form-data`, `files` field, vendor auth required).
- Allowed image types: jpeg/png/webp, max 5MB each.
- In development, media is served at `/media/` via Django `DEBUG` static mapping.

Production note: move media storage to S3-compatible object storage for scalability.
