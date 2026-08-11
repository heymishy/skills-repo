## Test Plan: Remove `smug-s1`'s promote/opt-out routes and old Standards tab rendering

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s11-remove-smug-s1-routes-and-tab.md
**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-4-smug-s1-migration.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-11

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | old routes return 404 | 1 test | — | — | — | — | 🟢 |
| AC2 | nav repointed to new view | 1 test | — | — | — | — | 🟢 |
| AC3 | obsolete test files removed | — | — | — | 1 check | — | 🟢 |
| AC4 | grep-verified no dangling references | — | — | — | 1 check | — | 🟢 |

---

## Coverage gaps

AC3/AC4 are repo-hygiene checks, not runtime behaviour — represented as manual/CI checks rather than unit tests, matching their actual nature (a grep/file-presence assertion, not a functional test).

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | None beyond a running server instance | N/A | None | |
| AC2 | Mock nav/product state | Mock pool | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### oldStandardsRoutes_afterRemoval_return404

- **Verifies:** AC1
- **Precondition:** Server running with this story's changes applied
- **Action:** Request `GET /products/:id/standards-tab`, `PUT .../standards/:id/promote`, `POST .../standards/:id/optout`
- **Expected result:** All three return 404
- **Edge case:** No

### standardsNavLink_repointedToNewView

- **Verifies:** AC2
- **Precondition:** Mock nav rendering
- **Action:** Render the product page nav
- **Expected result:** The "Standards" nav link's href points at the new repo-backed view's route, and there is exactly one "Standards"-labelled nav entry (not two)
- **Edge case:** No

---

## Integration Tests

### fullRegressionSuite_afterRemoval_noDanglingReferences

- **Verifies:** AC4
- **Components involved:** Whole repo
- **Precondition:** This story's changes applied
- **Action:** `grep -rn "standardsPost\|standardsList\|standardsPut\|handlePutStandardPromote\|handlePostStandardOptout"` across `src/` and `tests/`
- **Expected result:** Zero matches outside of this story's own removal diff/commit history
- **Edge case:** No

---

## NFR Tests

None — confirmed with story owner (removal-only story, no new NFR surface).

---

## Out of Scope for This Test Plan

- DB table removal — `wugs-s12`'s own test plan.

---

## Test Gaps and Risks

None identified as blocking.
