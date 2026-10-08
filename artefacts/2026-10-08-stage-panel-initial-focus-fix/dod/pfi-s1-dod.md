# Definition of Done: Fix stage side panel's initial focus target and correct the E2E spec's wrap-test labels

**PR:** [#961](https://github.com/heymishy/skills-repo/pull/961) | **Merged:** 2026-10-08
**Story:** artefacts/2026-10-08-stage-panel-initial-focus-fix/stories/pfi-s1-fix-stage-panel-initial-focus-and-e2e-labels.md
**Test plan:** artefacts/2026-10-08-stage-panel-initial-focus-fix/test-plans/pfi-s1-test-plan.md
**DoR artefact:** artefacts/2026-10-08-stage-panel-initial-focus-fix/dor/pfi-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-pfi-s1-panel-focus-fix.js` "AC1: openPanel() explicitly focuses the description field, not the DOM-order-first element" (source-text assertion) **and** live Chrome re-verification against real staging data post-deploy (2026-10-09): `document.querySelector('.sw-stage-edit').click(); ...; document.activeElement.id` returned `"sw-stage-field-description"` — the exact value that was `"sw-stage-panel-close"` before this fix | `unit` + `live` (strongest evidence class — the original bug was itself found this way) | None |
| AC2 | ✅ | Unchanged trap logic (`getFocusable()`) — live-verified pre-merge in both directions against real staging data (Shift+Tab from close wraps to `moment_of_truth`; Tab from there wraps back to close); not re-exercised post-deploy since the fix did not touch this code path | `live` (pre-merge), unit coverage via `check-ep1-s3-stage-panel.js` (9/9, unmodified, still passing) | None |
| AC3 | ✅ | `check-pfi-s1-panel-focus-fix.js` "AC3: E2E spec's first/last-focusable locators match the true DOM order" — asserts `tests/e2e/ep1-s3-stage-panel-focus-management.spec.js` references both `#sw-stage-panel-close` and `#sw-stage-field-moment_of_truth` as `domFirst`/`domLast`, and that the old reversed labeling is absent | `unit` (source-text assertion) | None |

**Live verification beyond the test plan (Chrome, 2026-10-09, post-merge and post-deploy):** Re-navigated to the real journey canvas (`wuce-staging.fly.dev/journeys/862d52d7-ff98-4176-bd9f-81f0f417f8df`), clicked the real "Edit stage" link via `document.querySelector('.sw-stage-edit').click()`, and read `document.activeElement.id` directly — `"sw-stage-field-description"`, confirming the fix is live and behaving correctly against production-shaped staging data, not just passing in a mocked unit test. This closes the loop on the bug that this story's own grounding work found the same way.

**Deploy-timing note (logged as an Observation below, not a deviation):** the first live re-check attempted immediately after merge showed stale pre-fix behaviour (`"sw-stage-panel-close"`) and then a logged-out landing page — both traced to the "Staging Deploy" GitHub Actions workflow still being in progress and the app's process restart clearing the in-memory authenticated session, not to the fix being wrong. Confirmed correct once the deploy completed and the operator re-authenticated.

---

## Scope Deviations

None. Implementation matches the DoR contract exactly: `openPanel()`'s initial-focus call changed to target `#sw-stage-field-description` explicitly; the E2E spec's `domFirst`/`domLast` locators corrected to match true DOM order; no changes to `server.js`, the `PATCH` handler, or any other file.

---

## Test Plan Coverage

**Tests from plan implemented:** 3 / 3 (AC1, AC2, AC3).
**Tests passing in CI:** All pass; confirmed in PR #961's CI and independently re-run against master post-merge (`npm test`: 724 files, 0 failed).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (initial focus targets description field) | ✅ | ✅ | Source-text unit assertion + live Chrome re-verification |
| AC2 (trap wrap behaviour unchanged) | ✅ | ✅ | Covered by unmodified `check-ep1-s3-stage-panel.js` (9/9) + prior live verification |
| AC3 (E2E spec locators corrected) | ✅ | ✅ | Source-text unit assertion against the spec file |

**Gaps:** None. The E2E spec itself (`ep1-s3-stage-panel-focus-management.spec.js`) remains unexecuted in the standard harness (pre-existing `fake-test-db.js` gap for `customer_journeys`/`customer_journey_stages`, logged in `ep1-s3`'s own `decisions.md` D5) — this story only corrected its locators via a source-text assertion, matching `ep1-s3`'s own already-accepted verification strategy for that file. Not a new gap introduced by this story.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Accessibility (this story's whole purpose) | ✅ | Live-confirmed on real staging data, both before (bug present) and after (bug fixed) the change |
| Reliability | ✅ | The E2E spec's wrap assertions now actually exercise the wrap condition instead of coincidentally passing on adjacent-element tabbing |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| N/A | N/A | N/A | Short-track correctness/accessibility fix, no metric tracked — matches `jcg-s1`/`csb-s1`'s own precedent |

---

## Outcome

**COMPLETE**

All three ACs satisfied with passing unit-test evidence, and — unusually for a short-track fix — directly confirmed against real, live staging data both before and after the fix (the same verification method that found the bug in the first place). No scope deviations. CI fully green. `npm test` on master: 724 files, 0 failed.

**Follow-up actions:** None blocking. The `fake-test-db.js` gap for `customer_journeys`/`customer_journey_stages` (preventing `ep1-s3-stage-panel-focus-management.spec.js` from running in the standard harness) remains an open, separately-logged follow-up — not introduced or worsened by this story.

---

## DoD Observations

1. **Deploy-timing + session-loss gotcha, newly discovered this session:** merging to `master` triggers a real "Staging Deploy" GitHub Actions workflow (`Deploy to wuce-staging` → smoke test → post-deploy E2E confirmation → manual production promotion) that takes real time to complete — a live Chrome check performed before it finishes will show stale (pre-merge) behaviour, which could be misread as the fix being wrong rather than a timing issue. Additionally, the staging app's process restart during deploy appears to clear in-memory session state, logging out any previously-authenticated browser session. Recommendation for `/improve`: document this explicitly as a required wait-for-deploy-completion step in any skill or instruction that calls for live Chrome post-merge verification, so a future session does not misdiagnose a stale read as a regression.
2. **Live-Chrome-first bug discovery is now a proven pattern, not a one-off:** this is the second story this session found entirely through operator-directed live AC verification against real staging data rather than through code review or automated testing (the first being `csb-s1`'s boot-wiring gap, found via Fly logs). Combined with `csb-s1`'s own DoD Observation 1 (proposing a boot-wiring governance test) and `jcg-s1`'s own DoD Observation 1 (proposing a CSRF-guard governance test), there is a recurring theme: static/code-level governance checks are catching a narrower class of defect than live behavioural verification is. Worth scoping as a dedicated `/improve` candidate — e.g. a lightweight post-merge live-smoke-check step added to the standard pipeline for any story touching interactive focus/keyboard-trap UI, not just relying on it being requested ad hoc.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Fix stage side panel's initial
focus target and correct the E2E spec's wrap-test labels" (pfi-s1). Check:
1. Does every AC row have a concrete evidence reference (test name,
   observable behaviour, or live Chrome confirmation)?
2. Is the post-deploy live re-verification convincing as direct evidence
   that the fix works against real staging data, not just a passing
   source-text unit assertion?
3. Does DoD Observation 1 (deploy-timing + session-loss gotcha) belong in
   a shared skill instruction so a future session doesn't misdiagnose a
   stale live-check as a regression?
4. Is the outcome verdict (COMPLETE) consistent with the AC and
   deviation rows, given this was a narrowly-scoped, fully-verified fix?
```
