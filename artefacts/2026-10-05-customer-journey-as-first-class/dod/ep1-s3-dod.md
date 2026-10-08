# Definition of Done: Stage side panel: edit all optional attributes

**PR:** [#960](https://github.com/heymishy/skills-repo/pull/960) | **Merged:** 2026-10-08T08:35:34Z
**Story:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s3.md
**Test plan:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep1-s3-test-plan.md
**DoR artefact:** artefacts/2026-10-05-customer-journey-as-first-class/dor/ep1-s3-dor.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (markup) | ✅ | `check-ep1-s3-stage-panel.js` "AC1: panel markup contains all 8 editable fields with correct types/options" + live Chrome re-verification (2026-10-09): all 8 field ids (`description`, `customer_actions`, `touchpoints`, `channel`, `emotion`, `pain_points`, `opportunities`, `moment_of_truth`) confirmed present in the real rendered panel | `unit` + `live` | None |
| AC1 (interaction) | ✅ | Live Chrome (2026-10-09): clicking the real "Edit stage" link opens the panel and lands initial focus on `#sw-stage-field-description` (confirmed after the `pfi-s1` fix; see that story's own DoD for the original bug and fix) | `live` (was `written-but-unexecuted` E2E spec at merge time; now independently confirmed live) | Originally gap-logged as written-but-unexecuted at this story's own merge; closed by live verification rather than by running the E2E spec |
| AC2 | ✅ | `check-ep1-s3-stage-panel.js` (valid edit + 2 security tests) + live Chrome re-verification (2026-10-09): editing the description field and blurring it fired a real `PATCH /journeys/:id/stages/:stageId` request, confirmed via network inspection returning HTTP 200 | `unit` + `live` | None |
| AC3 | ✅ | `check-ep1-s3-stage-panel.js` (DB update + render tests) + live Chrome re-verification (2026-10-09): toggling the `moment_of_truth` checkbox fired a PATCH (200) and the stage card's `.sw-stage-moment-badge` ("Moment of truth") indicator was present | `unit` + `live` | None |
| AC4 | ✅ | Live Chrome re-verification (2026-10-09): with the triggering "Edit stage" link explicitly focused first (matching real user interaction), opening the panel then pressing Escape closed it (`sw-stage-panel--open` class removed) and returned focus to that exact link (`document.activeElement === editLink`) | `live` (was `written-but-unexecuted` E2E spec at merge time; now independently confirmed live) | Same as AC1 (interaction) above |
| AC5 | ✅ | Live Chrome verification performed during `pfi-s1`'s own investigation (2026-10-08): Tab from the true last element (`moment_of_truth`) wraps to the true first (close button); Shift+Tab from the true first wraps to the true last — confirmed in both directions against real staging data | `live` (was `written-but-unexecuted` E2E spec at merge time; now independently confirmed live) | Same as AC1 (interaction) above |
| (security) | ✅ | `check-ep1-s3-stage-panel.js` CSRF rejection, cross-tenant journey rejection, cross-journey stage rejection — all pass (3/3) | `unit` | None |

**Live verification beyond the test plan (Chrome, 2026-10-09, post-merge and post-deploy):** All five ACs re-verified directly against a real journey/stage on `wuce-staging.fly.dev`, closing the three ACs (AC1 interaction, AC4, AC5) that were logged at merge time as "written-but-unexecuted" (the Playwright spec existed but could not run without a real `DATABASE_URL`). One methodological note: an initial AC4 attempt using a synthetic `.click()` without first focusing the trigger element returned focus to `<body>` instead of the link — re-running with an explicit `.focus()` before the click (matching both a real user interaction and the E2E spec's own `editLink.focus()` → `editLink.press('Enter')` pattern) confirmed focus correctly returns to the trigger. This was a test-methodology artifact, not a product defect — logged here so a future live-verification pass doesn't misdiagnose the same thing as a regression.

---

## Scope Deviations

None. Implementation matches the DoR contract exactly: `handlePatchJourneyStage` (CSRF-guarded, field/enum allowlist-validated, journey+stage ownership checked), `handleGetJourneyCanvas` extended with the side panel markup and per-field autosave client script, fresh Tab-trap implementation (no existing precedent reused, per the test plan's own grounding note), E2E spec written per AC1/AC4/AC5's explicit NFR requirement (not RISK-ACCEPT, per `decisions.md` D5).

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9 unit tests (AC1 markup, AC2, AC2 security x2, AC3 x2, CSRF, cross-tenant, cross-journey-stage) + 1 E2E spec (AC1 interaction, AC4, AC5).
**Tests passing in CI:** All 9 unit tests pass; confirmed in PR #960's CI and independently re-run against master post-merge (`npm test`: 724 files, 0 failed, including the `pfi-s1` fix applied on top).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (markup, 8 fields) | ✅ | ✅ | Unit + live |
| AC2 (valid edit PATCHes scoped record) | ✅ | ✅ | Unit + live |
| AC2 (security: disallowed field) | ✅ | ✅ | Unit |
| AC2 (security: invalid enum) | ✅ | ✅ | Unit |
| AC3 (moment_of_truth DB update) | ✅ | ✅ | Unit + live |
| AC3 (render: moment-of-truth indicator) | ✅ | ✅ | Unit + live |
| CSRF rejection | ✅ | ✅ | Unit |
| Cross-tenant journey rejection | ✅ | ✅ | Unit |
| Cross-journey stage rejection | ✅ | ✅ | Unit |
| E2E: AC1 (interaction)/AC4/AC5 | ✅ | ✅ (live, not via the Playwright runner) | Spec itself remains unexecuted in the standard harness (see Gaps below); the behaviour it encodes was independently confirmed live |

**Gaps:** `tests/e2e/ep1-s3-stage-panel-focus-management.spec.js` itself has still never been run through `npx playwright test` — the `fake-test-db.js` gap for `customer_journeys`/`customer_journey_stages` (no `DATABASE_URL` available in any session so far) remains open, mirroring `bmau-s1`'s own already-logged follow-up. This is a test-infrastructure gap, not a behavioural gap: the ACs the spec encodes have now been independently confirmed live against real staging data, by both this story's own investigation and `pfi-s1`'s.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| WCAG 2.1 AA focus management | ✅ | AC1 (interaction)/AC4/AC5 all live-confirmed; initial-focus bug found and fixed by `pfi-s1` |
| Tenant scoping (ADR-025) | ✅ | Journey + stage ownership both checked (404) before any update; unit-tested |
| Autosave on blur | ✅ | Live-confirmed real PATCH fired on blur, no full-page reload |
| Design system component patterns | ✅ | Consulted per the test plan's own grounding note; no existing precedent matched, fresh focus-trap implementation built following the standard WCAG pattern |
| No new npm runtime dependencies | ✅ | `journeys.js` only requires existing in-repo modules |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M3 — Journey-level metric coverage | No (pre-feature) | Not yet — pain points/opportunities/emotion attributes can now be captured per stage, but attribution into health views ships in `ep3-s2` | Same pattern as `ep1-s1`/`ep1-s2`'s own DoDs — M3 becomes measurable once a health view consumes these fields |

---

## Outcome

**COMPLETE**

All five ACs satisfied, including the three (AC1 interaction, AC4, AC5) that were open "written-but-unexecuted" gaps at merge time — closed here by direct live verification against real staging data rather than by running the Playwright spec, which remains blocked on the pre-existing `fake-test-db.js` gap. No scope deviations. CI fully green. `npm test` on master: 724 files, 0 failed.

**Follow-up actions:**
1. Extend `fake-test-db.js` with `customer_journeys`/`customer_journey_stages` support so `ep1-s3-stage-panel-focus-management.spec.js` can run in the standard harness instead of relying on ad hoc live verification — mirrors `bmau-s1`'s own already-logged follow-up for `modulesAdapter`.
2. None blocking otherwise.

---

## DoD Observations

1. **This story's own merge-time gap (three ACs logged as written-but-unexecuted) is what directly led to finding `pfi-s1`.** The operator's own request to live-verify every AC of `ep1-s1`/`ep1-s2`/`ep1-s3` against real staging data — rather than accepting "written-but-unexecuted, unit tests pass" as sufficient at DoD time — surfaced a real initial-focus bug that no unit test or code review had caught, plus a labeling defect in the E2E spec itself that would have made its own wrap assertions pass for the wrong reason even if it had been run. This reinforces the pattern already logged in `csb-s1`'s and `jcg-s1`'s own DoD Observations: live behavioural verification is catching a class of defect that static/unit-level checks are not, and is now 3-for-3 this session.
2. **A synthetic `.click()` without first focusing the trigger element is not equivalent to a real user interaction for focus-return testing**, and produced a false-looking failure (focus landed on `<body>` instead of the trigger link) on the first live AC4 attempt in this DoD pass. Any future live-Chrome verification of focus-return/trigger-restore behaviour should explicitly `.focus()` the trigger element before clicking or activating it, matching both real browser behaviour and this story's own E2E spec's `editLink.focus()` → `editLink.press('Enter')` pattern — logged here so it isn't rediscovered the hard way again.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Stage side panel: edit all
optional attributes" (ep1-s3). Check:
1. Does every AC row have a concrete evidence reference (test name,
   observable behaviour, or live Chrome confirmation)?
2. Is closing AC1 (interaction)/AC4/AC5 via live verification — rather
   than by actually running the Playwright spec — an acceptable
   substitute, given the spec remains blocked on the pre-existing
   fake-test-db.js gap?
3. Does DoD Observation 1 (three ACs found to need fixing, via live
   verification, after they were marked done at merge) suggest live
   AC verification should become a standard DoD step for any story with
   written-but-unexecuted E2E coverage, rather than an operator-initiated
   ad hoc request?
4. Is the outcome verdict (COMPLETE) consistent with the AC and
   deviation rows, given every AC now has direct live evidence?
```
