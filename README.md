Frontend: Next.js admin

Start:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Set `BACKEND_URL` and `APP_ORIGIN` in `.env.local`.
Set `ADMIN_EMAIL`, `AUTH_SECRET`, and either `ADMIN_PASSWORD` for local development or `ADMIN_PASSWORD_HASH` for production.
Set `INTERNAL_API_TOKEN` to the same value used by the backend.
For live maker-checker access, prefer `ADMIN_USERS_JSON` with separate `maker` and `approver` users using scrypt hashes.
