# Wambai Web Frontend

Next.js (App Router) frontend for buyer-first marketplace flows.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env file:
   ```bash
   cp .env.local.example .env.local
   ```
3. Ensure backend runs on `http://127.0.0.1:8000`.
4. Start dev server:
   ```bash
   npm run dev
   ```

## Environment

- `NEXT_PUBLIC_API_BASE` defaults to Django API base, e.g. `http://127.0.0.1:8000/api`.

## Common issues

- **CORS errors**: confirm backend allows `http://localhost:3000` and `http://127.0.0.1:3000`.
- **401 Unauthorized**: login again to refresh JWT in local storage.
- **Cannot connect to backend**: verify Django server is running and API base URL is correct.
