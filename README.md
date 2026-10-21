# AstroTrack — MERN Stack Project

AstroTrack is an astronomical observation platform built with the MERN stack.

## Tech Stack
- MongoDB — persistent NoSQL database
- Express.js — REST API framework
- React + TypeScript — frontend
- Node.js — backend runtime
- Mongoose — MongoDB ODM
- Vite — frontend build tool

## Project Structure

```text
AstroTrack/
├── backend/
│   ├── src/
│   │   ├── config/db.ts
│   │   ├── models/Observation.ts
│   │   ├── routes/astroRoutes.ts
│   │   ├── routes/observationRoutes.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   └── package.json
└── README.md
```

## Setup

### 1. MongoDB
Create a MongoDB Atlas cluster (or use a local MongoDB server) and create/use a database named `astrotrack`.

### 2. Backend environment
Copy `backend/.env.example` to `backend/.env` and replace the MongoDB URI with your own connection string.

### 3. Install dependencies

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend, in another terminal:

```bash
cd frontend
npm install
npm run dev
```

The backend runs on `http://localhost:5000` and the Vite frontend normally runs on `http://localhost:5173`.

## API

- `GET /api/astro/status` — backend status
- `GET /api/astro/object/:name` — celestial object information
- `GET /api/observations` — list observations
- `POST /api/observations` — create an observation
- `DELETE /api/observations/:id` — delete an observation

## Important
Do not commit `backend/.env` or your MongoDB credentials to GitHub. Use `.env.example` as the template.

## Secure User and Admin Login

AstroTrack now includes role-based authentication backed by MongoDB Atlas.

### Configure the backend

1. Open a terminal in `backend` and create a `.env` file by copying `.env.example`.
2. Set `MONGO_URI` to your own MongoDB Atlas connection string.
3. Set `JWT_SECRET` to a long, random secret (at least 32 characters).
4. Set `ADMIN_EMAIL`, `ADMIN_NAME`, and `ADMIN_PASSWORD`. The admin password must be at least 12 characters. Keep this file private and never commit or share it.
5. Install dependencies and start the backend:

   ```bash
   npm install
   npm run dev
   ```

The backend creates the initial admin account from those environment variables when it starts. It does not provide public admin registration. If an account with `ADMIN_EMAIL` already exists as an admin, it is reused and its password is not reset automatically. If that email belongs to a regular user, startup stops with an error rather than silently promoting it.

### Start the frontend

Open a second terminal in `frontend` and run:

```bash
npm install
npm run dev
```

Open the local URL shown by Vite. Choose **Create account** to register a regular user, or choose **Admin** on the sign-in page and use the admin credentials configured in `backend/.env`.

### Access rules

- Regular users can register and sign in, create observations, and view/delete only their own observations.
- Admins can sign in using the provisioned admin account, view all observations, and delete any observation.
- Passwords are stored as bcrypt hashes. The backend issues JWTs that expire after 8 hours and checks them on protected observation endpoints.
- Public registration always creates a `user` role. The role selector on the login screen does not grant privileges by itself.

### Authentication endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Register a regular user |
| POST | `/api/auth/login` | Sign in as user or admin |
| GET | `/api/auth/me` | Validate a token and return the signed-in identity |

Protected observation routes require `Authorization: Bearer <token>`.

## Admin-only Analytics Dashboard

The admin account now has an **Astronomy Analytics** section with registered-user count, total observations, observations recorded today, a six-month observation chart, and the most frequently observed celestial objects. Admins can refresh the analytics and export the currently displayed observation records to CSV.

The analytics endpoint is `GET /api/admin/analytics`. It requires a valid JWT and the `admin` role on the server; regular users receive `403 Forbidden` if they try to access it directly. No extra package installation is needed beyond the existing backend and frontend dependencies.
