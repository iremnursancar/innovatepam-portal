<!--
SYNC IMPACT REPORT
==================
Version Change: [unversioned template] --> 1.0.0
Modified Principles: N/A (initial ratification from template)
Added Sections:
  - Core Principles (all 5: API-First Design, Security by Default,
    Test-First, Layered Architecture, Phased Simplicity)
  - Technology Standards
  - Development Workflow
  - Governance
Removed Sections: N/A (template placeholders replaced)
Templates Updated:
  [OK] .specify/memory/constitution.md (this file)
  [OK] .specify/templates/plan-template.md (Constitution Check gates updated)
  [--] .specify/templates/spec-template.md (no structural changes required)
  [--] .specify/templates/tasks-template.md (no structural changes required)
  [--] .github/agents/*.md (no hard-coded CLAUDE references in templates)
  [--] .github/prompts/*.md (no hard-coded CLAUDE references in templates)
Follow-up TODOs: None -- all placeholders resolved.
-->

# InnovatEPAM Portal Constitution

## Core Principles

### I. API-First Design
The backend REST API is the authoritative contract between server and client.
- API endpoints and their request/response shapes MUST be designed and documented
  before any implementation begins.
- Frontend components MUST consume the API contract; they MUST NOT embed business
  logic that belongs in the backend.
- Breaking API changes MUST be versioned or explicitly coordinated across both
  layers before merging.

**Rationale**: Decoupling frontend from backend implementation details enables
parallel development and prevents tight coupling that makes future changes costly.

### II. Security by Default
Every feature MUST treat security as a first-class requirement, not an afterthought.
- All protected routes MUST enforce authentication via verified JWT/session before
  processing any request.
- Passwords MUST be hashed using bcrypt (cost factor >= 12); plaintext passwords
  MUST never be stored or logged.
- File uploads MUST be validated for MIME type, extension, and maximum size before
  persisting to storage.
- Secrets, tokens, and credentials MUST be read from environment variables; they
  MUST NOT appear in source code or logs.

**Rationale**: InnovatEPAM Portal handles employee identities and organizational
ideas. A single security failure can expose sensitive internal data.

### III. Test-First (NON-NEGOTIABLE)
Tests for critical paths MUST be written and confirmed to fail before implementation.
- Critical paths are: user authentication, idea submission, and admin evaluation
  workflow.
- The Red -> Green -> Refactor cycle MUST be followed for all new critical-path code.
- A feature MUST NOT be marked complete until its acceptance scenarios (from the
  spec) pass in an automated test.
- Non-critical utilities may use test-after but MUST still achieve >= 80% branch
  coverage before merge.

**Rationale**: The MVP delivers trust and correctness over feature count. Defects
in auth or the evaluation workflow directly undermine the platform's purpose.

### IV. Layered Architecture
Code MUST be organized into clearly separated layers with dependency direction:
Routes -> Services -> Data Access.
- Route handlers MUST only parse input, delegate to a service, and format the
  response. Business logic MUST NOT live in route handlers.
- Services MUST encapsulate all domain logic and MUST NOT directly query the
  database (delegate to a repository/data-access layer).
- Database access MUST be isolated in a dedicated data-access layer; raw SQL or
  query-builder calls MUST NOT appear in service files.
- Frontend components MUST delegate API calls to a dedicated API-client module;
  fetch/axios calls MUST NOT be inlined in React components.

**Rationale**: Layering is the single most effective safeguard against the "big
ball of mud" antipattern common in MVP-speed development.

### V. Phased Simplicity
Introduce complexity only when there is demonstrated, measurable need.
- SQLite is the correct database for Phase 1; migration to a client-server DB
  MUST be deferred until query performance or concurrency issues are observed.
- React Context API is the correct state solution for Phase 1; Redux or a
  similar library MUST NOT be introduced without a documented rationale.
- YAGNI applies to all infrastructure, abstractions, and tooling decisions.
- Any deviation from the Phase 1 tech stack MUST be recorded in the feature plan
  as a Complexity Tracking entry and approved before implementation begins.

**Rationale**: Over-engineering at MVP stage delays delivery without providing
proportional value. Phase 1 scope is deliberately constrained.

## Technology Standards

The following stack is locked for Phase 1 and MUST NOT be changed without a
constitution amendment:

| Layer      | Technology          | Notes                                |
|------------|---------------------|--------------------------------------|
| Backend    | Node.js + Express   | REST API server                      |
| Frontend   | React 18 + Vite     | SPA; no SSR in Phase 1               |
| Database   | SQLite              | File-based; single-instance only     |
| State      | React Context API   | No external state management library |
| Auth       | JWT (access token)  | Stored in httpOnly cookie            |
| File store | Local filesystem    | Phase 1 only; cloud store in Phase 2 |

All dependencies MUST be pinned to exact versions via `package-lock.json` to
ensure reproducible builds across environments.

## Development Workflow

- **Branching**: Feature work MUST use a branch named `###-short-description`
  (e.g., `001-user-auth`). Direct commits to `main` are prohibited except for
  hotfixes with documented justification.
- **Code Review**: Every PR MUST pass automated tests and receive at least one
  peer approval before merge.
- **Constitution Check**: Every `plan.md` MUST include a Constitution Check gate
  mapping the feature against all five principles. Implementation MUST NOT
  proceed to Phase 1 design until the gate passes.
- **Environment Config**: A `.env.example` MUST be kept up to date whenever new
  environment variables are introduced. Actual `.env` files MUST remain git-ignored.
- **Definition of Done**: A feature is done when code is merged, tests pass, the
  API is documented (if applicable), and no open security violations remain.

## Governance

This constitution MUST supersede all other project practices. When any practice
conflicts with a principle stated here, this document takes precedence.

**Amendment Procedure**:
1. Open a PR that modifies this file with the proposed change clearly described.
2. State the version bump type (MAJOR / MINOR / PATCH) and rationale in the PR
   description.
3. At least one team member (other than the author) MUST approve.
4. Update `LAST_AMENDED_DATE` and `CONSTITUTION_VERSION` in the version line.
5. Update the Sync Impact Report (HTML comment at top of this file) and revise
   any dependent templates as required.

**Versioning Policy**:
- MAJOR: A principle is removed, redefined incompatibly, or the Technology
  Standards table is materially changed.
- MINOR: A new principle, section, or substantial guidance block is added.
- PATCH: Clarifications, wording improvements, or typo fixes.

**Compliance Review**: Constitution Check gates in plan files are the primary
compliance mechanism. Gate violations found post-merge MUST be documented and
addressed in a follow-up amendment during the next retrospective.

**Version**: 1.0.0 | **Ratified**: 2026-02-24 | **Last Amended**: 2026-02-24