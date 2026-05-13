# Epic: Pipeline Evolution Foundation

**Discovery reference:** artefacts/2026-04-11-skills-platform-phase2/discovery.md
**Benefit-metric reference:** artefacts/2026-04-11-skills-platform-phase2/benefit-metric.md
**Slicing strategy:** Risk-first — Phase 1 pipeline evolution debt (D1–D4, D8/D9, B1-enforce) is resolved first because the gaps directly affect quality of all downstream Phase 2 outer loop work. These stories improve the harness before the harness is used to deliver all remaining Phase 2 stories.

## Goal

When this epic is complete, the /definition, /review, and /definition-of-ready skills have been upgraded with the eight Phase 1 learnings entries that were logged but deferred. Stories produced by /definition have traceable dependencies and testable ACs. Reviews are durable across session boundaries. DoR enforces NFR profile presence and cross-story schema dependency declarations. DoD includes explicit AC verification prompts. The platform's own outer loop for Phase 2 benefits from these improvements from story p2.4 onwards.

## Out of Scope

- D5, D6 — not yet scheduled; require Phase 2 inner loop traces as input before they can be defined
- D7 — delivered during Phase 1 p1.6 DoD amendment session (confirmed in `.github/templates/definition-of-done.md` line 97); not a Phase 2 story
- Changes to the /test-plan, /branch-setup, or /verify-completion skills — those improvement candidates are not in the P2.6 batch
- Automated testability scoring (ML-based) — D2 uses a heuristic prompt only; automation is a Phase 3 improvement candidate
- Backfilling D1/D2/D3 improvements onto Phase 1 story artefacts — applies to new stories from Phase 2 forward only

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| MM5 — Flow findings conversion rate | 0 of 2 Phase 1 findings actioned | ≥50% of logged findings actioned within 2 features | D1/D2/D3 (p2.1) + D4 (p2.2) + D8/D9/B1-enforce (p2.3) are the Phase 1 flow findings being actioned — all 5 findings are in this epic |
| MM1 — Solo operator outer loop Phase 2 | Phase 1: 0 blocking lookups, ~13h | ≤1 blocking lookup, ≤3 calendar days Phase 2 | Better /definition (D1/D2/D3) and durable /review (D4) reduce rework loops in outer loop |

## Stories in This Epic

- [ ] p2.1 — /definition skill improvements (D1/D2/D3): dependency chain validation, testability filter, learnings exit step
- [ ] p2.2 — /review skill improvement (D4): incremental per-story write
- [ ] p2.3 — DoR and DoD template improvements (D8/D9/B1-enforce): cross-story schema dependency check, verification prompt, NFR guardrail enforcement

## Human Oversight Level

**High** — all three stories modify platform governance skill files. Changes to /definition, /review, and /definition-of-ready instruction text affect all future outer loop runs. Human review of each SKILL.md diff before merge is required.
