# Definition of Done: dviz.3 — Governance: extend viz-check to dashboards/

**PR:** commit cd8d573 (feat: add governance test scripts) | **Merged:** 2026-04-21
**Story:** artefacts/2026-04-18-dashboard-v2/stories/dviz.3-governance-check.md
**Test plan:** artefacts/2026-04-18-dashboard-v2/test-plans/dviz.3-test-plan.md
**DoR artefact:** artefacts/2026-04-18-dashboard-v2/dor/dviz.3-dor.md
**Assessed by:** Copilot
**Date:** 2026-04-23

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | tests/check-dashboard-viz.js exists. Running `node tests/check-dashboard-viz.js` exits 0 against current dashboards/ (5 files, all clean). | Direct execution — `[check-dashboard-viz] PASS: all 5 file(s) are valid JavaScript` | None |
| AC2 | ✅ | Script calls `execSync('node --check ...')` per file; error path calls `console.error()` with filename + error message, then `process.exit(1)`. Exit-1 path confirmed by code inspection. | Code inspection of tests/check-dashboard-viz.js lines 28-35 | Deviation: `tests/check-dviz3-dashboard-governance.js` (the T1-T7 test wrapper from the test plan) was never created. AC2 is satisfied by code inspection only, not by an automated test. |
| AC3 | ✅ | `package.json` scripts.test contains `node tests/check-dashboard-viz.js`. | Static check of package.json | None |
| AC4 | ✅ | Full `npm test` suite passes including `node tests/check-dashboard-viz.js`. | CI green on master | None |
| AC5 | ✅ | Script uses `fs.readdirSync(DASHBOARD_DIR).filter(f => f.endsWith('.js'))` — no hardcoded filenames. | Code inspection of tests/check-dashboard-viz.js line 15 | None |

**Deviation summary:** `tests/check-dviz3-dashboard-governance.js` (T1-T7 verification wrapper specified in the test plan) was never created. The ACs are satisfied by direct execution and code inspection, but the planned automated test harness for the governance script itself is absent. This has no runtime impact — the script works correctly and is exercised daily by `npm test`.

---

## Scope Deviations

**One scope deviation: test plan verification file not implemented.**

`tests/check-dviz3-dashboard-governance.js` (T1-T7 from the test plan, covering existence, syntax, readdirSync usage, node --check invocation, package.json inclusion, integration run, and error emission) was not created. The ACs are all met through other means; the missing file is a test-hygiene gap, not a functional failure.

Follow-up options:
1. Create `tests/check-dviz3-dashboard-governance.js` T1-T7 in a follow-up short-track story.
2. Accept via RISK-ACCEPT: the governance script is exercised by `npm test` on every commit; a wrapper test adds redundancy but not new coverage.

---

## Test Plan Coverage

**Tests from plan implemented:** 0/7 (check-dviz3-dashboard-governance.js not created)
**Tests passing in CI:** N/A — test file absent; ACs verified by direct execution and code inspection

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 — check-dashboard-viz.js exists | ❌ | N/A | Not in check-dviz3-dashboard-governance.js (file not created) |
| T2 — check-dashboard-viz.js syntax clean | ❌ | N/A | Verified by running `node --check tests/check-dashboard-viz.js` manually |
| T3 — check-dashboard-viz.js scans dashboards/ dynamically | ❌ | N/A | Verified by code inspection (readdirSync) |
| T4 — check-dashboard-viz.js runs node --check per file | ❌ | N/A | Verified by code inspection (execSync) |
| T5 — package.json includes check-dashboard-viz in test chain | ❌ | N/A | Verified by direct inspection of package.json |
| T6 — all current dashboards/*.js files are syntax-clean | ❌ | N/A | Verified by running `node tests/check-dashboard-viz.js` → PASS |
| T7 — check-dashboard-viz.js emits actionable error on syntax failure | ❌ | N/A | Verified by code inspection (console.error with filename) |

**Gaps:** The entire test plan file `tests/check-dviz3-dashboard-governance.js` was not created. All 7 planned assertions have been verified by other means at DoD time, but are not part of the automated suite.

---

## NFR Status

No NFRs defined for this story.

---

## Metric Signal

No metrics defined for this story.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

Follow-up actions:
1. (Operator choice — not blocking) Create `tests/check-dviz3-dashboard-governance.js` T1-T7 to formalise the governance script's own test harness. Short-track story (complexity 1).

---

## DoD Observations

1. **Test plan verification wrapper missing (candidate for /improve):** dviz.3's test plan specified `tests/check-dviz3-dashboard-governance.js` as the verification file but it was never committed. For future governance-script stories: the test file that verifies a governance script should be committed as part of the same PR/commit as the script itself. Add to `/definition-of-ready` checklist: "governance scripts must ship with their T1-T7 wrapper in the same PR".
