# Coding Standards: InnovatEPAM Portal

**Last updated**: 2026-02-24
**Applies to**: All code in `backend/` and `frontend/` on branch `001-phase1-mvp` and beyond.
**For AI assistant consumption**: Every rule in this document is a hard constraint.
When generating code, apply all applicable rules without being asked. Deviations
require an explicit instruction from the developer and a comment in the code
explaining why.

---

## 1. Naming Conventions

### 1.1 Files

| Context | Convention | Examples |
|---------|-----------|---------|
| React components | `PascalCase.jsx` | `IdeasListPage.jsx`, `StatusBadge.jsx` |
| React pages | `PascalCase.jsx` in `pages/` | `LoginPage.jsx`, `IdeaDetailPage.jsx` |
| React context files | `PascalCase.jsx` in `context/` | `AuthContext.jsx` |
| Frontend API modules | `camelCase.js` in `api/` | `authApi.js`, `ideasApi.js` |
| Frontend hooks | `camelCase.js` in `hooks/` (prefix `use`) | `useAuth.js`, `useIdeas.js` |
| Backend route files | `camelCase.js` in `routes/` | `auth.js`, `ideas.js`, `evaluations.js` |
| Backend service files | `camelCase.js` in `services/` | `authService.js`, `ideaService.js` |
| Backend repository files | `camelCase.js` in `repositories/` | `userRepository.js`, `ideaRepository.js` |
| Backend middleware files | `camelCase.js` in `middleware/` | `authenticate.js`, `requireRole.js` |
| Backend utility files | `camelCase.js` in `utils/` | `jwt.js`, `validate.js` |
| Test files | mirror source path, suffix `.test.js` | `authService.test.js`, `LoginPage.test.jsx` |
| SQL migration files | `NNN_snake_case_description.sql` | `001_initial_schema.sql` |
| Config / env example | `camelCase.js` or `.env.example` | `config.js`, `.env.example` |

**Rule**: Never use `index.js` as a barrel export file in this project. Import
from the explicit file path to keep dependency graphs unambiguous.

### 1.2 Identifiers

| Kind | Convention | Examples |
|------|-----------|---------|
| Variables | `camelCase` | `userId`, `ideaList`, `isLoading` |
| Functions | `camelCase`, verb-first | `getIdea()`, `submitIdea()`, `validateEmail()` |
| React components | `PascalCase` | `IdeaDetailPage`, `EvaluationPanel` |
| React hooks | `camelCase`, prefix `use` | `useAuth()`, `useIdeas()` |
| Constants (module-level, never reassigned) | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE`, `ALLOWED_MIME_TYPES`, `IDEA_STATUSES` |
| Environment variable names | `UPPER_SNAKE_CASE` | `JWT_SECRET`, `DB_PATH`, `UPLOADS_PATH` |
| Express router instances | `camelCase` + `Router` suffix | `authRouter`, `ideasRouter` |
| SQLite table names | `snake_case`, plural | `users`, `ideas`, `attachments`, `evaluations` |
| SQLite column names | `snake_case` | `user_id`, `created_at`, `stored_path` |
| SQL aliases in queries | `snake_case` matching column name | `u.email AS email` |

### 1.3 Status & Enum Values

Idea status values are lowercase strings, consistent across DB column values,
API responses, and frontend display logic:

```js
// backend/src/utils/constants.js  (single source of truth)
const IDEA_STATUSES = {
  SUBMITTED:    'submitted',
  UNDER_REVIEW: 'under_review',
  ACCEPTED:     'accepted',
  REJECTED:     'rejected',
};

const IDEA_CATEGORIES = [
  'Process Improvement',
  'Product Idea',
  'Cost Reduction',
  'Customer Experience',
  'Other',
];

const USER_ROLES = {
  SUBMITTER: 'submitter',
  ADMIN:     'admin',
};

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
```

Import constants from this file wherever status strings or enums appear.
Never inline `'submitted'` or `'admin'` as magic strings in business logic.

---

## 2. File Structure Rules

### 2.1 Backend — one responsibility per file

Each file in `backend/src/` must have exactly one reason to change:

```
routes/auth.js           → HTTP: parse input, call authService, set cookie, respond
services/authService.js  → Logic: hash password, verify credentials, sign token
repositories/userRepository.js → Data: SQL for users table only
middleware/authenticate.js → Cross-cutting: verify JWT cookie, attach req.user
utils/jwt.js              → Pure utility: signToken, verifyToken
```

Do not create utility functions inside route or service files. Extract to
`utils/` immediately.

### 2.2 Frontend — one component per file

Each `.jsx` file exports exactly one component (the default export matches the
filename in PascalCase). Named exports are permitted for sub-components used
only within that file but must be typed as internal helpers, not the public API.

```
pages/IdeasListPage.jsx     → default export: IdeasListPage
components/StatusBadge.jsx  → default export: StatusBadge
context/AuthContext.jsx      → default export: AuthProvider; named export: useAuth
api/ideasApi.js              → named exports: submitIdea, listIdeas, getIdea
```

### 2.3 Test file co-location

Test files live in a `__tests__/` subdirectory at the same level as the source
file they test:

```
backend/src/services/__tests__/authService.test.js
backend/src/routes/__tests__/auth.test.js
frontend/src/pages/__tests__/LoginPage.test.jsx
```

---

## 3. Code Organisation — Layered Architecture

This is a hard constraint from Constitution Principle IV. Violations must not
be introduced, and generated code must not suggest workarounds.

### 3.1 Route layer rules (`backend/src/routes/`)

```js
// ✅ CORRECT — route handler is input/output only
router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.register(email, password);
    res.cookie('token', result.token, cookieOptions);
    res.status(201).json({ user: result.user });
  } catch (err) {
    next(err);  // always delegate to errorHandler
  }
});

