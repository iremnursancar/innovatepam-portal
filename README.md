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
Coverage: 108 tests passing across Phase 1 + Phase 2 features.

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
| List notifications | `GET /api/notifications` | Authenticated |
| Mark notification read | `PATCH /api/notifications/:id/read` | Authenticated |
| Mark all read | `PATCH /api/notifications/read-all` | Authenticated |
| Notification counts | `GET /api/notifications/count` | Authenticated |
| Vote on idea | `POST /api/ideas/:id/vote` | Authenticated |
| Statistics | `GET /api/stats` | Admin |
| Export CSV | `GET /api/ideas/export` | Admin |

### Phase 1 MVP (Branch: `001-phase1-mvp`)
- **User Authentication**: Register, login, logout with HTTP-only JWT cookies
- **Idea Submission**: Rich form with title, description, category, file attachment
- **Admin Evaluation**: Accept / reject ideas with mandatory evaluator comments
- **Status Tracking**: Submitted → Under Review → Accepted / Rejected
- **Role-based Access**: Submitter vs Admin guards on every protected route

### Phase 2 Enhancements (Branch: `002-phase2-enhancements`)
- **Community Voting System**: Public/private ideas with upvote functionality
- **Real-time Notifications**: Bell icon with dropdown, unread badges, mark as read
- **Activity Monitoring**: Admin activity feed showing recent platform events
- **Analytics Dashboard**: 6-metric statistics panel (total, pending, acceptance rate, etc.)
- **CSV Export**: Download all ideas for offline reporting (admin-only)
- **AI-Powered Analysis**: Smart category suggestions, impact estimation, actionable tips
- **Enhanced Navigation**: Separate "My Ideas" and "Browse Community Ideas" pages
- **Status Timeline**: Visual history showing idea lifecycle with timestamps
- **Search & Filters**: Advanced filtering by status, category, with sort options

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

### Database

- **Migrations**: 7 total (auto-applied on server start, idempotent)
- **Tables**: `users`, `ideas`, `evaluations`, `attachments`, `activities`, `notifications`, `idea_votes`, `idea_status_history`
- **Notable columns**: `ideas.is_public` (Phase 2 public/private toggle)

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