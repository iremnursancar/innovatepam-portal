# Feature Specification: InnovatEPAM Portal — Phase 2 Enhancements

**Feature Branch**: `002-phase2-enhancements`
**Created**: 2026-02-26
**Status**: Draft
**Depends On**: `001-phase1-mvp` (fully shipped)

## Overview

Phase 2 builds upon the MVP with community engagement, real-time notifications,
and analytics/reporting features. The goal is to increase participation,
transparency, and insight into the innovation pipeline.

---

## User Scenarios & Testing *(mandatory)*

---

### User Story 5 — Community Engagement & Voting System (Priority: P1)

**As a** user
**I want to** share ideas publicly and vote on others' ideas
**So that** the community can engage and prioritise innovations together

**Why this priority**: Voting surfaces the best ideas organically and gives
evaluators community signal. Public sharing transforms the portal from a
one-way submission box into a collaborative space, delivering measurable
engagement before any analytics work begins.

**Independent Test**: Submit a public idea as User A, log in as User B, upvote
it, and verify the vote count increments. Toggle the vote off and verify it
decrements. Confirm private ideas are invisible to User B.

**Acceptance Scenarios**:

1. **Given** a user is submitting an idea, **When** they toggle "Make Public",
   **Then** the idea is visible in the public feed to all authenticated users
   after submission.
2. **Given** a public idea from another user, **When** the viewer clicks the
   upvote button, **Then** the vote count increments and the button enters an
   active state.
3. **Given** a previously upvoted idea, **When** the user clicks the upvote
   button again, **Then** the vote is removed and the count decrements (toggle
   behaviour).
4. **Given** a private idea, **When** any user other than the submitter views
   the ideas list, **Then** the private idea does not appear.
5. **Given** an admin reviewing an idea, **When** they open the evaluation
   panel, **Then** the current community vote count is displayed alongside the
   idea details.

**Functional Requirements**:

| ID    | Requirement |
|-------|-------------|
| FR5.1 | Users can mark ideas as public or private during submission (default: private). |
| FR5.2 | Public ideas are visible in a shared feed to all authenticated users. |
| FR5.3 | Users can upvote public ideas; voting is a toggle (cast / retract). |
| FR5.4 | Vote counts are displayed to admins in the evaluation panel. |
| FR5.5 | Users can browse and filter the public idea feed. |
| FR5.6 | Ideas list supports "Most Voted" sort option. |

**UI Details**:
- Public/private toggle on submission form (default: private)
- Privacy indicator on idea cards: 🌐 Public / 🔒 Private
- Vote button rendered only on public ideas; shows count
- Vote count updates optimistically in the UI (no full reload)
- Admin evaluation panel shows "Community Votes: N"

---

### User Story 6 — Notifications & Activity Monitoring (Priority: P1)

**As a** user or admin
**I want to** receive notifications about important platform events
**So that** I stay informed about my ideas and the overall activity without
having to poll the portal manually

**Why this priority**: Closing the feedback loop for submitters (status changes)
and admins (new submissions) is directly tied to user trust and platform
adoption. Activity monitoring gives admins situational awareness without
requiring a dedicated admin tour.

**Independent Test**: Submit an idea as a submitter, log in as an admin and
accept it, then switch back to the submitter session. Verify a notification
appears in the bell dropdown and the unread badge increments. Mark it as read
and confirm the badge disappears.

**Acceptance Scenarios**:

1. **Given** an admin evaluates an idea (accepted or rejected), **When** the
   evaluation is saved, **Then** the idea owner receives a notification with
   the outcome.
2. **Given** a user submits a new idea, **When** submission succeeds, **Then**
   all admins receive a "new submission" notification.
3. **Given** unread notifications exist, **When** the user views the navbar,
   **Then** the bell icon displays a red badge with the unread count.
4. **Given** a notification dropdown is open, **When** the user clicks a
   notification, **Then** they are navigated to the relevant idea detail page
   and the notification is marked as read.
5. **Given** multiple unread notifications, **When** the user clicks "Mark all
   as read", **Then** all notifications are marked read and the badge clears.
6. **Given** the admin dashboard is open, **When** the activity feed panel
   is rendered, **Then** the most recent platform events are listed in
   reverse-chronological order.

**Functional Requirements**:

