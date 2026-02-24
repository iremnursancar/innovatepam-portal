# Architecture Overview: InnovatEPAM Portal — Phase 1 MVP

**Last updated**: 2026-02-24
**Branch**: `001-phase1-mvp`
**For AI assistant consumption**: This document describes the authoritative
system architecture. When generating or reviewing code, treat every statement
here as a binding constraint unless a newer ADR explicitly supersedes it.

---

## 1. Architecture Pattern

**Monolithic web application** with strict internal layering.

Phase 1 is a single deployable unit — one Node.js process serving the REST API
and one Vite-built React SPA served by a static host or the same Node.js
process. There are no microservices, message queues, background workers, or
separate API gateways. The monolith is intentional and correct for the 10–50
concurrent internal users targeted by Phase 1 (see ADR-001).

Internal structure follows **Layered Architecture** (Constitution Principle IV):

```
┌─────────────────────────────────┐
│         React SPA               │  frontend/
│  Pages → Components → API Client│
└────────────┬────────────────────┘
             │ HTTP + JSON (REST)
             │ httpOnly cookie (JWT)
┌────────────▼────────────────────┐
│      Express Route Handlers     │  backend/src/routes/
│  (parse input, call service,    │
│   format response — no logic)   │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│         Service Layer           │  backend/src/services/
│  (all domain logic lives here)  │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│      Repository / Data Access   │  backend/src/repositories/
│  (all SQL queries live here)    │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│     SQLite (better-sqlite3)     │  backend/data/innovatepam.db
└─────────────────────────────────┘
```

**Enforcement rule**: No layer may call a layer below its immediate neighbour.
Routes call services; services call repositories; repositories call the DB
module. Routes MUST NOT query the database directly. Services MUST NOT build
Express responses.

---

## 2. Tech Stack

| Concern | Technology | Key dependency | ADR |
|---------|-----------|---------------|-----|
| Backend runtime | Node.js 20 LTS | — | ADR-001 |
| Backend framework | Express 4 | `express` | ADR-001 |
| Database | SQLite | `better-sqlite3` | ADR-001 |
| Frontend framework | React 18 | `react`, `react-dom` | ADR-001 |
| Frontend build tool | Vite 5 | `vite` | ADR-001 |
| Client-side routing | React Router v6 | `react-router-dom` | ADR-001 |
| Frontend state | React Context API | built-in | ADR-004 |
| HTTP client (FE→BE) | Axios | `axios` | ADR-001 |
| Authentication tokens | JWT (HS256) | `jsonwebtoken` | ADR-002 |
| Token transport | httpOnly cookie | `cookie-parser` | ADR-002 |
| Password hashing | bcrypt | `bcryptjs` | ADR-002 |
| File upload parsing | Multipart | `multer` | ADR-003 |
| File storage | Local filesystem | `fs` (built-in) | ADR-003 |
| Environment config | dotenv | `dotenv` | — |
| CORS | Express CORS | `cors` | — |
| Testing | Jest | `jest` | constitution III |

---

## 3. Repository / Directory Structure

