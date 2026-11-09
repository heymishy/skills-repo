# Definition of Done: Bottom-up programme-candidate detection script (epic-count primary signal)

**PR:** https://github.com/heymishy/skills-repo/pull/1061 | **Merged:** 2026-11-09
**Story:** artefacts/2026-11-08-programme-entry-points/stories/pep-s3-bottom-up-detection-script.md
**Test plan:** artefacts/2026-11-08-programme-entry-points/test-plans/pep-s3-bottom-up-detection-script-test-plan.md
**DoR artefact:** artefacts/2026-11-08-programme-entry-points/dor/pep-s3-bottom-up-detection-script-dor.md
**Assessed by:** Claude Sonnet 5
**Date:** 2026-11-10

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `T3-no-timeline-field-at-all` asserts no `time`/`span`/`date`/`day`/`duration` key anywhere in the computed signals object. `T4-at-threshold`/`T4-below-threshold`/`T4-above-threshold`/`T4-threshold-is-4` confirm `isCandidate` flags at exactly `epicCount >= 4`, with `EPIC_COUNT_THRESHOLD = 4` verified directly in the shipped `scripts/detect-programme-candidates.js:33`. | `integration-real-code` | None |
| AC2 | ✅ | `T6-phase4-flagged` runs `scanPipelineState` against the real, live `.github/pipeline-state.json` on master and confirms `2026-04-19-skills-platform-phase4-opus` (real epic count 4, verified directly — not the artefact-cited 5) is flagged as a candidate. | `integration-real-code` (against real production data, not a fixture) | Real epic count is 4, not 5 as every prior artefact in this tranche cited — see Scope Deviations / DoD Observations. Outcome unaffected: 4 ≥ 4 still correctly flags true positive. |
| AC3 | ✅ | `T6-tir-not-flagged` runs the same live scan against `2026-07-09-team-identity-roles` (1 epic) and confirms it is correctly NOT flagged. `T2-real-tir-decisions-count` confirms the real "depend" mention count is 5 (verified occurrence count), not the artefact-cited 4 (a stale `grep -c` line-count). | `integration-real-code` (against real production data) | Real dependency-mention count is 5, not 4 as cited. Outcome unaffected: epic count, not dependency count, is the load-bearing signal for AC3's true-negative result. |
| AC4 | ✅ | `T5`-series assertions (report generation) confirm the report lists each candidate's epic count and dependency-density score, states the directional/human-judgment disclaimer, and explicitly handles the zero-candidate case ("0 candidates found"). | `unit` | None |

Fresh test run on master post-merge (`node tests/check-detect-programme-candidates.js`): **27/27 passing.**

**A deviation is any difference between implemented behaviour and the AC**, even if minor. The two real-data discrepancies above (phase4's true epic count; team-identity-roles' true dependency-mention count) are genuine deviations from what this tranche's artefacts assumed going in — recorded here and in `decisions.md`/the implementation plan, not silently absorbed, even though neither changes AC2/AC3's pass/fail outcome.

---

## Scope Deviations

