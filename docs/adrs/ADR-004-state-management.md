# ADR-004: Frontend State Management — React Context API (No External Library)

**Date**: 2026-02-24
**Status**: Accepted
**Deciders**: Engineering team
**Relates to**: `specs/001-phase1-mvp/plan.md`, `docs/adrs/ADR-001-tech-stack.md`

---

## Context

InnovatEPAM Portal's React 18 frontend must manage a small, well-defined set of
shared state across its four user stories: authentication state, the idea list,
individual idea detail, and form data for submission and evaluation.

Constraints driving the decision:

- **State surface area**: Phase 1 has three distinct pieces of truly shared
  client state — the authenticated user object (name, role), the idea list, and
  transient form state. Idea detail and evaluation data are fetched on navigation
  to a specific route and do not need to be shared globally.
- **Component tree depth**: The application has a flat route-based structure
  (Register → Login → Ideas List → Idea Detail → Submit Idea). There are no
  deeply nested component hierarchies that would cause prop-drilling at a scale
  that requires a dedicated state library.
- **Team familiarity**: The engineering team has working knowledge of React
  Context API from React training. Introducing a separate state management
  library requires learning its paradigm (actions, reducers, selectors, or
  observables) on top of React concepts, increasing ramp-up cost.
- **Constitution Principle V (Phased Simplicity / YAGNI)**: External state
  libraries must not be introduced without a documented performance or
  maintainability rationale. No such rationale exists for Phase 1.
- **Timeline**: 8 weeks to a working MVP. Every abstraction layer added without
  a concrete need consumes implementation and debugging time.

---

## Decision

Use **React Context API** with `useContext` and `useReducer` (where appropriate)
for all shared client state in Phase 1. No external state management library
will be introduced.

**Contexts defined**:

- `AuthContext` — current user object (`id`, `email`, `role`), `login()`,
  `logout()`, `register()` methods, and a loading flag for the initial `getMe()`
  call on app load. Provided at the root of the component tree.
- `IdeasContext` *(optional, lazy)* — idea list cache for the Ideas List page
  if a prop-drilling concern arises during implementation. May be implemented as
  local component state with an API call if the list page is the only consumer.

All other state (form field values, loading/error flags per page) is **local
component state** via `useState`/`useReducer`. It is not lifted into context
unless two or more components need it simultaneously.

---

## Rationale

### Context API is sufficient for Phase 1

The canonical use case for a dedicated state library is an application where:

1. Many components at different tree levels need to read or update the same
   state simultaneously, OR
2. State transitions are complex enough that predictable, traceable updates
   (e.g., Redux DevTools time-travel debugging) provide measurable development
   value.

Neither condition is met in Phase 1. `AuthContext` has a single writer (the
auth API calls) and a small number of readers (ProtectedRoute, Navbar, the
idea submission form). The idea list is fetched by one page component. The
evaluation form is local to one page. React Context with `useReducer` is a
first-class React pattern that covers this topology without any additional
dependency.

### Performance is not a concern at Phase 1 scale

The common objection to Context API is unnecessary re-renders: when a context
value changes, all consumers re-render. This is only a problem when a single
context holds many frequently-updated values consumed by many components.
`AuthContext` changes at most twice per session (on login and logout). There is
no high-frequency state mutation (no real-time data, no animations driven by
state) that would trigger render performance issues.

If a performance problem is measured in Phase 2 (via React DevTools Profiler),
adding `React.memo`, splitting contexts, or migrating to Zustand are all
incremental steps that do not require a full rewrite.

### Avoiding Redux Toolkit boilerplate at MVP scale

Redux Toolkit reduces Redux boilerplate considerably, but even with `createSlice`
and `createAsyncThunk`, the React + Redux pattern introduces:

- A store configuration file
- Slice files with actions and reducers per domain
- Selector functions per piece of state
- The `Provider` wrapper and `useSelector`/`useDispatch` hooks throughout

For three pieces of shared state in a four-page application, this structure
adds significant ceremony with no measurable benefit. The code surface that
must be read, understood, and maintained by every future contributor grows
without proportional value.

---

## Consequences

### Positive

- **Zero additional dependencies**: Context API is built into React 18. No
  package to install, version, or patch.
- **No paradigm overhead**: Developers who know React already know Context and
  hooks. No actions, reducers, selectors, or store concepts to learn before
  writing product features.
- **Straightforward debugging**: Context values are inspectable in React
  DevTools' component tree view. No separate DevTools extension required for
  Phase 1's state complexity.
