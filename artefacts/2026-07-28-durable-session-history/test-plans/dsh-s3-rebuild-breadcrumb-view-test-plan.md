# Test Plan: Rebuild the breadcrumb "view a completed stage" page into a chat+artefact split view

**Story reference:** artefacts/2026-07-28-durable-session-history/stories/dsh-s3-rebuild-breadcrumb-view.md
**Epic reference:** artefacts/2026-07-28-durable-session-history/epics/dsh-e1-durable-session-history.md
**Test plan author:** Copilot
**Date:** 2026-07-28

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Renders chat-left/artefact-right split when turns available | 1 | — | 1 | — | — | 🟢 |
| AC2 | Falls back to artefact-only view when turns unavailable | 1 | — | — | — | — | 🟢 |
| AC3 | Existing edit-artefact functionality unregressed | — | 1 | — | — | — | 🟢 |
| AC4 | Cross-tenant 404 unregressed | — | — | — | — | — | 🟢 — already covered by `check-p0.2-journey-guard-wiring.js`; re-confirmed by running that suite, not re-implemented |
| AC5 | No message-input control shown (read-only MVP) | 1 | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — unit/integration tests use fake journey/session fixtures matching dsh-s1/dsh-s2's own doubles. The E2E scenario uses a new local-only, `NODE_ENV=test`-gated seed endpoint (`POST /test/seed-durable-stage`) that seeds a completed stage whose turns exist only via the injectable durable-read adapter — no corresponding in-memory session — simulating "server has restarted, memory is gone" without an actual restart or a real database connection. Runs entirely against the disposable local Playwright webServer process (matching `frsr-s1`'s existing pattern); creates no data in real staging and requires no cleanup.
**PCI/sensitivity in scope:** No
**Availability:** Available now (new seed endpoint is part of this story's own implementation scope)
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|------------------|-------|
| AC1 (unit) | A completed stage with a fake db returning turns via dsh-s2's function | Inline fixture | None | |
| AC1 (E2E) | A journey + completed stage seeded via `/test/seed-durable-stage`, turns available only through the durable-read path | New test-only endpoint | None | Local ephemeral webServer only |
| AC2 | A completed stage with dsh-s2's function returning `null` | Inline fixture | None | |
| AC3 | An existing completed-stage fixture (reused from the pre-dsh-s3 artefact-edit test, unmodified) | Inline fixture | None | |
| AC5 | Rendered HTML from the AC1 fixture | Inline fixture | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Renders chat-left/artefact-right split when durable turns are available

- **Verifies:** AC1
- **Precondition:** dsh-s2's read function returns a non-empty turns array for the requested stage
- **Action:** Request `GET /journey/:journeyId/stage/:stageName` as the tenant owner
- **Expected result:** Response HTML contains both a chat-panel container with the returned turns rendered, and the existing artefact-panel content
- **Edge case:** No

### Falls back to artefact-only view when no durable turns exist

- **Verifies:** AC2
- **Precondition:** dsh-s2's read function returns `null` for the requested stage
- **Action:** Request the same route
- **Expected result:** Response HTML matches today's existing artefact-only rendering (no chat panel, no error, no empty broken panel)
- **Edge case:** Yes — the explicit "no retroactive recovery" boundary case

### No message-input control appears in the rendered chat panel

- **Verifies:** AC5
- **Precondition:** Same as AC1
- **Action:** Inspect the rendered HTML
- **Expected result:** No `<input>`/`<textarea>`/send-button element is present in the chat panel markup
- **Edge case:** No

---

## Integration Tests

### Existing inline artefact-edit flow is unregressed

- **Verifies:** AC3
- **Components involved:** The rebuilt `handleGetJourneyStageView` page and the existing, unmodified `handlePostJourneyStageArtefact` handler
- **Precondition:** A completed stage exists (with or without durable turns)
- **Action:** Render the page, then submit the existing edit-artefact form
- **Expected result:** The artefact content updates exactly as it did before this story — same redirect, same save behaviour

---

## E2E Tests (Playwright, local ephemeral webServer)

### AC1 (end-to-end confirmation): the rebuilt page actually renders both panels in a real browser

- **Verifies:** AC1
- **Spec file:** `tests/e2e/dsh-s3-breadcrumb-split-view.spec.js`
- **Fixture:** `withAuth` (existing `tests/e2e/fixtures/auth.js` convention, matching `frsr-s1`)
- **Setup:** `POST /test/seed-durable-stage` (new, `NODE_ENV=test`-gated) creates a journey + completed stage whose turns are served only via the durable-read path — no in-memory session backing it, simulating post-restart state
- **Action:** `page.goto()` the seeded stage's `/journey/:id/stage/:name` URL
- **Expected result:** Both the chat panel (containing the seeded turn text) and the artefact panel (containing the seeded artefact content) are visible in the rendered page — this is the specific class of bug (handler correct in isolation, but not actually correct when rendered through the real router/page) that jsvr-s1 taught us unit tests alone can miss
- **Why E2E, not just unit:** Confirms the real composed page (navigator strip + chat panel + artefact panel, actual CSS layout) renders coherently — a unit test on the handler function alone doesn't prove the assembled page is visually/structurally correct

---

## NFR Tests

None — confirmed with story owner. No new NFRs beyond what dsh-s2 already specifies for the read path this story consumes.

---

## Out of Scope for This Test Plan

- Re-deriving AC4's cross-tenant guard test — already covered by `check-p0.2-journey-guard-wiring.js`; this test plan only re-runs that existing suite as a regression check, not a new implementation.
- Any real-staging E2E coverage — this story's E2E concern (rendering correctness) doesn't require a real restart/Postgres round-trip, so the local ephemeral pattern is sufficient (see dsh-s4's test plan for the one scenario that does need real staging).

---

## Test Gaps and Risks

None.
