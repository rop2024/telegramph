# Telegraph (telegramph)

Small full-stack project containing a React frontend and an Express backend.

This README explains how to configure and run the project locally on Windows (PowerShell) and includes example environment variables and quick tests for the API endpoints.

## Prerequisites

- Node.js (16+ recommended) and npm installed
- (Optional) MongoDB connection string (Atlas or local) if backend uses MongoDB
- Firebase service account JSON if using Firebase Admin

## Repository layout

- `backend/` — Express server, routes, models, Firebase Admin helper
- `frontend/` — React app (Create React App structure)

## Environment files

Create env files in the `backend/` and `frontend/` folders as needed.

Example `backend/.env` (create this file):

REPLACE values before use.

```powershell
# backend/.env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/your-db?retryWrites=true&w=majority
FIREBASE_SERVICE_ACCOUNT=./path/to/serviceAccountKey.json
JWT_SECRET=your_jwt_secret
```

Example `frontend/.env` (create this file):

```powershell
# frontend/.env
REACT_APP_API_URL=http://localhost:5000
```

Notes:
- `REACT_APP_API_URL` tells the frontend where the backend API lives. If not set, requests will be relative to the frontend origin.
- Keep credentials and service account files out of version control (they're included in `.gitignore`).

## Install dependencies

Open two terminals (one for backend, one for frontend) or run sequentially.

Backend:

```powershell
cd 'D:\@Development\_1_projects\@project - telegraph\backend'
npm install
```

Frontend:

```powershell
cd 'D:\@Development\_1_projects\@project - telegraph\frontend'
npm install
```

## Run locally (development)

Start the backend server:

```powershell
cd 'D:\@Development\_1_projects\@project - telegraph\backend'
npm start
```

Start the frontend dev server:

```powershell
cd 'D:\@Development\_1_projects\@project - telegraph\frontend'
npm start
```

The React app typically runs on http://localhost:3000 and will proxy requests to the API URL you set in `REACT_APP_API_URL` (e.g. http://localhost:5000).

## Quick API checks

After starting the backend, test the health and test endpoints (PowerShell):

```powershell
# Check health
curl http://localhost:5000/health

# Check test endpoint
curl http://localhost:5000/test
```

Expected responses depend on server implementation but generally will be JSON with a `status` or `message` field.

## Build for production

Frontend build (generates static files):

```powershell
cd 'D:\@Development\_1_projects\@project - telegraph\frontend'
npm run build
```

After building, you can serve the `frontend/build` directory with a static server or integrate it with the Express backend.

## Common Troubleshooting

- If you see CORS errors, ensure backend allows requests from the frontend origin or configure a proxy in the frontend dev server.
- If Firebase Admin fails to initialize, confirm `FIREBASE_SERVICE_ACCOUNT` path and that the service account file contains valid credentials.
- If Git shows LF/CRLF warnings on Windows, consider adding a `.gitattributes` to normalize line endings.

## Next steps / Improvements

- Create component stubs if missing: `frontend/src/components/Login.js`, `Register.js`, `Dashboard.js`.
- Add `frontend/src/utils/auth.js` with a simple `isAuthenticated()` helper (token check) used by `ProtectedRoute`.
- Add tests for backend endpoints and frontend components.

---

If you'd like, I can scaffold the missing frontend components and `utils/auth.js`, or create a `.gitattributes` and normalize line endings. Tell me which you'd prefer and I'll implement it.
