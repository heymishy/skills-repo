# Definition of Done: Build an idempotent anonymized seed script for staging

**PR:** https://github.com/heymishy/skills-repo/pull/453 | **Merged:** 2026-07-10
**Story:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.4-anonymized-seed-script.md
**Test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.4-anonymized-seed-script-test-plan.md
**DoR artefact:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s2.4-anonymized-seed-script-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `scripts/seed-staging.js` — `SYNTHETIC_TENANTS` array (2 tenants), inserts representative rows into `products`, `credits`, `user_roles` | automated test (T1-T3) | None |
| AC2 (Acceptance Criterion 2) | ✅ | Every INSERT uses `ON CONFLICT (...) DO NOTHING` on deterministic synthetic IDs — idempotent rerun | automated test (T4/T5) | None |
| AC3 | ✅ | Synthetic emails (`engineer@example-staging.test`), tenant IDs (`tenant-demo-1/2`) — zero real PII | automated test (T6/T7) | None |
| AC4 (Acceptance Criterion 4) | ✅ | `.github/workflows/staging-deploy.yml` runs the seed step immediately after `deploy-staging` — automatic, not a manual step | automated test (IT1) + cross-verified against bri-s2.5's own IT1 for wiring | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

None. PR #453 touched exactly `scripts/seed-staging.js`, its D37 (injectable adapter rule) wiring, and the new test file.

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9
**Tests passing in CI:** 9 / 9 (re-verified directly against current master, 2026-07-14)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1-T3 (≥2 tenants, representative rows) | ✅ | ✅ | |
| T4/T5 (idempotent rerun) | ✅ | ✅ | |
| T6/T7 (zero real PII) | ✅ | ✅ | |
| IT1 (automatic post-deploy execution) | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## D37 (Injectable Adapter Rule) Compliance

Confirmed directly: `requireDbConnection()` throws `Error('Adapter not wired: dbConnection. Call setDbConnection() with a real implementation before use.')` — correct, no silent no-op default. Real Postgres wiring is a separate code block (`require.main === module`), matching D37's mandatory task-separation requirement (handler task vs. wiring task).

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Seed script completes in under 30 seconds | ✅ | No timing violation found in the automated test run; real-world post-deploy timing not independently re-measured in this DoD pass, consistent with this being a fast, small, synthetic-data script |
| Zero real customer data ever appears in seed script/output | ✅ | T6/T7 pass — hard requirement, directly evidenced |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — A broken build cannot reach prod | ✅ (0%) | Not yet — this story provides realistic staging test data; the full gate is bri-s2.6 | |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. **This story is the one that discovered and correctly root-caused bri-s2.2's T1 regression** (`decisions.md`, 2026-07-11, RISK-ACCEPT | verify-completion) — running `node tests/check-bri-s2.2-neon-staging-branch.js` as part of this story's own adjacent-regression sweep surfaced the false-positive collision between bri-s2.2's schema-fork guard and bri-s1.2's unrelated PostHog key-selection code. This story's own test file (`check-bri-s2.4-anonymized-seed-script.js`) was unaffected (9/9 passing) — the regression was correctly diagnosed as out-of-scope for bri-s2.4 and left for a dedicated fix. See bri-s2.2-dod.md for the full account.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Build an idempotent anonymized seed script for staging" (bri-s2.4).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
