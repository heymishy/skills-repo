# Definition of Done: Render incident records and their triage summaries on the product page

**PR:** https://github.com/heymishy/skills-repo/pull/1082 | **Merged:** 2026-11-12 (merge commit 6decdbeea)
**Story:** artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s3-web-ui-rendering.md
**Test plan:** artefacts/2026-11-08-incident-triage-and-respond/test-plans/itar-s3-web-ui-rendering-test-plan.md
**DoR artefact:** artefacts/2026-11-08-incident-triage-and-respond/dor/itar-s3-web-ui-rendering-dor.md
**Assessed by:** Claude (against merged code on master at d5fa1421e, which contains 6decdbeea)
**Date:** 2026-11-12

---

## AC Coverage

Verification-strength tags: `unit` = a render function against fixtures; `integration-real-code` = the real route handler `handleGetProductView`, with the real GitHub fetch adapter `realFetchRepoPath` run against a stubbed `fetch` that returns the real GitHub Contents payload shape; `live-verified` = confirmed against a real running instance; `production-observed` = observed in production. No browser or deployed-instance check was made for this story.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ⚠️ | AC1 (Acceptance Criterion 1: each incident record in a connected repo's `workspace/incidents.json` is fetched via `fetchRepoPath` and rendered as a distinct item showing at least its status and triage summary). Tests handleGetProductView_rendersEachRecordAsDistinctItem_whenIncidentsJsonPresent, renderIncidentItem_showsStatusAsTextLabel_notColorAlone and renderIncidentItem_omitsTriageSummaryBlock_whenAbsent pass. Strength: `integration-real-code`. | Automated test `tests/check-itar-s3-web-ui-rendering.js` (14 passed, 0 failed, re-run on merged master) | The page is asserted as HTML through the real handler. It was not seen in a real browser and not checked on staging or production. |
| AC2 | ⚠️ | AC2 (Acceptance Criterion 2: a populated triage summary is visible inline, with no click-through). renderIncidentItem_showsTriageSummaryInline_whenPresent passes. Strength: `unit` plus `integration-real-code`. | Automated test | Same: HTML asserted, not seen in a browser. |
| AC3 | ✅ | AC3 (Acceptance Criterion 3: a repo with no `workspace/incidents.json` renders normally with zero incident items, never a visible error). handleGetProductView_rendersZeroIncidentItems_whenIncidentsJsonFileNotFound and the three-path silent fallback test (fetch throws, returns an empty string, returns null) pass, plus invalid JSON, no repo and no token cases. Strength: `integration-real-code`. | Automated test | None |
| AC4 | ⚠️ | AC4 (Acceptance Criterion 4: a real incident record, such as the migrated `tenant_admin_bootstrap_failed` case, renders end to end without error). handleGetProductView_rendersMigratedRealRecord_endToEnd_withRealTriageSummary passes: the record is built through the real chain (`createIncidentRecord`, then `draftTriageSummary`, then the serialised file, then the page). A second test feeds the real committed `workspace/incidents.json` through the handler and shows zero incident items and no deferred-item text. Strength: `integration-real-code`. | Automated test | **No real incident record exists in the real data file.** `workspace/incidents.json` holds 2 `deferred-item` records and no incidents, so the AC's "real record" proof is a record built in the test from the real finding's text, not a persisted real record rendered on a real page. |

**Verification strength summary:** AC3 `integration-real-code`; AC1, AC2 and AC4 `integration-real-code` but marked ⚠️ (no browser observation; AC4 also lacks a persisted real record); 0 `live-verified`; 0 `production-observed`. UI-evidence gate: this story renders browser-visible content and no browser observation was made, which is why AC1, AC2 and AC4 carry a deviation.

---

## Scope Deviations

None against the story's Out of Scope list. The PR changed four files: `src/web-ui/routes/products.js`, `tests/check-itar-s3-web-ui-rendering.js` (new), the implementation plan, and one regex in `tests/check-ep4-s2-nav-and-product-link.js` (another story's test; loosened so the journey-id argument may be followed by the new trailing arguments). When the branch was merged with urpv-s3's changes, `tests/check-urpv-s3-decisions-md-as-reactive-source.js` also needed one edit: its authorisation test counted exactly two `fetchRepoPath` calls, and the incidents fetch is a legitimate third call through the same adapter, so the count is now limited to `decisions.md` calls. Owner, repo and token are still asserted on all calls.

