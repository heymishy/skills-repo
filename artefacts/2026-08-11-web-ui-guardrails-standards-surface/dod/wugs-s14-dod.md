# Definition of Done: Add a fetch timeout to the shared GitHub Contents API adapter

**PR:** https://github.com/heymishy/skills-repo/pull/736 | **Merged:** 2026-08-13
**Merge commit:** 6951c06a
**Story:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s14-fetch-timeout.md
**Test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s14-fetch-timeout-test-plan.md
**DoR artefact:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/dor/wugs-s14-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `AC1: fetchGithubContentsResponse_requestHangs_abortsAndThrowsClearTimeoutError` asserts a hanging mock `fetch` (short `timeoutMs` override) throws an `ArtefactFetchError` whose message clearly states a timeout occurred, distinguishing `err.name === 'AbortError'` from a genuine network error inside the same `catch` block | automated test (`tests/check-wugs-s14-fetch-timeout.js`) | None |
| AC2 | ✅ | `AC2: fetchGithubContentsResponse_normalFastResponse_behaviourUnchanged` asserts an identical return value to pre-story behaviour; `timeoutMs` is a trailing optional parameter, so existing call sites (`export-data-source.js`, `routes/journey.js`) are unaffected | automated test | None |
| AC3 | ✅ | `AC3a: fetchGithubContentsResponse_normalResponse_timeoutTimerCleared` and `AC3b: fetchGithubContentsResponse_timeoutFires_noDoubleErrorOrLateResolution` together confirm `clearTimeout` fires via a `finally` block on both the success and timeout paths, with no second error or late resolution | automated test | None |
| AC4 | ✅ | `AC4: bothCallers_fetchArtefactAndRealFetchRepoPath_inheritTimeoutIdentically` asserts both `fetchArtefact` and `realFetchRepoPath` throw the same timeout error shape when given a hanging mock, confirming no per-caller duplication | automated test | None |

All 5 of this story's own tests re-run fresh against merged `master` (post-merge, not just pre-merge CI) on 2026-08-14: `5 passed, 0 failed`. Sibling stories `wugs-s1` (6/6), `wugs-s2` (11/11) re-confirmed unaffected. Full suite: 516 files run, 33 pre-existing failures (documented baseline, exact match), 0 new failures. This PR's own CI (`f9a0916f`, the pre-merge head) passed cleanly in full: Watermark Gate, Trace Validation, Cross-Tenant Isolation Repeat Gate, Assurance Gate, PR Checks, and E2E Tests all green.

**No deviations on the 4 ACs.**

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None shipped beyond the story's stated scope. Confirmed via diff review: no configurable/env-var-driven timeout value, no retry-on-timeout mechanism, and the unrelated D37 injectable-adapter pair (`fetchRepoPath`/`setFetchRepoPath`/`getFetchRepoPath`) in the same file is byte-identical pre/post-change.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5
**Tests passing in CI:** 5 / 5 (this story's own PR CI ran and passed cleanly in full before merge — unlike `wugs-s13`, which merged after a repo-wide CI-triggering outage began)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: hanging request aborts, clear timeout error | ✅ | ✅ | 1 test |
| AC2: normal fast response unaffected | ✅ | ✅ | 1 test |
| AC3a: timer cleared on success path | ✅ | ✅ | 1 test |
| AC3b: no double-error/late resolution on timeout path | ✅ | ✅ | 1 test |
| AC4: both callers inherit the fix identically | ✅ | ✅ | 1 test |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — this story IS the NFR fix, closing `nfr-profile.md`'s own already-recorded Performance gap | ✅ | AC1/AC3 directly verify the timeout mechanism; `nfr-profile.md`'s Gaps-table wording ("a reasonable fetch timeout (e.g. 10s)") matches this story's AC1 10s default exactly |
| Security — none new | ✅ | No new security surface; confirmed via code review |
| Accessibility — none new | ✅ | Error message surfaced through `_fetchGuardrailsSectionPiece`'s existing error-state rendering, unchanged by this story |
| Audit — none new | ✅ | Confirmed no new state-changing logic |

---

## Metric Signal

**Measurement-ready gate:** Is measurement possible yet for this story? **Not directly — this is a reliability fix, not a new user-facing capability.**

`m1` ("Guardrail/standard visibility in the web UI") lists `wugs-s1`, `wugs-s2`, `wugs-s3`, `wugs-s4`, `wugs-s5`, `wugs-s6`, `wugs-s7`, `wugs-s11`, `wugs-s12`, `wugs-s14` as contributing stories (the array was stale prior to this DoD — corrected as part of this write to include `wugs-s14`, which was missing entirely, matching `benefit-metric.md`'s own coverage matrix reasoning: this story hardens the reliability of the shared adapter every one of `m1`'s primary contributing stories depends on to render a populated view).

> **Guardrail/standard visibility in the web UI**
> Signal: not-yet-measured
> Evidence note: this story closes a reliability gap (an unbounded hang on a slow GitHub API call) in the shared adapter `m1`'s own contributing stories all depend on. It does not itself change whether the view renders correctly under normal conditions — `m1`'s own measurement (100% of active products with a connected repo render a populated, correctly-delineated view) is unaffected by this story specifically, though this story reduces the risk of that measurement being degraded by transient GitHub API slowness.
> Date measured: null

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Guardrail/standard visibility in the web UI | ✅ (0%) | Unchanged by this story — measurement readiness tracks `m1`'s primary contributing stories, not this reliability hardening | This story is a defensive fix, not a new capability contributing directly to the measured target |

---

## Outcome

**COMPLETE**

No deviations on the 4 ACs. This story's own PR CI passed cleanly in full before merge — the cleanest verification path of this session's two follow-up stories, since it merged just before the repo-wide CI-triggering outage began (documented in `wugs-s13`'s own DoD and `decisions.md`).

---

## DoD Observations

1. **This story's merge (`6951c06a`, 2026-08-13T23:29:45Z) landed just before the repo-wide CI-triggering outage that later affected `wugs-s13`.** Confirmed via direct comparison: this PR's final pre-merge commit (`f9a0916f`) has 6 real, green workflow runs recorded against it, while `wugs-s13`'s equivalent later commits have zero. No action needed for this story specifically — noted here only so a future reader comparing the two stories' DoDs understands why one has full CI evidence and the other relies on local post-merge re-verification instead.
2. **`m1`'s `contributingStories` array in `pipeline-state.json` was stale before this DoD** — matching `/trace`'s 2026-08-14 LOW finding #7 exactly (the array undercounted the metric's real contributing stories, `wugs-s14` included). Corrected as a natural side effect of this DoD's own Step 6 metric-signal task, alongside the equivalent fix for `m2` in `wugs-s13`'s own DoD. This closes trace finding #7 for both metrics without a separate dedicated story.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Add a fetch timeout to the shared GitHub Contents API adapter.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is the "not-yet-measured, unaffected by this story" metric-signal framing reasonable for a reliability-only fix, or should this story have been excluded from m1's contributing-stories list entirely?
3. Is the outcome verdict (COMPLETE) consistent with the AC and deviation rows?
```
