## Test Plan: Drive the formed-idea outer loop to DoR and assert the /definition story-map canvas, close/resume mid-SSE

**Story reference:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/b1-formed-idea-outer-loop-story-map.md
**Epic reference:** artefacts/2026-07-23-e2e-core-journey-coverage/epics/epic-b-formed-idea-journey-e2e-full-gate-data-hygiene.md
**Test plan author:** Claude (agent), operator-directed
**Date:** 2026-07-23

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Discovery driven to Approved status | — | — | 1 test | — | — | 🟢 |
| AC2 | Definition writes epics/stories; story-map canvas renders them | — | — | 1 test | — | — | 🟢 |
| AC3 | Review/test-plan/DoR reached, DoR status visible | — | — | 1 test | — | — | 🟢 |
| AC4 | Resume restores story-map-specific field | — | 1 test | — | — | — | 🟢 |

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
| AC1 | A formed-idea feature description tagged `e2e-test-`, an authenticated staging user (from A1), and a tenant/product context (created independently by this spec, per the B1 story revision) | Synthetic, generated in test setup | None | |
| AC2 | The same session, driven through `/benefit-metric` and `/definition` | Synthetic | None | |
| AC3 | The same session, driven through `/review`, `/test-plan`, `/definition-of-ready` | Synthetic | None | |
| AC4 | The same session, closed and resumed | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None — cross-system, multi-stage skill-session behaviour.

---

## Integration Tests

### Story-map-specific field restores correctly on resume

- **Verifies:** AC4
- **Components involved:** `mergeRedisSessionData` (denylist-based session restore), applied to the `/definition` skill-session type
- **Precondition:** The resumed `/definition` session from AC2/AC3
- **Action:** An Integration test reads the resumed session's story-map-specific field (e.g. `epicsDraft` or the implementation's actual field name — distinct from A4's `canvasBlocks`) directly via the session-state API
- **Expected result:** The field is present and populated, matching what existed before closing — proving the denylist-restore mechanism generalizes across skill session types (not just `/ideate`)
- **Edge case:** No

---

## E2E Tests

### Formed-idea feature reaches an Approved discovery

- **Verifies:** AC1
- **Precondition:** An authenticated staging user with a tenant/product context this spec creates independently
- **Action:** Playwright spec creates a feature via the "formed idea" path and drives `/discovery` to Approved status
- **Expected result:** The discovery artefact is saved and readable via the API/UI showing Approved status
- **Edge case:** No

### Definition writes epics/stories and the story-map canvas renders them

- **Verifies:** AC2
- **Precondition:** AC1's approved discovery
- **Action:** Playwright spec continues through `/benefit-metric` into `/definition`
- **Expected result:** Epics and stories are saved, and the `/definition` story-map canvas DOM renders visual elements corresponding to at least the epics/stories just created — not an empty/placeholder canvas
- **Edge case:** No

### The scenario reaches DoR sign-off

- **Verifies:** AC3
- **Precondition:** AC2's story-map content
- **Action:** Playwright spec continues through `/review` → `/test-plan` → `/definition-of-ready`
- **Expected result:** A visible DoR status field reflects the sign-off state, completing the scenario's stated end point
- **Edge case:** No

---

## NFR Tests

### Each outer-loop stage transition completes within a bounded wait

- **NFR addressed:** Performance
- **Measurement method:** Asserted within the AC1-AC3 E2E tests — each stage transition/artefact handoff is awaited with a bounded Playwright wait per stage
- **Pass threshold:** No single stage's wait exceeds Playwright's default action timeout × a documented small factor (e.g. 3×)
- **Tool:** Playwright Test

### Resumed session is only reachable by the same authenticated user/tenant

- **NFR addressed:** Security
- **Measurement method:** Same pattern as A4's equivalent NFR test — an E2E test attempts to load the resumed session URL from an unauthenticated or different-tenant context
- **Pass threshold:** Rejected (401/403 or equivalent)
- **Tool:** Playwright Test

---

## Out of Scope for This Test Plan

- Driving past `/definition-of-ready` into the coding/inner loop or DoD
- Testing multiple different story-map layouts or epic/story counts

---

## Test Gaps and Risks

None — no gaps identified for this story's test plan.
