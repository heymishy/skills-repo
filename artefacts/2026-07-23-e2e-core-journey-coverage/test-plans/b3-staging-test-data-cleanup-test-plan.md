## Test Plan: Design and implement a staging test-data cleanup strategy for E2E-generated accounts and records

**Story reference:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/b3-staging-test-data-cleanup.md
**Epic reference:** artefacts/2026-07-23-e2e-core-journey-coverage/epics/epic-b-formed-idea-journey-e2e-full-gate-data-hygiene.md
**Test plan author:** Claude (agent), operator-directed
**Date:** 2026-07-23

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Purge script removes tagged records past retention, leaves others untouched | — | 1 test | — | — | — | 🟢 |
| AC2 | Non-tagged records are never deleted (positive allowlist match) | — | 1 test | — | — | — | 🟢 |
| AC3 | decisions.md RISK entry updated to reflect implementation | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Seeded database (a scratch/test staging schema or a dedicated test tenant seeded with a mix of tagged and untagged records)
**PCI/sensitivity in scope:** No
**Availability:** Available now — reuses A1's audit-logged identities and A3's `e2e-test-` naming convention
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A mix of `e2e-test-` tagged records with varying ages (some past retention, some recent) plus non-tagged records | Seeded database — test setup inserts records with controlled timestamps | None | |
| AC2 | At least one non-tagged record resembling a real manually-created account | Seeded database | None | |
| AC3 | The `decisions.md` RISK entry | Fixtures (repo file) | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None.

---

## Integration Tests

### Purge script removes old E2E-tagged records and leaves recent/non-tagged ones

- **Verifies:** AC1
- **Components involved:** `scripts/cleanup-e2e-staging-data.js` (or equivalent), the staging users/products/Stripe-test-customers store
- **Precondition:** A seeded set of records: some `e2e-test-` tagged and older than the retention window, some `e2e-test-` tagged and recent, some not tagged at all
- **Action:** Run the purge script against the seeded set
- **Expected result:** Only the old, tagged records are removed; recent tagged records and all non-tagged records remain

### A non-tagged record is never deleted, even one resembling test data

- **Verifies:** AC2
- **Components involved:** Same as above
- **Precondition:** A non-tagged record deliberately named to resemble an E2E-tagged one (e.g. containing "test" but not the `e2e-test-` prefix) but old
- **Action:** Run the purge script
- **Expected result:** This record is NOT deleted — the match is a strict positive allowlist on the exact `e2e-test-` prefix, not a fuzzy heuristic that could false-positive on real data

### `decisions.md` RISK entry reflects the implemented mechanism

- **Verifies:** AC3
- **Components involved:** `artefacts/2026-07-23-e2e-core-journey-coverage/decisions.md`
- **Precondition:** The purge script exists and is confirmed running
- **Action:** A Node script reads `decisions.md`'s "Staging test-data accumulation" entry and asserts it no longer says "tracked, not yet resolved" and instead names the chosen mechanism and confirms it is implemented
- **Expected result:** The entry reflects resolution, not an open question

---

## E2E Tests

None — this story's mechanism is a backend script, not browser-driven.

---

## NFR Tests

### Cleanup script uses least-privilege credentials

- **NFR addressed:** Security
- **Measurement method:** Code review / config inspection — confirm the script's Postgres/Stripe test-mode credentials are scoped to delete permissions on E2E-tagged records only, not full-admin access
- **Pass threshold:** No credential used by the script has broader scope than strictly required
- **Tool:** Manual code/config review

### Every cleanup run logs what was deleted

- **NFR addressed:** Audit
- **Measurement method:** Integration test asserts the script writes a log entry (record type, ID, creation timestamp) for each deleted record during the AC1 test run
- **Pass threshold:** One log entry per deleted record, no silent deletions
- **Tool:** Node script assertion against the script's own log output

---

## Out of Scope for This Test Plan

- Cleaning up any non-staging environment
- A fully general-purpose data lifecycle/retention tool

---

## Test Gaps and Risks

None — no gaps identified for this story's test plan.
