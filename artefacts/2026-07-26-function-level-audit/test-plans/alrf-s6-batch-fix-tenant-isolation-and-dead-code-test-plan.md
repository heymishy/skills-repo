## Test Plan: Batch fix — tenant-isolation, dead code, rate-limiter re-assessment

**Story reference:** artefacts/2026-07-26-function-level-audit/stories/alrf-s6-batch-fix-tenant-isolation-and-dead-code.md
**Epic reference:** csd-e1-code-shape-diagrams (finding #2's routes belong to this epic)
**Test plan author:** Claude (agent) — retrospective backfill, 2026-08-21
**Date:** 2026-08-21

**Backfill note:** reconstructed after the fact — implementation and its test file (`tests/check-alrf-s6-as-built-tenant-isolation.js`) already existed and were merged (2026-07-26); documents existing coverage per `templates/retrospective-story.md`'s convention.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `as-built-diagrams.js` resolves `repoRoot` via the tenant-aware `getRepoRoot(req)`, not a private static function | 1 test | — | — | — | — | 🟢 |
| AC2 | `as-built-system-architecture.js` resolves `repoRoot` via the same tenant-aware adapter | 1 test | — | — | — | — | 🟢 |
| AC3 | Two different tenants requesting the same feature slug resolve to two different repo roots | 1 test | — | — | — | — | 🟡 |
| AC4 | No regression to existing as-built diagram generation behaviour | — | 4 regression suites | — | — | — | 🟢 |
| AC5 | `assignFeatureToModule`/`unassignFeature` removal has zero regressions (confirmed genuinely dead code) | — | 6 regression suites (98 checks) | — | — | — | 🟢 |

---

## Coverage gaps

None. All 5 ACs have direct test coverage. AC3 marked 🟡 since the fix is dormant on this deployment today (`WUCE_TENANT_ROOT_BASE` unset everywhere) — the test proves the code path is correct, but it isn't yet exercised by real multi-tenant traffic.

---

## Test Data Strategy

**Source:** Synthetic — two distinct tenant contexts for AC3's cross-tenant assertion.
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained.

---

## Unit Tests

Tests live in `tests/check-alrf-s6-as-built-tenant-isolation.js` (8 assertions total):

- **AC1:** `as-built-diagrams.js` uses `getRepoRoot(req)`, not its own private `_repoRoot()`.
- **AC2:** `as-built-system-architecture.js` uses the same canonical adapter.
- **AC3:** Two tenants requesting the same feature slug resolve to two different repo roots — no collision.

---

## Integration Tests

**AC4 (regression):** `check-csd-s5-as-built-diagram-generation.js` (10/10), `check-csd-s6-drift-signal.js` (18/18), `check-csd-s7-as-built-system-architecture-diagram.js` (9/9), `check-alrf-s5-artefact-path-traversal-guard.js` (10/10) — all pass unchanged.

**AC5 (regression, dead-code removal):** `check-a1-modules-taxonomy-crud.js` (26/26), `check-a2-reassign-epics-between-modules.js` (11/11), `check-a4-module-grouped-rendering.js` (11/11), `check-fps-s1-progress-proxy.js` (7/7), `check-pvc-s1-consolidate-and-tab-features-view.js` (14/14), `check-tmc-s1-persist-feature-module-classification.js` (29/29) — 98 checks combined, all unchanged, confirming `assignFeatureToModule`/`unassignFeature` were genuinely dead code with zero live callers.

---

## E2E Tests

None.

---

## NFR Tests

### Security — dormant multi-tenancy isolation closed before it can ever go live

- **NFR addressed:** Security (tenant isolation).
- **Measurement method:** AC3 above IS the security-relevant assertion.
- **Pass threshold:** N/A — see AC3.
- **Tool:** This repo's hand-rolled `test()`/`assert` harness.

---

## Out of Scope for This Test Plan

- Finding #4 (`auth-email.js`'s rate-limiter) — re-assessed and confirmed acceptable, no code change made, so no test needed.
- The newly-reported resume-session bug root cause — logged separately in `workspace/capture-log.md`, not fixed by this story.
- Feeding as-built snapshots into `/design` — raised as an architecture question, not yet scoped as a story.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC3's fix is dormant on this deployment (`WUCE_TENANT_ROOT_BASE` unset) | No real multi-tenant repo-root config exists yet in production | Test proves correctness now, ahead of the config being turned on; revisit if/when `WUCE_TENANT_ROOT_BASE` is configured for real |