// ❌ WRONG — business logic in route
router.post('/register', async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 12);  // belongs in service
  const user = db.prepare('INSERT INTO users...').run(...); // belongs in repository
  res.json(user);
});
```

**Route handler checklist**:
- [ ] Reads from `req.body`, `req.params`, `req.query`, `req.user`, `req.file`
- [ ] Calls exactly one service method
- [ ] Formats and sends response
- [ ] Has a `try/catch` that calls `next(err)` on error
- [ ] Contains no `if/else` business logic (decisions belong in service)
- [ ] Maximum 25 lines

### 3.2 Service layer rules (`backend/src/services/`)

```js
// ✅ CORRECT — service owns logic, delegates data access
async function register(email, password) {
  if (!isValidEmail(email)) throw createError(400, 'Invalid email format');
  const existing = await userRepository.findByEmail(email);
  if (existing) throw createError(409, 'Email already registered');
  const hash = await bcrypt.hash(password, 12);
  const user = await userRepository.createUser({ email, password: hash, role: USER_ROLES.SUBMITTER });
  const token = jwt.signToken({ sub: user.id, role: user.role });
  return { user: sanitizeUser(user), token };
}

// ❌ WRONG — service queries DB directly
async function register(email, password) {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email); // belongs in repository
}
```

**Service checklist**:
- [ ] All domain validation happens here (not in routes, not in repositories)
- [ ] All DB access goes through a repository function — never `db.prepare()` directly
- [ ] Returns plain data objects (no Express objects, no HTTP status codes)
- [ ] Throws errors using a `createError(statusCode, message)` helper — status code
  is metadata on the error object, not a return value
- [ ] Maximum 50 lines per function; extract helpers if exceeded

### 3.3 Repository layer rules (`backend/src/repositories/`)

```js
// ✅ CORRECT — repository is pure data access
function findByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) ?? null;
}

function createUser({ email, password, role }) {
  const result = db.prepare(
    'INSERT INTO users (email, password, role, created_at) VALUES (?, ?, ?, ?)'
  ).run(email, password, role, new Date().toISOString());
  return findById(result.lastInsertRowid);
}

// ❌ WRONG — repository validates or applies business rules
function createUser(data) {
  if (!data.email.includes('@')) throw new Error('Invalid email'); // belongs in service
}
```

**Repository checklist**:
- [ ] Contains only `db.prepare(...)` calls and immediate data mapping
- [ ] Uses **parameterized queries** exclusively — string interpolation in SQL is forbidden
- [ ] No `req`, `res`, or Express imports
- [ ] No business rules, no bcrypt, no JWT
- [ ] Returns `null` for not-found single-row queries (not `undefined`, not an exception)
- [ ] Maximum 15 lines per function

### 3.4 Frontend API module rules (`frontend/src/api/`)

```js
// ✅ CORRECT
export async function listIdeas() {
  const { data } = await apiClient.get('/ideas');
  return data;
}

// ❌ WRONG — API call inside a React component
function IdeasListPage() {
  useEffect(() => {
    axios.get('http://localhost:3000/api/ideas').then(...); // must go through api/ideasApi.js
  }, []);
}
```

- All Axios calls live in `frontend/src/api/` files.
- Components call custom hooks or context methods that internally call API modules.
- `apiClient.js` is the only file that imports from `axios` directly.

---

## 4. Error Handling

### 4.1 Backend error format

All error responses from the API use the same JSON shape:

```json
{ "error": "<human-readable message>", "code": <HTTP status integer> }
```

The global `errorHandler.js` produces this format. Never construct this
manually in route handlers — always call `next(err)`.

```js
// utils/createError.js
function createError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

