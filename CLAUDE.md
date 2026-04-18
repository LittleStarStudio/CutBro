# CutBro — SaaS Barbershop Platform
# CLAUDE.md — Project Context & Development Guide

> This file is automatically read by Claude Code at the start of every session.
> Communication language: Bahasa Indonesia for chat, English for all code.

---

## 1. Project Overview

**CutBro** is a multi-tenant SaaS platform for barbershop management.
It allows barbershop owners to manage their business (services, barbers, bookings, payments)
while customers can discover barbershops and make bookings online.

**Architecture:** Single Page Application (React) + REST API (Laravel) + Multi-Tenant MySQL

---

## 2. Monorepo Structure

```
CutBro/                          ← Root folder (monorepo)
├── CLAUDE.md                    ← This file (place here at root)
├── Backend/                     ← Laravel 11 REST API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/     ← API controllers (grouped by role)
│   │   │   ├── Middleware/      ← Auth, role-check, tenant isolation
│   │   │   └── Requests/        ← Form request validation
│   │   ├── Models/              ← Eloquent models
│   │   ├── Services/            ← Business logic layer
│   │   └── Repositories/        ← DB query layer (if used)
│   ├── routes/
│   │   └── api.php              ← All API routes
│   ├── database/
│   │   └── migrations/          ← All migration files
│   └── .env                     ← Backend environment variables
│
└── Frontend/                    ← React + Vite SPA
    ├── src/
    │   ├── pages/               ← All page components
    │   ├── components/          ← Reusable UI components
    │   ├── hooks/               ← Custom React hooks
    │   ├── services/            ← Axios API call functions
    │   ├── utils/               ← Helper functions
    │   └── routes/              ← React Router config
    └── .env                     ← Frontend environment variables
```

---

## 3. Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| PHP | 8.3.28 | Runtime |
| Laravel | 11.48.0 | API Framework |
| Laravel Sanctum | latest | Token-based Authentication |
| MySQL | 8.4.3 | Database |
| Laragon | local | Local server environment |
| Midtrans | sandbox | Payment gateway |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18+ | UI Framework |
| Vite | latest | Build tool |
| Tailwind CSS | latest | Styling |
| React Router | latest | Navigation |
| Axios | latest | HTTP client |
| npm | latest | Package manager |

---

## 4. Local Development Environment

```
Backend  → http://localhost:8000   (Laravel via Laragon)
Frontend → http://localhost:5173   (React via Vite)
Database → localhost:3306          (MySQL via Laragon)
Database name: db_cutbro
```

### Start Commands

**Backend:**
```bash
cd CutBro/Backend
php artisan serve
```

**Frontend:**
```bash
cd CutBro/Frontend
npm run dev
```

> ⚠️ No Railway or Vercel deployment at this stage. Everything runs locally until presentation.

---

## 5. Database Schema (db_cutbro)

### Core Tables

| Table | Description |
|---|---|
| `users` | All users (Super Admin, Owner, Barber, Customer) |
| `roles` | Role definitions (super_admin, owner, barber, customer) |
| `permissions` | Permission definitions |
| `role_permissions` | Pivot: role ↔ permission |
| `barbershops` | Registered barbershop tenants |
| `services` | Services offered per barbershop |
| `service_categories` | Service category grouping per barbershop |
| `barbers` | Barber profiles linked to users & barbershop |
| `shifts` | Shift schedules per barbershop |
| `barber_shift_assignments` | Barber ↔ shift ↔ day_of_week assignment |
| `bookings` | Customer booking records |
| `payments` | Payment records linked to bookings |
| `operational_hours` | Barbershop open/close hours per day |
| `barbershop_user_blocks` | Blocked customers per barbershop |
| `login_logs` | Security login attempt logs |
| `personal_access_tokens` | Sanctum tokens (with is_refresh flag) |

### Key Relationships
```
users → belongs to → roles
users → belongs to → barbershops (for owner & barber)
barbershops → has many → services, barbers, shifts, bookings, operational_hours
barbers → belongs to → users & barbershops
barbers → has many → barber_shift_assignments
bookings → belongs to → customer (user), barber, service, barbershop
bookings → has one → payment
services → belongs to → service_categories
```