| ID    | Requirement |
|-------|-------------|
| FR6.1 | Users are notified when their idea status changes (accepted / rejected). |
| FR6.2 | Admins are notified when any new idea is submitted. |
| FR6.3 | Notification dropdown in navbar shows the last 10 notifications with unread count badge. |
| FR6.4 | Users can mark individual notifications or all notifications as read. |
| FR6.5 | Activity feed on the admin dashboard lists recent platform events (submissions, decisions). |
| FR6.6 | Notification counts auto-refresh every 60 seconds without a full page reload. |

**UI Details**:
- Bell icon in navbar; red circular badge shows unread count (hidden when 0)
- Dropdown lists notifications newest-first; unread items visually distinguished
- "Mark all as read" button in dropdown header
- Activity feed on admin dashboard: event type, actor email, idea title, timestamp

---

### User Story 7 — Analytics, Reporting & AI Analysis (Priority: P2)

**As an** admin
**I want** analytics dashboards, export tools, and AI-assisted analysis
**So that** I can track innovation metrics, generate reports, and give
submitters richer feedback

**Why this priority**: Analytics and export deliver immediate operational value
(monthly reporting, trend tracking) while the AI layer enhances submission
quality over time. Both are additive and do not block earlier stories.

**Independent Test**: Log in as admin, open the statistics panel and verify all
6 metric tiles render with non-stale data. Click "Export CSV" and confirm a
valid CSV file downloads. Submit an idea and verify AI analysis suggestions
appear on the review screen.

**Acceptance Scenarios**:

1. **Given** the admin dashboard is open, **When** the statistics panel renders,
   **Then** it displays: Total Ideas, Pending Review, Accepted, Rejected,
   Acceptance Rate, and Most Active Category.
2. **Given** the admin clicks "Export CSV", **When** the download completes,
   **Then** the file contains one row per idea with all relevant fields
   (id, title, category, status, submitter, created_at, votes).
3. **Given** a new idea is submitted, **When** an admin opens the idea detail,
   **Then** an AI analysis section displays: suggested category, estimated
   impact score (1–10), and actionable improvement tips.
4. **Given** the ideas list is visible, **When** the user types in the search
   box or applies a status/category filter, **Then** the list updates to show
   only matching ideas without a full page reload.
5. **Given** an idea detail page is open, **When** the status history section
   is rendered, **Then** a visual timeline shows each status change with actor
   and timestamp.

**Functional Requirements**:

| ID    | Requirement |
|-------|-------------|
| FR7.1 | Statistics panel with 6 key metrics visible on the admin dashboard. |
| FR7.2 | "Export CSV" button (admin-only) that downloads all ideas as a CSV file. |
| FR7.3 | AI analysis on idea detail: category suggestion, impact score, improvement tips. |
| FR7.4 | Search and multi-dimensional filter (status, category) with sort (date, votes). |
| FR7.5 | Status history timeline on idea detail page showing full lifecycle. |

**UI Details**:
- Statistics panel: 6 metric cards in a responsive grid
- Export button in admin toolbar; disabled with spinner during generation
- AI analysis card below idea description; loaded asynchronously
- Search bar + filter dropdowns above ideas list
- Timeline component on detail page: vertical rail, nodes per status change

---

## Technical Stack

Unchanged from Phase 1:

| Layer    | Technology |
|----------|------------|
| Runtime  | Node.js 22 |
| API      | Express 5  |
| Database | SQLite (better-sqlite3) |
| Auth     | HTTP-only JWT cookie |
| Frontend | React 19 + Vite |
| Styling  | Tailwind CSS v4 |
| Testing  | Jest + Supertest (backend), Vitest (frontend) |

---

## Database Changes

### New Tables

| Table                | Purpose |
|----------------------|---------|
| `notifications`      | Per-user notification records (type, message, is_read). |
| `idea_votes`         | Upvote records — one row per (user_id, idea_id) pair. |
| `idea_status_history`| Immutable audit log of every status transition per idea. |
| `activities`         | Platform-wide event log for the admin activity feed. |

### Schema Additions to Existing Tables

| Table   | Column      | Type    | Default | Notes |
|---------|-------------|---------|---------|-------|
| `ideas` | `is_public` | INTEGER | `0`     | Boolean flag; 1 = visible in the public feed. |

### Migration Strategy
- One numbered migration file per schema change (e.g. `003_activities_table.sql`).
- `runMigrations()` is idempotent; safe to run on every server start.
- No destructive changes to Phase 1 tables.

---

## Out of Scope for Phase 2

- Email / push notifications (in-app only)
- Idea comments / threaded discussion
- Role management UI (admin promotion remains a CLI script)
- Rich-text idea descriptions
- Mobile-native application
