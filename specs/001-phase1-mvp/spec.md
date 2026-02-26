# Feature Specification: InnovatEPAM Portal  Phase 1 MVP

**Feature Branch**: `001-phase1-mvp`
**Created**: 2026-02-24
**Status**: Draft
**Input**: User description: "InnovatEPAM Portal is a platform for employees to submit innovation ideas and for evaluators to review them. Phase 1 MVP: user auth, idea submission, admin evaluation, status tracking."

## User Scenarios & Testing *(mandatory)*

### User Story 1 – Employee Registration & Login (Priority: P1)

**As an** employee
**I want to** register and sign in to the portal
**So that** I can access the platform and submit ideas

**Why this priority**: Authentication is the gating requirement for every other
feature. No idea can be submitted or evaluated without a verified identity.

**Independent Test**: Register a new account, log out, log back in. Verify the
user lands on their home view and their name/role is shown. Delivers a secure,
identifiable session — standalone value even before submission exists.

**Acceptance Criteria:**
- Unregistered users can create an account with a valid email and password
- Registered users can sign in with correct credentials and are redirected to their home view
- Invalid credentials show an error message and no session is created
- Duplicate email registrations are rejected with an appropriate error
- Signed-in users can log out and have their session invalidated

---

### User Story 2 – Idea Submission with Attachment (Priority: P2)

**As a** submitter
**I want to** submit innovation ideas with supporting files
**So that** evaluators can review my proposals with full context

**Why this priority**: Idea submission is the platform's core value proposition.
Without it there is nothing for admins to evaluate.

**Independent Test**: Log in as a submitter, submit an idea with a file
attachment, verify the idea appears in the submitter's list with status
"Submitted". Demonstrates end-to-end data capture independently of evaluation.

**Acceptance Criteria:**
- Required fields (title, description, category) must be filled; missing fields highlight with an error
- Ideas are saved with "Submitted" status on successful submission
- Users can attach one file per idea within allowed size (10 MB) and type limits
- File uploads that exceed the size limit or use a disallowed type are rejected with a clear error before submission
- Invalid submissions are not saved and the form remains open for correction
- Successfully submitted ideas appear immediately in the submitter's idea list

---

### User Story 3 – Idea Listing & Status Visibility (Priority: P3)

**As a** user
**I want to** view my submitted ideas and their current status
**So that** I can track the progress of my proposals

**Why this priority**: Without visibility into idea state, submitters cannot
confirm their submissions were received and admins cannot identify what needs
attention.

**Independent Test**: Submit two ideas as a submitter, then view the idea list.
Verify both ideas appear with accurate statuses. Log in as an admin and confirm
both ideas are visible.

**Acceptance Criteria:**
- Submitters see only their own ideas in the list
- Admins see all ideas from all users
- List displays: title, category, status, and submission date for each idea
- Status updates (e.g. to "Under Review") are reflected immediately in the list
- Clicking an idea navigates to its full detail view

---

### User Story 4 – Admin Evaluation Workflow (Priority: P4)

**As an** admin/evaluator
**I want to** review and evaluate submitted ideas
**So that** I can approve promising innovations and provide actionable feedback

**Why this priority**: The evaluation workflow closes the innovation loop. It is
the business outcome the platform exists to facilitate, but it depends on all
three prior stories being complete.

**Independent Test**: Submit an idea as a submitter, then log in as an admin,
navigate to that idea, enter a decision with a comment, and save. Verify the
status updates to "Accepted" or "Rejected" and the comment is visible.

**Acceptance Criteria:**
- Admins can mark ideas as "Under Review" to signal evaluation has begun
- Admins can Accept or Reject an idea with a mandatory comment; submission without a comment is blocked
- Idea status updates immediately upon saving a decision
- Evaluation decision and comment are preserved and visible to admins
- Submitters cannot perform any evaluation action (not visible in UI; blocked at API level)
- Previously recorded decisions can be updated by an admin (re-evaluation replaces prior decision)

---

### Edge Cases

- What happens when a user registers with an email address that already exists?
- What happens when a session token expires while the user is mid-form?
- What happens when the file storage is unavailable during an attachment upload?
- How does the system handle an idea submission while the file upload is still
  in progress?
- What happens when an admin evaluates an idea that has no attachment?
- What is the maximum allowed attachment file size, and is it enforced consistently
  on both client and server?
- What happens when a category value is provided that is not in the predefined list?

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & Identity**

- **FR-001**: System MUST allow any visitor to register an account using a unique
  email address and a password.
- **FR-002**: System MUST validate that the email address is properly formatted
  during registration.
- **FR-003**: System MUST reject registration if the email address is already in
  use and display an appropriate message.
