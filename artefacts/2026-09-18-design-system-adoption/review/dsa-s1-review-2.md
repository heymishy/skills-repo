# Review Report: Restyle the Artefact Viewer and Build Its Sign-Off/Comments UI to Match DESIGN.md — Run 2

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s1.md
**Date:** 2026-09-18
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## Review Diff — Run 2 vs Run 1

### Resolved since last run
✅ [1-M1] (So-that clause read as beta-feedback framing while Benefit Linkage cited visual-consistency) — PARTIALLY RESOLVED: the visual half of the So-that clause now connects more directly to visual consistency; see new finding [2-M1] below for the remaining gap on the functional half.

### New findings this run
🆕 [2-M1] — Category A (Traceability) — AC5–AC8 (the new sign-off/comments functionality) don't trace to any named benefit metric.
🆕 [2-M2] — Category B (Scope) — The parent epic's own Benefit Metrics Addressed table wasn't updated to reflect this story's functional scope, even after the epic's Goal section was amended.

### Carried forward unchanged
⏳ [1-M2] (AC4 verification-method wording) — 2 runs open. Already RISK-ACCEPTed in `decisions.md` (run 1); the amended story's AC4 text is unchanged from run 1, so this finding carries forward unchanged, not re-opened.
⏳ [1-L1] (segment-level persona) — 2 runs open, still accurate; now paired with a new dual-persona note, see [2-L1] below.

### Progress summary
Run 1: 0 HIGH, 2 MEDIUM, 1 LOW
Run 2: 0 HIGH, 3 MEDIUM, 2 LOW
Change: HIGH +0, MEDIUM +1 (net: 1 resolved, 2 new), LOW +1

SAME (no regression — the story's scope grew substantially, and review scrutiny grew with it; no finding got worse or was missed)

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[2-M1]** Category A (Traceability) — AC5–AC8 (sign-off UI wiring, comments create/list) don't trace to any metric in `benefit-metric.md`. The 3 defined metrics (visual consistency, `design.system` DoR gate, beta feedback) all frame this feature as a visual/governance initiative — none measures "sign-off and comments actually work." The Benefit Linkage field's second sentence ("also builds the real Sign-off/Comments UI so the visual restyle isn't presenting functionality that doesn't exist") is a real rationale, but it isn't a named-metric linkage the way the visual half is.
  Risk if proceeding: a future `/trace` run or benefit-coverage audit would find AC5–AC8 orphaned from any metric, reading as scope without a measured outcome.
  To acknowledge: run /decisions, category RISK-ACCEPT — the rationale is sound (a visual mock depicting nonexistent functionality undermines the "visual credibility" goal itself) even without a dedicated metric, given this is a bounded, one-story, operator-directed exception already fully documented in `decisions.md`.

- **[2-M2]** Category B (Scope) — The parent epic's (`visual-restyle-rollout.md`) own Benefit Metrics Addressed table still lists only the 2 original metrics; it wasn't extended to acknowledge `dsa-s1`'s new functional scope, even though the epic's Goal section was amended with a note about it.
  Risk if proceeding: same as [2-M1] — an epic-level benefit-coverage check would show the same gap.
  To acknowledge: run /decisions, category RISK-ACCEPT — same underlying rationale as [2-M1], recorded once covers both.

- **[1-M2]** Category C (AC quality) — Carried forward unchanged from run 1: AC4 describes a verification method rather than a sharply observable outcome. Already RISK-ACCEPTed in `decisions.md` (run 1 entry) — no new acknowledgment needed, referencing the existing entry is sufficient.

---

## LOW findings — note for retrospective

- **[1-L1]** Category D (Completeness) — Carried forward: persona is segment-level ("a beta user"), honestly sourced, not a fabrication.

- **[2-L1]** Category D (Completeness) — The amended User Story now names two personas together ("a beta user... and... Hamish King"), same pattern already noted as a LOW finding on `dsa-s4`. Not wrong — both personas genuinely benefit from both halves of this story — but worth being aware this is now the 2nd of 5 stories with a dual-persona framing.

---

## Summary

0 HIGH, 3 MEDIUM, 2 LOW.
**Outcome:** PASS

---

## Score Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS |
| Scope integrity | 4 | PASS |
| AC quality | 4 | PASS |
| Completeness | 4 | PASS |
| Architecture compliance | 5 | PASS |

**Verdict:** PASS — all criteria scored 3 or above. This story's Architecture Constraints section is now one of the most thoroughly-grounded in this whole feature (real trace-based specifics for both the sign-off endpoint's exact response shapes and the reasoning against reusing the org-scoped comments module) — Architecture compliance scored 5/5 despite the substantial scope growth. 3 MEDIUM findings should be acknowledged in /decisions before proceeding to /test-plan; none are severe enough to block, given the underlying rationale for each is sound and already substantially documented.
