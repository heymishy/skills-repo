# Definition of Done: Reactive-vs-planned load rollup by pod

**PR:** https://github.com/heymishy/skills-repo/pull/1084 | **Merged:** 2026-11-12 (merge commit 149c88d52)
**Story:** artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s4-reactive-planned-rollup-by-pod.md
**Test plan:** artefacts/2026-11-08-unified-reactive-proactive-visibility/test-plans/urpv-s4-reactive-planned-rollup-by-pod-test-plan.md
**DoR artefact:** artefacts/2026-11-08-unified-reactive-proactive-visibility/dor/urpv-s4-reactive-planned-rollup-by-pod-dor.md
**Assessed by:** Claude (against merged code on master at 88457a760, which contains 149c88d52)
**Date:** 2026-11-12

---

## AC Coverage

Verification-strength tags: `unit` = pure rollup functions against fixtures; `integration-real-code` = the real route handler `handleGetProductView` with the real pod SQL helpers (`getFeaturePodAssignments`, `getProductDefaultPod`) run against a test database stand-in; `live-verified` = confirmed against a real running instance; `production-observed` = observed in production. No browser or deployed-instance check was made for this story.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ⚠️ | AC1 (Acceptance Criterion 1: items tagged `track: "short"` and items from `decisions.md` RISK-ACCEPT/SCOPE entries count as reactive, every other item as planned, with pod attribution via `getFeaturePodAssignments`, then the product default pod, then "Unassigned"). Tests "AC1: track:short and decisions.md items count as reactive, everything else planned", "AC1: pod resolves explicit assignment, then product default pod, then Unassigned", "AC1: a decisions.md item takes the pod of its feature" and the route test "AC1/AC2 (real route)" pass. Strength: `unit` plus `integration-real-code`. | Automated test `tests/check-urpv-s4-reactive-planned-rollup-by-pod.js` (17 passed, 0 failed, re-run on merged master) | Three readings the story does not specify, all in the build agent's hands: completed (`definition-of-done`) items are excluded as not active; a feature in several pods is counted once under each pod, with the Total line counting it once; taxonomy-only items have no journey so they can only fall to the default pod or Unassigned. The pod query count is the NFR deviation below. |
| AC2 | ⚠️ | AC2 (Acceptance Criterion 2: a pod with both kinds shows both counts distinctly, for example "3 reactive / 12 planned"). Test "AC2: pod row has separate reactiveCount and plannedCount fields (3 / 12), not a blended 15" and the route test pass; the rendered cell reads `N reactive / M planned`. Strength: `unit` plus `integration-real-code`. | Automated test | The page was asserted as HTML through the real handler. It was not seen in a real browser and not checked on staging or production. |
| AC3 | ✅ | AC3 (Acceptance Criterion 3: no pods configured gives one "Unassigned" row carrying the whole split). Tests "AC3: zero pods configured -> exactly one Unassigned row carrying the full split", the empty-items edge case (a real 0 / 0 row) and "AC3 (real route)" pass. Strength: `unit` plus `integration-real-code`. | Automated test | None |
| AC4 | ⚠️ | AC4 (Acceptance Criterion 4: the rollup is reachable from the consolidated features view without navigating away, using the existing tab pattern). Test "AC4 (real route): the rollup is an additional tab in the same response -- no separate route or page" passes: a "By Pod" tab button and panel are in the same response and switch through the page's own `pvcShowTab`. Strength: `integration-real-code`. | Automated test | The tab switching is JavaScript in the browser. It was asserted from the HTML only, never clicked in a browser. |

**Verification strength summary:** AC3 `unit` plus `integration-real-code`; AC1, AC2 and AC4 the same strength but marked ⚠️; 0 `live-verified`; 0 `production-observed`. UI-evidence gate: this story renders browser-visible content and no browser observation was made, which is why AC2 and AC4 carry a deviation, and AC1 carries one for the unspecified readings.

---

## Scope Deviations

