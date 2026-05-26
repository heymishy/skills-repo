# Test Plan — wfp.11b: Interactive allocation assignment UI — person-centric and squad-centric views

**Story:** wfp.11b
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27
**Review:** PASS — wfp.11b run 1, 0 HIGH findings; 1-M1 MEDIUM (H-E2E trigger — Playwright E2E tests specified below); 1-L1 LOW (squad bulk-assign idempotency — specified in DoR contract)

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC6 | Person-centric view: list all persons; 4 filter dimensions; per-person detail (initiatives, FTE count, skills); over-allocation flag; shared state | — | — | ✅ | — | None | Low |
| AC7 | Squad-centric view: list squads; per-squad detail (initiatives, FTE, skill union); bulk assign squad to initiative; shared state | — | — | ✅ | — | None | Low |
| AC11 | Cross-view navigation: staged changes preserved across all three views; unsaved banner consistent; count consistent; reload loses all changes | — | — | ✅ | — | None | Low |
| NFR-SCALE | Person view interactive with 200 roster entries; squad view with 40 squads | — | — | ✅ | — | None | Low |
| NFR-NO-RELOAD | No additional GET /workforce/data on view switch | — | — | ✅ | — | None | Low |
| NFR-LAYOUT | 1280px no horizontal scroll across all three views | — | — | — | ✅ (RISK-ACCEPT) | Untestable-by-automation | Low |

---

## Coverage gaps

**NFR-LAYOUT** — Same B2 RISK-ACCEPT as wfp.11a: 1280px layout constraint and CSS styling cannot be verified by automated tests. Manual smoke test covers this post-implementation.

**No unit tests** — wfp.11b introduces no new route handlers or Node.js modules. All logic is in the browser-executed inline JavaScript served by `handleGetWorkforceHtml`. A unit test of the inline script is not feasible without a headless JS runtime, which Playwright already provides. All test coverage is E2E only.

---

## Test Data Strategy

**Fixture reuse** — Uses the same fixtures defined in wfp.11a test plan (`tests/fixtures/workforce/`). Extension: the roster fixture is extended to 8 people to exercise scale and over-allocation scenarios:

```
tests/fixtures/workforce/roster.json (extended for wfp.11b):
  — Alice: squad "Platform Eng", skills: ["java","spring","kafka","docker"], productGroup: "Platform", employmentType: "permanent"
  — Bob: squad "Platform Eng", skills: ["java","k8s"], productGroup: "Platform", employmentType: "permanent"
  — Carol: squad "Data Eng", skills: ["python","spark","sql"], productGroup: "Data", employmentType: "permanent"
  — Dave: squad "Data Eng", skills: [], productGroup: "Data", employmentType: "contractor"
  — Eve: squad "Security", skills: ["python","auth","iam"], productGroup: "Security", employmentType: "permanent"
  — Frank: squad "Platform Eng", skills: ["kafka","go"], productGroup: "Platform", employmentType: "permanent"
  — Grace: squad "Data Eng", skills: ["python","ml","spark"], productGroup: "Data", employmentType: "contractor"
  — Hana: squad "Security", skills: ["iam","soc","siem"], productGroup: "Security", employmentType: "permanent"

tests/fixtures/workforce/allocation-input-overallocated.json:
  — Alice assigned to 3 initiatives (exceeds OVER_ALLOCATION_THRESHOLD of 2)
  — Bob assigned to 1 initiative (under threshold)
```

**No real PII** — all names are placeholders.

---

## E2E tests

Test file: `tests/e2e/wfp11b-person-squad-views.spec.js`
Run command: `npx playwright test tests/e2e/wfp11b-person-squad-views.spec.js`
Requires: Same test server global setup as wfp.11a spec.

| # | Test ID | AC | Scenario | Expected |
|---|---------|-----|---------|---------|
| E1 | `person-view-tab-activates-list` | AC6 | Click person-centric view tab | Person-centric view panel visible; full roster list rendered |
| E2 | `person-view-filter-by-product-group` | AC6 | Select "Platform" from product-group filter in person view | Only Platform Eng members visible (Alice, Bob, Frank) |
| E3 | `person-view-filter-by-employment-type` | AC6 | Select "contractor" from employment-type filter | Only Dave and Grace visible |
| E4 | `person-view-filter-by-squad` | AC6 | Select "Security" from squad filter | Only Eve and Hana visible |
| E5 | `person-view-filter-by-skill-tag` | AC6 | Enter "python" in skill-tag filter | Carol, Eve, Grace visible; Alice, Bob, Dave, Frank, Hana not visible |
| E6 | `person-view-over-allocation-flag-above-threshold` | AC6 | Load with allocation-input-overallocated.json; open person view | Alice (3 assignments) carries over-allocation warning indicator |
| E7 | `person-view-no-flag-at-threshold` | AC6 | Bob has exactly 2 assignments (= OVER_ALLOCATION_THRESHOLD) | Bob's row does NOT carry over-allocation warning indicator |
| E8 | `person-view-detail-shows-initiatives-and-fte` | AC6 | Select Alice from person list | Detail panel shows all 3 initiatives Alice is assigned to; FTE commitment count = 3 |
| E9 | `squad-view-tab-activates-list` | AC7 | Click squad-centric view tab | Squad-centric view visible; squads listed: "Platform Eng", "Data Eng", "Security" |
| E10 | `squad-view-detail-shows-skill-union` | AC7 | Select "Platform Eng" squad | Detail panel shows union of all member skills (java, spring, kafka, docker, k8s, go) |
| E11 | `squad-bulk-assign-stages-all-members` | AC7 | In squad view, assign "Platform Eng" squad to "pilot-platform" initiative | In-memory state contains staged entries for Alice, Bob, Frank each assigned to pilot-platform |
| E12 | `squad-bulk-assign-idempotent` | AC7 | Alice already staged for pilot-platform; assign "Platform Eng" squad again | Alice's entry count for pilot-platform = 1 (not doubled); Bob and Frank added |
| E13 | `cross-view-staged-changes-preserved` | AC11 | Stage change in initiative view → navigate to person view | Banner still visible; person view reflects the staged change |
| E14 | `cross-view-banner-dismissed-on-save` | AC11 | Stage changes across views → save → 200 response | Banner dismissed in all three views after save |
| E15 | `no-additional-data-fetch-on-view-switch` | NFR-NO-RELOAD | Intercept all network requests; navigate between all three views | No additional GET /workforce/data requests after initial page load |

---

## Notes on test file format

```js
// tests/e2e/wfp11b-person-squad-views.spec.js
const { test, expect } = require('@playwright/test');
// Uses same globalSetup as wfp11a-assignment-ui.spec.js
// baseURL pointed at test server started in globalSetup
```

wfp.11b has no unit test file — no new Node.js module is introduced. The E2E spec is the only test file. The `package.json` test chain does NOT need a new `node tests/check-...` entry; the Playwright suite (`npm run test:e2e`) covers it.