- **FR-004**: System MUST allow a registered user to sign in using their email
  and password.
- **FR-005**: System MUST maintain a secure session for a signed-in user across
  page refreshes for at least 24 hours without requiring re-authentication.
- **FR-006**: System MUST allow a signed-in user to log out, immediately
  invalidating their session.
- **FR-007**: System MUST enforce role-based access: users with the "submitter"
  role MUST NOT access admin-only views or actions.

**Idea Submission**

- **FR-008**: System MUST allow a signed-in submitter to create a new idea by
  providing a title (required), description (required), and category (required,
  from a predefined list).
- **FR-009**: System MUST assign an initial status of "Submitted" to every newly
  created idea.
- **FR-010**: System MUST allow a submitter to attach exactly one file to an idea
  at submission time.
- **FR-011**: System MUST restrict attachments to common document and image
  formats (PDF, DOCX, PNG, JPG, XLSX) with a maximum size of 10 MB per file.
- **FR-012**: System MUST reject file uploads that exceed the size limit or use a
  disallowed MIME type, and display a clear error before submitting the form.

**Idea Listing**

- **FR-013**: System MUST display a list of ideas to signed-in users, showing at
  minimum: title, category, submission date, and current status.
- **FR-014**: Submitters MUST see only their own ideas in the idea list.
- **FR-015**: Admins MUST see all ideas from all submitters in the idea list.
- **FR-016**: System MUST allow an admin to view the full details of any idea,
  including title, description, category, submitter, submission date, status,
  and attachment (if present).

**Evaluation Workflow**

- **FR-017**: System MUST allow an admin to set an idea's status to "Under
  Review" to signal that evaluation has begun.
- **FR-018**: System MUST allow an admin to record a decision of "Accepted" or
  "Rejected" on any idea, accompanied by a mandatory text comment.
- **FR-019**: System MUST update the idea's status to "Accepted" or "Rejected"
  immediately upon saving the evaluation.
- **FR-020**: System MUST persist the evaluator's comment alongside the decision
  and make it viewable by admins.
- **FR-021**: System MUST prevent submitters from performing any evaluation
  action (status change or decision recording).

### Key Entities

- **User**: Represents a registered participant. Attributes: unique identifier,
  email address, hashed credential, assigned role (submitter or admin),
  registration timestamp.
- **Idea**: Represents a submitted innovation proposal. Attributes: unique
  identifier, title, description, category (from predefined list), status
  (Submitted / Under Review / Accepted / Rejected), reference to submitting
  user, submission timestamp.
- **Attachment**: Represents a file linked to a single idea. Attributes: unique
  identifier, reference to parent idea, original filename, validated MIME type,
  file size, stored location reference, upload timestamp. One attachment per idea.
- **Evaluation**: Represents the admin's recorded decision on an idea. Attributes:
  unique identifier, reference to idea, reference to evaluating admin, decision
  (Accepted / Rejected), comment text, evaluation timestamp.

## Assumptions

- The predefined category list for Phase 1 is: Process Improvement, Product
  Idea, Cost Reduction, Customer Experience, Other. This can be extended without
  a constitution amendment.
- All users are internal employees; public self-registration is acceptable for
  Phase 1 (no invite-only gate).
- Admins are assigned their role manually (e.g., by direct database update) in
  Phase 1; a self-serve admin management UI is deferred to Phase 2.
- Email notifications (e.g., notify submitter of decision) are out of scope for
  Phase 1.
- Search, filtering, and pagination of the idea list are out of scope for Phase 1.
- The attachment storage location is the local filesystem (per the constitution's
  Technology Standards); cloud storage migration is a Phase 2 concern.
- An idea can be re-evaluated (decision can be overwritten by an admin) in
  Phase 1; a lock-on-first-decision policy may be introduced in Phase 2.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new employee can complete registration, log in, and reach their
  home view in under 2 minutes from a blank browser tab.
- **SC-002**: A submitter can draft and submit an idea with a file attachment in
  under 3 minutes once logged in.
- **SC-003**: An admin can view all submitted ideas and record an evaluation
  decision with a comment in under 2 minutes per idea.
- **SC-004**: 100% of ideas submitted through the platform have a visible,
  accurate status at every stage of the workflow (Submitted  Under Review 
  Accepted/Rejected).
- **SC-005**: The complete end-to-end workflow  registration, login, idea
  submission with attachment, admin evaluation, and status update  can be
  demonstrated without errors in a single session.
- **SC-006**: Unauthorized access attempts (a submitter trying to evaluate, an
  unauthenticated user accessing protected pages) are blocked 100% of the time.
