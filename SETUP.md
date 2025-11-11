# Telegraph — Setup Guide

This document explains how to set up the Telegraph application locally (backend + frontend), plus how to configure optional services used by the project (MongoDB, Firebase, email provider).

This guide assumes you're using Windows PowerShell (the project's development environment). Adjust commands for macOS / Linux shells if needed.

---

## Table of contents
- Prerequisites
- Repository layout
- Backend setup
  - Environment variables
  - Install dependencies
  - Run in development
  - Run in production
  - Email provider setup (Gmail OAuth2 or SMTP)
- Frontend setup
  - Environment variables
  - Install dependencies
  - Run in development
  - Build for production
- Running both (dev workflow)
- Tests & verification
- Security & notes

---

## Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended) — comes with Node.js
- MongoDB (local) or a MongoDB Atlas cluster
- (Optional) Gmail account + OAuth2 credentials or SMTP credentials for sending email
- A Firebase service account JSON if you use Firebase admin features

---

## Repository layout (important files)
- `backend/` — Express API, Mongoose models, email service
- `frontend/` — React app (Create React App)
- `architecture.md` — Full API & architecture documentation
- `SETUP.md` — This file

---

## Backend setup

1) Open a PowerShell terminal and change to the backend folder:

```powershell
cd "d:\@Development\_1_projects\@project - telegraph\backend"
```

2) Copy example env and edit it:

```powershell
copy .env.example .env
notepad .env
```

Fill in the values (see example below).

3) Install dependencies:

```powershell
npm install
```

4) Run in development (auto-reloads with nodemon):

```powershell
npm run dev
```

Or run production server:

```powershell
npm start
```

5) Common server scripts (in `backend/package.json`):
- `npm run dev` — start with `nodemon` (development)
- `npm start` — start Node.js server normally

### Backend environment variables (.env)
Create `backend/.env` (or use the project's root `.env` if preferred). Example keys (do NOT commit secrets):

```text
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/telegraph_dev

# Auth
JWT_SECRET=your_jwt_secret_here_change_me_to_a_long_string

# Firebase (optional)
FIREBASE_SERVICE_ACCOUNT=./path-to-firebase-adminsdk.json

# Email (Gmail OAuth2 or SMTP)
# OAuth2 (production)
GMAIL_USER=you@gmail.com
GMAIL_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=xxxxxxxx
GMAIL_REFRESH_TOKEN=xxxxxxxx

# SMTP (development fallback)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your_smtp_password_or_app_password

# Other
# (Add any other env variables your team uses)
```

Notes:
- For Gmail production you may use OAuth2 (recommended) or App Passwords.
- Keep secrets out of source control. Add `.env` to `.gitignore`.

### Email provider setup (quick)
- OAuth2 (recommended for production):
  1. Create OAuth credentials in Google Cloud Console (OAuth Client ID).
  2. Use Google OAuth Playground to obtain a refresh token (or implement server-side OAuth consent flow).
  3. Set `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_USER` in `.env`.

- SMTP (development):
  - For Gmail, create an App Password and set `SMTP_USER` and `SMTP_PASS`.
  - For other providers, set host/port and credentials.

### Database
- If using local MongoDB: ensure the service is running. Default URI in example uses `telegraph_dev`.
- If using MongoDB Atlas: set `MONGODB_URI` to your connection string (remember to whitelist your IP or use a private network).

---

## Frontend setup

1) Open a PowerShell terminal and change to the frontend folder:

```powershell
cd "d:\@Development\_1_projects\@project - telegraph\frontend"
```

2) Copy example env and edit it (optional):

```powershell
copy .env.example .env
notepad .env
```

3) Install dependencies:

```powershell
npm install
```

4) Run development server:

```powershell
npm start
```

5) Build for production:

```powershell
npm run build
```

### Frontend environment variables
Create `frontend/.env` (or a root `.env` with REACT_APP_API_URL). Example:

```text
REACT_APP_API_URL=http://localhost:5000
# (Optional) other feature flags
```

Notes:
- The React app reads `REACT_APP_API_URL` to call the backend. Adjust when deploying.

---

## Running both (developer workflow)
Open two PowerShell windows (or tabs):

Terminal A (backend):

```powershell
cd "d:\@Development\_1_projects\@project - telegraph\backend"
npm run dev
```

Terminal B (frontend):

```powershell
cd "d:\@Development\_1_projects\@project - telegraph\frontend"
npm start
```

This starts the frontend at `http://localhost:3000` and backend at `http://localhost:5000` (defaults). The frontend proxies API calls to the URL in `REACT_APP_API_URL`.

---

## Testing & verification
- Health check:

```powershell
curl http://localhost:5000/health
```

- Create user (example):

```powershell
curl -X POST http://localhost:5000/auth/register -H "Content-Type: application/json" -d '{"username":"alice","email":"alice@example.com","password":"password123"}'
```

- List drafts (authenticated): Use Postman or the frontend UI. Ensure the Authorization header includes `Bearer <token>`.

---

## Production & Deployment notes
- Use environment variables in your hosting platform (Heroku, Vercel, DigitalOcean, AWS, etc.).
- Use HTTPS and configure CORS origins.
- Use a proper process manager (PM2, systemd) for the backend.
- Use a trusted email provider or a transactional email service (SendGrid, Mailgun) for large volume.

---

## Security & Best Practices
- Never commit `.env` or service account JSON files.
- Rotate credentials periodically.
- Use robust JWT_SECRET (>= 32 characters).
- Use rate-limiting on public endpoints if you expose them.
- Enable logging and monitoring for the email sending pipeline.

---

## Troubleshooting
- Backend fails to connect to MongoDB: verify `MONGODB_URI`, network access, and MongoDB service.
- Email service not configured: check `.env` keys for Gmail or SMTP and inspect backend logs.
- React app can't reach API: verify `REACT_APP_API_URL` and CORS settings on backend.

---

## Useful developer commands
From repo root (PowerShell):

```powershell
# Start backend and frontend in separate terminals (recommended)
cd .\backend; npm run dev
cd ..\frontend; npm start

# Build frontend for production
cd .\frontend; npm run build

# Run backend production server
cd .\backend; npm start
```

---

## Where to get help
- Check `architecture.md` for detailed API/endpoint documentation.
- Check backend logs in your terminal for runtime errors.
- Open an issue or contact the project owner if you need credentials or infra access.

---

Created on: 2025-11-11

