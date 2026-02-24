# Domain Glossary: InnovatEPAM Portal

**Last updated**: 2026-02-24
**Applies to**: Phase 1 MVP (`001-phase1-mvp`)
**For AI assistant consumption**: Use the exact terms and values defined here
when generating code, comments, API responses, UI labels, and database values.
When a term has a canonical code value (marked **Code value**), that exact
string must be used in source code and the database — never a synonym or
alternate casing.

---

## 1. Key Domain Terms

### Idea

An innovation proposal created and submitted by an employee through the portal.
An idea is the central entity of the platform; all other domain objects
(Attachment, Evaluation, Status) exist in relation to it.

**Attributes**: title, description, category, status, submitting user, submission
timestamp, optional attachment, optional evaluation.

**Lifecycle**: An idea is created with status `submitted` and progresses through
the Status lifecycle (see below). Once created, the title, description, and
category are immutable in Phase 1.

**Code reference**: `ideas` table; `Idea` entity in `repos/ideaRepository.js`;
`ideaService.js`.

---

### Submitter

A registered user whose role is `submitter`. The default role assigned to every
new account at registration.

**Capabilities**: register, log in, log out, submit ideas, view own ideas only,
view attachment on own ideas, view evaluation result on own ideas (read-only).

**Cannot**: view other users' ideas, access the evaluation workflow, change idea
status.

**Code value**: `'submitter'` — used in `users.role` DB column, JWT payload
`role` claim, `USER_ROLES.SUBMITTER` constant.

---

### Admin (Evaluator)

A registered user whose role is `admin`. Role is assigned manually by a database
update in Phase 1; there is no self-serve admin promotion UI.

**Capabilities**: everything a Submitter can do, plus: view all ideas from all
submitters, set an idea's status to `under_review`, record an evaluation
decision (accept or reject) with a mandatory comment.

**Cannot**: submit ideas under a different user's account; delete ideas or users
in Phase 1.

**Code value**: `'admin'` — used in `users.role` DB column, JWT payload `role`
claim, `USER_ROLES.ADMIN` constant.

**Note for code generation**: Admin permission is enforced by the
`requireRole('admin')` middleware on `PATCH /api/ideas/:id/status` and
`POST /api/evaluations`. Never trust the role from the request body — always
read it from `req.user.role` (populated by the `authenticate` middleware from
the verified JWT).

---

### Evaluation

The admin's recorded decision on an idea, consisting of a **decision** value
(`accepted` or `rejected`) and a mandatory plain-text **comment** explaining
the rationale.

**One evaluation per idea**: the `evaluations` table has a `UNIQUE` constraint
on `idea_id`. Submitting a second evaluation replaces (upserts) the first —
there is no evaluation history in Phase 1.

**Effect**: Saving an evaluation updates the parent idea's `status` to match
the decision (`accepted` → `'accepted'`, `rejected` → `'rejected'`).

**Comment rule**: The comment field is mandatory. An empty or whitespace-only
comment must be rejected with HTTP 400 before the evaluation is persisted.

**Code reference**: `evaluations` table; `evaluationRepository.upsertEvaluation()`;
`evaluationService.evaluate()`.

---

### Status

The lifecycle state of an idea. Progresses in one direction only — statuses
cannot be reverted (except that re-evaluation replaces the prior accepted/rejected
decision in Phase 1).

**Valid values and transitions**:

```
submitted  →  under_review  →  accepted
                            →  rejected
```

| Display label | Code value | Set by | How |
|--------------|-----------|--------|-----|
| Submitted | `'submitted'` | System | Automatically on idea creation |
| Under Review | `'under_review'` | Admin | `PATCH /api/ideas/:id/status` |
| Accepted | `'accepted'` | Admin | `POST /api/evaluations` (decision: accepted) |
| Rejected | `'rejected'` | Admin | `POST /api/evaluations` (decision: rejected) |

**Code value**: lowercase snake_case strings as listed above — used in
`ideas.status` DB column, API responses, and `IDEA_STATUSES` constant.

