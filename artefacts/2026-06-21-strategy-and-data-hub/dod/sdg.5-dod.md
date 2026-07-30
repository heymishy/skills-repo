# Definition of Done: sdg.5 — Reference content injection into /discovery system prompt

**PR:** https://github.com/heymishy/skills-repo/pull/655 (replaces #653, auto-closed when `feature/sdg.4` was deleted post-merge — same commits, retargeted to `master`) | **Merged:** 2026-07-30
**Story:** artefacts/2026-06-21-strategy-and-data-hub/stories/sdg.5.md
**Test plan:** artefacts/2026-06-21-strategy-and-data-hub/test-plans/sdg.5-test-plan.md
**DoR artefact:** artefacts/2026-06-21-strategy-and-data-hub/dor/sdg.5-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Reference section injected into `/discovery` prompt, byte-for-byte identical format to `/ideate`'s (shared mechanism, not duplicated) | `tests/check-sdg5-discovery-injection.js` T1, T2 | None |
| AC2 | ⚠️ | Model grounds scope against strategy | Not automated — accepted MEDIUM finding per DoR | Manual smoke test not yet performed |
| AC3 | ✅ | `skills/discovery/SKILL.md` instructs the literal `[Grounded in: <filename>]` callout format | Same file, T3 | None |
| AC4 | ✅ | Callout markers preserved verbatim in saved artefact (no escaping/stripping) | Same file, T4 | None |
| AC5 | ✅ | Multiple reference files appear independently in the injected section | Same file, T5 | None |
| AC6 | ✅ | No referenceFiles → baseline discovery, no markers, no error | Same file, T6, T7 | None |

---

## Scope Deviations

None. No automatic relevance ranking, no modification of the operator's problem statement, no feedback loops, no separate storage of reference content — matching the story's out-of-scope list.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7
**Tests passing in CI:** 7 / 7

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1–T7 | ✅ | ✅ | T2 specifically confirms the injection mechanism is shared with `/ideate`, not reimplemented — satisfies the DoR's own architecture constraint |

**Gaps (tests not implemented):** AC2 (probabilistic model behaviour) — explicitly accepted as a MEDIUM finding in the DoR, not automatable.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Same injection mechanism as sdg.4 (not duplicated) | ✅ | T2 — byte-for-byte identical section output |
| Literal callout format, no variations | ✅ | T3 (checks literal string `[Grounded in:`) |
| Callout markers preserved verbatim | ✅ | T4 (write-then-read round trip) |
| ADR-023 handoff schema respected | ✅ | No change to the handoff schema itself — only the pre-existing `buildSystemPrompt` call site's arguments |

---

## Metric Signal

No completed `benefit-metric.md` artefact exists for this feature (same pre-existing gap flagged in `sdg.1`/`sdg.4`'s DoD). Recorded as `not-yet-measured`.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:** AC2's manual smoke test (run `/discovery` with a strategy file uploaded; verify at least one scope section references it, and callout markers appear) has not yet been performed — recommend doing this the next time `/discovery` is used with an uploaded reference file.

---

## DoD Observations

1. **PR churn note:** the original PR for this story (#653) was auto-closed by GitHub when its base branch (`feature/sdg.4`) was deleted immediately after #652 merged — a side effect of deleting a branch that another open PR still targets as its base. No work was lost (the commits remained on the `feature/sdg.5` branch, which was untouched); a replacement PR (#655) was opened targeting `master` directly and merged instead. Tagging as an `/improve` candidate: when merging a PR that is the base of another still-open PR, do not delete the merged branch until the dependent PR has been retargeted.
2. Same 5-week-plus dormancy context as `sdg.4` — see that story's DoD.
