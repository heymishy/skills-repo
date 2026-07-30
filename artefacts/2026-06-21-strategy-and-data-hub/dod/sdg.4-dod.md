# Definition of Done: sdg.4 — Reference content injection into /ideate system prompt

**PR:** https://github.com/heymishy/skills-repo/pull/652 | **Merged:** 2026-07-30
**Story:** artefacts/2026-06-21-strategy-and-data-hub/stories/sdg.4.md
**Test plan:** artefacts/2026-06-21-strategy-and-data-hub/test-plans/sdg.4-test-plan.md
**DoR artefact:** artefacts/2026-06-21-strategy-and-data-hub/dor/sdg.4-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Section injected after SKILL.md content: `## Strategic context and reference material` | `tests/check-sdg4-ideate-injection.js` T1, T2 | None |
| AC2 | ✅ | Token budget validated; `[WARN]` logged when total > 12,000 tokens (soft limit, injection proceeds) | Same file, T3 | None |
| AC3 | ✅ | Largest reference file truncated with `[TRUNCATED — remaining content exceeds token budget]` marker when over budget | Same file, T4, T5 | None |
| AC4 | ✅ | Single HTTP request — `buildSystemPrompt` returns one assembled string, no streaming/multi-part | Same file, T6 (return-type check); architecturally the function has always returned a single string sent in one turn | None |
| AC5 | ⚠️ | Model grounds ≥2/5 opening questions in strategy content | Not automated — accepted MEDIUM finding per DoR (probabilistic model behaviour) | Manual smoke test not yet performed |
| AC6 | ✅ | No referenceFiles → section omitted, no error, SKILL.md content unchanged | Same file, T7, T8 | None |

---

## Scope Deviations

None. Implementation matches the story's stated out-of-scope list (no forced usage, no semantic ranking, no mid-session content changes, no summarization beyond truncation-to-fit).

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8 (per DoR's AC-to-test mapping) — implemented as 9 tests (added one extra legacy-bare-array regression guard beyond the DoR's minimum)
**Tests passing in CI:** 9 / 9

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1–T8 (DoR mapping) | ✅ | ✅ | |
| Regression: legacy bare-array priorArtefacts | ✅ | ✅ | Added beyond DoR minimum — confirms backward compatibility with every existing caller |

**Gaps (tests not implemented):** AC5 (probabilistic model behaviour) — explicitly accepted as a MEDIUM finding in the DoR, not automatable.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| System prompt assembly — `buildSystemPrompt()` accepts `referenceFiles` | ✅ | Code review + T1–T9 |
| Token counting — 4-chars-per-token heuristic | ✅ | Reuses `reference-reader.js`'s `logTokenBudget`, confirmed correct format via T3/T5 |
| Truncation preserves semantic completeness | ✅ | Truncates the largest file only, keeps a leading portion, never drops entirely — T4 |
| Error handling — missing/unreadable files don't fail assembly | ✅ | `reference-reader.js`'s own `readReferenceFile` already returns `null` (skipped) rather than throwing for missing/invalid files (sdg.3); this story's injection loop only processes the results that come back |

---

## Metric Signal

No completed `benefit-metric.md` artefact exists for this feature (same gap already flagged in `sdg.1`'s DoD — pre-existing, not new to this story). Recorded as `not-yet-measured`.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:** AC5's manual smoke test (run `/ideate` with a real strategy file uploaded; confirm ≥2/5 opening questions reference it) has not yet been performed — recommend doing this the next time `/ideate` is used with an uploaded reference file, since automated coverage of this AC was never possible by design.

---

## DoD Observations

1. This story sat fully DoR-signed-off but unimplemented for over 5 weeks (since 2026-06-26) before being picked up in this session — see `sdg.1`'s DoD for the fuller context on how this gap was discovered.
2. Confirmed via direct code investigation before writing any code that `referenceFiles` was being silently dropped by the pre-existing `buildSystemPrompt` — the object-shaped 4th argument's `.length` check evaluated `undefined` (falsy) against a plain object, so the whole prior-artefacts/reference block was a silent no-op. This was a genuine, confirmed implementation gap, not just a missing test.