### Multi-Tenant Rule (CRITICAL)
```sql
-- Every query for tenant-specific data MUST include:
WHERE barbershop_id = auth()->user()->barbershop_id
```
**Never return data across different barbershop tenants.**

### Important Column Notes
- `users.barbershop_id` → NULL for super_admin and customer
- `users.login_attempts` → increments on failed login (security)
- `users.locked_until` → account locked timestamp
- `users.google_id` → for Google OAuth login
- `bookings.status` → default: `pending_payment`
- `payments.provider` → 'midtrans'
- `payments.external_reference` → Midtrans order/transaction ID
- `personal_access_tokens.is_refresh` → distinguishes refresh tokens

---

## 6. API Standards

### Base URL (Local)
```
http://localhost:8000/api
```

### Authentication Header
```
Authorization: Bearer {token}
```
All endpoints require this header except `/auth/login` and `/auth/register-owner`.

### Standard Response Format
```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "message": "Error description" }
```

### HTTP Status Codes
| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Server Error |

---

## 7. Role System & Access Matrix

| Role | barbershop_id in users | Dashboard |
|---|---|---|
| `super_admin` | NULL | Super Admin Dashboard |
| `owner` | filled | Owner Dashboard |
| `barber` | filled | Barber Dashboard |
| `customer` | NULL | Customer Dashboard |

### Endpoint Access by Role
| Endpoint Group | Super Admin | Owner | Barber | Customer |
|---|---|---|---|---|
| `/admin/*` | ✅ | ❌ | ❌ | ❌ |
| `/services` | ❌ | ✅ | ❌ | ❌ |
| `/barbers` | ❌ | ✅ | ❌ | ❌ |
| `/shifts` | ❌ | ✅ | ❌ | ❌ |
| `/bookings/my` | ❌ | ❌ | ❌ | ✅ |
| `/bookings` (manage) | ❌ | ✅ | ✅ | ❌ |
| `/dashboard/stats` | ❌ | ✅ | ❌ | ❌ |
| `/payments` | ❌ | ❌ | ❌ | ✅ |

---

## 8. Features Status

### ✅ Backend — Completed
- Authentication (login, register owner, logout)
- Token refresh mechanism (is_refresh on personal_access_tokens)
- Login security (login_attempts, locked_until, login_logs)
- Google OAuth fields on users table
- Role & Permission system (roles, permissions, role_permissions)
- Database schema fully migrated

### 🔄 Backend — In Progress / Incomplete
- Services CRUD (partially done)
- Barbers CRUD (partially done)
- Bookings management (partially done)
- Dashboard stats endpoint
- Payment integration (Midtrans sandbox)
- Operational hours management
- Shift management
- Barber shift assignments
- Super Admin: barbershop management & suspend
- Customer: booking flow & my bookings

### ✅ Frontend — Completed
- All UI layouts done (both mobile & desktop responsive)
- All page designs ready

### ❌ Frontend — Not Started
- API integration (connecting UI to backend endpoints)
- Authentication flow (login, register, token storage)
- Role-based routing & protected routes
- All dashboard data fetching
- Payment flow (Midtrans redirect & callback handling)

---

## 9. Payment Gateway — Midtrans

- **Mode:** Sandbox (development only)
- **Flow:**
  1. Customer creates booking → status: `pending_payment`
  2. Customer hits `POST /payments` → backend creates Midtrans transaction
  3. Backend returns `payment_url`
  4. Frontend redirects customer to `payment_url`
  5. Midtrans calls `POST /payments/callback` on success/failure
  6. Backend updates `payments.status` and `bookings.status`
- **Credentials:** Store in `Backend/.env` as `MIDTRANS_SERVER_KEY` and `MIDTRANS_CLIENT_KEY`
- **Never** hardcode Midtrans keys in source code
- **Status:** ✅ Sandbox keys sudah dikonfigurasi di `Backend/.env`

---

## 9b. Third-Party Services Status

> ⚠️ Semua key/credential disimpan di `.env` (tidak di-commit ke git). File ini hanya mencatat STATUS konfigurasi — bukan nilai key-nya.

