# Dokumentasi API Backend (be-kwm)

Base URL
- Lokal: `http://localhost:3001`
- Produksi: gunakan domain Vercel Anda

Autentikasi
- Header: `Authorization: Bearer <token>`
- Format respons sukses: `{ status: "success", message, data, meta? }`
- Format error: `{ status: "error", message, errors? }`

## Auth

### POST /auth/login
- Body:
```json
{ "email": "user@example.com", "password": "password123" }
```
- Respons sukses:
```json
{
  "status": "success",
  "message": "Login berhasil",
  "data": {
    "token": "<jwt>",
    "user": { "id": "...", "name": "...", "email": "...", "role": "ADMIN|SECURITY|EMPLOYEE", "isActive": true, "createdAt": "...", "updatedAt": "..." }
  }
}
```

### DELETE /auth/logout
- Header: `Authorization`
- Respons:
```json
{ "status": "success", "message": "Logout berhasil", "data": null }
```

### GET /auth/me
- Header: `Authorization`
- Respons:
```json
{
  "status": "success",
  "message": "Profil berhasil diambil",
  "data": { "id": "...", "name": "...", "email": "...", "role": "...", "isActive": true, "createdAt": "...", "updatedAt": "..." }
}
```

## Users (Admin)

### POST /users
- Header: `Authorization`
- Body:
```json
{ "name": "Alice", "email": "alice@prisma.io", "password": "password123", "role": "EMPLOYEE", "isActive": true, "divisionId": "<division-id-opsional>" }
```
- Respons:
```json
{ "status": "success", "message": "User berhasil dibuat", "data": { "id": "...", "name": "Alice", "email": "alice@prisma.io", "role": "EMPLOYEE", "isActive": true, "division": { "id": "...", "name": "..." }, "createdAt": "...", "updatedAt": "..." } }
```

### GET /users?page=1&pageSize=10
- Header: `Authorization`
- Catatan: `pageSize` default 10, tanpa batas maksimum.
- Respons (paginated):
```json
{
  "status": "success",
  "message": "Daftar user berhasil diambil",
  "data": { "items": [ { "id": "...", "name": "...", "email": "...", "role": "...", "isActive": true, "division": { "id": "...", "name": "..." }, "createdAt": "...", "updatedAt": "..." } ] },
  "meta": { "page": 1, "pageSize": 10, "totalItems": 123, "totalPages": 13 }
}
```

### GET /users/:id (Self/Admin)
- Header: `Authorization`
- Respons:
```json
{ "status": "success", "message": "User berhasil diambil", "data": { "id": "...", "name": "...", "email": "...", "role": "...", "isActive": true, "division": { "id": "...", "name": "..." }, "createdAt": "...", "updatedAt": "..." } }
```

### PUT /users/:id (Admin)
- Header: `Authorization`
- Body (opsional):
```json
{ "name": "Baru", "email": "baru@example.com", "password": "password123", "role": "SECURITY", "isActive": true, "divisionId": "<division-id-opsional>" }
```
- Respons:
```json
{ "status": "success", "message": "User berhasil diperbarui", "data": { "id": "...", "name": "Baru", "email": "baru@example.com", "role": "SECURITY", "isActive": true, "division": { "id": "...", "name": "..." }, "createdAt": "...", "updatedAt": "..." } }
```

### DELETE /users/:id (Admin)
- Header: `Authorization`
- Respons:
```json
{ "status": "success", "message": "User berhasil dihapus", "data": { "message": "User berhasil dihapus" } }
```

## Attendance (Employee)

### GET /api/attendance/me?page=1&pageSize=10
- Header: `Authorization`
- Catatan: `pageSize` maksimum 100.
- Respons (paginated):
```json
{
  "status": "success",
  "message": "Riwayat presensi berhasil diambil",
  "data": {
    "items": [
      {
        "id": "...",
        "userId": "...",
        "attendanceDate": "2025-11-29T00:00:00.000Z",
        "checkInAt": "2025-11-29T01:05:01.000Z",
        "checkOutAt": "2025-11-29T09:10:20.000Z",
        "status": "ONTIME",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  },
  "meta": { "page": 1, "pageSize": 10, "totalItems": 50, "totalPages": 5 }
}
```

### GET /api/attendance/my-qr
- Header: `Authorization`
- Respons:
```json
{ "status": "success", "message": "QR berhasil dibuat", "data": { "qr": "<userId>|<timestamp>|<signature>", "expiresInMs": 60000 } }
```
- Rate limit: maksimal 1 request per 10 detik per user. Gunakan di frontend untuk menampilkan QR yang berubah (mis. setiap 30 detik).

### GET /api/attendance/today
- Header: `Authorization`
- Deskripsi: Mengambil presensi hari ini (zona waktu WITA). Akan mengembalikan `null` jika belum ada presensi.
- Respons (ada presensi):
```json
{
  "status": "success",
  "message": "Presensi hari ini berhasil diambil",
  "data": {
    "id": "...",
    "userId": "...",
    "attendanceDate": "2025-11-29T00:00:00.000Z",
    "checkInAt": "2025-11-29T01:05:01.000Z",
    "checkOutAt": null,
    "status": "ONTIME",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```
