# Test Plan: Add a --dry-run flag to scripts/purge-e2e-tenants.js

**Story reference:** artefacts/2026-07-26-function-level-audit/stories/alrf-s12-purge-script-dry-run-flag.md
**Epic reference:** None — short-track follow-up to alrf-s11
**Test plan author:** Copilot
**Date:** 2026-07-27

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `--dry-run` prints count/list, performs zero deletes | 1 test | — | — | — | — | 🟢 |
| AC2 | No-flag behaviour unchanged (still does the real purge) | 1 test | — | — | — | — | 🟢 |
| AC3 | Dry-run output textually distinct from real-purge output | Covered by AC1/AC2 tests' assertions | — | — | — | — | 🟢 |
| AC4 | CI workflows still call the script with no flag | — | — | — | Manual — grep the workflow files | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — an unreachable DB connection string (`127.0.0.1:1`), same pattern already used to verify the alrf-s11 CI-hang fix.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|------------------|-------|
| AC1 | An unreachable `DATABASE_URL` so the script exits fast without needing a real DB | Inline in test (`postgres://baduser:badpass@127.0.0.1:1/nonexistent`) | None | Connection refused is immediate, unlike a blackhole IP's timeout |
| AC2 | Same | Same | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### --dry-run: exits 0 and prints "[dry-run]" (not "Purged") against an unreachable DB

- **Verifies:** AC1, AC3
- **Precondition:** `DATABASE_URL` points at an unreachable host
- **Action:** Spawn `node scripts/purge-e2e-tenants.js --dry-run` as a child process
- **Expected result:** Exit code 0; stdout contains `[dry-run]`; stdout does not contain `Purged `
- **Edge case:** No

### without --dry-run: still runs the real purge path ("Purged", not "[dry-run]")

- **Verifies:** AC2, AC3
- **Precondition:** Same unreachable `DATABASE_URL`
- **Action:** Spawn `node scripts/purge-e2e-tenants.js` (no flag) as a child process
- **Expected result:** Exit code 0; stdout contains `Purged `; stdout does not contain `[dry-run]`
- **Edge case:** Yes — confirms this story's addition did not change the pre-existing default behaviour

---

## Integration Tests

None beyond the child-process CLI tests above — this is a CLI-entrypoint-only change; the underlying functions are unmodified and already covered by alrf-s11's existing test suite.

---

## NFR Tests

None — confirmed with story owner. Pure CLI-flag addition, no new perf/security/accessibility surface.

---

## Out of Scope for This Test Plan

- Re-verifying `findE2eTenantIds`/`purgeTenant`/`purgeE2eTenants` — already covered by alrf-s11's test suite, unmodified here.
- Confirming CI workflow files don't pass `--dry-run` (AC4) — a one-line grep check, not worth a dedicated automated test; verified manually.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| No live-staging confirmation of the dry-run's real output against real accumulated tenant data | Requires the operator to run it themselves against staging | Operator runs `--dry-run` first and reviews the real output before running the real purge, per the story's own intent |
