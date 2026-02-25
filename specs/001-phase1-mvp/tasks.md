# Tasks: InnovatEPAM Portal  Phase 1 MVP

**Input**: Design documents from `specs/001-phase1-mvp/`
**Prerequisites**: spec.md  | plan.md (template  tech stack sourced from user specification)
**Branch**: `001-phase1-mvp`
**Generated**: 2026-02-24

**Tech Stack**: Node.js + Express (backend) | React 18 + Vite (frontend) | SQLite (better-sqlite3) | JWT in httpOnly cookie | bcrypt | Multer + local filesystem | Jest

**Tests**: Not included in this task list. Per user specification, Jest tests for critical paths (auth, idea submission, evaluation) will be written during `/speckit.implement`.

**Organization**: Tasks are grouped by user story enabling independent implementation and delivery of each increment.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: User story label (US1US4)
- Exact file paths included in all task descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize both projects, install all dependencies, establish repo structure.

- [x] T001 Initialize backend Node.js project: create `backend/` directory, run `npm init`, install express, better-sqlite3, bcryptjs, jsonwebtoken, cookie-parser, cors, multer, dotenv  create `backend/package.json`
- [x] T002 Initialize frontend Vite + React project: run `npm create vite@latest frontend -- --template react`, install react-router-dom, axios  create `frontend/package.json`
- [x] T003 [P] Create directory structure: `backend/src/{db,repositories,services,routes,middleware,utils}`, `backend/uploads/`, `frontend/src/{api,context,components,pages}`  create all directories with `.gitkeep` where needed

**Checkpoint**: Both projects initialize with `npm install` without errors

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that ALL user stories depend on. MUST be complete before any story begins.

** CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Create SQLite database module with connection and WAL mode config in `backend/src/db/database.js`
- [x] T005 Create database schema migration runner and initial schema (users, ideas, attachments, evaluations tables) in `backend/src/db/migrations/001_initial_schema.sql` and `backend/src/db/migrate.js`
- [x] T006 [P] Create JWT utility with `signToken(payload)` and `verifyToken(token)` helpers in `backend/src/utils/jwt.js`
- [x] T007 [P] Create authentication middleware that reads JWT from httpOnly cookie and attaches `req.user` in `backend/src/middleware/authenticate.js`
- [x] T008 [P] Create role-guard middleware factory `requireRole(role)` for admin-only route protection in `backend/src/middleware/requireRole.js`
- [x] T009 [P] Create Multer upload middleware: MIME-type allowlist (PDF, DOCX, PNG, JPG, XLSX), 10 MB size limit, `uploads/` destination in `backend/src/middleware/upload.js`
- [x] T010 Configure Express app with CORS (localhost:5173), cookie-parser, JSON body parser, static file serving for `uploads/`, and global error handler in `backend/src/app.js` and `backend/src/middleware/errorHandler.js`
- [x] T011 [P] Create app entry point with server start and DB migration invocation in `backend/src/server.js`
- [x] T012 [P] Create environment config loader with required-variable validation in `backend/src/config.js`; create `backend/.env.example` with JWT_SECRET, PORT, DB_PATH, UPLOADS_PATH
- [x] T013 [P] Bootstrap React app with React Router `<BrowserRouter>`, AuthContext provider shell, and placeholder routes in `frontend/src/main.jsx` and `frontend/src/App.jsx`
- [x] T014 [P] Create base Axios instance with `withCredentials: true` and base URL config in `frontend/src/api/apiClient.js`; create `frontend/.env.example` with VITE_API_BASE_URL

**Checkpoint**: `node src/server.js` starts without error; `npm run dev` starts frontend; DB file created with all four tables

---

## Phase 3: User Story 1  Employee Registration & Login (Priority: P1)  MVP

**Goal**: Any visitor can register an account, sign in, and receive a role-aware session. Admins and submitters are distinguished.

**Independent Test**: Register a new account via `POST /api/auth/register`, log in via `POST /api/auth/login`, call `GET /api/auth/me`  verify user object with role is returned. On frontend: complete registration and login forms, verify home view shows user's name and role badge.

### Implementation for User Story 1

