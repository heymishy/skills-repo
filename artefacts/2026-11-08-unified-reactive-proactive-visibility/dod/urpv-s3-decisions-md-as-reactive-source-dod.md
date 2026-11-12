# Definition of Done: Surface decisions.md RISK-ACCEPT/SCOPE entries as a second reactive-work source

**PR:** https://github.com/heymishy/skills-repo/pull/1081 | **Merged:** 2026-11-12 (merge commit ab308f579)
**Story:** artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s3-decisions-md-as-reactive-source.md
**Test plan:** artefacts/2026-11-08-unified-reactive-proactive-visibility/test-plans/urpv-s3-decisions-md-as-reactive-source-test-plan.md
**DoR artefact:** artefacts/2026-11-08-unified-reactive-proactive-visibility/dor/urpv-s3-decisions-md-as-reactive-source-dor.md
**Assessed by:** Claude (against merged code on master at ab308f579)
**Date:** 2026-11-12

---

## AC Coverage

Verification-strength tags: `unit` = parser against fixtures; `integration-real-code` = the real route handler `handleGetProductView` and the real renderer, with the GitHub fetch adapter replaced by a mock that follows the adapter's contract; `live-verified` = confirmed against a real running instance; `production-observed` = observed in production. No browser or deployed-instance check was made for this story.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ⚠️ | AC1 (Acceptance Criterion 1: each `RISK-ACCEPT` or `SCOPE` entry in a feature's `decisions.md` is surfaced as a reactive-work item with date, code and title). Parser tests pass for a well-formed RISK-ACCEPT, a SCOPE entry whose Decision follows Rationale, and this feature's own real `decisions.md`. The route test "AC1 (real route)" passes: the consolidated page shows the items with date, code and title, and ARCH is excluded. Strength: `unit` plus `integration-real-code`. | Automated test `tests/check-urpv-s3-decisions-md-as-reactive-source.js` (16 passed, 0 failed, re-run on merged master) | The rendered page is asserted as HTML through the real handler. It was not seen in a real browser and not checked on staging or production. The items render as a separate "Reactive decisions" section below the tabs, not inside the By Module or By Phase rows the contract named. |
| AC2 | ✅ | AC2 (Acceptance Criterion 2: entries with another code, such as `ARCH`, `ASSUMPTION` or `SLICE`, are not surfaced). The parser test "excludes ARCH / ASSUMPTION / SLICE entries" passes, and the route test confirms ARCH is absent from the page. Strength: `unit` plus `integration-real-code`. | Automated test | None. Code variants such as "RISK-ACCEPT (informational)" and "SCOPE + DESIGN" count by their leading code token; that matches how real files are written. |
| AC3 | ✅ | AC3 (Acceptance Criterion 3: a malformed entry among well-formed ones is skipped silently, logged server-side, and never blocks the rest). Parser test "skips the malformed entry, keeps the rest, logs server-side once, never throws" passes, and route test "AC3 (real route)" shows two well-formed entries rendered with no error text. Strength: `unit` plus `integration-real-code`. | Automated test | None. Legacy-format headers such as `### RISK-ACCEPT-001 —` are not recognised and are logged as malformed if they carry a Decision field. |
| AC4 | ⚠️ | AC4 (Acceptance Criterion 4: a missing `decisions.md`, or a failed fetch, renders the page normally with zero items). Parser tests cover a 404 and any other failure including an unwired adapter. Route tests "AC4 (real route)" show the page returns 200 with zero items and no error banner for a 404 on every feature and for a non-404 failure. Strength: `unit` plus `integration-real-code`. | Automated test | Not seen in a real browser or on a deployed instance. |

**Verification strength summary:** AC2 and AC3 `unit` plus `integration-real-code`; AC1 and AC4 `integration-real-code` but marked ⚠️ because the rendered page was not observed in a browser; 0 `live-verified`; 0 `production-observed`. UI-evidence gate: this story renders browser-visible content and no browser observation was made, which is why AC1 and AC4 carry a deviation.

---

## Scope Deviations

None against the story's Out of Scope list (no other entry types parsed, no caching in `product_rollups`, no writes to `decisions.md`). The PR changed five files: `src/web-ui/modules/decisions-reactive-source.js` (new), `src/web-ui/routes/products.js`, `tests/check-urpv-s3-decisions-md-as-reactive-source.js` (new), the implementation plan, and one regex in `tests/check-ep4-s2-nav-and-product-link.js` (another story's test, loosened so the journey-id argument may be followed by the new trailing `decisionsReactiveItems` argument; it passes 6/6 on master).