| Service | Tujuan | Status | Konfigurasi di |
|---|---|---|---|
| **Midtrans Sandbox** | Payment gateway | ✅ Configured | `Backend/.env` (SERVER_KEY, CLIENT_KEY) + `Frontend/.env` (CLIENT_KEY) |
| **Google OAuth** | Login dengan Google | ✅ Configured | `Backend/.env` (CLIENT_ID, CLIENT_SECRET, REDIRECT_URI) |
| **Mailtrap** | Email testing (forgot password, verification) | ✅ Configured | `Backend/.env` (MAIL_HOST, PORT, USERNAME, PASSWORD) |

### Google OAuth Redirect URI (penting untuk Google Console)
```
http://127.0.0.1:8000/api/auth/google/callback
```
> Jika mengganti port atau domain, update di Google Cloud Console → Credentials → OAuth 2.0 Client → Authorized redirect URIs

### Mailtrap
Semua email yang dikirim backend (verification, forgot password) masuk ke inbox Mailtrap.
Login di [mailtrap.io](https://mailtrap.io) untuk melihat email yang terkirim.

---

## 10. Coding Conventions

### Backend (Laravel)
- Use `async` Service layer pattern: Controller → Service → Model
- All controllers return consistent JSON using the standard response format
- Use Laravel Form Requests for all validation
- Use soft deletes (`deleted_at`) on: users, barbershops, barbers, services, service_categories, barbershop_user_blocks
- Always scope queries with `barbershop_id` for tenant isolation
- Use `try-catch` in all service methods
- Use Laravel policies or middleware for role-based authorization
- Never expose raw SQL errors to API responses

### Frontend (React)
- Use functional components with hooks only (no class components)
- All API calls go through `src/services/` — never call axios directly in components
- Store auth token in `localStorage` with key: `cutbro_token`
- Use React Router for all navigation
- Follow existing component naming and folder structure
- Use Tailwind utility classes only — no custom CSS unless necessary
- Handle loading and error states on every API call

### General
- All code written in **English** (variable names, comments, function names)
- All git commit messages in **English**
- Communicate with Claude in **Bahasa Indonesia**

---

## 11. Environment Variables

### Backend (`Backend/.env`)
```
APP_NAME=CutBro
APP_ENV=local
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=db_cutbro
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost:5173
FRONTEND_URL=http://localhost:5173

MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=<lihat Backend/.env>
MAIL_PASSWORD=<lihat Backend/.env>
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="no-reply@cutbro.test"
MAIL_FROM_NAME="CutBro"

GOOGLE_CLIENT_ID=<lihat Backend/.env>
GOOGLE_CLIENT_SECRET=<lihat Backend/.env>
GOOGLE_REDIRECT_URI=http://127.0.0.1:8000/api/auth/google/callback

MIDTRANS_SERVER_KEY=<lihat Backend/.env>
MIDTRANS_CLIENT_KEY=<lihat Backend/.env>
MIDTRANS_IS_PRODUCTION=false
```

### Frontend (`Frontend/.env`)
```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_MIDTRANS_CLIENT_KEY=<lihat Frontend/.env>
```

---

## 12. Important Rules — Do NOT Violate

1. **Never change the existing database schema** for `users`, `roles`, `barbershops` without discussion
2. **Never skip `barbershop_id` scoping** in any query involving tenant data
3. **Never put secrets** (API keys, passwords) in source code or commit them to git
4. **Never return data from another tenant** — always filter by authenticated user's `barbershop_id`
5. **Never deploy to Railway or Vercel** at this stage — local only
6. **Always use the standard response format** `{ success, data/message }` — never deviate
7. **Never use class components** in React — functional components only
8. **Always add error handling** on both frontend (API calls) and backend (service methods)

---

## 13. GitHub Repositories

> Both repos need to be cloned to local PC before starting development.

```bash
# Clone both into monorepo structure
mkdir CutBro
cd CutBro
git clone <backend-repo-url> Backend
git clone <frontend-repo-url> Frontend
```

After cloning:
```bash
# Backend setup
cd Backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate

# Frontend setup
cd ../Frontend
npm install
cp .env.example .env
```

---

## 14. First Session Checklist

When starting a new Claude Code session, ask Claude to:
1. Read this `CLAUDE.md` file
2. Scan the `Backend/app/` and `Frontend/src/` folder structure
3. Identify what has been implemented vs what's missing
4. Confirm understanding before starting any task

---

*Last updated: 3 April 2026 | Project: CutBro SaaS Barbershop | Developer: Fariduddin Syah A*