- [x] T015 [P] [US1] Create User repository with `createUser`, `findByEmail`, `findById` methods in `backend/src/repositories/userRepository.js`
- [x] T016 [US1] Implement AuthService with `register(email, password)` (bcrypt hash, role=submitter default) and `login(email, password)` (bcrypt compare, sign JWT) in `backend/src/services/authService.js`  depends on T015, T006
- [x] T017 [US1] Implement auth routes: `POST /api/auth/register`, `POST /api/auth/login` (set httpOnly cookie), `POST /api/auth/logout` (clear cookie), `GET /api/auth/me` (requires authenticate middleware) in `backend/src/routes/auth.js`  depends on T016, T007
- [x] T018 [US1] Mount auth router on `/api/auth` in `backend/src/app.js`
- [x] T019 [P] [US1] Implement auth API client with `register(email, password)`, `login(email, password)`, `logout()`, `getMe()` in `frontend/src/api/authApi.js`  depends on T014
- [x] T020 [US1] Implement AuthContext with `user`, `login()`, `logout()`, `register()` state and methods; persist auth state via `getMe()` on app load in `frontend/src/context/AuthContext.jsx`  depends on T019
- [x] T021 [P] [US1] Build RegisterPage form (email, password, confirm password) with validation and error display in `frontend/src/pages/RegisterPage.jsx`  depends on T020
- [x] T022 [P] [US1] Build LoginPage form (email, password) with error display and redirect-on-success in `frontend/src/pages/LoginPage.jsx`  depends on T020
- [x] T023 [US1] Build ProtectedRoute component that redirects unauthenticated users to `/login` in `frontend/src/components/ProtectedRoute.jsx`  depends on T020
- [x] T024 [US1] Build AdminRoute component that redirects non-admin users to ideas list in `frontend/src/components/AdminRoute.jsx`  depends on T020
- [x] T025 [US1] Wire all auth routes in `frontend/src/App.jsx`: `/register`, `/login`, `/` (protected)  depends on T021, T022, T023

**Checkpoint**: Register  Login  `/api/auth/me` returns user with role. Logout clears cookie. Duplicate email returns 409. Wrong password returns 401.

---

## Phase 4: User Story 2  Idea Submission with Attachment (Priority: P2)

**Goal**: A signed-in submitter can create an idea with title, description, and category, optionally attaching a single validated file. The idea appears in their list with status "Submitted".

**Independent Test**: Authenticated as a submitter, post `POST /api/ideas` with multipart form data (title, description, category, file)  verify 201 response with idea object containing status "Submitted" and attachment metadata. On frontend: submit the form and verify idea appears in the list with correct status badge.

### Implementation for User Story 2

- [ ] T026 [P] [US2] Create Idea repository with `createIdea`, `findById`, `findBySubmitter`, `findAll`, `updateStatus` methods in `backend/src/repositories/ideaRepository.js`
- [ ] T027 [P] [US2] Create Attachment repository with `createAttachment`, `findByIdeaId` methods in `backend/src/repositories/attachmentRepository.js`
- [ ] T028 [US2] Implement IdeaService `submitIdea(submitterId, fields, file)` method: validate category against allowlist, persist idea with status "Submitted", persist attachment record if file present in `backend/src/services/ideaService.js`  depends on T026, T027
- [ ] T029 [US2] Implement `POST /api/ideas` route: authenticate middleware  upload middleware (T009)  requireRole not needed (any authenticated user)  call IdeaService  return 201 in `backend/src/routes/ideas.js`  depends on T028, T007, T009
- [ ] T030 [US2] Mount ideas router on `/api/ideas` in `backend/src/app.js`
- [ ] T031 [P] [US2] Implement ideas API client with `submitIdea(formData)` in `frontend/src/api/ideasApi.js`  depends on T014
- [ ] T032 [US2] Build SubmitIdeaPage: controlled form (title, description, category select, file input with client-side size/type check), submission handling, success redirect to ideas list in `frontend/src/pages/SubmitIdeaPage.jsx`  depends on T031, T023
- [ ] T033 [US2] Add SubmitIdeaPage route `/ideas/new` (protected, submitter-visible) in `frontend/src/App.jsx`

**Checkpoint**: Submitter can POST a multipart idea with file  201 with attachment. File exceeding 10 MB returns 400. Disallowed MIME type returns 400. Missing required field returns 400.

---

## Phase 5: User Story 3  Idea Listing & Status Visibility (Priority: P3)

**Goal**: Signed-in users see a role-filtered idea list. Submitters see only their own ideas; admins see all. Each row shows title, category, date, and current status badge.

