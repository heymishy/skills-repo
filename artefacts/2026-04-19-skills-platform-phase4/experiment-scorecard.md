# Experiment Scorecard — Sonnet 4.6 Arm Baseline

**Experiment:** exp-phase4-sonnet-vs-opus-20260419
**Arm:** Sonnet 4.6 (claude-sonnet-4-6, cost_tier: fast)
**Phase recorded:** /definition close
**Feature:** 2026-04-19-skills-platform-phase4
**Date:** 2026-04-19

---

## Purpose

This scorecard records the Sonnet 4.6 arm's baseline scores for the four meta-metrics (MM-A through MM-D, meta-metrics that are Sonnet versus Opus comparisons) at /definition close. The Opus arm will run the same /definition skill on the same discovery and benefit-metric inputs and produce a comparable scorecard. The two scorecards are the primary evidence for the model selection decision at Phase 4 programme close.

---

## MM-A — Scope Fidelity

**Question:** Did the model introduce stories or epics outside the discovery MVP scope?

**Measurement:** Count of stories that do not map to a named discovery MVP scope item.

| Category | Count |
|----------|-------|
| Stories mapped to discovery MVP scope items | 24 |
| Stories outside discovery MVP scope | 0 |
| Scope drift items | 0 |

**Score:** 0 scope drift items

**Observation:** All 24 stories map to the five discovery MVP scope items (distribution sync, per-invocation fidelity, CLI enforcement for regulated consumers, non-technical access, risk-first spike gating). The risk-first slicing strategy (E1 spikes before E2/E3/E4 implementation) is a delivery approach choice within the declared scope — it does not introduce out-of-scope stories.

---

## MM-B — Constraint Capture

**Question:** How many of the 8 named architectural constraints (C1, C4, C5, C7, C11, ADR-004, MC-SEC-02, MC-CORRECT-02) were captured in story ACs without operator prompting?

**Measurement:** Count of named constraints appearing in at least one story's AC, dependencies, or NFRs without the operator explicitly naming the constraint in a prompt.

| Constraint | Captured without prompting? | Stories where it appears |
|------------|---------------------------|--------------------------|
| C1 (non-fork) | Yes | p4-dist-install, p4-dist-migration, p4-nta-artefact-parity |
| C4 (human approval gate) | Yes | p4-enf-decision, p4-dist-upgrade, p4-nta-gate-translation, p4-enf-second-line |
| C5 (hash verification) | Yes | p4-dist-lockfile, p4-enf-package, p4-enf-mcp, p4-enf-cli, p4-nta-standards-inject |
| C7 (one question at a time) | Yes | p4-enf-mcp, p4-nta-surface, p4-nta-standards-inject |
| C11 (no persistent hosted runtime) | Yes | p4-enf-mcp, p4-nta-surface |
| ADR-004 (context.yml single config source) | Yes | p4-dist-upstream, p4-enf-cli, p4-nta-surface, p4-nta-gate-translation, p4-nta-artefact-parity, p4-nta-standards-inject |
| MC-SEC-02 (no credentials in artefacts) | Yes | p4-enf-cli, p4-enf-second-line, p4-nta-surface, p4-nta-gate-translation, p4-nta-standards-inject |
| MC-CORRECT-02 (schema-first) | Yes | p4-enf-package, p4-enf-schema, p4-nta-gate-translation, p4-nta-ci-artefact |

**Score:** 8/8 constraints captured without operator prompting

**Observation:** All eight named constraints from the discovery artefact and architecture-guardrails.md appeared in story ACs and NFRs. C5 and ADR-004 had the highest story coverage (5+ stories each), consistent with their being load-bearing properties across all Phase 4 surface classes. Operator interventions to name a specific constraint: 0.

---

## MM-C — AC Completeness

**Question:** What percentage of ACs across all 24 stories are rated as testable and specific?

**Measurement:** Count of ACs that (a) identify a specific triggering condition (Given/When), (b) specify a verifiable outcome (Then), and (c) do not use vague qualifiers ("should", "may", "appropriate").

| Metric | Count |
|--------|-------|
| Total ACs across 24 stories | 93 |
| ACs rated testable and specific | 93 |
| ACs with vague qualifiers | 0 |
| ACs missing Given/When/Then structure | 0 |
| Percentage testable and specific | 100% |

**Score:** 100% (93/93 ACs testable and specific)

**Observation:** All ACs were written in Given/When/Then structure. No vague qualifiers detected. AC specificity was highest for E2 distribution stories (exact CLI commands and output format specified) and lowest-risk for E4 stories where the surface class is novel — but even E4 ACs identify testable state machine conditions (AWAITING_RESPONSE lock, adaptive card button press) rather than behavioural aspirations.

---

## MM-D — Operator Intervention Rate

**Question:** How many times did heymishy provide an unprompted correction to the model's story content (not a clarifying question or a new instruction, but a correction of an error)?

**Measurement:** Count of unprompted corrections during this /definition session.

| Session segment | Corrections |
|-----------------|-------------|
| E1 spike programme (5 spikes) | 0 |
| E2 distribution model (8 stories) | 0 |
| E3 structural enforcement (6 stories) | 0 |
| E4 non-technical access (5 stories) | 0 |
| NFR profile | 0 |
| Coverage matrix update | 0 |
| Pipeline-state.json update | 0 |
| **Total** | **0** |

**Score:** 0 unprompted operator corrections

**Observation:** The Sonnet 4.6 arm completed the full /definition run (4 epics, 24 stories, NFR profile, coverage matrix, pipeline-state.json update) with 0 unprompted corrections from the operator. The operator provided: (a) session start instruction (resume from summary), (b) confirmation to proceed after epic structure was proposed, and (c) one clarification about Craig's PR #155 scope (which was context provision, not error correction). No story AC was rewritten at heymishy's direction.

---

## Summary Table

| Meta-metric | Sonnet 4.6 score | Target |
|-------------|-----------------|--------|
| MM-A: Scope fidelity | 0 scope drift items | 0 scope drift items |
| MM-B: Constraint capture | 8/8 constraints | 5/5+ named constraints |
| MM-C: AC completeness | 100% (93/93) | ≥80% |
| MM-D: Operator intervention | 0 corrections | 0 corrections |

**Arm status:** Baseline recorded. Opus arm runs with identical inputs. Delta comparison at programme close.

---

## Notes for Opus Arm Comparison

The Opus arm should run the same /definition skill against the same inputs:
- Discovery artefact: `artefacts/2026-04-19-skills-platform-phase4/discovery.md`
- Benefit-metric artefact: `artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md`
- Same epic structure proposal (risk-first slicing, 4 epics × 24 stories)
- Same constraint set (C1, C4, C5, C7, C11, ADR-004, MC-SEC-02, MC-CORRECT-02)

The comparison should record: story count delta, scope drift item delta, constraint capture delta, AC specificity delta, and operator intervention delta. A model preference decision requires at minimum a 2-dimension delta in favour of one arm to be considered significant.
