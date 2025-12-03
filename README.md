# KWM Attendance Backend

Attendance REST API built with Express 5 + TypeScript and Prisma (MariaDB). Provides JWT auth, role-based user management (ADMIN, SECURITY, EMPLOYEE), and QR-based check-in/out.

## Stack
- Node.js + Express 5 (TypeScript)
- Prisma 7 + @prisma/adapter-mariadb
- JWT auth + bcrypt + role authorization middleware
- Payload validation with Zod

## Prerequisites
- Node.js 18+ and npm
- MariaDB/MySQL accessible to the app

## Environment Variables
Create a `.env` in the project root:

```
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DB_NAME"
JWT_SECRET="your-secret-here"
QR_SECRET="optional-if-different-from-jwt"
PORT=3001 # optional, defaults to 3001
```

## Run Locally
1) Install deps: `npm install`  
2) Generate Prisma client: `npx prisma generate`  
3) Apply schema to DB: `npx prisma db push`  
4) Seed initial data: `npx prisma db seed` (creates sample accounts)  
5) Start dev server: `npm run dev`, then open `http://localhost:3001`

Seeded accounts (password `password123`):
- Admin: `alice@prisma.io`
- Employee: `nilu@prisma.io`
- Security: `mahmoud@prisma.io`

## Response Shape
- Success: `{ "status": "success", "message": "...", "data": { ... }, "meta": { ...? } }`
- Error: `{ "status": "error", "message": "...", "errors": { field: message }? }`

## Endpoint Summary
### Auth
- `POST /auth/login` — login, returns JWT.
- `GET /auth/me` — current user profile.
- `DELETE /auth/logout` — logout and invalidate active token in DB.

### Users
- `GET /users?page=&pageSize=` — list users; ADMIN only.
- `GET /users/:id` — detail; ADMIN or the account owner.
- `POST /users` — create user (ADMIN).
- `PUT /users/:id` — update user (ADMIN).
- `DELETE /users/:id` — delete user (ADMIN).

### Attendance & Security
- `GET /api/attendance/me` — current user attendance history (pagination `page`, `pageSize`).
- `GET /api/attendance/my-qr` — generate attendance QR string (60s TTL, 1 request/10s limit).
- `POST /api/security/scan-attendance` — scan QR to check-in/out; SECURITY role only.

## Quick Testing
- `test.http` contains sample requests for REST Client / similar HTTP tools.
- `test-endpoints.ts` can be run with `npx tsx test-endpoints.ts` (needs populated DB and env vars). The script starts a temp server and exercises login, profile, role authorization, etc.

## Deploy
Repo includes `vercel.json` and handler `api/index.ts` for Vercel (Node serverless). Set environment variables in your deployment platform.