**Independent Test**: As submitter: `GET /api/ideas` returns only own ideas. As admin: `GET /api/ideas` returns all ideas. On frontend: idea list renders all rows with status badges; submitter cannot see other users' ideas.

### Implementation for User Story 3

- [ ] T034 [US3] Implement IdeaService `listIdeas(requestingUser)` (role-conditional query) and `getIdeaDetail(ideaId, requestingUser)` (include attachment + evaluation if present) in `backend/src/services/ideaService.js`  depends on T026, T027
- [ ] T035 [US3] Implement `GET /api/ideas` (role-filtered list) and `GET /api/ideas/:id` (detail with attachment + evaluation) routes in `backend/src/routes/ideas.js`  depends on T034, T007
- [ ] T036 [P] [US3] Extend ideas API client with `listIdeas()` and `getIdea(id)` in `frontend/src/api/ideasApi.js`  depends on T014
- [ ] T037 [US3] Build IdeasListPage: fetch and render idea rows (title, category, date, status badge), "New Idea" button for submitters, row click navigates to detail in `frontend/src/pages/IdeasListPage.jsx`  depends on T036, T020, T023
- [ ] T038 [US3] Build IdeaDetailPage: render idea fields, attachment download link, evaluation result section (read-only for submitters) in `frontend/src/pages/IdeaDetailPage.jsx`  depends on T036, T020
- [ ] T039 [US3] Add route `/ideas` (protected list) and `/ideas/:id` (protected detail) in `frontend/src/App.jsx`; set `/ideas` as default authenticated landing page

**Checkpoint**: Submitter sees only own ideas in list. Admin sees all. Status badges reflect current state. Unauthenticated GET returns 401.

---

## Phase 6: User Story 4  Admin Evaluation Workflow (Priority: P4)

**Goal**: An admin can open any idea, optionally mark it "Under Review", then record an "Accepted" or "Rejected" decision with a mandatory comment. The idea status updates immediately.

**Independent Test**: As admin: `PATCH /api/ideas/:id/status` (body: `{status:"under_review"}`)  200. `POST /api/evaluations` (body: `{ideaId, decision:"accepted", comment:"text"}`)  idea status becomes "Accepted", evaluation record retrievable. Submitter attempting same  403.

### Implementation for User Story 4

- [ ] T040 [P] [US4] Create Evaluation repository with `upsertEvaluation(ideaId, adminId, decision, comment)` and `findByIdeaId(ideaId)` in `backend/src/repositories/evaluationRepository.js`
- [ ] T041 [US4] Implement EvaluationService `evaluate(ideaId, admin, decision, comment)` (validate decision enum, upsert evaluation, update idea status) in `backend/src/services/evaluationService.js`  depends on T040, T026
- [ ] T042 [US4] Implement evaluation routes: `PATCH /api/ideas/:id/status` (admin only, status: under_review) and `POST /api/evaluations` (admin only: accepted/rejected + comment) in `backend/src/routes/evaluations.js`  depends on T041, T007, T008
- [ ] T043 [US4] Mount evaluations router and wire status-update sub-route for ideas in `backend/src/app.js`
- [ ] T044 [P] [US4] Implement evaluations API client with `setUnderReview(ideaId)` and `submitEvaluation(ideaId, decision, comment)` in `frontend/src/api/evaluationsApi.js`  depends on T014
- [ ] T045 [US4] Build EvaluationPanel component (admin-only, visible on IdeaDetailPage): status action buttons, decision radio (Accept/Reject), comment textarea (required), submit handler in `frontend/src/components/EvaluationPanel.jsx`  depends on T044, T024
- [ ] T046 [US4] Integrate EvaluationPanel into IdeaDetailPage with AdminRoute guard; show read-only evaluation result to submitters in `frontend/src/pages/IdeaDetailPage.jsx`  depends on T045, T038

**Checkpoint**: Admin can accept/reject with comment  status updates. Submitter attempting evaluation  403. Missing comment  400. Existing evaluation is replaced on re-evaluation.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Wiring loose ends, consistent UX, and production-readiness for the MVP demo.

