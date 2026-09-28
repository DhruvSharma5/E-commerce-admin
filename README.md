# Stockroom: Authentication & Product CRUD

A small e-commerce catalog with a secure REST API and a React frontend, in a single repository.

- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, express-validator
- **Frontend:** React (Vite) + React Router
- **Live link:** `<add your deployed URL here>`
- **Repository:** `<add your GitHub URL here>`

## Features
- Register / login / refresh-token / logout / me
- Short-lived **access token** (15 min, JSON body, kept in memory on the frontend)
- Long-lived **refresh token** (7 days, `httpOnly` cookie, stored **hashed** in the DB, rotated on every refresh, reuse detection revokes all sessions)
- Product CRUD; write routes protected by the `authenticate` middleware; only the creator can edit/delete a product (403 otherwise)
- `express-validator` on every route that takes body, params or query input, with field-level 400 errors
- Login rate limiting, Helmet security headers, passwords never returned or logged

## Project structure
```
backend/
  server.js
  src/
    config/db.js
    models/          User.js, Product.js
    middleware/      authenticate.js, validate.js, errorHandler.js
    validators/      auth.validators.js, product.validators.js
    controllers/     auth.controller.js, product.controller.js
    routes/          auth.routes.js, product.routes.js
    utils/tokens.js
frontend/
  src/ api.js, AuthContext.jsx, App.jsx, pages/, components/
```

## Setup (local)
Requirements: Node 20+ and a MongoDB instance (local or Atlas).

```bash
# 1. Backend
cd backend
cp .env.example .env        # fill in MONGO_URI and two long random secrets
npm install
npm run dev                 # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxies /api to :5000)
```
Generate secrets with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

### Environment variables (`backend/.env`)
| Name | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `ACCESS_TOKEN_SECRET` | Signs access tokens |
| `REFRESH_TOKEN_SECRET` | Signs refresh tokens (must differ from the access secret) |
| `ACCESS_TOKEN_EXPIRES` | Default `15m` |
| `REFRESH_TOKEN_EXPIRES` | Default `7d` |
| `NODE_ENV` | Set `production` when deployed (enables `secure` cookies) |
| `CLIENT_URL` | Only if the frontend is hosted on a different origin |

## Deployment (Frontend + Express API on Vercel)
The frontend and Express backend can be deployed as two Vercel projects from this same repository. Vercel supports Express with zero configuration.

### 1. Deploy the backend
1. Push the repository to GitHub.
2. In Vercel, create a **new project** from the same repository.
3. Set **Root Directory** to `backend`.
4. Leave Build Command and Output Directory at their defaults; Vercel detects the Express `server.js` entry point.
5. Add these Environment Variables in the backend Vercel project:
   - `MONGO_URI`
   - `ACCESS_TOKEN_SECRET`
   - `REFRESH_TOKEN_SECRET`
   - `ACCESS_TOKEN_EXPIRES=15m`
   - `REFRESH_TOKEN_EXPIRES=7d`
   - `NODE_ENV=production`
   - `CLIENT_URL=https://e-commerce-admin-ten-ruby.vercel.app`
   - `COOKIE_SAME_SITE=none`
6. Deploy and copy the backend URL, for example `https://your-backend.vercel.app`.

### 2. Deploy/update the frontend
1. Open the existing Vercel frontend project.
2. In **Settings → Environment Variables**, add:
   - `VITE_API_URL=https://your-backend.vercel.app`
3. Redeploy the frontend.

The frontend keeps using `/api/...` in application code; `VITE_API_URL` supplies the deployed backend origin in production. Locally, leaving `VITE_API_URL` empty keeps the existing Vite proxy to `http://localhost:5000`.

### 3. MongoDB Atlas
Make sure the MongoDB Atlas deployment allows the Vercel backend to connect. For a demo, Atlas Network Access can allow `0.0.0.0/0`; for production, use a more restrictive network/security setup where practical.

### Vercel project structure
For the backend Vercel project, use this repository but set its Root Directory to:
```text
backend
```
Vercel detects the existing `server.js` Express entry point automatically.

## API endpoints
Base path: `/api`. Errors use `{ "success": false, "message": "...", "errors": [{ "field": "email", "message": "..." }] }`.

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Body: `name, email, password, confirmPassword`. Returns the user (201), no tokens. 409 if email exists |
| POST | `/auth/login` | Public | Body: `email, password`. Returns `accessToken` + user, sets refresh cookie. 401 generic message on failure |
| POST | `/auth/refresh-token` | Public (needs refresh cookie) | Returns a new `accessToken` and rotates the refresh cookie. 401 if missing/expired/invalid, 403 if reused |
| POST | `/auth/logout` | Authenticated | Revokes the refresh token in the DB and clears the cookie |
| GET | `/auth/me` | Authenticated | Returns the logged-in user |

### Products
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/products` | Authenticated | Create. Body: `name, description?, price (number), stock (integer), category?` |
| GET | `/products` | Public | List. Query: `page, limit (max 100), search` |
| GET | `/products/:id` | Public | Get one (400 invalid id, 404 not found) |
| PUT | `/products/:id` | Authenticated (owner) | Update |
| DELETE | `/products/:id` | Authenticated (owner) | Delete |

Protected routes need `Authorization: Bearer <accessToken>`.

## How data flows (frontend to API and back)
1. **Login page** calls `login()` in `AuthContext`, which calls `api('/auth/login')` in `api.js`.
2. The server checks the password, returns the access token in JSON and sets the refresh token as an `httpOnly` cookie.
3. `api.js` keeps the access token in a variable and adds it as a `Bearer` header on protected calls.
4. If the access token has expired, the API answers 401. `api.js` calls `/auth/refresh-token` (the browser sends the cookie automatically), stores the new access token, and retries the original request once.
5. On a page reload the token in memory is gone, so `AuthContext` calls refresh first, then `/auth/me`, to restore the session.
6. Validation errors (400) come back as `errors[]`; `ApiError` turns them into a `{field: message}` map and each `<Field>` shows its own message.
# E-commerce-admin
