# Definition of Done: The journey-gate "Continue to next stage" control is not sticky when it appears via a live turn completion

**PR:** [#858](https://github.com/heymishy/skills-repo/pull/858) | **Merged:** 2026-09-10 (merge commit `237a0f7a`)
**Story:** artefacts/2026-09-11-journey-gate-live-completion-sticky-gap/stories/jgls-s1-fix-live-completion-gate-not-sticky.md
**Test plan:** artefacts/2026-09-11-journey-gate-live-completion-sticky-gap/test-plans/jgls-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-11-journey-gate-live-completion-sticky-gap/dor/jgls-s1-dor.md
**Assessed by:** Copilot (Claude Sonnet 5)
**Date:** 2026-09-11

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Sticky positioning added to `showCommitLink()`'s `wrap.style.cssText`, confirmed via unit test (5 property assertions) and a live post-deploy Chrome smoke check on staging (`getComputedStyle` returned `position: sticky; bottom: 0px` on the actual live-completion gate, reproduced via `/journey/:slug/resume`) | `tests/check-jgls-s1-live-gate-sticky.js` (5/5) + manual live smoke check (RISK-ACCEPT, `decisions.md`) | None |
| AC2 | ✅ | Pre-existing layout properties (`padding`, `display`, `align-items`, `gap`, `flex-wrap`) confirmed unchanged | `tests/check-jgls-s1-live-gate-sticky.js` (5/5) | None |
| AC3 | ✅ | Canonical sticky-positioning substring confirmed present in both `journeyPanel`'s style string and `showCommitLink()`'s `wrap.style.cssText` (2 occurrences found) | `tests/check-jgls-s1-live-gate-sticky.js` (1/1) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. The merged diff is a single-line change to `showCommitLink()`'s `wrap.style.cssText` (`src/web-ui/routes/skills.js` ~line 3845), plus the new consistency-guard unit test. Confirmed out of scope and absent from the merged diff: no refactor unifying the two gate-rendering code paths, no change to `journeyPanel`'s own already-correct construction, no change to `showCommitLink()`'s trigger conditions or form content.

---

## Test Plan Coverage

**Tests from plan implemented:** 3 / 3 (declared in test-plan.md as 3 named test groups)
**Tests passing in CI:** 11 / 11 (unit-level assertion count across the 3 named groups)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| showCommitLink-wrap-gets-sticky-positioning (AC1) | ✅ | ✅ | 5 property assertions, all passing |
| showCommitLink-wrap-existing-properties-unchanged (AC2) | ✅ | ✅ | 5 property assertions, all passing |
| journey-gate-style-strings-agree-on-positioning (AC3) | ✅ | ✅ | Consistency guard, passing |

**Gaps (tests not implemented):** None.

**Post-deploy manual smoke check (per RISK-ACCEPT, `decisions.md`):** Performed on `wuce-staging.fly.dev` after the fix deployed (`237a0f7`, deployed 2026-09-10T19:28:07Z). Navigated `/journey/2026-08-31-web-ui-navigation-legibility/resume` (creates a fresh session, fires the stage turn live — the exact scenario that originally surfaced this bug). Confirmed via `getComputedStyle` on the resulting gate control: `position: sticky`, `bottom: 0px` — genuinely applied by the browser, matching the mechanism already proven correct by `wnl-s2`'s own E2E suite for the sibling code path.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No new-request overhead (Performance) | ✅ | String-literal addition only, no new requests or computation |
| Security | ✅ Not applicable | No new input surface |
| Accessibility (existing form/button markup unaffected) | ✅ | AC2 confirms no non-positioning properties changed |
| Data residency / Availability / Compliance | ✅ Not applicable | Client-side rendering fix only |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M2 — Next-stage-action findability (`2026-08-31-web-ui-navigation-legibility`) | ✅ (target: 0 "couldn't find next stage" incidents across 4 weeks post-ship; baseline: 1 confirmed incident 2026-08-31) | Not yet — this story closes the last gap in `wnl-s2`'s own contribution to M2; the same 4-week no-incident observation window applies, now correctly starting from this fix's deploy rather than `wnl-s2`'s incomplete one | Signal: `not-yet-measured`. Evidence note: `jgls-s1` shipped 2026-09-10, closing the gap that would have left the majority of real usage (the live-completion path) still exposed to the original M2 baseline incident. |

**Recorded in pipeline-state.json:** feature-level metric `m2` (owned by `2026-08-31-web-ui-navigation-legibility`) already lists `wnl-s2` in `contributingStories` — this story is a direct correction to that same contribution, not a new metric owner. No separate metric entry created for `jgls-s1`.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required to close this story. Two related, explicitly out-of-scope items remain logged for future consideration (not blocking this story's completion):
1. Unifying the two gate-rendering code paths (`journeyPanel` and `showCommitLink()`) into one shared function, to prevent this exact class of bug (one path fixed, the other silently left behind) from recurring for future changes to this control. Logged as an `/improve` candidate.
2. The sidebar's own `noProductJourneyCount` undercounting issue (`wnl-s3`'s own DoD follow-up) — unrelated to this story, already tracked separately.

---

## DoD Observations

1. This bug is a direct illustration of why live Chrome verification after merge (not just CI passing) caught something CI structurally could not: both the unit tests and the E2E suite for `wnl-s2` exercised only the server-rendered path (via a seed endpoint that creates an already-done session directly), never the live-completion path that `/journey/:slug/resume` actually exercises in real usage. The consistency-guard test added by this story (AC3) is a direct, permanent mitigation — it would have caught `wnl-s2`'s own gap at CI time if it had existed then.
2. No NFR gaps or guardrail entries were absent at delivery time.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "The journey-gate Continue to next stage control is not sticky when it appears via a live turn completion" (jgls-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