- **Clean upgrade path**: If Phase 2 introduces state complexity that Context
  cannot handle efficiently, migrating `AuthContext` to Zustand (or Redux
  Toolkit for teams preferring Redux) requires changing the context provider
  and its consumers — the component interface (`useAuth()`, `useIdeas()` hooks)
  remains the same if a custom hook abstraction layer is used from the start.

### Negative / Trade-offs

- **Re-render risk at scale**: Context does not support selective subscription
  (only changed slice). If a single context object grows to hold many values
  that change at different frequencies, consumers will re-render unnecessarily.
  Mitigation: keep each context small and focused (one concern per context);
  split rather than grow if a second concern is added.
- **No DevTools middleware for state history**: Redux DevTools time-travel and
  action logs are unavailable. For Phase 1's simple state machines this is not
  a loss. If debugging state transitions becomes difficult in Phase 2, this is
  a trigger to introduce a library.
- **`useReducer` complexity ceiling**: For complex async state (loading,
  success, error, stale states across multiple resources), `useReducer` inside
  Context becomes verbose. React Query or SWR (for server state) and Zustand
  (for client state) are better fits at that complexity level and should be
  evaluated at the Phase 2 boundary.
- **Boilerplate per context**: Each context requires a provider component,
  a custom hook (`useAuth`, `useIdeas`), and a default value. For three contexts
  this is a one-time cost; at ten or more contexts it becomes unwieldy.

---

## When Redux (or an alternative) Would Become Necessary

The following are concrete triggers to re-evaluate this decision:

1. **More than 5 contexts** are needed to avoid prop-drilling across a growing
   component tree — the mental overhead of which provider wraps which exceeds
   the boilerplate cost of a store.
2. **Measured re-render performance degradation** is confirmed via React
   DevTools Profiler (e.g., list items re-rendering on every keystroke in an
   unrelated form).
3. **Complex async state patterns** appear: concurrent API calls whose results
   must be merged, optimistic updates, background refetch, or pagination cache.
   At this point, **React Query** (server state) + **Zustand** (client state) is
   the preferred upgrade path over Redux.
4. **Cross-tab state synchronisation** becomes a requirement (e.g., logout in
   one tab must propagate to other open tabs). Redux Persist or Zustand's
   `persist` middleware handles this; Context does not.
5. **Team size grows** to the point where explicit action names and reducer logs
   are needed for debugging production state issues across contributors.

---

## Alternatives Considered

### 1. Redux Toolkit

**What it offers**: Predictable state container with DevTools, time-travel
debugging, middleware support (thunks, sagas), and `createSlice` reducing
boilerplate versus vanilla Redux. Industry-standard for large React applications.

**Why rejected**: The boilerplate cost of slices, actions, selectors, and store
configuration is disproportionate to Phase 1's three-context state surface.
Redux shines when state transitions must be auditable across a large team or
when state is shared across dozens of components. Neither condition applies to
the current scope. Redux Toolkit remains the preferred migration target if
trigger conditions above are met, given its ecosystem maturity.

### 2. MobX

**What it offers**: Observable-based reactive state with minimal boilerplate;
mutate state directly and components re-render automatically. Lower ceremony
than Redux for medium-complexity state.

**Why rejected**: MobX introduces a fundamentally different programming model
(observables, computed values, reactions) that requires dedicated learning time.
The team's React training did not cover MobX. For Phase 1's state simplicity,
the learning investment is not justified. MobX is also less commonly used in
the Node.js + React ecosystem, reducing the pool of reference material and
community support available to the team.

### 3. Zustand

**What it offers**: Minimal API — a single `create()` call defines a store with
state and actions; `useStore(selector)` subscribes only to the selected slice,
eliminating the re-render problem inherent in Context. Tiny bundle size (~1 kB).

**Why rejected for Phase 1**: Zustand is the strongest contender after Context
API and should be the first upgrade considered if Context triggers occur.
Rejected now solely on YAGNI grounds — the re-render issue Zustand solves does
not exist at Phase 1's state complexity. Its API is simple enough that migration
from custom `useAuth()`/`useIdeas()` hooks to Zustand stores is a low-cost
refactor when needed.

### 4. Recoil

**What it offers**: Atom-based state model from Meta; fine-grained subscriptions
(components subscribe to individual atoms, not entire stores); first-class async
selectors for derived server state.

**Why rejected**: Recoil was in experimental/beta status for an extended period
and has seen reduced maintenance activity from Meta. Its atom model, while
elegant, adds concepts (atoms, selectors, atom families) not present in the
team's existing React knowledge. The uncertainty around its long-term maintenance
trajectory makes it a poor choice for a project where state management should be
a solved, stable concern.
