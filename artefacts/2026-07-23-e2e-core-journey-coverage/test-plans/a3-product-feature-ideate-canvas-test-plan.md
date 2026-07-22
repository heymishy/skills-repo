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
| AC3 | Canvas renders/updates if the model emits markers within bounded retries | — | — | 1 test | 1 scenario (fallback) | Untestable-by-nature (model-emission reliability only) | 🟡 |
| AC4 | Disk artefact content matches rendered canvas content | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|---------------------------|---------|
| Whether the `/ideate` model reliably emits a canvas marker on a given invocation cannot be guaranteed by any test — only whether the rendering pipeline correctly displays a marker *if* one is emitted | AC3 | Untestable-by-nature | Model output is non-deterministic per-invocation; a test can assert code behaviour given a marker, not that the model always produces one | E2E test asserts the "if emitted, renders/updates" behaviour with a bounded retry (3 attempts); if no marker is emitted after retries, the manual verification scenario covers this case instead of failing the CI-blocking gate for reasons unrelated to a real regression |

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
| AC3 | Ideation turns (2 model turns) | Synthetic — real model calls against staging's real skill-execution pipeline, not mocked (this story specifically tests the real pipeline, unlike the local-mocked-LLM convention used by the existing 29 specs) | None | See Test Gaps and Risks — real model calls introduce the AC3 gap above |
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

### Ideation canvas renders and updates when the model emits markers (bounded retry)

- **Verifies:** AC3
- **Precondition:** An active `/ideate` session from AC2
- **Action:** Playwright spec drives 2 turns of ideation conversation, retrying up to 3 attempts per turn if no canvas marker is detected
- **Expected result:** If a marker is emitted within the retry budget, the canvas DOM contains rendered elements corresponding to it, and new elements appear between turn 1 and turn 2. If no marker is emitted after 3 attempts on either turn, the test is marked as a known gap (see Coverage gaps) rather than a hard CI failure, and the manual verification scenario covers it instead.
- **Edge case:** Yes — the no-marker-emitted path is the story's own acknowledged edge case

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

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Model may not emit a canvas marker within the retry budget on a given CI run | Model output is non-deterministic per-invocation — this repo has hit this exact class of gap before (inc5, 2026-06-16) | Bounded retry (3 attempts) reduces but does not eliminate the risk; the manual verification scenario is the fallback for genuine non-emission, not treated as a hard CI failure |
