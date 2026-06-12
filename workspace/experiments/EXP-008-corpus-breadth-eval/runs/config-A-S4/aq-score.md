# AQ Score: Experience API Layer — Card Services Platform Migration (S4 Config A)

**STATUS: SELF-SCORED — INVALID**

---

## Notice

This file was created by the same session that produced the pipeline artefacts (discovery.md, definition.md, review.md, test-plan.md, dor.md). Per EXP-008-corpus-breadth-eval CONVENTIONS.md, same-session self-scoring is invalid for the Artefact Quality (AQ) dimension.

**aq_status: requires_judge_scoring**

AQ scoring for this run must be performed by the designated judge model (claude-sonnet-4-6, as locked in manifest.md) in a separate session with no prior context from this run session. The judge must read each artefact cold and score against the AQ rubric without knowledge of the CPF evaluation intent.

---

## Run identification

| Field | Value |
|-------|-------|
| Story | S4 — Experience API Layer — Card Services (PCI DSS) |
| Config | A — Uniform claude-sonnet-4-6 |
| Run date | 2026-05-18 |
| Pipeline artefacts produced | discovery.md, definition.md, review.md, test-plan.md, dor.md |

---

## CPF scores (valid — evaluator-scored)

| Metric | Score |
|--------|-------|
| cpf_general | 1.00 (5/5 constraints surfaced: C1, C2, C3, C4, C5) |
| cpf_regulated | 1.00 (all three regulated constraints C1, C2, C4 surfaced with named gate owners and explicit test coverage) |
| C5 surfaced | true |
| C5 surfacing quality | full (not injection-aided) |
| C5 surface stage | /discovery |

---

## AQ score (placeholder — judge scoring required)

| Dimension | Score | Notes |
|-----------|-------|-------|
| problem_framing | — | Judge scoring required |
| scope_discipline | — | Judge scoring required |
| story_testability | — | Judge scoring required |
| nfr_specificity | — | Judge scoring required |
| dor_gate_quality | — | Judge scoring required |
| **AQ total** | **—** | **Requires judge scoring** |

---

## Instructions for judge

1. Read the following artefacts cold (no prior session context):
   - `runs/config-A-S4/discovery.md`
   - `runs/config-A-S4/definition.md`
   - `runs/config-A-S4/review.md`
   - `runs/config-A-S4/test-plan.md`
   - `runs/config-A-S4/dor.md`
2. Score each AQ dimension (0, 1, or 2) using the rubric in `judge-prompts/aq-scoring-prompt.md`
3. Record the score and rationale in this file
4. Update `run-record.yaml` fields: `aq`, `aq_status: scored`, `aq_judge_date`, `aq_judge_model`, `aq_dimensions`
5. Update the AQ tracker table in `manifest.md`

**Do not reference this notice or the CPF scores during AQ scoring.** Score each dimension on artefact quality alone, cold.
