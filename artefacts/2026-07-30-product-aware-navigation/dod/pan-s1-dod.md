# Definition of Done: List products directly in the sidebar; remove redundant Run a Skill and Journeys nav items

**PR:** https://github.com/heymishy/skills-repo/pull/639 | **Merged:** 2026-07-29
**Story:** artefacts/2026-07-30-product-aware-navigation/stories/pan-s1-product-aware-navigation.md
**Test plan:** artefacts/2026-07-30-product-aware-navigation/test-plans/pan-s1-product-aware-navigation-test-plan.md
**DoR artefact:** artefacts/2026-07-30-product-aware-navigation/dor/pan-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Products list rendered with name + journey count, active marker | ✅ | `check-pan-s1-product-aware-navigation.js` U1 (name+count), U2 (active marker), IT1 (shared query shape); re-run against merged master (commit `c8894277`), 29/29 assertions pass | Automated test — `tests/check-pan-s1-product-aware-navigation.js` | None |
| AC2 — Product row links to /products/:id | ✅ | U4: rendered href matches `/products/:id` (URI-encoded) | Automated test | None |
| AC3 — Run a Skill / Journeys removed from NAV_ITEMS | ✅ | U5 (structural NAV_ITEMS check — no `skills`/`journey` entries), U6 (no combination of active/isAdmin re-introduces the text); `check-wuce18-html-shell.js` T2/T3/T9 and `check-wuce23-skill-launcher-landing.js` T13 updated to assert absence, both re-run against merged master (42/42 and 35/35 passing) | Automated test | None |
| AC4 — /journey lists only no-product journeys; sidebar "No product" entry | ✅ | IT2: real `handleGetJourney` handler, fixture journeys with/without `productId`, only no-product journeys appear in rendered body; U3 (sidebar "No product" entry shows its own count) | Automated test | None |
| AC5 — Unwired pages' sidebar unchanged (regression guard) | ✅ | IT3: identical input with no `products` key produces byte-for-byte identical output across repeated calls; no `class="sw-product-nav-item` rendered when `products` is omitted; Org board/Settings/header confirmed still present | Automated test | None |
| AC6 — Journey creation flows unaffected (regression guard) | ✅ | U7: static-source check confirms `handlePostJourney` (unchanged) never references `productId`; IT4: real `handlePostProductFeature` handler still sets `productId` correctly on the created journey | Automated test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
No deviations recorded — all 6 ACs implemented and verified exactly as specified.

---

## Scope Deviations

None. Confirmed via direct grep of the merged code: `products`/`activeProductId` are threaded into `renderShell` from exactly 3 call sites — `handleGetJourney` (journey.js), and `_renderProductDashboard`/`_renderProductView` (products.js, backing `handleGetDashboard` and `handleGetProductView` respectively). No other `renderShell` call site (~60 others) was touched, matching the story's Architecture Constraints and the bounded-scope decision in `decisions.md`.

`/skills` and `/journey` routes remain live (not deleted) — only their `NAV_ITEMS` entries were removed, matching the story's explicit scope.

---

## Test Plan Coverage

**Tests from plan implemented:** 11 / 11 (U1–U7, IT1–IT4)
**Tests passing in CI:** 11 / 11 (29 individual assertions, all passing — re-verified against merged master commit `c8894277`)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| U1 — product name + journey count rendered | ✅ | ✅ | |
| U2 — active product marked distinctly | ✅ | ✅ | |
| U3 — "No product" entry with its own count | ✅ | ✅ | |
| U4 — product row href = /products/:id | ✅ | ✅ | |
| U5 — NAV_ITEMS no longer has skills/journey | ✅ | ✅ | |
| U6 — no active/isAdmin combination re-introduces removed nav text | ✅ | ✅ | |
| U7 — handlePostJourney unchanged (no productId) | ✅ | ✅ | Implemented as a static-source check rather than a full HTTP-level trace, per the test plan's own framing ("trace the same code path") |
| IT1 — shared products-summary helper returns correct shape | ✅ | ✅ | |
| IT2 — GET /journey lists only no-product journeys | ✅ | ✅ | |
| IT3 — unwired page sidebar byte-for-byte unchanged | ✅ | ✅ | |
| IT4 — handlePostProductFeature still sets productId | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

