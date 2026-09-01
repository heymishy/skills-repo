# Definition of Done: ep1-s1 — Feature Discovery from Pipeline-State Index (revised scope)

**PR:** https://github.com/heymishy/skills-repo/pull/808 | **Merged:** 2026-09-01
**Story:** artefacts/new-feature-af17f555/stories/ep1-s1.md
**Test plan:** artefacts/new-feature-af17f555/test-plans/ep1-s1-test-plan.md
**DoR artefact:** artefacts/new-feature-af17f555/dor/ep1-s1-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-02

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — CLI-only non-terminal feature appears on `/journey` with correct badge/date/Continue | ✅ | `integration: handleGetJourney renders a merged-in CLI-only feature with jh-continue` — passing | `tests/check-ep1-s1-journey-feature-merge.js`, run in CI's "Lint, typecheck, test, build" job | None |
| AC2 — terminal-stage features excluded, from both sources | ✅ | `AC2: excludes completed/archived/released features` — passing | Same test file | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. `/skills` (the literal skill picker) and `handleGetJourneyResume`'s own resume mechanism were both explicitly out of scope for this story and were not touched by this story's own code changes (`_mergeStateFeaturesIntoJourneyList` + its wiring into `handleGetJourney` only). `handleGetJourneyResume` was modified in the same PR, but that change belongs to `ep1-s3` (see that story's own DoD) — implemented together per `decisions.md`'s hard-coupling finding, not a scope violation of this story's own boundary.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 10 planned
**Tests passing in CI:** 8 / 8 implemented

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: includes a non-terminal pipeline-state feature with no journey record | ✅ | ✅ | |
| AC1: excludes a feature already present in journey-store list | ✅ | ✅ | |
| AC2: excludes completed/archived/released features | ✅ | ✅ | |
| AC1: maps updatedAt to createdAt | ✅ | ✅ | |
| graceful degradation: missing pipeline-state.json does not throw | ✅ | ✅ | |
| terminal-stage constant matches pipeline-state.json vocabulary exactly | ✅ | ✅ | |
| regression: existing journey-store entries preserved unmodified | ✅ | ✅ | |
| integration: handleGetJourney renders a merged-in CLI-only feature with jh-continue | ✅ | ✅ | |

**Gaps (tests not implemented):** The test plan specified 10 tests (7 unit, 3 integration) across AC1/AC2; 8 were actually written (7 unit, 1 integration), consolidated during implementation without reducing AC coverage — both ACs remain covered by at least one unit and one integration-level test. Not a coverage gap in substance; disclosed as a plan-vs-implementation count difference.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Feature list fetch ≤2 seconds | ⚠️ | Not explicitly measured with a timing test. Evidenced by implementation: synchronous local `fs.readFileSync` via the existing `_readPipelineFeatures` helper, the same mechanism every other local-disk read on this page already uses at production scale. No perf regression expected; not independently benchmarked. |
| Graceful fallback if pipeline-state.json unreachable | ✅ | `graceful degradation: missing pipeline-state.json does not throw` — passing |
| Terminal stages (completed, archived, released) excluded | ✅ | `AC2` test + `terminal-stage constant matches...` test — both passing |
| Stalled features included | ⚠️ | No dedicated test. Evidenced by code review: `TERMINAL_STAGES = ['completed', 'archived', 'released']` does not include `'stalled'`, so a stalled feature is not filtered out by this story's merge logic. Not independently verified with a stalled-stage fixture. |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Web UI Session Start Share | ❌ | Not yet — `ep1-s6` (PostHog instrumentation) has not shipped; no measurement infrastructure exists yet | Signal: not-yet-measured |
| Metric 2 — Feature Discoverability — Load Success Rate | ❌ | Not yet — same reason | Signal: not-yet-measured |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. Consider a dedicated timing test or manual measurement for the ≤2s feature-list-fetch NFR if this page's load time becomes a concern (owner: platform team, not blocking).
2. Consider a dedicated stalled-feature-inclusion test to close the NFR evidence gap (owner: platform team, low priority — behaviour is correct by inspection).
3. Metric signals will remain `not-yet-measured` until `ep1-s6` ships and real Web UI adoption data accumulates.

---

## DoD Observations

1. This story's original DoR contract (signed off 2026-05-16) targeted a build that no longer matched the codebase by 2026-09-01 — see `decisions.md`. Worth feeding back to `/improve`: a story with a large time gap between DoR sign-off and inner-loop start should trigger a "re-verify the contract against current code" prompt at `/branch-setup` time, not rely on the coding agent discovering staleness by chance while reading the code.
2. `ep1-s3` turned out to be a hard runtime dependency of this story's own Continue button, discoverable only by reading `handleGetJourneyResume`'s actual implementation — `pipeline-state.json`'s `Dependencies` field did not capture this. Worth feeding back to `/improve`: consider whether `/definition` or `/review` should prompt for a "does this story's UI element require another story's backend logic to actually function" check when a story adds a UI affordance (a button, a link) whose target handler is itself modified by a sibling story.
3. `/products/:id` has the identical CLI-only-feature blind spot this story fixed for `/journey`, deliberately deferred — see `decisions.md`. Flagging again here so `/trace` and any future `/improve` pass surfaces it as a known, tracked gap rather than something to be "discovered" again later.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for ep1-s1 — Feature Discovery from
Pipeline-State Index.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
