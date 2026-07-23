## Test Plan: Drive product + first-feature creation via rough-idea/ideate, assert canvas and artefact persistence

**Story reference:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/a3-product-feature-ideate-canvas.md
**Epic reference:** artefacts/2026-07-23-e2e-core-journey-coverage/epics/epic-a-new-user-journey-e2e-staging-auth-foundation.md
**Test plan author:** Claude (agent), operator-directed
**Date:** 2026-07-23

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Product creation persists across a page reload | — | — | 1 test | — | — | 🟢 |
| AC2 | Rough-idea feature creation routes into a reachable `/ideate` session | — | — | 1 test | — | — | 🟢 |
| AC3 | Canvas renders/updates from a deterministic mock-LLM fixture | — | — | 1 test | — | — | 🟢 |
| AC4 | Disk artefact content matches rendered canvas content | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None — revised 2026-07-23 per the ARCH decision in decisions.md: this story now runs with `MOCK_LLM_GATEWAY=true` against a deterministic mock fixture (configured to always include a canvas marker), removing the model-emission-reliability gap that applied when this story called the real model.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A product name/details tagged `e2e-test-` | Synthetic, generated in test setup | None | Supports B3's cleanup mechanism |
| AC2 | A feature name tagged `e2e-test-`, "rough idea" path selection | Synthetic | None | |
| AC3 | Ideation turns (2 model turns) | Synthetic — `MOCK_LLM_GATEWAY=true` against a fixture configured to always emit a canvas marker (per the 2026-07-23 ARCH decision; matches discovery's original constraint to never call real Anthropic APIs from E2E) | None | Deterministic — no model-emission gap |
| AC4 | The saved `/ideate` artefact file on staging's disk/Postgres | Read directly from the real persistence layer, not mocked | None | |

### PCI / sensitivity constraints

None.

### Gaps

None beyond the AC3 model-emission gap already recorded above.

---

## Unit Tests

None — this story is inherently cross-system (real staging + real product/feature creation + real `/ideate` session).

---

## Integration Tests

### Disk-persisted `/ideate` artefact matches rendered canvas content

- **Verifies:** AC4
- **Components involved:** The `/ideate` session's artefact-save path (disk/Postgres), the API endpoint that reads it back, per this repo's disk-canonicity convention (write-then-read-from-disk before handoff)
- **Precondition:** AC3's E2E test has produced canvas content in an active `/ideate` session
- **Action:** After the E2E browser test completes, an Integration test reads the artefact directly from disk/Postgres (via the same API the app itself uses to read it back) and compares its content against what the canvas rendered
- **Expected result:** The artefact content matches what was rendered — proving the save-to-disk path is exercised, not just in-memory session state

---

## E2E Tests

### Product creation persists across a page reload

- **Verifies:** AC1
- **Precondition:** An authenticated, plan-active staging user (from A1/A2)
- **Action:** Playwright spec creates a product, fills in details, submits, then reloads the products list page
- **Expected result:** The product appears in the reloaded page with the same submitted details — not just present in the immediate post-submit DOM
- **Edge case:** No

### Rough-idea feature creation routes into a reachable `/ideate` session

- **Verifies:** AC2
- **Precondition:** The product from AC1 exists
- **Action:** Playwright spec creates a first feature, choosing the "rough idea" path
- **Expected result:** The flow routes to `/ideate`, and the resulting session has its own reachable URL (a subsequent direct navigation to that URL loads the same session)
- **Edge case:** No

### Ideation canvas renders and updates from a deterministic mock fixture

- **Verifies:** AC3
- **Precondition:** An active `/ideate` session from AC2, server running with `MOCK_LLM_GATEWAY=true`
- **Action:** Playwright spec drives 2 turns of ideation conversation against a mock fixture configured to always include a canvas marker
- **Expected result:** The canvas DOM contains rendered elements corresponding to the fixture's marker, and new elements appear between turn 1 and turn 2 — deterministic, no retry needed
- **Edge case:** No

---

## NFR Tests

### Canvas DOM update completes within the SSE stream's completion signal

- **NFR addressed:** Performance
- **Measurement method:** Asserted within the AC3 E2E test — the canvas DOM change is awaited against the SSE stream's own completion event, with a bounded Playwright wait, not an arbitrary long poll
- **Pass threshold:** Canvas update observed within the same wait window the SSE completion signal itself uses (no separate fixed millisecond threshold beyond that)
- **Tool:** Playwright Test

### None — confirmed for Security/Accessibility/Audit

Security (naming-convention tagging for cleanup) is enforced by the `e2e-test-` prefix in test data itself, not a separate runtime test. Accessibility is not applicable (test infrastructure, not user-facing UI). Audit has no dedicated mechanism beyond existing artefact-save logging — no new test required.

---

## Out of Scope for This Test Plan

- Every possible `/ideate` canvas interaction (drag-reorder, manual card editing) — only that it renders and updates from model-driven content
- Multi-product or multi-feature creation in a single run

---

## Test Gaps and Risks

None — revised 2026-07-23. Using `MOCK_LLM_GATEWAY=true` removes the model-emission-reliability gap; this story no longer calls the real model at all.
