## Test Plan: Assert full session close/resume mid-SSE-stream for the ideate canvas

**Story reference:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/a4-ideate-session-resume.md
**Epic reference:** artefacts/2026-07-23-e2e-core-journey-coverage/epics/epic-a-new-user-journey-e2e-staging-auth-foundation.md
**Test plan author:** Claude (agent), operator-directed
**Date:** 2026-07-23

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Server retains in-progress turn state after mid-stream disconnect | — | 1 test | — | — | — | 🟢 |
| AC2 | Resumed session restores canvas and turn history | — | — | 1 test | — | — | 🟢 |
| AC3 | First new response after resume uses restored context | — | — | 1 test | — | — | 🟢 |
| AC4 | `canvasBlocks` (non-allowlist field) specifically restores correctly | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | An active `/ideate` session mid-stream (continuation of A3's session) | Synthetic, generated in test setup | None | |
| AC2 | Same session, closed and reopened | Synthetic | None | |
| AC3 | Same session, a new turn sent post-resume | Synthetic | None | |
| AC4 | Same session's `canvasBlocks` field, read via the session-state API | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None — cross-system browser/session behaviour, not a pure function/module.

---

## Integration Tests

### Server session store retains in-progress turn state after a mid-stream disconnect

- **Verifies:** AC1
- **Components involved:** The SSE turn-streaming handler, the session-state store (Redis/Postgres write-behind, per `mergeRedisSessionData`)
- **Precondition:** An active `/ideate` session with a turn in progress
- **Action:** The Playwright browser context is closed mid-stream (before the SSE stream's completion event); an Integration test then queries the session-state store directly (via the same read API AC2 uses) for the interrupted session ID
- **Expected result:** The session-state store contains a `pendingSectionDraft` (or equivalent in-progress marker) for the interrupted turn — proving state was retained server-side, not just that the client silently disconnected
- **Edge case:** No

### `canvasBlocks` restores correctly on resume, proving the denylist-restore mechanism is structural

- **Verifies:** AC4
- **Components involved:** `mergeRedisSessionData` (denylist-based session restore, per `wusl-s2`)
- **Precondition:** The resumed session from AC2/AC3
- **Action:** An Integration test reads the resumed session's `canvasBlocks` field directly via the session-state API
- **Expected result:** `canvasBlocks` is present and populated, matching what existed before the browser was closed — this field was never in `mergeRedisSessionData`'s original 8-field allowlist, so its correct restoration is direct evidence the fix generalizes, not another narrow allowlist
- **Edge case:** No

---

## E2E Tests

### Resuming a closed session restores the canvas and turn history

- **Verifies:** AC2
- **Precondition:** AC1's interrupted session
- **Action:** Playwright spec opens a fresh browser context at the same session URL
- **Expected result:** The canvas renders with the same blocks/markers, and the chat/turn history matches what existed before closing
- **Edge case:** No

### The first new turn after resume uses the restored context

- **Verifies:** AC3
- **Precondition:** The resumed session from AC2
- **Action:** Playwright spec sends a new turn referencing a detail only present in a prior (pre-close) turn
- **Expected result:** The response is coherent with that prior detail — proving the model received the restored context, not a blank/fresh one
- **Edge case:** No

---

## NFR Tests

### Session resume render completes within a normal page-load wait

- **NFR addressed:** Performance
- **Measurement method:** Asserted within the AC2 E2E test using Playwright's default navigation/load wait — no special resume-specific budget
- **Pass threshold:** Resumed page reaches a stable, interactive state within Playwright's default timeout
- **Tool:** Playwright Test

### Resumed session is only reachable by the same authenticated user/tenant

- **NFR addressed:** Security
- **Measurement method:** An additional E2E test attempts to load the same session URL from an unauthenticated browser context, and separately from a different tenant's authenticated context
- **Pass threshold:** Both attempts are rejected (401/403 or equivalent, not the session content)
- **Tool:** Playwright Test

---

## Out of Scope for This Test Plan

- Resuming on a different device/browser than where the session was closed
- Every possible mid-stream close timing — one representative point only

---

## Test Gaps and Risks

None — no gaps identified for this story's test plan.