// middleware/errorHandler.js
function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const message = status < 500 ? err.message : 'Internal server error';
  if (status >= 500) console.error('[ERROR]', err);
  res.status(status).json({ error: message, code: status });
}
```

### 4.2 Async error handling

Every async route handler and service method must be wrapped in `try/catch`.
No unhandled promise rejections are permitted.

```js
// ✅ CORRECT — route handler
router.get('/:id', async (req, res, next) => {
  try {
    const idea = await ideaService.getIdeaDetail(req.params.id, req.user);
    res.json(idea);
  } catch (err) {
    next(err);
  }
});

// ❌ WRONG — missing catch
router.get('/:id', async (req, res) => {
  const idea = await ideaService.getIdeaDetail(req.params.id, req.user);
  res.json(idea);
});
```

### 4.3 Frontend error handling

API call failures must be caught at the call site and surfaced to the user
via component state — never swallowed silently.

```js
// ✅ CORRECT
const [error, setError] = useState(null);
try {
  await login(email, password);
} catch (err) {
  setError(err.response?.data?.error ?? 'Login failed. Please try again.');
}

// ❌ WRONG — silent failure
try {
  await login(email, password);
} catch (err) {
  console.log(err); // user has no idea what happened
}
```

### 4.4 Logging

Backend logging rules:
- `console.error('[ERROR]', err)` for 5xx errors (unhandled/unexpected).
- `console.warn('[WARN]', message)` for 4xx errors only when they indicate
  suspicious activity (e.g., repeated 401s). Routine validation failures
  (missing field, wrong password) are NOT logged — they are noise.
- `console.info('[INFO]', message)` for significant lifecycle events
  (server start, DB migration complete).
- **Passwords, JWT tokens, and full file paths must never appear in log output.**

---

## 5. Testing Requirements

### 5.1 Test-First for critical paths (Constitution Principle III)

The following paths are **critical** and must have tests written before
implementation. Tests must be confirmed to fail (red) before writing the
implementation (green):

| Critical path | Test file |
|-------------|----------|
| User registration | `backend/src/services/__tests__/authService.test.js` |
| User login (correct + wrong password) | `backend/src/services/__tests__/authService.test.js` |
| JWT cookie set on login | `backend/src/routes/__tests__/auth.test.js` |
| Auth middleware rejects invalid token | `backend/src/middleware/__tests__/authenticate.test.js` |
| Idea submission (with + without file) | `backend/src/services/__tests__/ideaService.test.js` |
| File MIME/size rejection | `backend/src/middleware/__tests__/upload.test.js` |
| Evaluation accept/reject + comment required | `backend/src/services/__tests__/evaluationService.test.js` |
| Admin-only route blocks submitter | `backend/src/middleware/__tests__/requireRole.test.js` |

Non-critical utilities (response formatting, date helpers) may use test-after,
but must reach ≥ 80% branch coverage before a PR is merged.

### 5.2 Jest configuration

```js
// backend/jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  clearMocks: true,
};