`server.js` is unchanged. No new route or adapter was added: the story extends `GET /products/:id` through the existing `handleGetProductView` and the existing `setFetchRepoPath(realFetchRepoPath)` wiring.

---

## Test Plan Coverage

**Tests from plan implemented:** the test plan registered 7 tests; the test file implements 14 (the 7, plus mixed-type, fetch-bound, wiring and coexistence cases). I did not map the plan's 7 names one to one against the 14.
**Tests passing:** 14 / 14, re-run locally on merged master. The build agent reported RED first (8 failing). The coexistence test with urpv-s3's section was added during the merge fix and passes. Final CI results for PR #1082 were not re-inspected; the operator merged it.

**Gaps (tests not implemented):** none identified apart from the browser check above.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: fetch latency of `workspace/incidents.json` at scale | ⚠️ | **Never measured.** The feature's `nfr-profile.md` says the baseline is owed before itar-s3 reaches DoR, and the DoR did not resolve it; it stays `[UNKNOWN BASELINE]`. What was built is a worst-case bound: a 3-second `Promise.race` inside the fetch, tested with a hanging fetch (page renders in under 6 seconds). The bound is separate from the fetcher's own 10-second timeout, which cannot be lowered through its four-argument wrapper. |
| Security: record text escaped | ✅ | NFR-SEC-1 renderIncidentItem_escapesAllRecordText passes. |
| Authorisation: per-tenant fetch (ADR-025) | ✅ | The fetch URL is asserted to be scoped to the product's own repo with the session `accessToken` as a Bearer token. |
| Accessibility: status as a text label, not colour alone | ✅ | renderIncidentItem_showsStatusAsTextLabel_notColorAlone passes. Not checked in a browser. |

---

## Metric Signal

The story contributes to the feature's rendering metric. No metric in the feature's `metrics[]` lists itar-s3 as a contributor.

**Incident rendering coverage (records visible to a delivery engineer without leaving the product page)**
Signal: not-yet-measured
Evidence note: the page code is merged, but no real incident exists to render, and the page has not been seen on a deployed instance. The first real incident recorded with `node scripts/create-incident.js` and committed will be the first real measurement.
Date measured: null

---

## Outcome

**COMPLETE WITH DEVIATIONS**

ACs satisfied: 4/4 in substance. AC3 is ✅; AC1, AC2 and AC4 are ⚠️. Nothing is ❌. The largest gap is that no real incident has ever been rendered, because none exists.

**Follow-up actions:**
1. Record a real incident (or persist the real `tenant_admin_bootstrap_failed` one) with `node scripts/create-incident.js`, commit it, and look at the product page on staging or production. That upgrades AC1, AC2 and AC4 to real-world checks. Owner: operator.
2. Measure the real fetch latency of `workspace/incidents.json` against a connected product, replace `[UNKNOWN BASELINE]` in `nfr-profile.md`, and decide whether the 3-second bound is right. Owner: operator.
3. Decide whether zero incidents should show explicit empty-state text. Today it renders nothing, which keeps existing output unchanged and matches AC3's wording. Owner: operator.

---

## DoD Observations

1. **Incidents are sorted newest first by `createdAt`, which the story does not specify.** A reasonable default, recorded so it is not mistaken for a requirement.
2. **Two parallel builds changed the same call in `products.js` and the same test regex**, which produced a merge conflict that took a separate fix round. Stories that extend the same function should be sequenced, not parallelised.
3. **Not verified here:** no browser, staging or production behaviour, no real latency, and per-check CI results for the merged PR.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Render incident records and their triage summaries on the product page".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