**Additional (beyond the test plan):** 2 pre-existing tests (`check-wuce18-html-shell.js`, `check-wuce23-skill-launcher-landing.js`) whose assertions directly targeted the nav items this story removes were updated in the same PR — not called out in the original test plan, since the test plan predates discovering these specific pre-existing assertion conflicts. Both re-verified passing against merged master (42/42, 35/35). Full baseline suite re-run against merged master: 443 files, 37 failed — exact match to the documented pre-existing baseline (`tests/known-baseline-failures.json`), zero new regressions.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — negligible added query cost | ✅ | Each of the 3 wired pages gains one additional lightweight products+journeys query (or reuses an existing one, in `handleGetDashboard`'s case); no new N+1 pattern — verified via manual fake-pool timing during implementation and via IT1's shape check |
| Security — no new tenant-scope surface | ✅ | The shared `getProductsNavSummary` helper's queries are tenant-scoped (`WHERE tenant_id = $1`), matching the existing, already-audited pattern in `handleGetDashboard` |
| Accessibility — product rows are real `<a href>` elements | ✅ | Confirmed via U4 (href assertion) and U2 (element structure); matches this repo's existing keyboard-navigable nav convention |
| Audit — no change to page-view logging | ✅ | Confirmed by code review — no new logging paths were introduced or removed |

---

## Metric Signal

No metrics apply. This is a short-track story with no `/benefit-metric` artefact (per CLAUDE.md's short-track path); the feature's `metrics` array in `pipeline-state.json` is empty. Benefit linkage was validated directly via an operator-approved design mockup instead (recorded in the story's Benefit Linkage section and in `decisions.md`).

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None required to close this story. Noted, non-blocking follow-ups already recorded in the story's Out of Scope section and in `decisions.md`'s revisit trigger: wiring the remaining ~60 `renderShell` call sites is a natural future story if operator feedback shows the missing Products section elsewhere is confusing — not scheduled now.

---

## DoD Observations

1. **Post-merge pipeline-state bookkeeping bug, self-caught and fixed forward.** The initial `bin/skills init` call used the feature slug `pan-s1-product-aware-navigation` instead of the actual artefact directory name `2026-07-30-product-aware-navigation`, which broke 2 of 3 CI gates on the first push: "Run assurance gate" (trace-report.js `--feature` resolution) and "Validate traceability chain" (the discovery-artefact-exists check, which keys off `pipeline-state.json` `slug` matching the `artefacts/` directory name). Root-caused directly from the CI failure logs, fixed with a follow-up commit correcting the slug, and re-verified: all 8 CI checks passed on the corrected commit. This is exactly the failure mode documented in the standing feedback memory `feedback_pipeline_state_slug_rules.md` ("slug must match artefacts/ dir name") — worth reinforcing at the next `/improve` pass since it recurred despite that memory already existing.
2. **One CI-only flake observed and NOT treated as a regression.** `tests/check-p4-enf-second-line.js` failed on the very first CI run ("Lint, typecheck, test, build") as a "1 NEW regression not in the known baseline." It passed 22/22 locally on 3 repeated runs, has zero content relation to any file this story touches (it validates docs about ADR-003/theme-F governance), and passed cleanly on the re-run triggered by the slug-fix commit — confirmed as CI-environment flakiness (matching the resource-contention pattern already documented for `check-md-3-adr.js`/`check-p3.5-validate-trace.js` in `tests/known-baseline-failures.json`), not a real regression from this story's code.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "List products directly in the sidebar; remove redundant Run a Skill and Journeys nav items" (pan-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
