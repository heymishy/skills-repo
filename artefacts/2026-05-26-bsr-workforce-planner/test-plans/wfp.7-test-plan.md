# Test Plan: Hiring gap view and leadership coverage view

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.7.md
**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-planning-dashboard.md
**Test plan author:** Copilot
**Date:** 2026-05-27

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Gap rows rendered with slug, requiredRole, requiredTags, mode label, "No current capacity" text | 3 tests | — | 1 test | — | — | 🟢 |
| AC2 | Group filter: matching productGroup shown; no productGroup → always visible; no-productGroup entries not hidden | 3 tests | — | — | — | — | 🟢 |
| AC3 | Leadership coverage shown for initiatives with computedFTE ≥ 3 (direct + profile-match only) | 2 tests | — | — | — | — | 🟢 |
| AC4 | No LEADERSHIP_ROLES match AND FTE ≥ 3 → "Leadership gap" badge (amber/red + text label) | 2 tests | — | 1 test | — | — | 🟢 |
| AC5 | FTE < 3 → shown without leadership gap badge | 1 test | — | — | — | — | 🟢 |
| AC6 | No hiringGap entries → empty state message shown | 1 test | — | 1 test | — | — | 🟢 |
| NFR-A11Y | Badges use text + colour; `<th>` headers | 2 tests | — | — | — | — | 🟢 |
| NFR-SEC | No external network calls | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None — badge styling is verified by class name + text content. All ACs are automatable.

---

## Test Data Strategy

All test data is synthetic. No real PII.

- **Initiative-map fixture for hiring gaps:** 3 entries — 1 net-new (hiringGap:true), 1 profile-match no-match (hiringGap:true), 1 direct alloc (no gap). One gap entry has productGroup; one does not.
- **Initiative-map fixture for leadership coverage:** 3 entries — one with FTE=4, no leader role; one with FTE=4, one leader; one with FTE=2 (sub-threshold).
- `LEADERSHIP_ROLES` constant set to `["Product Owner", "Engineering Chapter Lead", "People Leader"]` in `wfp-functions.js` — exported so tests can verify the check.
- E2E tests: Playwright; `tests/e2e/wfp7-hiring-gap.spec.js`.

---

## Unit tests

Test file: `tests/check-wfp7-hiring-gap.js`
Run command: `node tests/check-wfp7-hiring-gap.js`
Source under test: `dashboards/wfp-functions.js` (exports `renderHiringGapRow`, `renderHiringGapTable`, `filterHiringGaps`, `renderLeadershipCoverage`, `assessLeadershipCoverage`)

| # | Test ID | AC | Scenario | Expected |
|---|---------|-----|---------|---------|
| 1 | `render-hiring-gap-row-has-slug-and-role` | AC1 | Net-new entry `{ hiringGap: true, requiredRole: "Senior Engineer", allocationMode: "net-new", requiredTags: ["react"] }` | Row HTML contains "Senior Engineer" and initiative slug |
| 2 | `render-hiring-gap-row-net-new-mode-label` | AC1 | Net-new entry | Row contains "net-new" mode label |
| 3 | `render-hiring-gap-row-no-capacity-text` | AC1 | Any gap entry | Row contains "No current capacity — hiring required" |
| 4 | `filter-gaps-by-product-group-matching` | AC2 | Fixture: gap entry with `productGroup: "Platform"`, filter by "Platform" | Entry shown |
| 5 | `filter-gaps-by-product-group-non-matching` | AC2 | Fixture: gap entry with `productGroup: "Data"`, filter by "Platform" | Entry NOT shown |
| 6 | `filter-gaps-no-product-group-always-visible` | AC2 | Gap entry with no `productGroup` field; any filter active | Entry still shown under all filter values |
| 7 | `leadership-coverage-shown-for-3-plus-fte` | AC3 | Initiative with `computedFTE: 3` (direct + profile-match) | Initiative appears in leadership coverage result set |
| 8 | `leadership-coverage-not-shown-below-threshold` | AC3 | Initiative with `computedFTE: 2` | Initiative does NOT appear in the flagging result set |
| 9 | `leadership-gap-badge-when-no-leader-role` | AC4 | FTE=4; allocated roles are `["Engineer", "QA", "Designer", "Analyst"]`; LEADERSHIP_ROLES `["Product Owner", "Engineering Chapter Lead"]` | `assessLeadershipCoverage` returns `{ leadershipGap: true }` for that initiative |
| 10 | `no-leadership-gap-badge-when-leader-present` | AC4 | FTE=3; one allocated person has role "Product Owner" | Returns `{ leadershipGap: false }` |
| 11 | `sub-threshold-shown-without-badge` | AC5 | Initiative with `computedFTE: 2` | Present in table with no leadership gap badge; `leadershipGap` not true |
| 12 | `empty-state-message-when-no-gaps` | AC6 | `renderHiringGapTable([])` | Returns HTML containing "No hiring gaps recorded" |
| 13 | `nfr-a11y-leadership-badge-has-text-label` | NFR-A11Y | Initiative with leadership gap | Badge HTML contains text "Leadership gap" — not colour only |
| 14 | `nfr-a11y-table-headers-are-th` | NFR-A11Y | Rendered table HTML | Headers use `<th>` elements |
| 15 | `nfr-sec-no-external-fetch` | NFR-SEC | Static analysis of `dashboards/workforce.html` | No absolute-URL fetch calls; no CDN script tags |

---

## E2E tests

Test file: `tests/e2e/wfp7-hiring-gap.spec.js`
Run command: `npm run test:e2e -- --grep "wfp7"`

| # | Test ID | AC | Scenario | Expected |
|---|---------|-----|---------|---------|
| E1 | `e2e-hiring-gap-tab-shows-gaps` | AC1 | Navigate to Hiring Gaps tab with fixture containing 2 gaps | 2 rows visible; each contains role and "No current capacity" text |
| E2 | `e2e-leadership-gap-badge-visible` | AC4 | Load fixture with leadership gap; navigate to Leadership Coverage tab | "Leadership gap" badge text visible on the flagged initiative row |
| E3 | `e2e-hiring-gap-empty-state` | AC6 | Load fixture with no hiringGap entries; navigate to Hiring Gaps tab | Empty state message visible; no table rows |

---

## Total test count

**15 unit + 3 E2E = 18 tests**
All automated tests are expected to FAIL before implementation (RED phase of TDD).