None. `git show 89a09859 --stat` confirms exactly 4 files touched: `.github/pipeline-state.json` (bookkeeping), the implementation plan artefact, `scripts/detect-programme-candidates.js`, and `tests/check-detect-programme-candidates.js`. No automated escalation into `programme.md` was built (explicitly out of scope, AC4 confirms manual-review-report-only), no web-UI rendering was added (explicitly out of scope), and no real-world false-positive-rate claim was made beyond the 2 known historical cases (explicitly flagged `[UNKNOWN BASELINE]` in the story's own Out of Scope section).

---

## Test Plan Coverage

**Tests from plan implemented:** 27 / 27 (test plan specified 8 unit + 3 integration + 1 NFR = 12 test *cases*; the shipped test file groups these into 27 individual `assert()` calls, a finer granularity than the plan's own count but covering the same scenarios — no narrowing).
**Tests passing in CI:** 27 / 27 (confirmed via PR #1061's "Lint, typecheck, test, build" check, and independently re-run fresh against master post-merge for this DoD).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `countEpics` (flat + legacy-nested + missing-epics-field shapes) | ✅ | ✅ | |
| `countDependencyMentions` (real team-identity-roles decisions.md, empty, undefined) | ✅ | ✅ | Real-data occurrence count (5) corrected from the artefact-cited line-count (4) |
| `computeSignals` (no timeline field, expected fields, correct counts) | ✅ | ✅ | |
| `isCandidate` boundary (3/4/5 epics, threshold constant) | ✅ | ✅ | |
| `generateReport` (disclaimer, candidate listing, zero-candidate case) | ✅ | ✅ | |
| `scanPipelineState` AC2/AC3 against real pipeline-state.json | ✅ | ✅ | Real epic/dependency counts corrected from artefact citations; outcome unaffected |
| NFR performance sanity (`<5000ms`) | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — complete quickly enough for ad-hoc/CI use (no hard numeric SLO set, per `nfr-profile.md`) | ✅ | `T7-nfr-perf-under-5s`: real scan of the live `pipeline-state.json` completes in well under 5000ms |
| Security — none identified (read-only script against local files) | ✅ | Confirmed: `scripts/detect-programme-candidates.js` performs no writes, no network calls, no credential handling |
| Accessibility — N/A (CLI output) | ✅ | N/A, confirmed |
| Audit — the report plus run log form the audit trail | ✅ | `generateReport`'s output is the audit artefact; no separate logging mechanism needed at this scale |
| No new credential surface (cross-story NFR, `nfr-profile.md` row shared with pep-s1/pep-s2) | ✅ | Confirmed — no secrets, tokens, or credentials referenced anywhere in the shipped script |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Bottom-up detection heuristic validity (meta) | ✅ (complete-absence baseline — no detection mechanism existed before this story) | 2026-11-10 (today — this metric's own stated "Measurement method" in `benefit-metric.md` is literally "script run against both known historical cases," which is exactly what AC2/AC3's tests just did) | See full signal below |

**Bottom-up detection heuristic validity (meta)**
Signal: **on-track**
Evidence: Target was "the script correctly classifies both seeded cases (true positive on `phase4`, true negative on `team-identity-roles`)." Both hold on the real, live data: `T6-phase4-flagged` (true positive, real epic count 4) and `T6-tir-not-flagged` (true negative, real epic count 1). This is the strongest, not the minimum, signal threshold defined in `benefit-metric.md` — fully met, not merely "not invalidated."
Date measured: 2026-11-10

**Correction to this fork's own original dispatch instruction:** the task brief this DoD was run under assumed this metric should be marked "not-yet-measured," reasoning that it needed `pep-s2`'s routing patches to be live first. Reading `benefit-metric.md` directly shows this metric's own defined measurement method is the story-3 acceptance check itself — already complete. Marking it `not-yet-measured` would have been factually wrong; corrected to `on-track` based on the artefact's own stated method, not the stale instruction.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. Two real-data discrepancies (phase4's true epic count is 4, not 5; team-identity-roles' true dependency-mention count is 5, not 4) were found and corrected in the shipped test file, but every other artefact in this 2026-11-08 tranche that cites these numbers (discovery.md, benefit-metric.md, decisions.md, other stories) still states the old, artefact-level figures. Neither correction changes any AC outcome, so this is not a release blocker, but a future `/trace` or documentation pass should sweep these citations for consistency. Owner: not yet assigned — flagging for the next `/trace` run on this feature.
2. The story's own Out-of-Scope section already flags that a real-world false-positive rate (beyond the 2 known historical cases) is `[UNKNOWN BASELINE]` and logs this as the trigger for the heuristic's first `/decisions` revisit once real future data exists. No action needed now — noted here so it isn't lost.

---

## DoD Observations

1. **Two real-data discrepancies, corrected in code, not yet reconciled across artefacts** (see Follow-up action 1 above). This is a genuine /improve candidate: a lesson that artefact-level historical citations (epic counts, dependency-mention counts) degrade if not re-verified against live data at implementation time, exactly as happened here — not caught at `/definition`, `/review`, or `/test-plan`, only at actual implementation. Worth a standing reminder in `/implementation-plan` or `/subagent-execution` to re-verify any cited historical-data number against its real source before building a test fixture from it.
2. **Metric Signal step correction** (see above) is itself worth surfacing: a dispatch brief's own assumption about a metric's measurability should never override the benefit-metric artefact's own stated measurement method — this DoD run caught and corrected that rather than propagating it.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Bottom-up programme-candidate detection script (epic-count primary signal).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