```
innovatepam-portal/
├── backend/
│   ├── src/
│   │   ├── config.js                # Env variable loader + validation
│   │   ├── app.js                   # Express app (middleware stack, router mounts)
│   │   ├── server.js                # HTTP server start + DB migration invocation
│   │   ├── db/
│   │   │   ├── database.js          # better-sqlite3 connection, WAL mode
│   │   │   ├── migrate.js           # Migration runner
│   │   │   └── migrations/
│   │   │       └── 001_initial_schema.sql
│   │   ├── repositories/            # DATA ACCESS LAYER — SQL only
│   │   │   ├── userRepository.js
│   │   │   ├── ideaRepository.js
│   │   │   ├── attachmentRepository.js
│   │   │   └── evaluationRepository.js
│   │   ├── services/                # DOMAIN LOGIC LAYER
│   │   │   ├── authService.js
│   │   │   ├── ideaService.js
│   │   │   └── evaluationService.js
│   │   ├── routes/                  # ROUTE LAYER — input/output only
│   │   │   ├── auth.js              # POST /api/auth/register|login|logout, GET /api/auth/me
│   │   │   ├── ideas.js             # GET|POST /api/ideas, GET /api/ideas/:id, PATCH /api/ideas/:id/status
│   │   │   ├── evaluations.js       # POST /api/evaluations
│   │   │   └── attachments.js       # GET /api/attachments/:id/download
│   │   ├── middleware/
│   │   │   ├── authenticate.js      # JWT cookie → req.user
│   │   │   ├── requireRole.js       # requireRole('admin') factory
│   │   │   ├── upload.js            # Multer: MIME allowlist, 10 MB limit, uploads/ dest
│   │   │   └── errorHandler.js      # Global Express error handler (JSON responses)
│   │   └── utils/
│   │       ├── jwt.js               # signToken(payload), verifyToken(token)
│   │       └── validate.js          # Input validation helpers
│   ├── uploads/                     # Runtime file storage (git-ignored)
│   ├── .env.example                 # JWT_SECRET, PORT, DB_PATH, UPLOADS_PATH
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx                 # React root, BrowserRouter, AuthContext provider
│   │   ├── App.jsx                  # Route definitions
│   │   ├── api/
│   │   │   ├── apiClient.js         # Axios instance (withCredentials, baseURL)
│   │   │   ├── authApi.js           # register, login, logout, getMe
│   │   │   ├── ideasApi.js          # submitIdea, listIdeas, getIdea
│   │   │   └── evaluationsApi.js    # setUnderReview, submitEvaluation
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # user, login(), logout(), register(), loading
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx   # Redirects unauthenticated → /login
│   │   │   ├── AdminRoute.jsx       # Redirects non-admin → /ideas
│   │   │   ├── Navbar.jsx           # Nav links, user/role display, logout
│   │   │   ├── StatusBadge.jsx      # Color-coded status label
│   │   │   └── EvaluationPanel.jsx  # Admin-only: decision + comment form
│   │   └── pages/
│   │       ├── RegisterPage.jsx
│   │       ├── LoginPage.jsx
│   │       ├── IdeasListPage.jsx
│   │       ├── IdeaDetailPage.jsx
│   │       └── SubmitIdeaPage.jsx
│   ├── .env.example                 # VITE_API_BASE_URL
│   └── package.json
│
├── specs/001-phase1-mvp/            # Design documents
├── docs/adrs/                       # Architecture Decision Records
├── memory-banks/                    # AI assistant context
└── .gitignore
```

---

## 4. Database Schema

Four tables. All IDs are auto-increment integers. No ORM — raw SQL via
`better-sqlite3` in repository files.

```sql
-- users
id          INTEGER PRIMARY KEY AUTOINCREMENT
email       TEXT    NOT NULL UNIQUE
password    TEXT    NOT NULL          -- bcrypt hash, cost 12
role        TEXT    NOT NULL          -- 'submitter' | 'admin'
created_at  TEXT    NOT NULL          -- ISO 8601

-- ideas
id            INTEGER PRIMARY KEY AUTOINCREMENT
user_id       INTEGER NOT NULL REFERENCES users(id)
title         TEXT    NOT NULL
description   TEXT    NOT NULL
category      TEXT    NOT NULL        -- enum: see §5 Category List
status        TEXT    NOT NULL        -- 'submitted'|'under_review'|'accepted'|'rejected'
created_at    TEXT    NOT NULL

-- attachments  (0 or 1 per idea)
id            INTEGER PRIMARY KEY AUTOINCREMENT
idea_id       INTEGER NOT NULL REFERENCES ideas(id)
original_name TEXT    NOT NULL        -- original filename for display
mime_type     TEXT    NOT NULL        -- validated MIME
file_size     INTEGER NOT NULL        -- bytes
stored_path   TEXT    NOT NULL        -- relative path in uploads/
created_at    TEXT    NOT NULL

-- evaluations  (0 or 1 per idea; upserted on re-evaluation)
id            INTEGER PRIMARY KEY AUTOINCREMENT
idea_id       INTEGER NOT NULL REFERENCES ideas(id) UNIQUE
admin_id      INTEGER NOT NULL REFERENCES users(id)
decision      TEXT    NOT NULL        -- 'accepted' | 'rejected'
comment       TEXT    NOT NULL
created_at    TEXT    NOT NULL
updated_at    TEXT    NOT NULL
```