**Enforcement**: The service layer must reject any status value not in the
`IDEA_STATUSES` constant. Status transitions are not strictly enforced by a
state machine in Phase 1 (an admin can set `under_review` even on an already
`accepted` idea), but the UI should guide the natural flow.

---

### Attachment

A single file uploaded by a Submitter at idea submission time and permanently
linked to that idea.

**Cardinality**: exactly 0 or 1 per idea. An idea may be submitted without an
attachment. Once an attachment is saved it cannot be replaced or deleted in
Phase 1.

**Allowed formats** (MIME types):

| Display label | MIME type | Extension |
|--------------|-----------|----------|
| PDF | `application/pdf` | `.pdf` |
| Word document | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | `.docx` |
| PNG image | `image/png` | `.png` |
| JPEG image | `image/jpeg` | `.jpg`, `.jpeg` |
| Excel spreadsheet | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | `.xlsx` |

**Size limit**: 10 MB maximum (`10 * 1024 * 1024` bytes). Enforced by Multer
middleware before the service layer is called.

**Storage**: local filesystem at `backend/uploads/<uuid>` (no extension in
stored filename). Original filename preserved in `attachments.original_name`
for display only — never used as a filesystem path.

**Code reference**: `attachments` table; `attachmentRepository.js`;
`upload.js` middleware; `ALLOWED_MIME_TYPES` and `MAX_FILE_SIZE_BYTES` constants.

---

### Category

A classification label applied to every idea at submission time. Selected from
a fixed list; free-text categories are not accepted in Phase 1.

**Valid values**:

| Display label | Code value (exact string) |
|--------------|--------------------------|
| Process Improvement | `'Process Improvement'` |
| Product Idea | `'Product Idea'` |
| Cost Reduction | `'Cost Reduction'` |
| Customer Experience | `'Customer Experience'` |
| Other | `'Other'` |

**Code value**: the display label and code value are identical — Title Case
strings. Used in `ideas.category` DB column, API request body, API response,
and the frontend `<select>` options. Defined in the `IDEA_CATEGORIES` array
constant.

**Enforcement**: `ideaService.submitIdea()` must reject any category value not
present in `IDEA_CATEGORIES`.

---

### Session / Authenticated Session

The period during which a user's identity and role are known to the system,
established by a verified JWT stored in an `httpOnly` cookie.

**Lifetime**: 24 hours from issuance. After expiry, all protected endpoints
return HTTP 401 and the frontend redirects to `/login`.

**Stateless**: The server does not maintain a session store. The JWT is
self-contained (encodes `userId`, `role`, `iat`, `exp`). Logout is effected
by clearing the cookie on the client; the token itself remains cryptographically
valid until expiry.

**Code reference**: `utils/jwt.js`; `middleware/authenticate.js`; ADR-002.

---

### Protected Route (Backend)

Any Express route that requires an authenticated session. All routes are
protected except `POST /api/auth/register` and `POST /api/auth/login`.

A protected route must have `authenticate` as its first middleware. Admin-only
routes additionally carry `requireRole('admin')`.

---

### Protected Route (Frontend)

A React route that redirects unauthenticated users to `/login`. Implemented via
the `ProtectedRoute` component. All routes except `/login` and `/register` are
protected. The `AdminRoute` component additionally redirects non-admin users to
`/ideas`.

---

## 2. Business Rules

The following rules are invariants. They must be enforced in the **service
layer** (backend) and reflected defensively in the frontend. There is no
exception path in Phase 1.

