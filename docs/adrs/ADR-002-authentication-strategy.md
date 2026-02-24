# ADR-002: Authentication Strategy — JWT in httpOnly Cookie + bcrypt

**Date**: 2026-02-24
**Status**: Accepted
**Deciders**: Engineering team
**Relates to**: `specs/001-phase1-mvp/plan.md`, `docs/adrs/ADR-001-tech-stack.md`

---

## Context

InnovatEPAM Portal requires authenticated sessions for two roles — submitter
and admin — with meaningfully different permissions. Submitters may only create
and view their own ideas; admins can view all ideas and record evaluation
decisions. Anonymous access to any protected resource must be blocked.

Security requirements driving this decision:

- **XSS protection**: Tokens or session identifiers must not be readable by
  JavaScript; a compromised script injected into the page must not be able to
  exfiltrate credentials.
- **Password storage**: User passwords must be stored in a form that cannot be
  reversed or rainbow-table-attacked if the database is leaked.
- **Session persistence**: Authenticated state must survive page refreshes and
  browser restarts for at least 24 hours without requiring re-authentication.
- **Role enforcement**: The server must be able to determine a user's role on
  every request without an additional database round-trip on the critical path.
- **Stateless server preference**: The Phase 1 deployment is a single Node.js
  process; a solution that avoids an external session store reduces operational
  complexity (also aligned with Constitution Principle V — Phased Simplicity).

---

## Decision

**Token format**: JSON Web Token (JWT), signed with HS256 using a server-side
secret (`JWT_SECRET` environment variable).

**Token storage**: `httpOnly`, `SameSite=Strict`, `Secure` (in production)
cookie set by the server on successful login or registration.

**Token payload**: `{ sub: userId, role: "submitter"|"admin", iat, exp }`.
Token lifetime: 24 hours.

**Password hashing**: `bcryptjs` with a work factor of 12 rounds.

**Logout**: Server clears the cookie by setting an expired replacement; no
token blacklist is maintained in Phase 1.

---

## Rationale

### JWT

JWT allows the server to issue a self-contained, signed token that encodes the
user's identity and role. Because the role is embedded in the token, the
`authenticate` middleware can authorise a request without querying the database
on every call — only the cryptographic signature verification is needed. This is
the lowest-latency auth mechanism available without an external cache.

Token expiry (`exp` claim) provides a natural session-lifetime boundary without
server-side state. For Phase 1's single-server deployment, the lack of a shared
session store is a feature rather than a limitation.

### httpOnly Cookie (not `localStorage`)

Storing the JWT in `localStorage` is explicitly rejected. JavaScript running in
the page — including any third-party script or injected payload — can read
`localStorage` and exfiltrate the token. An `httpOnly` cookie is not accessible
to JavaScript at all; it is attached to requests automatically by the browser
and can only be read or cleared by the server. This eliminates the most
common JWT XSS attack vector.

`SameSite=Strict` prevents the cookie from being sent on cross-site requests,
which mitigates CSRF for the Phase 1 deployment (same-origin frontend and
backend). In Phase 2, if the frontend and API are served from different origins,
`SameSite=Lax` and a CSRF token should be re-evaluated (see Consequences).

### bcrypt (work factor 12)

bcrypt is the industry-standard adaptive hashing algorithm for passwords. Work
factor 12 provides a good balance between resistance to brute-force and login
latency (approximately 200–400 ms per hash on modern hardware), well within
acceptable UX bounds for an authentication form. The algorithm's built-in salt
generation means every stored hash is unique, preventing rainbow-table attacks
and removing any need for a separate salt column.

`bcryptjs` (the pure-JavaScript implementation) is chosen over the native
`bcrypt` binding to avoid native compilation requirements that complicate the
build environment, with no material performance difference at Phase 1 scale.

---

## Consequences

### Positive

- **XSS-resistant token storage**: httpOnly cookie prevents token exfiltration
  via JavaScript, satisfying the constitution's "Security by Default" principle.
- **No session store required**: JWT is stateless; no Redis, Memcached, or
  database session table needed in Phase 1, reducing operational complexity.
- **Role in token**: No database round-trip to determine role on every request —
  the `authenticate` middleware reads role from the verified token payload
  directly.
- **Password breach resilience**: bcrypt hashes with work factor 12 are
  computationally expensive to crack; even a full database leak does not
  immediately expose user passwords.
- **Standard, auditable approach**: JWT (RFC 7519) and bcrypt are widely
  understood, thoroughly documented, and supported by mature libraries with
  active security maintenance.