---

## 5. Key Domain Rules

These rules must be enforced in the **service layer**, not in route handlers.

| Rule | Enforced in | Notes |
|------|------------|-------|
| Password hashed at registration (bcrypt, cost 12) | `authService.register()` | Plaintext never persisted or logged |
| Default role on registration is `submitter` | `authService.register()` | Admin role set manually in DB for Phase 1 |
| JWT signed on login/register, 24 h expiry, set as httpOnly cookie | `authService.login()`, route handler | `SameSite=Strict`, `Secure` in production |
| Idea status starts as `submitted` | `ideaService.submitIdea()` | Cannot be overridden by client |
| Category must match allowlist | `ideaService.submitIdea()` | Process Improvement, Product Idea, Cost Reduction, Customer Experience, Other |
| At most one attachment per idea | `ideaService.submitIdea()` | Enforced by service; Multer parses one field only |
| Attachment MIME allowlist: PDF, DOCX, PNG, JPG, XLSX | `upload.js` middleware | Validated on upload before service call |
| Attachment max size: 10 MB | `upload.js` middleware | Multer `limits.fileSize` |
| Only admin may set status to `under_review`, `accepted`, `rejected` | `evaluationService`, `requireRole('admin')` middleware | Submitter attempts → 403 |
| Evaluation comment is mandatory | `evaluationService.evaluate()` | Empty string rejected with 400 |
| Re-evaluation replaces prior decision (upsert) | `evaluationRepository.upsertEvaluation()` | No lock-on-first-decision in Phase 1 |
| Submitters see only their own ideas | `ideaService.listIdeas()` | Admins see all |

---

## 6. Authentication & Request Flow

Every protected API request follows this middleware chain:

```
Request
  → cookie-parser          (makes req.cookies available)
  → authenticate.js        (reads JWT from cookie, verifies signature,
                             attaches req.user = { id, email, role })
  → [requireRole('admin')] (optional, admin-only routes only)
  → route handler          (delegates to service)
  → service                (domain logic, calls repository)
  → repository             (SQL query via database.js)
  → JSON response
```

Error path: any middleware that calls `next(err)` is caught by `errorHandler.js`
(mounted last) which returns `{ error: "<message>" }` with the appropriate HTTP
status code.

**Token lifecycle**:
- Issued: `POST /api/auth/login` or `POST /api/auth/register` → `Set-Cookie: token=<jwt>; HttpOnly; SameSite=Strict`
- Validated: every request to a protected route via `authenticate.js`
- Cleared: `POST /api/auth/logout` → `Set-Cookie: token=; Max-Age=0`
- Expiry: 24 hours (`exp` claim); client receives 401 and must re-authenticate

---

## 7. Frontend State & Data Flow

```
App load
  → AuthContext mounts
  → calls GET /api/auth/me
  → if 200: sets user state, renders protected routes
  → if 401: user is null, ProtectedRoute redirects to /login

Auth actions (login / register / logout)
  → AuthContext method called from page component
  → calls authApi.js function (Axios, withCredentials)
  → on success: updates user state in AuthContext
  → React Router navigates to destination

Idea list
  → IdeasListPage mounts
  → calls ideasApi.listIdeas()
  → renders idea rows with StatusBadge

Idea submission
  → SubmitIdeaPage: client-side MIME/size validation on file select
  → builds FormData, calls ideasApi.submitIdea(formData)
  → on success: navigates to /ideas

Evaluation (admin only, inside IdeaDetailPage)
  → EvaluationPanel renders only when req.user.role === 'admin'
  → calls evaluationsApi.submitEvaluation(ideaId, decision, comment)
  → on success: re-fetches idea detail to show updated status
```

Context API scope (see ADR-004):
- `AuthContext`: global, provided at root
- All other state: local `useState` / `useReducer` per page component
- No external state library in Phase 1

---

## 8. File Upload Flow

