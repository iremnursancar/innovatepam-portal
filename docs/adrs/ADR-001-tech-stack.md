# ADR-001: Technology Stack Selection — Phase 1 MVP

**Date**: 2026-02-24
**Status**: Accepted
**Deciders**: Engineering team
**Relates to**: `specs/001-phase1-mvp/plan.md`

---

## Context

InnovatEPAM Portal Phase 1 must be delivered within 8 weeks. The scope is a
web-based employee innovation management platform supporting user authentication,
idea submission with single-file attachments, an admin evaluation workflow, and
idea status tracking.

Constraints driving the decision:

- **Team expertise**: The engineering team's primary experience is in JavaScript
  and TypeScript across both frontend and backend.
- **Scale**: Phase 1 needs to support 10–50 concurrent internal users. No
  large-scale distribution or high-throughput workloads are anticipated.
- **Budget**: Open-source tooling only; no managed cloud services or paid
  database licences for Phase 1.
- **Timeline**: 8 weeks to a working MVP. Minimizing context-switching between
  languages, ecosystems, and deployment models is critical.
- **Data model**: Relatively simple — four core entities (User, Idea, Attachment,
  Evaluation) with straightforward relational structure and no complex query
  patterns in Phase 1.

---

## Decision

**Backend**: Node.js 20 LTS + Express 4
**Frontend**: React 18 + Vite 5
**Database**: SQLite (via `better-sqlite3`)
**State management**: React Context API
**Auth**: JWT stored in `httpOnly` cookie
**Password hashing**: bcrypt
**File handling**: Multer + local filesystem

A single JavaScript/TypeScript stack end-to-end, with a lightweight
file-based database for Phase 1.

---

## Rationale

### Node.js + Express (backend)

Node.js aligns directly with the team's expertise, eliminating ramp-up time.
Express is minimal and well-understood; it imposes no architectural opinion,
giving full control over the layered architecture required by the project
constitution (Routes → Services → Data Access). The non-blocking I/O model
is more than adequate for the expected 10–50 concurrent users. The NPM
ecosystem provides mature libraries for every Phase 1 requirement: `bcryptjs`,
`jsonwebtoken`, `multer`, `better-sqlite3`, `cookie-parser`.

### React 18 + Vite (frontend)

React 18 is the team's preferred frontend library. Vite provides a significantly
faster development feedback loop than webpack-based alternatives, important
under an 8-week timeline. React Context API is sufficient for Phase 1 state
requirements (auth state, idea list); introducing a heavier state library (Redux,
Zustand) would add complexity without measurable benefit at this scale
(Constitution Principle V — Phased Simplicity).

### SQLite (`better-sqlite3`)

Four entities, simple relational queries, no concurrent writes from multiple
application servers — SQLite is the most appropriate database for this scope.
`better-sqlite3` provides a synchronous API that integrates cleanly with Express
without requiring async/await around every query. There is no operational burden:
no connection pool, no separate database process, no credentials to manage. The
file-based nature simplifies backup to a single file copy. Migration to
PostgreSQL in Phase 2 is straightforward via a schema export/import cycle.

---

## Consequences

### Positive

- **Zero context-switching**: One language (JavaScript) across the entire stack
  means developers can contribute to both layers without switching toolchains.
- **Fast iteration**: Vite HMR and Node.js's fast startup enable a tight
  development loop within the 8-week timeline.
- **Low operational overhead**: SQLite requires no database server setup,
  credentials management, or connection pooling in Phase 1.
- **Known ecosystem**: All chosen libraries (`express`, `bcryptjs`,
  `jsonwebtoken`, `multer`, `react-router-dom`) are mature, widely documented,
  and have no significant known security issues at their pinned versions.
- **Testability**: Jest works natively across both backend (Node.js) and
  frontend (React via `@testing-library/react`), enabling a single test
  framework for the project (Constitution Principle III).

### Negative / Trade-offs

- **SQLite concurrency ceiling**: SQLite serializes writes. If Phase 2 requires
  multiple application instances (horizontal scaling) or significantly higher
  write throughput, a migration to PostgreSQL will be necessary. This is
  explicitly deferred per the constitution.
- **File-based attachment storage**: Storing uploads on the local filesystem
  means attachments are not replicated across instances and are not accessible
  from cloud-based deployments without additional work. Phase 2 must address
  this before any cloud deployment.
- **No built-in ORM**: Direct SQL via `better-sqlite3` requires manual query
  maintenance. For Phase 1's four simple entities this is acceptable; at larger
  data-model complexity an ORM (Drizzle, Prisma) should be evaluated.
- **JWT in httpOnly cookie**: This approach mitigates XSS token theft but
  requires CSRF consideration if non-GET state-changing endpoints are called
  cross-origin. For Phase 1 (single origin, internal users) this risk is low
  and acceptable.

---

## Alternatives Considered

### 1. Python (Flask) + PostgreSQL

**What it offers**: Flask is similarly minimal to Express; Python has strong
ecosystem support for data-heavy applications; PostgreSQL is production-grade
from day one.

**Why rejected**: The engineering team has limited Python and Flask experience,
introducing ramp-up cost that cannot be absorbed in an 8-week timeline. Managing
a PostgreSQL server adds operational complexity unnecessary for 10–50 users in
Phase 1. The data model does not require PostgreSQL's advanced features (JSONB,
full-text search, array types) in Phase 1.

### 2. Java (Spring Boot) + MySQL

**What it offers**: Battle-tested in enterprise environments; strong typing and
compile-time safety; Spring Security provides robust auth primitives.

**Why rejected**: Spring Boot's configuration overhead and JVM startup time
work against rapid MVP iteration. Java expertise is absent from the current team.
MySQL adds the same operational overhead as PostgreSQL without offering features
that Phase 1 requires. The overall ramp-up cost is prohibitive for the timeline.

### 3. Ruby on Rails + PostgreSQL

**What it offers**: Convention-over-configuration speeds up scaffold generation;
ActiveRecord is a mature ORM; Rails has built-in patterns for auth (Devise),
file uploads (ActiveStorage), and admin interfaces.

**Why rejected**: No Ruby experience on the team. Despite Rails' productivity
conventions, learning a new language and framework simultaneously would outweigh
the scaffold advantages. The team would also split between Ruby (backend) and
JavaScript (frontend), reintroducing the context-switching cost the chosen stack
avoids.

---

## Review Triggers

This decision should be revisited if any of the following occur:

- Phase 2 requires more than one application server instance (SQLite write
  serialization becomes a bottleneck).
- Concurrent users consistently exceed ~200 (re-evaluate SQLite ceiling and
  file storage).
- The team expands with members who have PostgreSQL/Prisma expertise and Phase 2
  scope justifies the migration cost.
- A security audit identifies concerns with the JWT/cookie implementation that
  require a stateful session store.