- Respons (belum ada presensi):
```json
{ "status": "success", "message": "Belum ada presensi hari ini", "data": null }
```

## Attendance (Security)

### POST /api/security/scan-attendance
- Header: `Authorization` (role SECURITY)
- Body:
```json
{ "qr": "<userId>|<timestamp>|<signature>" }
```
- Validasi backend:
  - Signature `HMAC_SHA256(secret, userId|timestamp)` valid (secret: `QR_SECRET`, fallback `JWT_SECRET`).
  - `timestamp` tidak lebih tua dari 60 detik.
- Respons sukses:
```json
{
  "status": "success",
  "message": "Presensi berhasil check-in",
  "data": {
    "mode": "CHECK_IN",
    "attendance": {
      "id": "...",
      "userId": "...",
      "attendanceDate": "2025-11-29T00:00:00.000Z",
      "checkInAt": "2025-11-29T01:05:01.000Z",
      "checkOutAt": null,
      "status": "ONTIME",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```
- Bila sudah check-in dan belum check-out → `mode: "CHECK_OUT"`, `message: "Presensi berhasil check-out"`.
- Bila hari ini sudah lengkap → error 400: `{ "status": "error", "message": "Presensi hari ini lengkap" }`.

## QR Spesifikasi
- Format: `userId|timestamp|signature`
- `timestamp`: ISO 8601 UTC (`new Date().toISOString()`)
- `signature`: `HMAC_SHA256(QR_SECRET, userId|timestamp)`
- Masa berlaku: 60 detik.

## Status Presensi
- Field `status` di `Attendance` merepresentasikan ketepatan waktu saat check-in.
- Nilai enum: `ONTIME` atau `LATE`.
- Penentuan otomatis saat check-in berdasarkan batas waktu WITA (default 08:00 WITA).

## Attendance (Admin)

### GET /api/attendance/summary/today
- Header: `Authorization` (role ADMIN)
- Deskripsi: Ringkasan presensi hari ini dengan kategori `belumCheckIn`, `onTime`, `terlambat` dan total user aktif.
- Cutoff penilaian on-time: 08:00 WITA (default).
- Respons:
```json
{
  "status": "success",
  "message": "Ringkasan presensi hari ini berhasil diambil",
  "data": { "belumCheckIn": 10, "onTime": 35, "terlambat": 5, "totalUsers": 50 }
}
```

## Error Contoh
```json
{ "status": "error", "message": "Unauthorized" }
{ "status": "error", "message": "Forbidden" }
{ "status": "error", "message": "Validation failed.", "errors": { "email": "Invalid email" } }
{ "status": "error", "message": "Resource not found" }
```

## Role Akses
- Admin: semua operasi `/users`, serta melihat detail user.
- Security: hanya `POST /api/security/scan-attendance`.
- Employee: `GET /api/attendance/me`, `GET /api/attendance/my-qr`, dan `GET /users/:id` untuk dirinya sendiri.

## Catatan Paginations
- Query: `page` (>=1), `pageSize`
- Batas: Attendance `pageSize` maksimum 100; Users default 10 tanpa batas maksimum.
- Meta selalu berisi: `page`, `pageSize`, `totalItems`, `totalPages`.

## Environment Variables
- `JWT_SECRET` (wajib)
- `QR_SECRET` (disarankan, terpisah dari JWT)
- `DATABASE_URL` (MySQL, dapat diakses environment target)
- `CORS_ORIGINS` (opsional, CSV origins yang diizinkan; default `http://localhost:3000`)

## Divisions (Admin)

### POST /api/divisions
- Header: `Authorization` (role ADMIN)
- Body:
```json
{ "name": "Teknik", "isActive": true }
```
- Respons:
```json
{ "status": "success", "message": "Division berhasil dibuat", "data": { "id": "...", "name": "Teknik", "isActive": true, "createdAt": "...", "updatedAt": "..." } }
```

### GET /api/divisions?page=1&pageSize=10
- Header: `Authorization` (role ADMIN)
- Respons (paginated):
```json
{
  "status": "success",
  "message": "Daftar division berhasil diambil",
  "data": { "items": [ { "id": "...", "name": "Teknik", "isActive": true, "createdAt": "...", "updatedAt": "..." } ] },
  "meta": { "page": 1, "pageSize": 10, "totalItems": 5, "totalPages": 1 }
}
```

### GET /api/divisions/:id
- Header: `Authorization` (role ADMIN)
- Respons:
```json
{ "status": "success", "message": "Division berhasil diambil", "data": { "id": "...", "name": "Teknik", "isActive": true, "createdAt": "...", "updatedAt": "..." } }
```

### PUT /api/divisions/:id
- Header: `Authorization` (role ADMIN)
- Body (opsional):
```json
{ "name": "Teknik Mesin", "isActive": true }
```
- Respons:
```json
{ "status": "success", "message": "Division berhasil diperbarui", "data": { "id": "...", "name": "Teknik Mesin", "isActive": true, "createdAt": "...", "updatedAt": "..." } }
```

### DELETE /api/divisions/:id
- Header: `Authorization` (role ADMIN)
- Respons:
```json
{ "status": "success", "message": "Division berhasil dihapus", "data": { "message": "Division berhasil dihapus" } }
```