```
Frontend                     Backend
─────────                    ───────
File input change
  → client validates MIME + size (FR-012, client-side guard)
  → builds FormData (title, description, category, file)

POST /api/ideas (multipart)
  → authenticate middleware (verify JWT)
  → upload middleware (Multer)
      → rejects if MIME not in allowlist → 400
      → rejects if size > 10 MB → 400
      → writes file to uploads/<uuid>.<ext>
  → route handler
  → ideaService.submitIdea()
      → creates idea row (status: submitted)
      → creates attachment row (original_name, mime_type, file_size, stored_path)
  → 201 { idea, attachment }

GET /api/attachments/:id/download
  → authenticate middleware
  → attachmentRepository.findById()
  → res.download(stored_path, original_name)
    (streams file with Content-Disposition: attachment)
```

Stored path format: `uploads/<uuid>` (UUID v4, no extension in stored name;
original extension available from `original_name` in DB for display).

---

## 9. API Surface (Phase 1)

All routes are prefixed `/api`. All request/response bodies are JSON except
multipart file upload.

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/api/auth/register` | ✗ | — | Create account, return JWT cookie |
| POST | `/api/auth/login` | ✗ | — | Verify credentials, return JWT cookie |
| POST | `/api/auth/logout` | ✓ | any | Clear JWT cookie |
| GET | `/api/auth/me` | ✓ | any | Return current user object |
| POST | `/api/ideas` | ✓ | submitter | Create idea (multipart, optional file) |
| GET | `/api/ideas` | ✓ | any | List ideas (role-filtered) |
| GET | `/api/ideas/:id` | ✓ | any | Idea detail + attachment + evaluation |
| PATCH | `/api/ideas/:id/status` | ✓ | admin | Set status to `under_review` |
| POST | `/api/evaluations` | ✓ | admin | Record accept/reject decision + comment |
| GET | `/api/attachments/:id/download` | ✓ | any | Stream attachment file |

---

## 10. Deployment Model (Phase 1)

```
┌────────────────────────────────────────────┐
│  Single server / local machine             │
│                                            │
│  ┌──────────────────┐                      │
│  │  Node.js process  │  :3000              │
│  │  (Express API)    │                     │
│  └────────┬─────────┘                      │
│           │ reads/writes                   │
│  ┌────────▼─────────┐                      │
│  │  SQLite file      │  backend/data/*.db  │
│  └──────────────────┘                      │
│                                            │
│  ┌──────────────────┐                      │
│  │  uploads/ dir     │  backend/uploads/   │
│  └──────────────────┘                      │
│                                            │
│  ┌──────────────────┐                      │
│  │  React SPA        │  :5173 (dev)        │
│  │  (Vite dev server)│  or static build    │
│  └──────────────────┘                      │
└────────────────────────────────────────────┘
```

- No reverse proxy, load balancer, or container orchestration in Phase 1.
- `uploads/` and the SQLite file must be included in server backup policy.
- Phase 2 scaling triggers: see ADR-001 (SQLite ceiling) and ADR-003
  (filesystem → cloud storage).

---

## 11. Cross-Cutting Constraints for Code Generation

When generating any backend file, apply these rules without being asked:

1. **Route files** must not contain `if/else` business logic — delegate to service.
2. **Service files** must not contain `db.prepare(...)` SQL — delegate to repository.
3. **Repository files** must not contain Express objects (`req`, `res`) — pure data functions only.
4. **Passwords** must never appear in logs, responses, or anywhere outside the bcrypt hash call.
5. **JWT_SECRET** must be read from `config.js` (env var), never hardcoded.
6. **All `uploads/` paths** emitted by Multer must be stored in the DB; direct filesystem paths must never be sent to the frontend.
7. **All authenticated routes** must call `authenticate` middleware before the route handler.
8. **Admin-only routes** (`PATCH /ideas/:id/status`, `POST /evaluations`) must additionally call `requireRole('admin')`.
9. **Error responses** must use the global `errorHandler.js` via `next(err)` — no inline `res.status(500).json(...)` in route handlers.
10. **Frontend API calls** must go through `frontend/src/api/` modules — no `axios` or `fetch` calls inside React components or context files directly.