### Negative / Trade-offs

- **No server-side token revocation in Phase 1**: Because JWTs are stateless,
  there is no mechanism to invalidate a specific token before its 24-hour expiry
  (e.g., after a password change or if a token is suspected compromised). Logout
  only clears the cookie on the client; the token itself remains cryptographically
  valid until expiry. Mitigation: 24-hour expiry limits the window of exposure.
  Phase 2 should introduce a token blacklist or short-lived access + refresh
  token pair if revocation becomes a requirement.
- **CSRF consideration for cross-origin deployments**: `SameSite=Strict` is
  sufficient for Phase 1's same-origin setup. If the frontend and API are ever
  deployed to different origins, the cookie's same-site policy must be reviewed
  and CSRF tokens added to state-changing requests.
- **bcrypt login latency**: Each login incurs ~200–400 ms for password
  comparison. This is acceptable and intentional; it cannot be optimised away
  without weakening security. At Phase 1 scale (10–50 users) this is invisible
  to UX.
- **Secret rotation complexity**: Rotating `JWT_SECRET` immediately invalidates
  all active sessions, requiring all users to log in again. A key-versioning
  strategy (multiple accepted secrets during rollover) is deferred to Phase 2.

---

## Alternatives Considered

### 1. Session-based auth (Express sessions + Redis)

**What it offers**: Server-side sessions are inherently revocable — deleting the
session record immediately invalidates the user's access. The session ID in the
cookie carries no user data, shrinking the attack surface of the cookie itself.

**Why rejected**: Requires a Redis instance (or equivalent persistent store),
adding an operational dependency that conflicts with Phase 1's simplicity
constraint. For a single-server, 10–50 user deployment, the operational cost
and additional failure point are not justified. This alternative should be
revisited if Phase 2 requires horizontal scaling with shared session state.

### 2. OAuth2 with a third-party provider (e.g., Google, Azure AD)

**What it offers**: Delegates credential management and MFA entirely to a
proven identity provider; eliminates the need to store passwords; provider
handles session security, breach monitoring, and account recovery.

**Why rejected**: InnovatEPAM Portal Phase 1 needs to be deployable without
a dependency on an external identity provider. Integrating OAuth2 requires
configuring redirect URIs, client credentials, and provider-specific consent
flows, all of which add timeline risk for an 8-week MVP. The portal's user base
is internal: a controlled, small group where a managed provider's resilience
benefits are less critical. OAuth2 integration is the recommended migration path
for Phase 2 if the organisation already uses an internal IdP (e.g., Azure AD).

### 3. HTTP Basic Authentication

**What it offers**: Trivially simple to implement; no token management required;
natively supported by browsers and HTTP clients.

**Why rejected**: Basic Auth sends credentials (Base64-encoded, not encrypted)
on every request. Even over HTTPS this creates unnecessary credential exposure
surface. It provides no session persistence without re-sending credentials, no
role information in the request without a database lookup, and no mechanism for
logout. It does not satisfy the 24-hour session persistence requirement and is
wholly inappropriate for a user-facing web application.

---

## Security Checklist

The following controls are required by implementation and enforced by the
constitution's "Security by Default" principle:

- [ ] `JWT_SECRET` is a minimum 256-bit random value stored only in environment
  variables; it MUST NOT appear in source code, logs, or version control.
- [ ] Cookie set with `httpOnly: true`, `sameSite: 'strict'`, `secure: true`
  (production) / `secure: false` (local dev only).
- [ ] `bcryptjs` work factor MUST NOT be reduced below 12 in any environment.
- [ ] Login endpoint MUST return the same error message for "email not found"
  and "wrong password" to prevent email enumeration.
- [ ] Token expiry (`exp`) MUST be validated on every authenticated request;
  expired tokens MUST be rejected with HTTP 401.
- [ ] Logout endpoint MUST clear the cookie server-side, not rely solely on
  client-side cookie deletion.

---

## Review Triggers

This decision should be revisited if any of the following occur:

- A security requirement for immediate token revocation emerges (e.g., admin
  account compromise, password change forcing re-login).
- The frontend and API are deployed to different origins, requiring
  `SameSite=Lax` and CSRF tokens.
- The organisation adopts an internal identity provider (Azure AD, Okta)
  making OAuth2/OIDC integration practical.
- Phase 2 introduces horizontal scaling, requiring shared session state (favour
  Redis-backed sessions over JWT at that point).