Two structural differences from the DoR contract, not scope deviations: the async fetch lives in `handleGetProductView` and the items are passed down as a new trailing parameter, because `_renderConsolidatedFeaturesSection` is synchronous; and the plan's integration tests that call that function with a mocked fetch were implemented through `handleGetProductView` instead.

---

## Test Plan Coverage

**Tests from plan implemented:** the test plan registered 9 tests; the test file implements 16. I did not map the plan's 9 names one to one against the 16.
**Tests passing:** 16 / 16, re-run locally on merged master. Wiring checked by reading the code: `fetchReactiveDecisionsForFeatures` is called from `handleGetProductView`, which `server.js` registers (`setFetchRepoPath(realFetchRepoPath)` at `server.js:260` is the production adapter wiring). The build agent did not see the tests fail first (the implementation was written before running them). Final CI results for PR #1081 were not re-inspected; the operator merged it.

**Gaps (tests not implemented):** none identified apart from the browser check above.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: the live `decisions.md` fetch per feature adds latency per page load | ⚠️ | **Not measured, and the DoR had made the measurement merge-blocking.** The DoR's Coding Agent Instructions require measuring the real fetch latency against a connected product and recording it in `nfr-profile.md` before the PR. The build agent could not (it needs a live token and a connected product) and did not invent a number; the PR was merged without it. `nfr-profile.md` still reads `[UNKNOWN BASELINE]`. |
| Security: output escaped, never raw HTML | ✅ | Route test "NFR security (real route)": a script tag in a `decisions.md` title is rendered escaped. |
| Authorisation: per-tenant fetch (ADR-025) | ✅ | Route test "NFR authorisation (real route)": the handler fetches with the product's own owner and repo and the session `accessToken`, once per feature. A path-safety test shows a slug with traversal characters is never fetched. |
| Accessibility: text labels and contrast as urpv-s2's tag | ✅ | New markup uses the design tokens `--warn`, `--muted` and `--line` only. Not checked in a browser. |
| Audit: parse failures logged server-side | ✅ | Parser test AC3 asserts one server-side log and no thrown error. |

---

## Metric Signal

The story names the metric "Reactive-work coverage on the surface".

**Reactive-work coverage on the surface**
Signal: not-yet-measured
Evidence note: decisions.md-sourced reactive items now render on the consolidated view, but no real connected product's page has been looked at since the merge, and urpv-s4 (which counts them in the rollup) is not built.
Date measured: null

---

## Outcome

**COMPLETE WITH DEVIATIONS**

ACs satisfied: 4/4 in substance. AC2 and AC3 are ✅; AC1 and AC4 are ⚠️ because the rendered page was never observed in a browser. Nothing is ❌. The most important recorded gap is the unmeasured fetch latency that the DoR had made merge-blocking.

**Follow-up actions:**
1. **Measure the real `decisions.md` fetch latency** against a connected product with a real token, and replace `[UNKNOWN BASELINE]` in `nfr-profile.md`. This was the DoR's merge-blocking item and is still owed. Owner: operator.
2. **Look at the consolidated features page for a real connected product** (staging or production) and confirm the "Reactive decisions" section shows real entries, which upgrades AC1 and AC4 to a real-world check. Owner: operator.
3. Decide whether the "Reactive decisions" section should sit inside the By Module and By Phase rows as the contract described, or stay as a separate section. Owner: operator.

---

## DoD Observations

1. **A merge-blocking DoR action item was bypassed without a recorded decision.** The latency measurement was marked as blocking merge and the PR merged without it. Either it should not have been marked blocking, or merging should have waited. A RISK-ACCEPT in `decisions.md` would have made the choice visible; none exists for this.
2. **Another story's test was edited.** The `check-ep4-s2` regex change is small and sound, but the same line was changed by a parallel itar-s3 build, which produced a merge conflict.
3. **Not verified here:** no browser, staging or production behaviour, no real latency, and CI results per check for the merged PR.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Surface decisions.md RISK-ACCEPT/SCOPE entries as a second reactive-work source".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
