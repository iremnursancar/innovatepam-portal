# Development Process — InnovatEPAM Portal

**Audience**: AI code-generation assistants  
**Purpose**: Authoritative reference for development workflow, branching, testing, and commit conventions  
**Version**: 1.0.0 | **Date**: 2026-02-24

---

## 1. Overview

Every feature in InnovatEPAM Portal follows a structured pipeline before a single line of production code is written. This ensures specs drive implementation, not the other way around.

```
IDEA
  │
  ▼
/speckit.specify  ──→  specs/{###}-{feature}/spec.md          (user stories, FRs, edge cases)
  │
  ▼
/speckit.plan     ──→  specs/{###}-{feature}/plan.md          (tech decisions, data model, contracts)
                        specs/{###}-{feature}/data-model.md
                        specs/{###}-{feature}/contracts/
                        specs/{###}-{feature}/research.md
  │
  ▼
/speckit.tasks    ──→  specs/{###}-{feature}/tasks.md         (ordered, parallelizable task list)
  │
  ▼
/speckit.implement ─→  source code on feature branch          (task-by-task, test-first)
  │
  ▼
PULL REQUEST → MERGE → main
```

Each stage **must complete** before the next begins. Never start `/speckit.implement` without a validated `tasks.md`.

### 1.1 SpecKit Stage Responsibilities

