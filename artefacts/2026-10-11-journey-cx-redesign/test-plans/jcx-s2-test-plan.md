## Test Plan: Placeholder mapping auto-converts to linked once its triggered discovery is approved

**Story reference:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s2.md
**Epic reference:** artefacts/2026-10-11-journey-cx-redesign/epics/journey-map-and-placeholder-trigger.md
**Test plan author:** Claude Sonnet 5
**Date:** 2026-10-11

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Approval converts placeholder → linked, feature_slug updates | — | 1 test | — | — | — | 🟢 |
| AC2 | Unapproved discovery leaves mapping as placeholder | — | 1 test | — | — | — | 🟢 |
| AC3 | Independent conversion — one approval doesn't affect another | — | 1 test | — | — | — | 🟢 |
| AC4 | Abandoned discovery leaves mapping as placeholder indefinitely | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1, AC2, AC3 | Placeholder mappings in known states, a discovery.md with a known `Status` field | Synthetic mock pool + a temp discovery.md fixture | None | |
| AC4 | A placeholder mapping with no associated discovery.md status change | Synthetic mock pool | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### AC4: an abandoned placeholder trigger never auto-converts

- **Verifies:** AC4
- **Precondition:** A placeholder mapping whose triggered discovery.md was never approved (status remains "Draft")
- **Action:** Run the conversion-check logic directly (no approval event fired)
- **Expected result:** `mapping_state` remains `placeholder`; `feature_slug` remains the original placeholder name
- **Edge case:** Yes — the "nothing happens" case, easy to accidentally not test

---

## Integration Tests

### AC1: approval converts the mapping to linked with the real feature's slug

- **Verifies:** AC1
- **Precondition:** A placeholder mapping whose triggered `discovery.md` has just had its `Status` field set to `Approved`
- **Action:** Trigger the conversion check against a real pool
- **Expected result:** The mapping row's `mapping_state` updates to `linked`, and `feature_slug` updates from the placeholder name to the real, approved feature's own slug

### AC2: an unapproved discovery leaves the mapping untouched

- **Verifies:** AC2
- **Precondition:** A placeholder mapping whose triggered `discovery.md` status is still `Draft`
- **Action:** Trigger the conversion check
- **Expected result:** No `UPDATE` call is made against the mapping row; `mapping_state` remains `placeholder`

### AC3: two independent placeholder mappings convert independently

- **Verifies:** AC3
- **Precondition:** Two placeholder mappings on two different stages, each with its own triggered discovery — one `Approved`, one still `Draft`
- **Action:** Run the conversion check across both
- **Expected result:** Only the approved one's mapping converts to `linked`; the other remains `placeholder` — exactly one `UPDATE` call recorded, targeting only the approved one's own row

---

## NFR Tests

### Security — conversion write is tenant-scoped

- **NFR addressed:** Security
- **Measurement method:** Attempt the conversion check against a mapping belonging to a different tenant than the session
- **Pass threshold:** 404, zero mutation — matches `jcx-s1`'s own D13 pattern
- **Tool:** Integration test, mock pool call-count assertion

---

## Gap table

No gaps — every AC is unit/integration-testable; the NFR reuses the same tenant-scoping pattern already established and tested in `jcx-s1`.
