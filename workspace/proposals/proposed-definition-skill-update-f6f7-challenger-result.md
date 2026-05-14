---
verdict: pass
session_summary: "Analytical pre-check against EXP-003 Config A / Config C run 1 / Config C run 2 baseline data. Two additions evaluated: (1) new Step 4a — regulated constraint propagation check between Step 4 and Step 5; (2) new quality check item. AC1 (F6): Step 4a.2 forces per-story enumeration of triggering stories using a concrete trigger definition heuristic (positive: has implementation code ACs or modifies system component within regulated scope; exclusion: solely documentation, vendor engagement, or post-implementation validation). This is independent of slicing strategy choice — the step fires after all stories are written regardless of which strategy was selected. In the Config C run 2 challenger scenario, S1.2 and S2.2 would be identified as triggering C2; S1.1 would not trigger alone. The C2 gap in both stories would be caught and fixed before the artefact is finalised. AC1: PASS. AC2 (F7): Step 4a.3 explicitly states 'Do not use a feature-level check — appears somewhere in the feature is insufficient and produces false positives.' The step iterates (constraint × triggering story) pairs — the Config C run 2 false-positive pattern (table confirms feature-level presence, misses S1.2/S2.2 story-level absence) cannot pass this check. AC2: PASS. AC3 (anti-overfitting): both additions are purely additive — no existing rule removed or weakened. AC3: PASS. AC4 (no regression): skip path is explicit and unconditional — 'Skip this step only if no regulated constraints are present.' A simple CRUD feature would skip Step 4a and proceed straight to Step 5 with no change in behaviour. AC4: PASS. AC5 (trigger definition concrete): criterion 2 (has ACs requiring implementation code) is mechanically checkable against AC language. Criterion 1 (modifies system component within regulated scope) retains minor judgment dependency on 'within the regulated scope' — mitigated by operator confirmation step in 4a.2 before trigger table is locked. This is the correct level of abstraction for a multi-framework rule covering PCI DSS, AML/CFT, GDPR, SOX, and HIPAA, each with different scope boundaries. AC5: PASS. Challenger scenario prediction: if Step 4a had been in SKILL.md during Config C run 2, C2 at definition would be 1.00 (both triggering stories corrected) instead of 0.35 — regulated chain CPF would have been 1.00 instead of 0.675. Anti-overfitting gate: both changes are additive (add-check). PASS."
traces_produced: none
reviewer: Hamis
reviewed_at: "2026-05-14T20:00:00Z"
---

# Challenger Result: proposed-definition-skill-update-f6f7

## Verdict: PASS

## Evaluation details

**Evidence reviewed:**
- `workspace/experiments/EXP-003-pipeline-eval/runs/config-A-run-1/definition.md` — risk-first; C2 in S1.2 AC3 + NFRs + Epic 3 dependency; C2 chain = 1.00
- `workspace/experiments/EXP-003-pipeline-eval/runs/config-C-run-1/definition.md` — vertical-slice; C2 absent from propagation table entirely; C2 chain = 0.00 at definition
- `workspace/experiments/EXP-003-pipeline-eval/runs/config-C-run-2/definition.md` — vertical-slice; C2 credited to S1.1/S1.3 only via false-positive propagation table; S1.2 and S2.2 have no C2 AC; C2 chain = 0.35
- `workspace/experiments/EXP-003-pipeline-eval/runs/config-C-run-2/cpf-scores.md` — investigation section with F6 and F7 formal findings

**AC1 — F6: slicing strategy suppresses regulated propagation:**
Step 4a.2 adds a mandatory trigger enumeration step that fires after all stories are written, regardless of slicing strategy. The trigger definition provides two positive criteria (implementation code ACs; modifies system component within regulated scope) and three exclusion criteria (solely documentation; solely vendor engagement; solely post-implementation validation). In the Config C run 2 scenario: S1.2 has implementation code ACs (replication implementation) within PCI DSS CDE scope → triggers; S2.2 has implementation code ACs (failover automation) within PCI DSS CDE scope → triggers; S1.1 is solely scoping workshop → excluded; S1.3 is solely compliance team sign-off → excluded from C2 (but triggers C3). PASS.

**AC2 — F7: self-check table is feature-scoped:**
Step 4a.3 opens each triggering story artefact and checks the constraint in that story's Architecture Constraints field. The step cannot produce a false positive by accepting "constraint appears somewhere" — it requires "constraint appears in this story." The Config C run 2 false-positive (propagation table: "ALL FIVE CONSTRAINTS PROPAGATED" while S1.2 and S2.2 have no C2 AC) would fail Step 4a.3 on the first triggering story checked. PASS.

**AC3 — Anti-overfitting gate:**
Change 1: Step 4a is a new section inserted between existing steps — purely additive. Change 2: one new bullet in the quality checks list — purely additive. Neither change modifies or weakens any existing rule. PASS.

**AC4 — No regression, non-regulated features:**
The step header is explicit: "Run this step only when... Skip this step only if no regulated constraints are present." The skip condition is binary and evaluated at the start of the step from the discovery Constraints section. Features with no regulatory constraints proceed from Step 4 directly to Step 5. PASS.

**AC5 — Trigger definition concrete:**
Criterion 2 (has ACs that require implementation code) is directly observable from the AC text — no judgment needed. Criterion 1 (modifies system component within regulated scope) has a minor judgment dependency on "within the regulated scope" — accepted because (a) the operator confirmation step in 4a.2 provides a human review before the table is locked, and (b) a more specific boundary (e.g. "PCI DSS CDE") would be incorrect for AML/CFT, GDPR, and SOX which have different scope definitions. PASS.

**Recommended action:** Accept and apply both additions to `.github/skills/definition/SKILL.md`.

## Open items post-apply

1. **EXP-004:** Re-run Config C /definition stage (Sonnet or Haiku) on S1 discovery after SKILL.md is updated — confirm C2 chain = 1.00 at definition. This is the validation run referenced in the routing policy prohibition section.
2. **Trigger definition "within regulated scope" edge case:** If a future run produces a trigger assignment dispute (operator disagrees about scope boundary), log the dispute in decisions.md and consider a follow-on spec to tighten criterion 1 for that framework.