// frontend/jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.jsx', '**/__tests__/**/*.test.js'],
  setupFilesAfterFramework: ['@testing-library/jest-dom'],
  clearMocks: true,
};
```

### 5.3 Test structure

Every test file follows Arrange–Act–Assert with `describe` grouping:

```js
describe('authService.register()', () => {
  describe('given a valid email and password', () => {
    it('creates a user with role submitter', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'securePass1!';

      // Act
      const result = await authService.register(email, password);

      // Assert
      expect(result.user.role).toBe('submitter');
      expect(result.user.password).toBeUndefined(); // never returned
      expect(result.token).toBeDefined();
    });
  });

  describe('given a duplicate email', () => {
    it('throws a 409 error', async () => {
      await authService.register('dupe@example.com', 'pass1');
      await expect(
        authService.register('dupe@example.com', 'pass2')
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });
});
```

### 5.4 What to mock

- **Repository functions**: always mock in service tests. Service tests must
  not touch the real SQLite file.
- **bcrypt**: mock in route-layer tests; use real bcrypt in service tests.
- **JWT sign/verify**: mock in middleware tests; use real JWT in service tests.
- **Multer** / filesystem: mock in upload middleware tests; use `tmp` directory
  in integration tests.
- **Never mock the unit under test itself**.

---

## 6. Security Rules

These rules apply to every file. Violations must not be committed.

### 6.1 Secrets and credentials

```js
// ✅ CORRECT
const secret = config.JWT_SECRET; // read from validated env via config.js

// ❌ WRONG — hardcoded secret
const secret = 'my-super-secret-key';
```

- `JWT_SECRET` must be read from `config.js` which reads from `process.env`.
- `config.js` must throw an error at startup if any required env variable is
  missing rather than silently defaulting to a weak value.
- `.env` files are git-ignored. `.env.example` is committed with placeholder
  values only (no real secrets).

### 6.2 Input validation

All user-supplied input must be validated before it reaches a service. Validation
belongs in the **service layer** (not the route handler, not the repository).

```js
// authService.js — validate before touching DB
if (!email || typeof email !== 'string') throw createError(400, 'Email is required');
if (!isValidEmail(email)) throw createError(400, 'Invalid email format');
if (!password || password.length < 8) throw createError(400, 'Password must be at least 8 characters');
```

Validation checklist per input type:

| Input | Validation required |
|-------|-------------------|
| Email | present, string, matches RFC 5322 format |
| Password (registration) | present, string, min 8 characters |
| Idea title | present, string, 1–200 characters |
| Idea description | present, string, 1–5000 characters |
| Idea category | present, must be in `IDEA_CATEGORIES` constant |
| Evaluation decision | present, must be `'accepted'` or `'rejected'` |
| Evaluation comment | present, string, min 1 character after trim |
| File MIME type | enforced by Multer middleware before service |
| File size | enforced by Multer middleware before service |

### 6.3 Parameterized SQL queries

All database queries must use placeholders. String interpolation or template
literals in SQL are forbidden.

```js
// ✅ CORRECT
db.prepare('SELECT * FROM users WHERE email = ?').get(email);
db.prepare('INSERT INTO ideas (user_id, title, status) VALUES (?, ?, ?)').run(userId, title, status);

// ❌ WRONG — SQL injection vector
db.prepare(`SELECT * FROM users WHERE email = '${email}'`).get();
```

### 6.4 Password handling

```js
// ✅ CORRECT — hash before storage, never return hash in response
const hash = await bcrypt.hash(password, 12);
await userRepository.createUser({ email, password: hash, role });

function sanitizeUser(user) {
  const { password, ...safe } = user;  // strip hash before returning to caller
  return safe;
}

// ❌ WRONG
res.json(user);  // user object still contains password hash
```

- The `password` (hash) column must be stripped from every user object before
  it leaves a service function. Use a `sanitizeUser()` helper.
- `password` must never appear in API responses, logs, or JWT payloads.

### 6.5 File path safety

```js
// ✅ CORRECT — UUID-based stored name; original name only in DB
const storedName = `${uuidv4()}`;
cb(null, storedName);

// ❌ WRONG — storing user-supplied filename on disk
cb(null, file.originalname); // path traversal risk
```

- Multer's `filename` callback must generate a UUID and ignore `file.originalname`.
- `file.originalname` is persisted in the `attachments.original_name` DB column
  for display only; it is never used as a filesystem path.
- The download endpoint must look up `stored_path` from the DB — not accept a
  path from the client request.

### 6.6 Authentication on every protected route

Every route that is not `POST /api/auth/register` or `POST /api/auth/login`
must include `authenticate` as the first middleware argument:

```js
// ✅ CORRECT
router.get('/', authenticate, async (req, res, next) => { ... });
router.post('/evaluations', authenticate, requireRole('admin'), async (req, res, next) => { ... });

// ❌ WRONG — missing authenticate
router.get('/', async (req, res, next) => { ... });
```

---

## 7. Code Style

### 7.1 General

- **Indentation**: 2 spaces (no tabs).
- **Quotes**: single quotes in JS/JSX; double quotes in JSX attribute string values only.
- **Semicolons**: required.
- **Trailing commas**: required in multi-line arrays and objects.
- **Line length**: 100 characters max.
- **`const` over `let`**: use `const` for all variables that are not reassigned.
  Never use `var`.
- **`async/await` over `.then()`**: use `async/await` for all Promise-based code.

### 7.2 Function length limits

| Layer | Max lines per function |
|-------|----------------------|
| Route handler | 25 |
| Service method | 50 |
| Repository method | 15 |
| React component render | 80 (split into sub-components if exceeded) |
| Utility function | 30 |

Functions that approach these limits are candidates for extraction — do not
extend the limits; extract instead.

### 7.3 Imports ordering

Group imports in this order, separated by a blank line:

```js
// 1. Node built-ins
import path from 'path';
import fs from 'fs';

// 2. External packages
import express from 'express';
import bcrypt from 'bcryptjs';

// 3. Internal — config/utils
import config from '../config.js';
import { createError } from '../utils/createError.js';

// 4. Internal — same-layer or adjacent
import * as userRepository from '../repositories/userRepository.js';
```

### 7.4 JSDoc for public service and utility functions

All exported service functions and utility functions must have a JSDoc comment:

```js
/**
 * Registers a new user account.
 * @param {string} email - Valid email address.
 * @param {string} password - Plaintext password (min 8 chars); will be hashed.
 * @returns {{ user: SanitizedUser, token: string }}
 * @throws {Error} 400 if email/password invalid; 409 if email already exists.
 */
async function register(email, password) { ... }
```

Route handlers and repository functions do not require JSDoc — the function
name and parameter names are sufficient.
