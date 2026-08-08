# Definition of Done: Consolidate validate-trace.sh's checks into a single Python pass

**PR:** https://github.com/heymishy/skills-repo/pull/689 | **Merged:** 2026-08-08
**Story:** artefacts/2026-08-08-validate-trace-perf/stories/vtp-s1-consolidate-validate-trace-checks.md
**Test plan:** artefacts/2026-08-08-validate-trace-perf/test-plans/vtp-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-08-validate-trace-perf/dor/vtp-s1-dor.md
**Assessed by:** Copilot
**Date:** 2026-08-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (byte-identical report output, full run) | ✅ | `fullRun_producesEquivalentReport_toPreChangeBaseline` | automated test — `tests/check-vtp-s1-validate-trace-consolidation.js` | Test gracefully skips on this specific dev machine due to an unrelated, pre-existing Windows/git-bash limitation in the *old* script's own direct-bash-interpolation `python3` calls (not something this change introduced); ran for real via CI's Linux runner instead, confirmed by PR #689's green `Validate traceability chain` and `Lint, typecheck, test, build` checks |
| AC2 (reduced process-spawn count) | ✅ | `consolidatedRun_spawnsExactlyOneSharedStatePython3Process` — confirmed exactly 1 shared-state `python3` invocation (down from 5+) | automated test | None |
| AC3 (all 6 `--check <name>` modes match pre-change verdicts) | ✅ | 6/6 `singleCheckMode_*_runsAndReportsCleanly` tests | automated test | None |
| AC4 (T6 sub-check still passes, margin documented) | ✅ | Full local run dropped from multiple minutes to ~17s (measured); the eval-mode scan specifically dropped from 2m31s to 2.4s | manual timing + PR description | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. AC1's noted skip is an environment limitation, not a behavioural gap — recorded per the skill's own definition of "deviation" for completeness.

---

## Scope Deviations

One deliberate, DoR-compliant scope expansion, documented at the time via a story addendum: `check_no_eval_mode_artefacts` was folded into the same consolidated Python pass mid-implementation, after being measured at 2m31s standalone (worse than the `discovery_approved` finding the story originally scoped around). The DoR's own coding instructions already said the consolidated pass should "compute all 6 checks' verdicts" — `no_eval_mode_artefacts` is the 6th check — so this was in scope by the DoR's own wording, just not separately called out by name in the original AC text. Not a violation of the story's stated Out of Scope section (which only excludes a language rewrite, schema changes, the broader audit, and further timeout increases).

---

## Test Plan Coverage

**Tests from plan implemented:** 9 planned / 8 actual (test plan's AC1 golden-diff and AC2 spawn-count items were combined into fewer, more targeted test cases than originally enumerated — same AC coverage, more efficient test design)
**Tests passing in CI:** 8 / 8

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| 6× `singleCheckMode_*` (AC3) | ✅ | ✅ | One per check name |
| `consolidatedRun_spawnsExactlyOneSharedStatePython3Process` (AC2) | ✅ | ✅ | Counting `python3` shim on `PATH` |
| `fullRun_producesEquivalentReport_toPreChangeBaseline` (AC1) | ✅ | ✅ (skips locally, runs in CI) | Git-based golden-diff against the parent commit |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance (this story's own primary NFR) | ✅ | Full local run: multiple minutes → ~17s. `check_discovery_approved`: ~300 subprocess spawns → 0. `check_no_eval_mode_artefacts`: 2m31s → 2.4s (~63x). |
| Security | N/A (none identified) | No new input handling; same trusted local files read as before. |
| Audit | ✅ (improves, incidentally) | A single consolidated Python pass is easier to reason about than 9 scattered inline scripts. |

---

## Metric Signal

No metrics array — short-track story. Not applicable.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None outstanding — the scope expansion (folding in `no_eval_mode_artefacts`) was itself the follow-up action from the original finding, and it shipped in this same PR.

---

## DoD Observations

1. **Found a more severe instance of the target defect class mid-implementation, and correctly expanded scope to fix it rather than deferring.** The original story was scoped around `check_discovery_approved`'s ~300 subprocess spawns; `check_no_eval_mode_artefacts`'s 3,691 spawns (2m31s standalone) was worse and was found by directly measuring rather than assuming. This is the kind of finding that would have been easy to defer to "a future story" — folding it in immediately, with the DoR's own wording cited as authorization, was the right call and avoided a second round-trip through the whole outer-loop process for what was clearly the same underlying pattern.
2. **The `is_hard_fail` function in `validate-trace.sh` remains genuinely dead code** — defined, but never called by any check or by `main`. Confirmed via direct reading during this work, deliberately left untouched (out of this story's scope; removing dead code wasn't part of the DoR contract). `/improve` candidate: a small, separate cleanup story to remove it, or confirm via git blame whether it's a stub for planned-but-unbuilt functionality.
3. **`discovery_approved`'s exempt-tracks fallback default subtly differs from `discovery_exists`'s** when the `trace-validation.yml` config key is absent (one defaults to a 4-item list, the other to a 5-item list including `programme`) — a genuine, pre-existing quirk in the original script, faithfully preserved rather than "fixed," per this story's zero-behaviour-change mandate. Also confirmed (separately) that an unregistered feature directory (not present in `pipeline-state.json`'s `features[].slug` list) is silently treated as track-exempt by `check_discovery_approved` due to `grep -qw ""` (empty pattern) trivially matching — a real, pre-existing latent gap, faithfully preserved for the same reason. `/improve` candidate: a follow-up story to decide whether either of these quirks should actually be fixed now that they're documented and understood, rather than staying silently inherited.
