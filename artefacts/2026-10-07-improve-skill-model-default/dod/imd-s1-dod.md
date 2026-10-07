# Definition of Done: /improve must default to Sonnet, matching the same conservative-absent-evidence precedent already applied to /ideate

**PR:** [#950](https://github.com/heymishy/skills-repo/pull/950) | **Merged:** 2026-10-07
**Story:** artefacts/2026-10-07-improve-skill-model-default/stories/imd-s1-default-improve-to-sonnet.md
**Test plan:** artefacts/2026-10-07-improve-skill-model-default/test-plans/imd-s1-test-plan.md
**DoR artefact:** artefacts/2026-10-07-improve-skill-model-default/dor/imd-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `imd-s1 AC1: improve defaults to a non-Haiku model with no overrides` passing | `unit` | None |
| AC2 | ✅ | `imd-s1 AC2: DEFAULT_SONNET_SKILLS contains improve` + regression check for discovery/ideate, both passing | `unit` | None |
| AC3 | ✅ | `imd-s1 AC3: WUCE_MODEL_OVERRIDE_IMPROVE still takes precedence` passing | `unit` | None |
| AC4 | ✅ | All 25 pre-existing tests in `check-psrc-s1-model-routing-config.js` pass unmodified; `check-psrc-verify-s3-model-routing-drift.js` (7/7, confirms the separate drift-guard list untouched) | `unit` + `integration-real-code` | None |

---

## Scope Deviations

None. The merged PR's diff matches the story's stated scope exactly: one array-literal addition in `model-routing.js`, plus 3 new tests in the one existing file named in scope. `improvement-agent` was confirmed unrelated and untouched.

---

## Test Plan Coverage

**Tests from plan implemented:** 3 / 3
**Tests passing in CI:** 3 / 3 (plus 26 pre-existing tests in the same file, 29/29 total) — confirmed via PR #950's green checks before merge.

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| imd-s1 AC1 (non-Haiku default) | ✅ | ✅ | |
| imd-s1 AC2 (DEFAULT_SONNET_SKILLS membership + regression) | ✅ | ✅ | |
| imd-s1 AC3 (override precedence) | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ N/A | No new code path |
| Security | ✅ N/A | No new input surface |
| Accessibility | ✅ N/A | No UI change |
| Cost (deliberate, acknowledged increase) | ✅ | Story's own NFR section states this explicitly — every `/improve` session now costs Sonnet-tier tokens instead of Haiku-tier, a deliberate tradeoff matching `/ideate`'s own already-accepted precedent, not an oversight |

---

## Metric Signal

No metrics tracked — short-track model-routing correctness fix, no `/benefit-metric` run.

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| N/A | N/A | N/A | No metric defined |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
- A dedicated eval for `/improve` (mirroring `EXP-044`'s own treatment of `/ideate`) remains a legitimate future candidate to potentially downgrade back to Haiku with real evidence — named explicitly out of scope in the story itself, not forgotten, not started.

---

## DoD Observations

1. **This story's own justification was entirely precedent-based, not a fresh investigation.** No new eval was run; the fix reused this codebase's own already-documented reasoning (the `EXP-044` inconclusive-evidence-still-defaults-to-Sonnet precedent for `/ideate`) and applied it to a skill with even weaker evidence. This is a legitimate, fast, low-risk way to close a real gap without re-deriving policy from scratch — worth citing as a pattern for similar "this skill was just never checked against an existing policy" gaps found in other config/routing modules.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "/improve must default to Sonnet,
matching the same conservative-absent-evidence precedent already applied to
/ideate" (imd-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
