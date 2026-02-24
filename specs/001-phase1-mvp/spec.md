# Feature Specification: InnovatEPAM Portal  Phase 1 MVP

**Feature Branch**: `001-phase1-mvp`
**Created**: 2026-02-24
**Status**: Draft
**Input**: User description: "InnovatEPAM Portal is a platform for employees to submit innovation ideas and for evaluators to review them. Phase 1 MVP: user auth, idea submission, admin evaluation, status tracking."

## User Scenarios & Testing *(mandatory)*

### User Story 1  Employee Registration & Login (Priority: P1)

An employee visits the portal for the first time, creates an account with their
email address and a password, and then signs in to access the platform. On
returning visits they sign in directly.

**Why this priority**: Authentication is the gating requirement for every other
feature. No idea can be submitted or evaluated without a verified identity.

**Independent Test**: Register a new account, log out, log back in. Verify the
user lands on their home view and their name/role is shown. Delivers a secure,
identifiable session  standalone value even before submission exists.

**Acceptance Scenarios**:

1. **Given** an unregistered email, **When** a user submits valid registration
   details, **Then** an account is created and the user is signed in automatically.
2. **Given** a registered email and correct password, **When** a user submits
   the login form, **Then** the user is signed in and redirected to their home view.
3. **Given** a registered email and wrong password, **When** a user submits the
   login form, **Then** an error message is shown and no session is created.
4. **Given** an already-registered email, **When** a new registration is attempted,
   **Then** an appropriate error is shown and no duplicate account is created.
5. **Given** a signed-in user, **When** they log out, **Then** their session is
   invalidated and they are redirected to the login page.

---

### User Story 2  Idea Submission with Attachment (Priority: P2)

A signed-in employee (submitter role) fills in a short form with their innovation
idea  providing a title, description, and category  optionally attaches a
single supporting file, and submits the idea. The idea immediately appears in
their personal idea list with a "Submitted" status.

**Why this priority**: Idea submission is the platform's core value proposition.
Without it there is nothing for admins to evaluate.

**Independent Test**: Log in as a submitter, submit an idea with a file
attachment, verify the idea appears in the submitter's list with status
"Submitted". Demonstrates end-to-end data capture independently of evaluation.

**Acceptance Scenarios**:

1. **Given** a signed-in submitter, **When** all required fields (title,
   description, category) are filled and the form is submitted, **Then** the idea
   is saved with status "Submitted" and shown in the submitter's list.
2. **Given** a valid idea form, **When** the submitter attaches a file within the
   allowed size and type limits, **Then** the attachment is stored and linked to
   the idea.
3. **Given** a valid idea form, **When** the submitter attaches a file that
   exceeds the size limit or has a disallowed type, **Then** the upload is
   rejected with a clear error message before submission.
4. **Given** a signed-in submitter, **When** they submit the form with a required
   field missing, **Then** the form is not submitted and the missing field is
   highlighted.
5. **Given** a signed-in submitter, **When** they attempt to attach more than one
   file, **Then** only the first (or last selected) file is accepted; multiple
   simultaneous attachments are not permitted.

---

### User Story 3  Idea Listing & Status Visibility (Priority: P3)

A signed-in user can view a list of ideas relevant to their role: submitters see
their own ideas with current statuses, admins see all submitted ideas. Status
labels make the progress of each idea immediately visible.

**Why this priority**: Without visibility into idea state, submitters cannot
confirm their submissions were received and admins cannot identify what needs
attention.

**Independent Test**: Submit two ideas as a submitter, then view the idea list.
Verify both ideas appear with accurate statuses. Log in as an admin and confirm
both ideas are visible.

**Acceptance Scenarios**:

1. **Given** a signed-in submitter with previously submitted ideas, **When** they
   navigate to the idea list, **Then** all their ideas are shown with accurate
   status labels.
2. **Given** a signed-in admin, **When** they navigate to the idea list, **Then**
   all ideas from all submitters are shown.
3. **Given** a signed-in submitter, **When** they view the idea list, **Then**
   they do not see ideas submitted by other users.
4. **Given** an idea whose status has changed (e.g., to "Under Review"), **When**
   the submitter views their list, **Then** the updated status is reflected.

---

### User Story 4  Admin Evaluation Workflow (Priority: P4)

A signed-in admin opens an idea, reviews its details and attachment, then records
an evaluation decision of "Accepted" or "Rejected" along with a mandatory
comment. The idea's status updates immediately to reflect the decision.

**Why this priority**: The evaluation workflow closes the innovation loop. It is
the business outcome the platform exists to facilitate, but it depends on all
three prior stories being complete.

**Independent Test**: Submit an idea as a submitter, then log in as an admin,
navigate to that idea, enter a decision with a comment, and save. Verify the
status updates to "Accepted" or "Rejected" and the comment is visible.

**Acceptance Scenarios**:

1. **Given** a signed-in admin viewing an idea in "Submitted" or "Under Review"
   status, **When** they select "Accept" and provide a comment, **Then** the
   idea's status changes to "Accepted" and the comment is stored.
2. **Given** a signed-in admin viewing an idea, **When** they select "Reject" and
   provide a comment, **Then** the idea's status changes to "Rejected" and the
   comment is stored.
3. **Given** a signed-in admin, **When** they attempt to submit an evaluation
   without a comment, **Then** the evaluation is not saved and a validation error
   is shown.
4. **Given** a signed-in submitter, **When** they attempt to access the evaluation
   action on any idea, **Then** they are denied access (action not visible or
   returns an error).
5. **Given** an idea that has already been evaluated, **When** an admin views it,
   **Then** the existing decision and comment are shown; re-evaluation replaces
   the prior decision.

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