None against the story's Out of Scope list. The PR changed `src/web-ui/modules/reactive-pod-rollup.js` (new), `src/web-ui/routes/products.js` (a new trailing `podContext` parameter and three small insertion points), the new test file, the plan, and one regex in `tests/check-ep4-s2-nav-and-product-link.js` (another story's test; the allowed number of trailing arguments went from `{0,2}` to `{0,3}`; it passes 6/6 on master). `server.js` is unchanged and no new route or table was added; pod data is read through the existing `pod-assignment-store.js`.

---

## Test Plan Coverage

**Tests from plan implemented:** the test plan registered 7 tests; the test file implements 17 (unit, route and NFR cases). I did not map the plan's 7 names one to one against the 17.
**Tests passing:** 17 / 17, re-run locally on merged master, along with ep4-s2 (6/6), urpv-s3 (16/16), itar-s3 (14/14) and iwf-s1 (11/11). Wiring checked: `resolvePodContext` is called from `handleGetProductView`, which `server.js` registers. Final CI results for PR #1084 were not re-inspected; the operator merged it.

**Gaps (tests not implemented):** none identified apart from the browser check above.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: no new per-item query | ⚠️ | **Not met as written.** `resolvePodContext` calls `getFeaturePodAssignments` once per distinct journey, in sequence, so a product with N features makes N extra pod queries on every page load. The build agent raised this in the PR, and the operator merged without a recorded decision, so this is accepted by merge only; no RISK-ACCEPT exists in `decisions.md`. Pod latency was not measured. |
| Accessibility: counts as text, not colour only | ✅ | Route test "NFR accessibility" asserts both counts are visible text, including a real "0", on every row. Not checked in a browser. |
| Security: pod names escaped | ✅ | Route test "NFR security": markup in a pod name is escaped. |
| Design tokens only | ✅ | Test "NFR design tokens" asserts no hardcoded hex colour in the module. |
| Resilience: pod lookup failure | ✅ | A failed lookup is logged server-side and the tab shows a note that counts use the default pod or Unassigned; the page still renders. |

---

## Metric Signal

The story serves the feature's reactive-versus-planned visibility metric. No metric in the feature's `metrics[]` lists urpv-s4 as a contributor.

**Reactive-versus-planned load visible by pod**
Signal: not-yet-measured
Evidence note: the rollup is merged and tested against fixtures, but no real connected product's By Pod tab has been looked at, and `track: "short"` plus real `decisions.md` items have not been seen counted on a live page.
Date measured: null

---

## Outcome

**COMPLETE WITH DEVIATIONS**

ACs satisfied: 4/4 in substance. AC3 is ✅; AC1, AC2 and AC4 are ⚠️. Nothing is ❌. The largest gaps are that the By Pod tab was never seen in a browser, and that the pod lookup is one query per feature where the story said no new per-item query.

**Follow-up actions:**
1. Look at the By Pod tab for a real connected product on staging or production and confirm the counts match what you expect. That upgrades AC2 and AC4 to real-world checks. Owner: operator.
2. Decide whether the per-feature pod query is acceptable, or ask for one batched query (all journeys' assignments in a single SQL call) as a small follow-up story. If accepted, log it as a RISK-ACCEPT in the feature's `decisions.md`. Owner: operator.
3. Confirm the three readings in AC1 (completed items excluded, multi-pod features counted under each pod, taxonomy-only items fall to the default pod or Unassigned). Owner: operator.

---

## DoD Observations

1. **The per-item query note in the story's NFR is contradicted by the shipped design.** It was visible in the PR description before merge; the merge is the only record of acceptance.
2. **Four stories have now changed the same render call in `products.js`** (urpv-s3, itar-s3, urpv-s4 and next ddft-s5), each adding a trailing parameter and loosening the same regex in another story's test. The parameter list is growing and is brittle; a later cleanup story could pass one options object.
3. **Not verified here:** no browser, staging or production behaviour, no pod-query latency, and per-check CI results for the merged PR.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Reactive-vs-planned load rollup by pod".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
