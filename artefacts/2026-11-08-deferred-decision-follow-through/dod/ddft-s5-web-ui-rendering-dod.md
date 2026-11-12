# Definition of Done: Render deferred-item records on the product page

**PR:** https://github.com/heymishy/skills-repo/pull/1086 | **Merged:** 2026-11-12 (merge commit 66be47377)
**Story:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s5-web-ui-rendering.md
**Test plan:** artefacts/2026-11-08-deferred-decision-follow-through/test-plans/ddft-s5-web-ui-rendering-test-plan.md
**DoR artefact:** artefacts/2026-11-08-deferred-decision-follow-through/dor/ddft-s5-web-ui-rendering-dor.md
**Assessed by:** Claude (against merged code on master at 66be47377)
**Date:** 2026-11-12

---

## AC Coverage

Verification-strength tags: `unit` = render and parse functions against fixtures; `integration-real-code` = the real route handler `handleGetProductView`, with the real GitHub fetch adapter `realFetchRepoPath` run against a stubbed `fetch` that returns the real GitHub Contents payload shape, and the real committed `workspace/incidents.json`; `live-verified` = confirmed against a real running instance; `production-observed` = observed in production. No browser or deployed-instance check was made for this story.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ⚠️ | AC1 (Acceptance Criterion 1: deferred-item records render alongside incident records, distinguished by a text label such as "Deferred" versus "Incident", not colour alone). Tests recordTypeLabel_returnsDistinctLiteralText, typeLabelNeverReliesOnColourAlone and mixedRecordList_rendersBothTypesLabelled_andSectionsIgnoreEachOthersRecords pass. Strength: `unit` plus `integration-real-code`. | Automated test `tests/check-ddft-s5-web-ui-rendering.js` (16 passed, 0 failed, re-run on merged master) | Two parts of the AC are only partly met. First, deferred items render in their own "Deferred items (n)" section after the Incidents section, not in one shared list; the agent chose this because itar-s3's section had to keep ignoring deferred-items. Second, incident items carry no "Incident" text label; only the section heading tells them apart. Deferred items carry a literal "Deferred" label. |
| AC2 | ⚠️ | AC2 (Acceptance Criterion 2: a populated `revisitCondition` is visible inline with no click-through). rendersRevisitConditionInlineNotBehindClickThrough passes: the text sits under a "Revisit when" label in the item. Strength: `unit` plus `integration-real-code`. | Automated test | HTML asserted through the real handler; not seen in a real browser. |
| AC3 | ⚠️ | AC3 (Acceptance Criterion 3: ddft-s1's two seeded real records, `tfhc-s1` and the C1-versus-Option-C one, render without error). bothRealSeededRecordsRenderWithoutError (AC3, real committed file) passes: the real committed file is fed through the real handler and both records render. realIncidentsJson_unchangedByTests confirms the file was not modified, and I confirmed its hash is the same on master as before the PR. Strength: `integration-real-code`. | Automated test | This is the story's "at least one seeded real record" proof, met against the real committed data, but only as HTML from the handler. It was not seen on a real page on staging or production. |
| AC4 | ✅ | AC4 (Acceptance Criterion 4: a file with no deferred-item records renders only the incidents, with no error or empty-state regression). Tests incidentOnlyRenderingUnchangedWhenZeroDeferredItems, zeroDeferredItems_incidentOnlyFile_rendersNormally and degradesSilently_whenFileMissingEmptyInvalidOrThrowing pass; itar-s3's own 14 tests still pass unchanged apart from the edit noted below. Strength: `integration-real-code`. | Automated test | None |

**Verification strength summary:** AC4 `integration-real-code`; AC1, AC2 and AC3 `unit` plus `integration-real-code` but marked ⚠️; 0 `live-verified`; 0 `production-observed`. UI-evidence gate: this story renders browser-visible content and no browser observation was made, which is why AC2 and AC3 carry a deviation.

---

## Scope Deviations

None against the story's Out of Scope list. The PR changed five files: `src/web-ui/routes/products.js` (a new section, a shared single fetch of `incidents.json`, and a new trailing `deferredItems` parameter), the new test file, the plan, and two other stories' tests. In `tests/check-ep4-s2-nav-and-product-link.js` the regex allows one more trailing argument (`{0,4}`). In `tests/check-itar-s3-web-ui-rendering.js` two assertions that "tfhc-s1 appears nowhere on the page" were changed, because that text now legitimately appears in the deferred section. One was narrowed to the incidents section. The other became `no "tfhc-s1" OR no data-incident-item`, and with the real file there are no incident items, so that branch is always true: that assertion now checks less than before.

The agent inlined the rule that an untyped record counts as an incident instead of importing `withDefaultType`, because the Dockerfile copies only `src/` into the image. A test forbids `scripts/` requires in `products.js`, and I confirmed there are none.

`server.js` is unchanged; the story extends `GET /products/:id` through the existing handler and the existing `setFetchRepoPath(realFetchRepoPath)` wiring.

---

## Test Plan Coverage

**Tests from plan implemented:** the test file implements 16 tests. I did not map the test plan's registered names one to one against the 16.
**Tests passing:** 16 / 16, re-run locally on merged master, along with itar-s3 (14), ep4-s2 (6), urpv-s3 (16) and urpv-s4 (17). The build agent reported RED first (11 of 16 failing before the implementation). The first CI run of PR #1086 failed on `tests/check-cat-s1-core-trace-builder.js`, a timing test (a 50 ms directory-walk assertion) that passes 26/26 alone and that ddft-s5 does not touch; the failed job was re-run and the operator then merged. I did not re-inspect the re-run's per-check results.

**Gaps (tests not implemented):** the contrast NFR test in the plan (axe-core) was replaced by a check for no hex or rgb colours in the new markup; `scripts/check-design-tokens.js` was not run.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security: record text escaped | ✅ | NFR revisitConditionTextIsEscapedOnRender passes. |
| Accessibility: text labels, not colour alone | ✅ | typeLabelNeverReliesOnColourAlone passes. Not checked in a browser. |
| Accessibility: colour contrast | ⚠️ | No axe-core run; only the no-literal-colour check (NFR deferredItemUsesOnlyDesignTokens) exists. |
| Performance: bounded fetch, no extra request | ✅ | One shared request for `incidents.json` (asserted: exactly 1) with the 3-second bound; a hanging fetch renders in under 6 seconds. Real latency was never measured, as for itar-s3. |
| Authorisation: per-tenant fetch | ✅ | Reuses itar-s3's fetch, scoped to the product's own repo with the session token. |

---

## Metric Signal

The story's metric needs at least one seeded real record rendered.

**Deferred-item visibility (records visible on the product page)**
Signal: not-yet-measured
Evidence note: the two seeded real records render without error through the real handler against the real committed file, which is the metric's stated target, but nothing has been looked at on a deployed page, so the measurement is not yet taken.
Date measured: null

---

## Outcome

**COMPLETE WITH DEVIATIONS**

ACs satisfied: 4/4 in substance. AC4 is ✅; AC1, AC2 and AC3 are ⚠️. Nothing is ❌. The deviations are the sibling section instead of one list, the missing "Incident" label, and that nothing was seen in a browser.

**Follow-up actions:**
1. Look at the product page for a real connected product on staging or production after the next promotion, and confirm the Incidents and Deferred items sections read well together. Owner: operator.
2. Decide whether incidents and deferred items should share one list with "Incident" and "Deferred" labels as the story says, or stay as two sections. Owner: operator.
3. Restore the strength of the weakened itar-s3 assertion, for example by asserting with a fixture that has both an incident and a deferred item. Owner: operator or a small follow-up.

---

## DoD Observations

1. **A sibling section was a sensible reading of a conflict between instructions**, not a defect, but it moves AC1 from the text to the agent's interpretation. Recorded so it is not mistaken for the original design.
2. **Four stories have now added a trailing parameter to the same render call in `products.js`** (urpv-s3, itar-s3, urpv-s4, ddft-s5; the regex in ep4-s2 was loosened each time). Replacing the positional list with one options object would end this.
3. **Nothing yet surfaces deferred items anywhere a person looks routinely**, apart from this page and the manual scan (ddft-s2). The "periodic" gap recorded in ddft-s2's DoD is unchanged.
4. **Not verified here:** no browser, staging or production behaviour, no latency, and the re-run's per-check CI results.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Render deferred-item records on the product page".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
