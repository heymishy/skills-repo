## Test Plan: Wire the viewer-write-block gate to Skill session routes

**Story reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s2-skill-sessions.md`
**Epic reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/epics/vrne-e1-viewer-write-blocking.md`
**Test plan author:** Copilot
**Date:** 2026-08-22

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Viewer denied starting a skill session | 2 tests | — | — | — | — | 🟢 |
| AC2 | Viewer denied on turn/answer routes | 4 tests | — | — | — | — | 🟢 |
| AC3 | Viewer denied on commit/execute routes | 3 tests | — | — | — | — | 🟢 |
| AC4 | Non-viewer roles unaffected (regression guard) | 3 tests | — | — | — | — | 🟢 |
| AC5 | Viewer denied on canvas-edit/assumption-confirm | 2 tests | — | — | — | — | 🟢 |
| AC6 | Denial is logged | 1 test | — | — | — | — | 🟢 |

Per review finding `1-M1` (resolved via `/decisions`), AC5 was added — the canvas-edit/assumption-confirm carve-out originally in this story's Out of Scope was reversed, so no Skill session write route remains untested.

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — in-memory `req`/`res` mocks, same pattern as `vrne-s1`'s test plan.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1–AC6 | Mock `req.session` with `role` varied per test; spy on the underlying model-call/DB-write function to prove it was never invoked | Synthetic | None | Spying on the model call is the critical assertion for AC1–AC3 — a 403 alone doesn't prove no cost was incurred if the model call happened before the gate check |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### AC1 — Session start denied for viewer

- **viewer-denied-session-start-form**
  - **Verifies:** AC1
  - **Precondition:** `req.session.role = 'viewer'`.
  - **Action:** Call `POST /api/skills/:name/sessions` (form/`authGuard` path).
  - **Expected result:** 403; `createSession` (or equivalent session-creation function) never called (spy-verified).
  - **Edge case:** No.
- **viewer-denied-session-start-json**
  - Same as above for the JSON path gated internally by `_checkAuth` (`handlePostSession`). Confirms the gate is added at the internal call site, not just the `server.js`-level wrapper.

### AC2 — Turn/answer routes denied for viewer

- **viewer-denied-turn** — `POST /api/skills/:name/sessions/:id/turn` → 403; model-call function never invoked (spy-verified — this is the cost-prevention assertion).
- **viewer-denied-turn-stream** — `POST .../turn-stream` → 403; streaming model-call function never invoked.
- **viewer-denied-answers-json** — `POST .../answers` (internal `_checkAuth` path) → 403.
- **viewer-denied-answer-html** — `POST .../answer` (`authGuard` path) → 403.

### AC3 — Commit/execute routes denied for viewer

- **viewer-denied-commit-form** — `POST .../commit` (form path) → 403; artefact-commit function never invoked.
- **viewer-denied-commit-json** — `POST .../commit` (JSON `_checkAuth` path, `handleCommitArtefact`) → 403; artefact-commit function never invoked.
- **viewer-denied-execute** — `POST /api/skills/:name/execute` → 403; skill execution never invoked.

### AC4 — Non-viewer roles unaffected

- **engineer-turn-succeeds** — `role: 'engineer'` on `/turn` → gate calls `next()`, model call proceeds normally.
- **product-commit-succeeds** — `role: 'product'` on `/commit` → proceeds normally.
- **admin-execute-succeeds** — `role: 'admin'` on `/execute` → proceeds normally.

### AC5 — Canvas-edit/assumption-confirm denied for viewer

- **viewer-denied-canvas-edit** — `POST .../canvas-edit` → 403; canvas-edit dispatch never invoked.
- **viewer-denied-assumption-confirm** — `POST .../assumption/:cardId/confirm` → 403; assumption-confirm function never invoked.

### AC6 — Denial logging

- **skill-session-denial-logged**
  - **Verifies:** AC6
  - **Precondition:** Injectable test logger wired.
  - **Action:** Trigger a viewer denial on `/turn`.
  - **Expected result:** Logger called with `personId`, `tenantId`, `timestamp`, `route` — same shape as `vrne-s1`'s AC5 test, confirming no schema drift between route groups.

---

## Integration Tests

### gate-wired-in-real-skill-session-flow

- **Verifies:** AC1, AC2 (implicitly — confirms real wiring, not just isolated unit behaviour)
- **Components involved:** `server.js` dispatch, `routes/skills.js`, the shared gate from `vrne-s1`.
- **Precondition:** Real `server.js` loaded with mock-gateway LLM adapter wired (this repo's existing staging-safe pattern — confirms no real model cost is incurred even if the test somehow reached the model call).
- **Action:** Issue a real HTTP request to `/api/skills/:name/sessions/:id/turn` with a viewer-role session.
- **Expected result:** 403 through the real dispatch path; mock-gateway's own call counter remains at 0 (double confirmation that no cost was incurred).

---

## NFR Tests

### audit-log-format-consistent-across-route-groups

- **NFR addressed:** Audit
- **Measurement method:** Same structural assertion as `vrne-s1`'s NFR test, applied to a Skill-session denial.
- **Pass threshold:** Same field names, same event-name convention.
- **Tool:** Node `assert`.

No Performance/Accessibility NFR tests — same rationale as `vrne-s1`.

---

## Out of Scope for This Test Plan

- Products/Features, Credits/billing, and edge-case routes — covered by `vrne-s1`/`vrne-s3`/`vrne-s4`.
- Read-only skill-session routes (viewing history/transcripts) — unaffected by this story, `viewer` retains read access.
- Real LLM model-call correctness — this test plan only proves the model call is *never reached* for a viewer; it does not test the model call's own behaviour (out of scope for an access-control story).

---

## Test Gaps and Risks

None.
