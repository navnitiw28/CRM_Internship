# Full Stack Auth App

This repository contains a full-stack authentication and authorization application built with:

- React + Vite + TypeScript
- Redux Toolkit
- React Router
- Node.js + Express + TypeScript
- Prisma ORM with PostgreSQL
- JWT access & refresh tokens
- Role-based access control (Admin/User)
- Email verification and password reset flow

## Setup

1. Install dependencies:
   ```bash
   npm run install:all
   ```
2. Create environment files:
   - `backend/.env` from `backend/.env.example`
   - `frontend/.env` from `frontend/.env.example`
3. Set `DATABASE_URL` in `backend/.env` to your PostgreSQL connection string.
4. Generate Prisma client and apply migrations:
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   ```
5. Start the app:
   ```bash
   npm run dev
   ```

## Local PostgreSQL with Docker

```bash
docker compose up -d postgres
```

## Render deployment

Render deployment is preconfigured via `render.yaml`.
- The backend service uses the PostgreSQL database from Render.
- The frontend service publishes the Vite build output.
- Update the frontend URL in `render.yaml` after the first deployment.

## API
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh-token`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/verify-email`
- `GET /api/users/me`
- `PATCH /api/users/me`
- `GET /api/users/admin`

## Notes
- The email sending implementation is a placeholder and logs actions to the console.
- For production, replace placeholder email and secret values with secure providers.
