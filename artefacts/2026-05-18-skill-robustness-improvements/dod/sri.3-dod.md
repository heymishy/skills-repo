# Definition of Done: Add measurement-ready gate to DoD Step 6 for infrastructure stories

**PR:** https://github.com/heymishy/skills-repo/pull/412 | **Merged:** 2026-06-25
**Story:** artefacts/2026-05-18-skill-robustness-improvements/stories/sri.3.md
**Test plan:** artefacts/2026-05-18-skill-robustness-improvements/test-plans/sri.3-test-plan.md
**DoR artefact:** artefacts/2026-05-18-skill-robustness-improvements/dor/sri.3-dor.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — First question in Step 6 per story is "Is measurement possible yet for this story? (yes / not yet)" — appears before any metric signal, trend, or rating prompt | ✅ | T1 (`dod-step6-contains-measurement-ready-gate-question`) passes — "Is measurement possible yet" text present. T2 (`dod-step6-gate-question-precedes-signal-prompt`) passes — gate character index precedes "on-track/at-risk/off-track" index in the Step 6 section. | Automated test (8/8 passing) | None |
| AC2 — "not yet" answer path records `not-yet-measured` + operator evidence note and moves on; no further Step 6 prompts for that story | ✅ | T3 (`dod-step6-not-yet-path-records-not-yet-measured`) passes. T4 (`dod-step6-not-yet-path-requests-evidence-note`) passes — "brief evidence note" instruction present. T5 (`dod-step6-not-yet-path-moves-on-without-signal-prompts`) passes — "Move on to the next metric" instruction present. | Automated test | None |
| AC3 — "yes" answer path proceeds with normal signal-capture flow; on-track/at-risk/off-track options unchanged | ✅ | T6 (`regression-normal-signal-options-still-present`) regression guard passes — all three signal labels present in Step 6 text. The "yes" path section is intact and explicitly documented. | Automated test — regression guard | None |
| AC4 — DoD artefact records `not-yet-measured` with operator evidence note (not blank, not "N/A") | ✅ | T7 (`dod-step6-artefact-instruction-records-evidence-note`) passes. Artefact template block includes "Evidence note: [operator-supplied evidence note — must not be blank or 'N/A']". State-write instruction updated to specify evidence note for `not-yet-measured` stories. | Automated test | None |
| AC5 — Each story processed independently; an infrastructure story's outcome does not affect adjacent stories | ✅ | T8 (`regression-per-story-loop-structure-intact`) regression guard passes — "each metric", "contributingStories", and "metrics array" references all still present in Step 6 per-story loop structure. | Automated test — regression guard | None |

## Scope Deviations

None. Only Step 6 of `skills/definition-of-done/SKILL.md` was modified. No other Steps changed. No `measurementReady` schema field added. No automated infrastructure story detection. No follow-up mechanism for `not-yet-measured` stories.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8
**Tests passing:** 8 / 8

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 dod-step6-contains-measurement-ready-gate-question | ✅ | ✅ | |
| T2 dod-step6-gate-question-precedes-signal-prompt | ✅ | ✅ | |
| T3 dod-step6-not-yet-path-records-not-yet-measured | ✅ | ✅ | |
| T4 dod-step6-not-yet-path-requests-evidence-note | ✅ | ✅ | |
| T5 dod-step6-not-yet-path-moves-on-without-signal-prompts | ✅ | ✅ | |
| T6 regression-normal-signal-options-still-present | ✅ | ✅ | |
| T7 dod-step6-artefact-instruction-records-evidence-note (AC4, NFR-AUDIT) | ✅ | ✅ | |
| T8 regression-per-story-loop-structure-intact | ✅ | ✅ | |

**Test gaps:** 2 — (a) NFR-PERF: runtime measurement of Step 6 completion time for a `not-yet-measured` story (<30 seconds target). Tests confirm the "not yet" path instruction text is present; they cannot time a real session. Manual Scenario 5 🔴 in the verification script is the coverage mechanism — pending OrderHub team's next DoD run. (b) AI instruction-text runtime verification: tests confirm instruction text is present; they cannot observe actual AI model behaviour in a live session. Both accepted by design — text-level verification is the established pattern for SKILL.md stories.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — Step 6 completes for a `not-yet-measured` story in under 30 seconds | ✅ (by design) | The "not yet" path is structurally simple: one gate question, one evidence note prompt, move on. T4 and T5 confirm the instruction text directs the operator to move on without further prompts. Runtime timing requires a live session (see test gap above). |
| Security — None identified | N/A | Text-only change. No user-supplied content rendered. No data written beyond DoD artefact. |
| Audit — `not-yet-measured` outcome with evidence note recorded in DoD artefact | ✅ | T7 passes. State-write instruction in Step 6 now explicitly requires evidence note (not blank, not "N/A") for `not-yet-measured` stories. The artefact template block includes the "Evidence note" field. |

---

## Metric Signal

Is measurement possible yet for M3 (Infrastructure story DoD Step 6 completion time)? **Not yet.**

| Metric | Signal | Evidence note | Date measured |
|--------|--------|---------------|---------------|
| M3 — Infrastructure story DoD Step 6 completion time | not-yet-measured | The measurement-ready gate instruction text is present and 8/8 tests pass. Runtime measurement requires a real DoD session on an infrastructure story — not yet run. OrderHub team (abhijeet-qsofte) to confirm on their next DoD run per the M3 measurement plan (issue #344). | null |

---

## Outcome: COMPLETE ✅

ACs satisfied: 5/5
Scope deviations: None
Test gaps: 2 (NFR-PERF runtime timing and AI instruction runtime — both accepted by design; text-level verification is the standard for SKILL.md stories)
