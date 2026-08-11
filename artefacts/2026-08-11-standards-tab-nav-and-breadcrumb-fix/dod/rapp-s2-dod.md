# Definition of Done: Fix the Standards tab's missing sidebar nav and duplicate breadcrumb

**PR:** https://github.com/heymishy/skills-repo/pull/722 | **Merged:** 2026-08-11
**Story:** artefacts/2026-08-11-standards-tab-nav-and-breadcrumb-fix/stories/rapp-s2-standards-tab-nav-and-breadcrumb.md
**Test plan:** artefacts/2026-08-11-standards-tab-nav-and-breadcrumb-fix/test-plans/rapp-s2-test-plan.md
**DoR artefact:** artefacts/2026-08-11-standards-tab-nav-and-breadcrumb-fix/dor/rapp-s2-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-11

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Products-nav renders real product names | `check-rapp-s2-standards-tab-nav-and-breadcrumb.js` (7/7 passing) + live Chrome verification on `wuce-staging.fly.dev` (sidebar showed Canned products, card issuing, Women's mentorship, test product, skills-framework, name, No product) | None |
| AC2 | ✅ | "See all products" link present, points at `/dashboard` | Same automated test + live verification | None |
| AC3 | ✅ | Zero-products state doesn't fabricate data | Automated test (`AC3` assertion) | None |
| AC4 | ✅ | Current product marked active in sidebar nav | Automated test (`AC4` assertion) + live verification (skills-framework highlighted active) | None |
| AC5 | ✅ | Exactly one breadcrumb bar, duplicate `&rsaquo;` link gone | Automated test (`AC5` assertion) + live verification (single "skills-framework › Standards" bar, no duplicate) | None |
| AC6 | ✅ | Standards `<h1>` heading still present | Automated test (`AC6` assertion) | None |
| AC7 | ✅ | JSON API branch (`res.json`) unaffected — regression guard | Automated test (`AC7` assertion) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found.

---

## Scope Deviations

None. Story's own Out of Scope (`_renderRoadmapTab`'s identical duplicate-breadcrumb pattern, Standards creation UI) was not touched, as intended.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7
**Tests passing in CI:** 7 / 7

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: handleGetProductStandardsTab_withPool_rendersProductsNavSection | ✅ | ✅ | |
| AC2: handleGetProductStandardsTab_seeAllProductsLink_pointsAtDashboard | ✅ | ✅ | |
| AC3: handleGetProductStandardsTab_zeroProducts_rendersEmptyProductsStateNotFabricated | ✅ | ✅ | |
| AC4: handleGetProductStandardsTab_marksCurrentProductActiveInSidebar | ✅ | ✅ | |
| AC5: standardsTab_noDuplicateBreadcrumb | ✅ | ✅ | |
| AC6: standardsTab_stillShowsStandardsHeading | ✅ | ✅ | |
| AC7: handleGetProductStandardsTab_jsonResponse_unaffectedByNavWiring | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

Regression suite also re-confirmed post-merge: `check-smug-s1-standards-tab-and-query-fix.js` (6/6), `check-jcn-s1-journey-page-nav-products.js` (5/5), `check-pan-s1-product-aware-navigation.js` (29/29), `check-psh-s4-navigation.js` (6/6), `check-psh-s6-product-kanban.js` (7/7), `check-psh-s7-org-kanban.js` (7/7), `check-prc-s4.1-edit-product.js` (3/3), `check-prc-s4.2-delete-product.js` (4/4) — all green at DoR time, PR CI confirmed all 8 checks passed.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Correctness — real, current tenant's product list, no staleness beyond existing query behaviour | ✅ | Unchanged query mechanism, confirmed via automated tests |
| No regression to `smug-s1`'s existing Standards-tab behaviour | ✅ | `check-smug-s1-standards-tab-and-query-fix.js` unmodified, 6/6 passing pre- and post-merge |

---

## Metric Signal

No formal `benefit-metric.md` exists for this story — short-track fix per CLAUDE.md's short-track convention (no discovery/benefit-metric artefacts required). No `metrics[]` entries in `pipeline-state.json` reference `rapp-s2`. Not applicable.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None blocking. Known, separately-tracked follow-up candidate (not part of this story): `_renderRoadmapTab`'s identical duplicate-breadcrumb pattern, flagged during investigation but explicitly out of scope for this fix.

---

## DoD Observations

1. Live Chrome verification on staging required a re-authentication step mid-session (the browser's GitHub OAuth session had expired between browser actions) — resolved with explicit operator permission to click through the already-authenticated GitHub session. No code or process issue; noted only as a session-mechanics observation, not a /improve candidate.
2. This fix directly informed the scoping of the subsequent `web-ui-guardrails-standards-surface` discovery — the "Standards creation UI" gap `smug-s1` deferred, confirmed still absent here, became a named driver in that feature's Problem Statement.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Fix the Standards tab's missing sidebar nav and duplicate breadcrumb" (rapp-s2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
