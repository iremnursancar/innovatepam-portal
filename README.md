# InnovatEPAM Portal

A full-stack idea management platform where employees submit innovation ideas and admins evaluate them.

---

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Node.js | 18 LTS or later |
| npm | 9+ (bundled with Node) |

> No database server needed — the app uses an embedded SQLite (WASM) database.

---

## Environment Setup

### Backend

```bash
cd backend
cp .env.example .env   # then edit values as needed
```

Default `.env` values (safe for local development):

```env
PORT=3001
JWT_SECRET=local_dev_secret_change_in_prod
DB_PATH=./data
UPLOADS_PATH=./uploads
```

### Frontend

```bash
cd frontend
cp .env.example .env
```

Default `.env`:

```env
VITE_API_BASE_URL=http://localhost:3001
```

---

## Install & Run

Open **two terminals** — one for backend, one for frontend.

### Terminal 1 — Backend

```bash
cd backend
npm install
npm run dev
```

The API server starts on **http://localhost:3001**.  
Database migrations run automatically on first start.

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

The React dev server starts on **http://localhost:5173**.

---

## Seeding an Admin User

By default all registered users are `submitter` role. To promote a user to admin:

1. Register an account at http://localhost:5173/register.
2. Open an SQLite client (e.g., [DB Browser for SQLite](https://sqlitebrowser.org/)) and open `backend/data/app.sqlite`.
3. Run:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

4. Log out and log back in — the admin badge and full idea list will appear.

---

## Running Tests (Backend)

```bash
cd backend
npm test
```

Tests use isolated in-memory SQLite instances per file and run with `--maxWorkers=3`.  
Coverage:

```bash
npm test -- --coverage
```

---

## Feature Overview

| Feature | Route | Roles |
|---------|-------|-------|
| Register | `POST /api/auth/register` | Public |
| Login | `POST /api/auth/login` | Public |
| Logout | `POST /api/auth/logout` | Authenticated |
| Submit idea (+ file) | `POST /api/ideas` | Any authenticated |
| List ideas | `GET /api/ideas` | Submitter: own; Admin: all |
| Idea detail | `GET /api/ideas/:id` | Owner or Admin |
| Mark Under Review | `PATCH /api/ideas/:id/status` | Admin |
| Evaluate idea | `POST /api/evaluations` | Admin |
| Download attachment | `GET /api/attachments/:id/download` | Owner or Admin |

### Idea categories

- Process Improvement
- Product Idea
- Cost Reduction
- Customer Experience
- Other

### Status flow

```
Submitted → Under Review → Accepted
                        → Rejected
```

---

## Project Structure

```
innovatepam-portal/
├── backend/
│   ├── src/
│   │   ├── app.js                  – Express app setup
│   │   ├── server.js               – HTTP server entry point
│   │   ├── config.js               – Environment config
│   │   ├── db/
│   │   │   ├── database.js         – SQLite connection singleton
│   │   │   ├── migrate.js          – Auto-migration runner
│   │   │   └── migrations/         – SQL migration files
│   │   ├── middleware/
│   │   │   ├── authenticate.js     – JWT cookie verifier
│   │   │   ├── requireRole.js      – Role guard factory
│   │   │   ├── upload.js           – Multer file upload config
│   │   │   └── errorHandler.js     – Centralised error handler
│   │   ├── repositories/           – Data-access layer
│   │   ├── services/               – Business logic layer
│   │   ├── routes/                 – Express routers
│   │   └── utils/validate.js       – Input validation helpers
│   └── __tests__/                  – Jest + Supertest integration tests
│
└── frontend/
    └── src/
        ├── api/                    – Axios API clients
        ├── context/AuthContext.jsx – Auth state provider
        ├── components/             – Shared UI components (Navbar, StatusBadge, EvaluationPanel)
        ├── pages/                  – Route-level pages (IdeasListPage, SubmitIdeaPage, IdeaDetailPage)
        └── App.jsx                 – React Router tree
```