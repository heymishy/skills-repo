## Test Plan: Reassign an epic to a different module

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/a2-reassign-epics-between-modules.md`
**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-a-product-view-redesign.md`
**Test plan author:** Claude (agent)
**Date:** 2026-07-21

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Reassign moves epic from X to Y | 1 | 1 | — | — | — | 🟢 |
| AC2 | Unassigned epic can be assigned to a real module | 1 | — | — | — | — | 🟢 |
| AC3 | Reassigning to the same module is a no-op | 1 | — | — | — | — | 🟢 |
| AC4 | Cross-product reassignment rejected | — | 1 | — | — | — | 🟢 |

## Coverage gaps

None.

## Test Data Strategy

**Source:** Mixed — synthetic fixtures for unit tests, mocked `pool.query` for integration tests (same convention as A1).
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1–AC4 | Two modules on one product, one module on a second product | Synthetic fixtures | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### reassignEpic moves an epic's module reference from X to Y
- **Verifies:** AC1
- **Precondition:** Epic `e1` references module `X`
- **Action:** Call reassign(`e1`, `Y`)
- **Expected result:** `e1`'s module reference is now `Y`, not `X`
- **Edge case:** No

### reassignEpic moves an unassigned epic into a real module
- **Verifies:** AC2
- **Precondition:** Epic `e2` has no module reference (null)
- **Action:** Call reassign(`e2`, `X`)
- **Expected result:** `e2`'s module reference is now `X`
- **Edge case:** Yes — null starting state

### reassignEpic to the epic's current module is a no-op
- **Verifies:** AC3
- **Precondition:** Epic `e1` references module `X`
- **Action:** Call reassign(`e1`, `X`)
- **Expected result:** No error thrown; `e1`'s module reference remains `X`; no duplicate assignment record created
- **Edge case:** Yes — idempotency check

---

## Integration Tests

### Reassignment request across products is rejected
- **Verifies:** AC4
- **Components involved:** route handler, mocked pool asserting product ownership check
- **Precondition:** Epic `e1` belongs to product A; module `Y` belongs to product B
- **Action:** Request reassignment of `e1` to `Y`
- **Expected result:** Request rejected (400/404); `e1`'s module reference unchanged

### Reassignment reflects in the product view's grouping on next load
- **Verifies:** AC1
- **Components involved:** route handler + `_renderProductView` (or its module-grouped successor from A4)
- **Precondition:** Epic `e1` under module `X`
- **Action:** Reassign to `Y`, then render the product view
- **Expected result:** `e1` appears under `Y`'s section, not `X`'s

---

## NFR Tests

### Reassignment reflects within budget
- **NFR addressed:** Performance
- **Measurement method:** Time from request to updated state being queryable
- **Pass threshold:** Under 200ms
- **Tool:** Manual timing script

### Cross-product reassignment enforcement
- **NFR addressed:** Security
- **Measurement method:** Same as the AC4 integration test — this NFR and AC4 are the same underlying property viewed from different angles
- **Pass threshold:** Rejected, zero rows affected
- **Tool:** Integration test (see above)

---

## Out of Scope for This Test Plan

- Bulk reassignment of multiple epics — not in this story's scope.

## Test Gaps and Risks

None.
