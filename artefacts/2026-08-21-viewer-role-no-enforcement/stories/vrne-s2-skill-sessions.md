# Story: Wire the viewer-write-block gate to Skill session routes

**Epic reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/epics/vrne-e1-viewer-write-blocking.md`
**Discovery reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/discovery.md`
**Benefit-metric reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/benefit-metric.md`
**Domain:** [web-ui, security, auth]

## User Story

As an **admin who assigned a teammate the `viewer` role**,
I want **that teammate to be denied when they attempt to start, run a turn in, or commit a skill session**,
So that **a viewer cannot drive real LLM cost or produce real governed artefacts on the tenant's behalf — the most consequential class of write action in the app**.

## Benefit Linkage

**Metric moved:** Viewer role actually enforces read-only access (Tier 1); Enumerated viewer-role write actions blocked (Tier 3)
**How:** Skill sessions are the single most consequential write action a `viewer` could currently perform — each turn incurs real model cost and a committed session produces a real, governed pipeline artefact. Gating this group moves both metrics for the highest-risk-if-left-open route group.

## Architecture Constraints

- **Reuse the shared gate built in `vrne-s1`** (`requireNonViewer` or equivalent) — do not duplicate the role-check logic in `routes/skills.js`.
- Several Skill session routes (`/api/skills/:name/sessions/:id/answers`, `/api/skills/:name/sessions/:id/commit` JSON path, `/api/skills/:name/execute`) are gated internally via their own `_checkAuth(req, res)` call rather than a `server.js`-level `authGuard` wrapper (confirmed at `/definition` via full route audit) — the new gate must be added at the same internal call site for these routes, not assumed to be addable via a single `server.js`-level change.
- **Deny by default** — same standard as `vrne-s1`.
- None else identified — checked against `.github/architecture-guardrails.md`.

## Dependencies

- **Upstream:** `vrne-s1` — must be DoD-complete (shared gate exists and is proven against Products/Features routes) before this story wires it to a new route group.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a session with `role: 'viewer'`, When the person submits `POST /api/skills/:name/sessions` (start a new skill session, either the form path gated by `authGuard` or the JSON path gated by `_checkAuth`), Then the response is a real denial — not a silently created session.

**AC2:** Given a session with `role: 'viewer'` and an existing skill session, When the person submits a turn (`POST /api/skills/:name/sessions/:id/turn` or `.../turn-stream`) or an answer (`.../answers` or `.../answer`), Then the response is a real denial — no model call is made, no cost is incurred.

**AC3:** Given a session with `role: 'viewer'` and an existing skill session, When the person submits `POST /api/skills/:name/sessions/:id/commit` (either the form or JSON path) or `POST /api/skills/:name/execute`, Then the response is a real denial — no artefact is committed.

**AC4:** Given a session with `role: 'engineer'`, `'product'`, or `'admin'`, When that person submits any Skill session write route, Then the request proceeds exactly as before this story (no regression to legitimate skill-session usage — the app's core function).

**AC5:** Given the gate denies a viewer-role request on a Skill session route, When the denial occurs, Then it is logged the same way as `vrne-s1`'s AC5 (person ID, tenant ID, timestamp, route).

## Out of Scope

- Products/Features routes — covered by `vrne-s1`.
- Credits/billing and edge-case routes — covered by `vrne-s3`/`vrne-s4`.
- Read-only skill-session routes (viewing session history/transcripts) — `viewer` must retain full read access.
- Canvas-edit and assumption-confirm routes (`/canvas-edit`, `/assumption/:cardId/confirm`) — lower-value, non-cost-incurring write actions within a session; not included in this story's AC set, may be swept up incidentally by the shared gate if applied broadly but not a required AC here.

## NFRs

- **Performance:** No new query pattern — reuses `vrne-s1`'s gate and its underlying live-role check.
- **Security:** This is the highest-value security gate in the epic — prevents real cost/artefact generation by a read-only-intended role. AC4 is the regression guard.
- **Accessibility:** Not applicable.
- **Audit:** AC5 — every denial logged.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
