# IconGens Forums - Minimal Backend (Express + SQLite)

This folder contains a minimal Node/Express + SQLite backend intended as a local/dev server for the IconGens Forums frontend demo.

Features
- Signup / Login (bcrypt + JWT)
- Create / list / view posts
- Delete and pin posts (staff only)
- Seeds an admin account if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are provided in `.env`.

Quick start

1. Open a terminal in this folder:

```powershell
cd "c:\Users\Kvngc\Downloads\IconGens Forums\server"
npm install
cp .env.example .env
# Edit .env to set JWT_SECRET and admin credentials if you want
npm run dev
```

2. The server will run on `http://localhost:4000` by default. API endpoints:
- POST /api/auth/signup
- POST /api/auth/login
- GET /api/users/me
- GET /api/posts
- POST /api/posts
- GET /api/posts/:id
- DELETE /api/posts/:id (staff only)
- POST /api/posts/:id/pin (staff only)

Security / production notes
- This is a demo scaffold. For production, use Postgres (or managed DB), run migrations, set secure JWT secret, TLS, proper logging, and stronger rate limits / monitoring.
