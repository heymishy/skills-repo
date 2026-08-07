## Test Plan: Impersonation audit log

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/d3-impersonation-audit-log.md`
**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-d-admin-user-impersonation.md`
**Test plan author:** Claude (agent)
**Date:** 2026-07-21

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Audit list shows completed sessions in full detail | 1 | 1 | — | — | — | 🟢 |
| AC2 | In-progress session shows no end timestamp | 1 | — | — | — | — | 🟢 |
| AC3 | Non-admin API access rejected server-side | — | 1 | — | — | — | 🔴 |
| AC4 | Empty state when zero sessions exist | 1 | — | — | — | — | 🟢 |

## Coverage gaps

None.

## Test Data Strategy

**Source:** Mixed — synthetic audit-table row fixtures (completed and in-progress); mocked `pool.query` for reads.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1, AC2, AC4 | Fixture rows: completed, in-progress, empty set | Synthetic | Fake identity pairs only | |
| AC3 | Non-admin session fixture | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Audit list renders admin, target, tenant, reason, and both timestamps for a completed session
- **Verifies:** AC1
- **Precondition:** A fixture row with `startedAt` and `endedAt` both set
- **Action:** Render the audit list
- **Expected result:** All fields present in the rendered row

### In-progress session shows no end timestamp, not a blank or placeholder value
- **Verifies:** AC2
- **Precondition:** A fixture row with `startedAt` set, `endedAt` null
- **Action:** Render
- **Expected result:** Row shows the start time and clearly indicates "in progress" (or equivalent) — not an empty cell that could be mistaken for missing data

### Empty audit list shows a clear empty-state message
- **Verifies:** AC4
- **Precondition:** Zero fixture rows
- **Action:** Render
- **Expected result:** "No impersonation sessions yet" (or equivalent) — not a blank table or error

---

## Integration Tests

### Audit list reflects real rows via the actual read path, most recent first
- **Verifies:** AC1
- **Components involved:** route handler, mocked `pool.query`
- **Precondition:** 3 fixture rows with different timestamps
- **Action:** Request the audit list
- **Expected result:** Rows returned in reverse-chronological order

### Non-admin request to the audit API is rejected by requireAdmin, not just hidden client-side
- **Verifies:** AC3
- **Components involved:** route handler, `requireAdmin`
- **Precondition:** Non-admin session
- **Action:** Directly call the audit-list API route
- **Expected result:** Rejected (403/404) — same defense-in-depth pattern already established for the Credits tab (C3) and nav visibility (B2)

---

## NFR Tests

### Audit list loads within budget at realistic scale
- **NFR addressed:** Performance
- **Measurement method:** Time the list query against a fixture of 1,000 rows
- **Pass threshold:** Under 1 second
- **Tool:** Manual timing script

---

## Out of Scope for This Test Plan

- Filtering, searching, or exporting the audit log — not in this story's scope.
- Writing audit entries — D1's test plan covers that; this plan only covers reading them.

## Test Gaps and Risks

None.