| Stage | Output | Validation Gate |
|-------|--------|----------------|
| `/speckit.specify` | `spec.md`, `checklists/requirements.md` | All 16 checklist items pass; zero `NEEDS CLARIFICATION` markers |
| `/speckit.plan` | `plan.md`, `data-model.md`, `contracts/`, `research.md`, `quickstart.md` | Constitution Check — all 5 principle gates marked `[x]` |
| `/speckit.tasks` | `tasks.md` | Every task has: checkbox, ID (T###), optional [P], optional [US#], description, file path |
| `/speckit.implement` | Source files per task | All tests pass; task marked `[x]` in tasks.md; committed with task reference |

---

## 2. Branching Strategy

### 2.1 Branch Inventory

| Branch | Purpose | Direct Commits |
|--------|---------|----------------|
| `main` | Stable, production-ready code | **FORBIDDEN** |
| `###-feature-name` | Feature development | YES — all implementation commits |

### 2.2 Branch Naming Convention

```
{3-digit-number}-{kebab-case-description}
```

**Examples**:
```
001-phase1-mvp
002-admin-dashboard
003-email-notifications
004-bulk-export
```

**Rules**:
- Number is zero-padded to 3 digits
- Description uses kebab-case (all lowercase, hyphens only — no underscores, no spaces)
- Number comes from `create-new-feature.ps1` script output (`FEATURE_NUM` field)
- Description should match the feature name in `spec.md`

### 2.3 Branch Lifecycle

```
main
  │
  ├── git checkout -b 001-phase1-mvp
  │       │
  │       ├── T001 commit
  │       ├── T002 commit
  │       ├── ...
  │       ├── T052 commit
  │       │
  │       └── Pull Request → reviewed → merged
  │
main (updated)
  │
  └── git checkout -b 002-next-feature
```

**Creating a branch**:
```powershell
# Always use the SpecKit script — it scaffolds the spec file too
.\.specify\scripts\powershell\create-new-feature.ps1 -FeatureName "my-feature-name"
```

**Merging back**:
- Open a pull request from `###-feature-name` → `main`
- All tests must pass before merge
- No force-pushing to main

---

## 3. Testing Strategy

### 3.1 Test-First Mandate (NON-NEGOTIABLE)

The following critical paths **MUST** have tests written before implementation code:

| Critical Path | Test File | Why |
|--------------|-----------|-----|
| User registration | `backend/tests/auth/register.test.js` | Security — input validation, duplicate detection |
| User login | `backend/tests/auth/login.test.js` | Security — credential verification, JWT issuance |
| Auth middleware | `backend/tests/middleware/authMiddleware.test.js` | Security — all protected routes depend on this |
| Idea submission | `backend/tests/ideas/createIdea.test.js` | Core business flow |
| File upload | `backend/tests/ideas/fileUpload.test.js` | Attack surface — MIME validation, size limits |
| Idea listing (submitter) | `backend/tests/ideas/listIdeas.test.js` | Data isolation — submitter sees only own ideas |
| Idea listing (admin) | `backend/tests/ideas/adminListIdeas.test.js` | Role enforcement — admin sees all |
| Evaluation submission | `backend/tests/evaluations/createEvaluation.test.js` | Business rule enforcement |

### 3.2 Test Execution Rules

```
Before every commit:
  ├── All existing tests must pass
  ├── New code must have corresponding tests (for critical paths)
  └── No test skipping (no .skip, no .only left in committed code)
```

**Run tests**:
```bash
# From repo root
cd backend && npx jest --runInBand

# Watch mode during development
cd backend && npx jest --watch
```

### 3.3 Test Scope by Layer

| Layer | Test Type | Tool | Scope |
|-------|-----------|------|-------|
| Routes | Integration | Jest + supertest | HTTP request → response cycle |
| Services | Unit | Jest | Business logic in isolation |
| Middleware | Unit | Jest | Function input/output |
| Data Access | Unit | Jest (in-memory SQLite) | SQL correctness |
| React components | Manual | Browser | Visual + interaction flows |
| React Context | Unit | Jest + React Testing Library | State transitions |

### 3.4 Manual Testing Flows

These UI flows require manual browser testing before each merge:

1. **Auth flow**: Register → Login → Access protected page → Logout → Verify redirect
2. **Submission flow**: Login as submitter → Submit idea with attachment → Verify on listing page
3. **Listing flow**: Login as submitter → Verify only own ideas visible; Login as admin → Verify all ideas visible
4. **Evaluation flow**: Login as admin → Open idea → Submit evaluation → Verify status change

---

## 4. Implementation Workflow per Task

Follow this exact sequence for every task in `tasks.md`:

### Step 1 — Read the Task

Open `specs/{###}-{feature}/tasks.md`. Locate the next unchecked task (`- [ ]`).

Read the task completely:
- **Task ID**: T### — used in commit message
- **[P] marker** — indicates parallelizable; can be worked alongside other [P] tasks
- **[US#] label** — identifies which user story this serves
- **Description + file path** — tells you exactly what to create/modify

### Step 2 — Gather Context

Before writing any code, read:

```
memory-banks/architecture/overview.md       → Layer rules, DB schema, API surface
memory-banks/conventions/coding-standards.md → Naming conventions, layer responsibilities, error format
memory-banks/domain/glossary.md             → Exact status values, constants, business rules
specs/{###}-{feature}/contracts/            → Interface contract for this endpoint (if exists)
specs/{###}-{feature}/data-model.md         → Entity definitions (if exists)
```

### Step 3 — Write the Test (RED)

For critical path tasks: write the Jest test first. The test **must fail** before proceeding.

```javascript
// backend/tests/auth/login.test.js
describe('POST /api/auth/login', () => {
  it('returns 200 and sets httpOnly cookie on valid credentials', async () => {
    // Arrange: seed user in test DB
    // Act: POST /api/auth/login
    // Assert: status 200, Set-Cookie header with httpOnly
  });

  it('returns 401 on invalid password', async () => {
    // ...
  });
});
```

Run: `npx jest path/to/test.file.js` → confirm RED (test fails as expected).

### Step 4 — Implement (GREEN)

Write the minimum code to make the test pass. Follow:
- File must be at the exact path specified in the task
- Naming follows `memory-banks/conventions/coding-standards.md`
- Layer rules: routes call services only; services call data access only; no DB in routes
- Error format: `{ error: "Human-readable message", code: "MACHINE_READABLE_CODE" }`
- No business logic in routes; no HTTP objects in services

Run: `npx jest path/to/test.file.js` → confirm GREEN (test passes).

### Step 5 — Refactor

With green tests, improve code quality:
- Extract magic values to `backend/src/utils/constants.js`
- Simplify conditional logic
- Ensure consistent error handling
- Add JSDoc to exported functions

Run tests again: still GREEN after refactor.

### Step 6 — Mark Task Complete

In `specs/{###}-{feature}/tasks.md`, change:
```
- [ ] T015 [US1] Implement login endpoint in backend/src/routes/auth.js
```
to:
```
- [x] T015 [US1] Implement login endpoint in backend/src/routes/auth.js
```

### Step 7 — Commit

```
git add .
git commit -m "type(scope): description [T###]"
```

See Section 5 for commit conventions.

---

## 5. Commit Convention

### 5.1 Format

```
type(scope): short description [T###]
```

All parts are **required**. Maximum line length: 72 characters.

### 5.2 Types

| Type | When to Use | Example |
|------|-------------|---------|
| `feat` | New feature code (routes, services, components) | `feat(auth): add login endpoint [T015]` |
| `fix` | Bug fix | `fix(ideas): correct status filter query [T023]` |
| `test` | Adding or updating tests only | `test(auth): add register validation tests [T014]` |
| `refactor` | Code change with no behaviour change | `refactor(services): extract status constants [T031]` |
| `docs` | Documentation only | `docs(plan): fill implementation plan for 001-phase1-mvp` |
| `chore` | Build scripts, config, dependencies | `chore(deps): add better-sqlite3 to backend` |

### 5.3 Scopes

Use the domain area or module being changed:

| Scope | Area |
|-------|------|
| `auth` | Authentication — login, register, logout, middleware |
| `ideas` | Idea submission and listing |
| `evaluations` | Evaluation submission and management |
| `users` | User management |
| `db` | Database schema, migrations |
| `middleware` | Express middleware |
| `config` | Configuration files |
| `frontend` | React components and pages |
| `memory-banks` | AI context documents |
| `specs` | Feature specification documents |
| `plan` | Implementation plan documents |

### 5.4 Task Reference

ALWAYS include the task ID in brackets at the end:

```
feat(auth): implement bcrypt password hashing in UserService [T013]
test(auth): add login integration tests [T014]
feat(auth): add POST /api/auth/login route [T015]
```

For multi-task commits (e.g., completing related [P] parallelizable tasks):
```
feat(ideas): add Idea model and IdeaService [T019, T020]
```

### 5.5 Examples — Full Commit History Pattern

```
chore(deps): initialise backend and frontend projects [T001]
chore(config): configure ESLint, Prettier, and Jest [T002]
chore(db): create SQLite file and schema migrations [T003]
chore(config): configure Express server with middleware [T004]
chore(config): configure Vite + React Router + Axios [T005]
feat(db): create users table schema [T006]
feat(db): create ideas table schema [T007]
feat(db): create attachments table schema [T008]
feat(db): create evaluations table schema [T009]
feat(auth): add User data access layer [T010]
feat(auth): implement UserService with bcrypt [T011]
test(auth): write register + login integration tests [T012, T013]
feat(auth): implement POST /api/auth/register endpoint [T014]
feat(auth): implement POST /api/auth/login endpoint [T015]
feat(auth): implement authMiddleware for protected routes [T016]
feat(auth): implement POST /api/auth/logout endpoint [T017]
feat(frontend): add AuthContext and useAuth hook [T018]
feat(frontend): build LoginPage and RegisterPage [T019]
feat(frontend): implement ProtectedRoute component [T020]
```

---

## 6. Definition of Done

A task is **Done** when ALL of the following are true:

```
[ ] Code exists at the exact file path specified in tasks.md
[ ] All tests pass (npx jest -- no failures, no skips)
[ ] New tests written for this task IF it is a critical path task
[ ] No console.log statements left in production code
[ ] No hardcoded secrets or credentials
[ ] Error responses use the { error, code } format
[ ] Layer boundaries respected (no DB access in routes, no HTTP in services)
[ ] Naming follows memory-banks/conventions/coding-standards.md
[ ] Task marked [x] in tasks.md
[ ] Committed with correct type(scope): description [T###] format
```

A user story (phase) is **Done** when:

```
[ ] All tasks in that story's phase are [x] in tasks.md
[ ] The story's independent test criteria pass (see tasks.md phase header)
[ ] Manual UI flow tested in browser (where applicable)
[ ] Committed and pushed to feature branch
```

---

## 7. Reference Files

| File | Role in Workflow |
|------|-----------------|
| `specs/001-phase1-mvp/tasks.md` | Single source of truth for implementation progress |
| `specs/001-phase1-mvp/spec.md` | User stories and acceptance criteria |
| `specs/001-phase1-mvp/plan.md` | Technical decisions and architecture choices |
| `specs/001-phase1-mvp/data-model.md` | Entity definitions and relationships |
| `specs/001-phase1-mvp/contracts/` | API interface contracts per endpoint |
| `memory-banks/architecture/overview.md` | System architecture, DB schema, API surface, 10 binding constraints |
| `memory-banks/conventions/coding-standards.md` | Naming, layer rules, error format, security rules |
| `memory-banks/domain/glossary.md` | Domain terms, status values, business rules, constants |
| `.specify/memory/constitution.md` | 5 binding principles that govern all decisions |
