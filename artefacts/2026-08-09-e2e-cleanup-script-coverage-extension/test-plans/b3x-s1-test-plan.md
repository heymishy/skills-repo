## Test Plan: Extend the existing staging-cleanup script's matching pattern and table coverage to close three real gaps

**Story reference:** artefacts/2026-08-09-e2e-cleanup-script-coverage-extension/stories/b3x-s1-cleanup-script-coverage-extension.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | New `@example.test` suffix pattern matches | 1 test | — | — | — | — | 🟢 |
| AC2 | Zero regression to existing prefix-matching behaviour | existing suite | — | — | — | — | 🟢 |
| AC3 | Tenant-less journey (+ its artefacts) deleted | 1 test | — | — | — | — | 🟢 |
| AC4 | credits/tenant_plan/user_roles rows deleted | 1 test | — | — | — | — | 🟢 |
| AC5 | Real (non-tagged) rows never touched, any table | 1 test | — | — | — | — | 🟢 |
| AC6 | Dry-run reports new tables, makes zero new-table writes | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. AC2 is covered by re-running `tests/check-b3-cleanup-script.js` unmodified in full — every existing test in that file already exercises the exact classification cases AC2 requires to stay unchanged.

---

## Test Data Strategy

**Source:** Extends the existing `createMockDb(seed)` helper already established in `tests/check-b3-cleanup-script.js` — add seed support and query-pattern handling for `journeys` (direct, not just via `product_id`), `artefacts`, `credits`, `tenant_plan`, and `user_roles`.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A tenant ID shaped like `bri-s3-2-<ts>-<n>@example.test` | Hand-authored, matching the real live-observed shape | None | |
| AC3 | A tenant-less journey row (no `product_id`) with a matching `artefacts` row, older than cutoff | Hand-authored, extended mock DB | None | |
| AC4 | Old/tagged rows in `credits`, `tenant_plan`, `user_roles` | Hand-authored, extended mock DB | None | |
| AC5 | Real, non-tagged rows in every newly-covered table, alongside tagged ones | Hand-authored, extended mock DB | None | |
| AC6 | Same seed as AC3/AC4, `dryRun` not set to `false` | Hand-authored | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### isTaggedForE2E_matchesExampleTestSuffix_alongsideExistingPrefix

- **Verifies:** AC1
- **Precondition:** None.
- **Action:** `isTaggedForE2E('bri-s3-2-1784957724823-344530@example.test')`.
- **Expected result:** Returns `true`.
- **Edge case:** Yes — the exact real-world shape this session found live.

### run_deletesOldTaggedTenantLessJourney_andItsArtefacts

- **Verifies:** AC3
- **Precondition:** Extended mock DB seeded with one journey (`tenant_id: 'e2e-test-old...'`, no `product_id`, `created_at` past cutoff) and one matching `artefacts` row (`journey_id` matching).
- **Action:** `run({ db, skipStripe: true, dryRun: false, retentionDays: 7 })`.
- **Expected result:** Both the journey row and its artefacts row are gone from `db.remaining`; the delete order in `db.deletions` shows artefacts before the journey.
- **Edge case:** Yes — this is the exact defect being fixed.

### run_deletesOldTaggedCreditsTenantPlanUserRolesRows

- **Verifies:** AC4
- **Precondition:** Extended mock DB seeded with one tagged row each in `credits`, `tenant_plan`, `user_roles`.
- **Action:** `run({ db, skipStripe: true, dryRun: false, retentionDays: 7 })`.
- **Expected result:** All three rows are gone from `db.remaining`.
- **Edge case:** Yes — the exact defect being fixed.

### run_realNonTaggedRows_neverTouchedInAnyNewTable

- **Verifies:** AC5
- **Precondition:** Extended mock DB seeded with both a tagged AND a real (non-tagged) row in `journeys`, `credits`, `tenant_plan`, `user_roles`.
- **Action:** `run({ db, skipStripe: true, dryRun: false, retentionDays: 7 })`.
- **Expected result:** Only the tagged rows are deleted; every real row remains in `db.remaining` across all four tables.
- **Edge case:** Yes — false-positive safety, the single most important property.

### run_dryRun_reportsNewTablesAndMakesZeroNewTableWrites

- **Verifies:** AC6
- **Precondition:** Same seed as `run_deletesOldTaggedTenantLessJourney...` / `run_deletesOldTaggedCreditsTenantPlanUserRolesRows`, combined.
- **Action:** `run({ db, skipStripe: true, retentionDays: 7 })` (dry-run default).
- **Expected result:** `summary.eligible` includes entries for the new tables' matched rows; zero `DELETE` queries recorded in `db.deletions` for `journeys`, `artefacts`, `credits`, `tenant_plan`, or `user_roles`.
- **Edge case:** Yes — the core safety guarantee, extended to new tables.

---

## Integration Tests

None required — re-running `tests/check-b3-cleanup-script.js` unmodified is the integration-level regression check (AC2), and the new tests above extend that same file's own established mock-DB/`run()` seam.

---

## NFR Tests

### falsePositiveSafety_acrossAllNewlyCoveredTables

- **NFR addressed:** Safety (primary)
- **Measurement method:** `run_realNonTaggedRows_neverTouchedInAnyNewTable` above — already the primary AC5 test, called out here to make the traceability from NFR to test explicit.
- **Pass threshold:** Zero false-positive matches/deletes across every table, in every test in both the existing and extended suite.
- **Tool:** Same unit test harness.

---

## Out of Scope for This Test Plan

- Any live confirmation against real staging Postgres — building and testing the extension is this story's scope.
- `credit_audit_log`, `organisations`, `impersonation_audit_log` — explicitly out of scope per the story.

---

## Test Gaps and Risks

None identified as blocking.
