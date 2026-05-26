# Review: wfp.12 — Skill coverage heat map
**Run:** 1
**Date:** 2026-05-27
**Reviewer:** Copilot / Hamish King
**Story:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.12.md

---

## FINDINGS

**1-M1 (MEDIUM) — Epic not updated to list Phase 2 stories**
`wfp-planning-dashboard.md` stories list contains wfp.5–wfp.8 only. wfp.12–wfp.16 reference this epic but the epic does not list them. Forward traceability (epic → story) is broken; a /trace run would flag these as orphaned stories. Note: `phase2-intelligence-intent.md` governs Phase 2 explicitly and provides substitute forward-link coverage, which mitigates the risk.
_Recommended action:_ Add wfp.12–wfp.16 to the stories list in `wfp-planning-dashboard.md`, or create a dedicated `wfp-intelligence-layer.md` epic and update all five story epic references. This finding applies equally to wfp.13, wfp.14, wfp.15, wfp.16.

**1-M2 (MEDIUM) — AC1: tag universe derivation ambiguous under team-first model**
AC1 defines `tags` (the heat map row axis) as "all unique skill tag strings from the union of all `skills` arrays in `roster.json`". Under the team-first data model, `teams.json` is the authoritative record of current team membership. `roster.json` may include retired or unallocated members whose skill tags would inflate the row axis with tags no currently-allocated team can cover — creating permanently empty rows. The intention should be stated explicitly.
_Recommended action:_ Amend AC1 to clarify: either (a) `tags` is the union of `skills` from non-retired roster members only, or (b) `tags` is the union of skills from non-retired team members in `teams.json` who appear in at least one allocated team. Option (b) is more consistent with the team-first model.

**1-L1 (LOW) — DoR pre-check boxes unchecked**
All `- [ ]` items in the Definition of Ready Pre-check section are unchecked. Acceptable for DoR skill to verify at sign-off; no rework needed.

---

## SCORES

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS — discovery, epic, benefit-metric all referenced; benefit linkage has real mechanism sentence; M2 and M3 explicitly named |
| Scope integrity | 5 | PASS — out-of-scope section explicit and non-trivial; no scope creep beyond discovery |
| AC quality | 4 | PASS — 6 ACs, all Given/When/Then, independently testable; edge cases (missing files, graceful fallback) have own ACs |
| Completeness | 4 | PASS — all template fields populated; named persona; complexity 2 rated with rationale; scope stability declared |

---

## VERDICT

**PASS ✅ — Run 1**

0 HIGH, 2 MEDIUM (epic forward-link gap shared across Phase 2 stories; AC1 tag universe clarification), 1 LOW. No HIGH findings. Ready for /test-plan after MEDIUMs are acknowledged or resolved.