| Rule ID | Rule | Enforced by |
|---------|------|------------|
| BR-001 | Every new user account is assigned role `submitter` at registration | `authService.register()` |
| BR-002 | A submitter's idea list contains only ideas with `user_id = req.user.id` | `ideaService.listIdeas()` |
| BR-003 | An admin's idea list contains all ideas regardless of submitter | `ideaService.listIdeas()` |
| BR-004 | A new idea is always created with status `submitted` | `ideaService.submitIdea()` |
| BR-005 | An idea may have at most one attachment; submitting a second is not supported in Phase 1 | `upload.js` (single field), schema UNIQUE not enforced but service enforces one-time only |
| BR-006 | Only an admin may change an idea's status to `under_review`, `accepted`, or `rejected` | `requireRole('admin')` middleware + `evaluationService` |
| BR-007 | An evaluation comment is mandatory (non-empty after trim) | `evaluationService.evaluate()` |
| BR-008 | A second evaluation replaces the first (upsert); there is no evaluation history | `evaluationRepository.upsertEvaluation()` |
| BR-009 | A submitter may not view, create, or modify evaluations | `requireRole('admin')` on evaluation endpoints; `AdminRoute` on frontend |
| BR-010 | File MIME type must be in the `ALLOWED_MIME_TYPES` list | `upload.js` middleware |
| BR-011 | File size must not exceed `MAX_FILE_SIZE_BYTES` (10 MB) | `upload.js` middleware |
| BR-012 | Idea category must be a value in `IDEA_CATEGORIES` | `ideaService.submitIdea()` |
| BR-013 | Email addresses must be unique across all user accounts | `users.email` UNIQUE constraint + `authService` 409 check |
| BR-014 | Passwords are stored exclusively as bcrypt hashes (cost 12); plaintext never persisted | `authService.register()` |
| BR-015 | A submitter may not access another submitter's idea detail | `ideaService.getIdeaDetail()` ownership check |

---

## 3. Role Permissions Matrix

| Action | Submitter | Admin |
|--------|:---------:|:-----:|
| Register an account | ✅ | ✅ |
| Log in | ✅ | ✅ |
| Log out | ✅ | ✅ |
| Submit a new idea | ✅ | ✗ (admin role is for evaluation, not submission) |
| Attach a file to own idea | ✅ | ✗ |
| View own ideas list | ✅ | — |
| View all ideas list | ✗ | ✅ |
| View own idea detail | ✅ | — |
| View any idea detail | ✗ | ✅ |
| Download attachment on own idea | ✅ | — |
| Download attachment on any idea | ✗ | ✅ |
| Set idea status to `under_review` | ✗ | ✅ |
| Record evaluation decision + comment | ✗ | ✅ |
| View evaluation result on own idea | ✅ (read-only) | ✅ |

**Note on Admin submitting ideas**: The portal models admins as evaluators, not
submitters. While no technical constraint prevents an `admin`-role user from
hitting `POST /api/ideas`, the UI does not expose the submission form to admins
and this use case is out of scope for Phase 1.

---

## 4. Term Cross-Reference

| Term | DB table/column | Code constant | API field | UI label |
|------|----------------|--------------|-----------|---------|
| Submitter role | `users.role = 'submitter'` | `USER_ROLES.SUBMITTER` | `role: "submitter"` | "Submitter" |
| Admin role | `users.role = 'admin'` | `USER_ROLES.ADMIN` | `role: "admin"` | "Admin" |
| Status: Submitted | `ideas.status = 'submitted'` | `IDEA_STATUSES.SUBMITTED` | `status: "submitted"` | "Submitted" |
| Status: Under Review | `ideas.status = 'under_review'` | `IDEA_STATUSES.UNDER_REVIEW` | `status: "under_review"` | "Under Review" |
| Status: Accepted | `ideas.status = 'accepted'` | `IDEA_STATUSES.ACCEPTED` | `status: "accepted"` | "Accepted" |
| Status: Rejected | `ideas.status = 'rejected'` | `IDEA_STATUSES.REJECTED` | `status: "rejected"` | "Rejected" |
| File size limit | `attachments.file_size` | `MAX_FILE_SIZE_BYTES` | `fileSize` | "Max 10 MB" |
| Decision: Accept | `evaluations.decision = 'accepted'` | — | `decision: "accepted"` | "Accept" |
| Decision: Reject | `evaluations.decision = 'rejected'` | — | `decision: "rejected"` | "Reject" |