- [ ] T047 Add centralized error handler middleware that returns `{error: message}` JSON for all Express errors (400/401/403/404/500) in `backend/src/middleware/errorHandler.js`  ensure mounted last in `backend/src/app.js`
- [ ] T048 [P] Add input validation for all backend routes: required fields, email format (FR-001/002), category enum (FR-008), decision enum (FR-018), comment required (FR-018)  inline validation or via a `validate.js` util in `backend/src/utils/validate.js`
- [ ] T049 [P] Build shared Navbar component with nav links (Ideas, Submit Idea), user name + role display, and Logout button in `frontend/src/components/Navbar.jsx`  depends on T020
- [ ] T050 [P] Add status badge component with color-coded labels (Submitted=blue, Under Review=yellow, Accepted=green, Rejected=red) in `frontend/src/components/StatusBadge.jsx`
- [ ] T051 [P] Add attachment download endpoint `GET /api/attachments/:id/download` that streams the file with correct Content-Disposition header in `backend/src/routes/attachments.js`; mount in `backend/src/app.js`
- [ ] T052 Write root-level `README.md` developer quickstart: prerequisites, environment setup steps, `npm install` + `npm run dev` commands for both backend and frontend, seed admin user instructions

**Checkpoint**: Full end-to-end workflow  register  login  submit idea with attachment  admin evaluates  status updated  runs without errors in a single browser session.

---

## Dependencies (Story Completion Order)

```
Phase 1 (Setup)
     Phase 2 (Foundation: DB, JWT, Middleware, App config)
             Phase 3 (US1: Auth)  MVP delivery point
                     Phase 4 (US2: Submission)  depends on authenticated session
                             Phase 5 (US3: Listing)  depends on ideas existing
                                    Phase 6 (US4: Evaluation)  depends on listing + ideas
                             Phase 7 (Polish)  can begin after Phase 3
```

**Story independence note**: US3 and US4 require US1 + US2 to be meaningful, but their backend routes can be built independently of the frontend. Backend routes for all stories can be implemented in parallel once Phase 2 is complete.

---

## Parallel Execution Examples

### After Phase 2 completes  backend and frontend can run in parallel:

**Backend track**:
```
T015 (User repo)  T016 (AuthService)  T017 (auth routes)  T018 (mount)
T026 (Idea repo) 
T027 (Attach repo) T028 (IdeaService)  T029 (POST /ideas)
                       T034 (listIdeas)  T035 (GET /ideas, GET /ideas/:id)
T040 (Eval repo)  T041 (EvalService)  T042 (eval routes)
```

**Frontend track** (after T013, T014):
```
T019 (authApi)  T020 (AuthContext)  T021 (RegisterPage)
                                         T022 (LoginPage)
                                         T023 (ProtectedRoute)
T031 (ideasApi)  T032 (SubmitIdeaPage)
T036 (ideasApi ext)  T037 (IdeasListPage)
                      T038 (IdeaDetailPage)  T046 (+ EvaluationPanel)
```

### Within same story  parallelizable tasks (marked [P]):
- **US1**: T015 (User repo)  T019 (auth API client)  different files, no dependency
- **US2**: T026 (Idea repo)  T027 (Attachment repo)  different files, no dependency
- **US4**: T040 (Eval repo)  T044 (eval API client)  different files, no dependency

---

## Implementation Strategy

### MVP Scope (Phase 3 alone delivers standalone value)
Implement through Phase 3 (T001T025) for a working authentication system:
- Users can register, log in, and see a role-aware home view
- Session persists across page refreshes
- Admin and submitter roles enforced

### Incremental Delivery Plan
| Phase | Tasks | Deliverable |
|-------|-------|-------------|
| 12 | T001T014 | Runnable skeleton, DB initialized |
| 3 | T015T025 | **MVP**: Auth fully working (US1 ) |
| 4 | T026T033 | Idea submission with attachment (US2 ) |
| 5 | T034T039 | Idea listing and status visibility (US3 ) |
| 6 | T040T046 | Admin evaluation workflow (US4 ) |
| 7 | T047T052 | Production-ready MVP demo |

---

## Summary

| Metric | Count |
|--------|-------|
| Total tasks | 52 |
| Setup tasks (Phase 1) | 3 |
| Foundational tasks (Phase 2) | 11 |
| US1 tasks (Phase 3) | 11 |
| US2 tasks (Phase 4) | 8 |
| US3 tasks (Phase 5) | 6 |
| US4 tasks (Phase 6) | 7 |
| Polish tasks (Phase 7) | 6 |
| Parallelizable tasks [P] | 26 |
| Test tasks | 0 (deferred to /speckit.implement) |

### Format Validation
All 52 tasks follow the required format: `- [ ] [TaskID] [P?] [Story?] Description with file path` 
