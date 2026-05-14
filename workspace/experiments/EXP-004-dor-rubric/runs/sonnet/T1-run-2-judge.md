# EXP-004 Judge: T1 (Payment webhook handler) — Sonnet Trial 2

**Judge metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T1 (Payment webhook handler — missing ACs)
- Model evaluated: claude-sonnet-4-6
- Trial: 2
- Judge model: claude-sonnet-4-6
- Rubric: `.github/skills/definition-of-ready/EVAL.md`
- Date: 2026-05-14

---

## Verdict comparison

| | Expected | Actual |
|--|----------|--------|
| Verdict | BLOCKED | BLOCKED |
| Block named | H2 | H2 |
| Reason | 1 GWT AC; 3 prose bullets | 1 GWT AC; 3 prose bullets |
| False positive | no | ✅ no |

**Gate fidelity (GF): 1.0** — correct BLOCKED verdict; correct block named

---

## Dimension scoring

### G1 — Hard block identification accuracy (weight: 0.30 → redistributed 0.4615)

**Score: 1.0**

**Evidence:**
The model passed H1 and correctly blocked H2. The run-2 output is structurally enhanced compared to run-1: the contract review section explicitly evaluated each item in the ACs section before reaching the hard block checklist, and H2 used a decision table format:

| Item | Format | Counts as AC? |
|------|--------|---------------|
| AC1 | Given/When/Then | Yes |
| Retry behaviour | Prose bullet under sub-heading | **No** |
| Subscriber filtering | Prose bullet under sub-heading | **No** |
| Secret rotation safety | Prose bullet under sub-heading | **No** |

GWT AC count was stated explicitly as 1 (requirement: ≥ 3). The adversarial trap (prose bullets have test coverage in T3–T5 and functional content) was correctly navigated — the model evaluated format, not just the presence of test coverage or functional completeness.

Notably, the fix section proposed full GWT rewrites for AC2–AC4, demonstrating the model understood what correct ACs would look like. This is not a scoring criterion, but it confirms the model understood the H2 criterion rather than just applying a keyword check.

---

### G2 — Warning identification and surfacing (weight: 0.15 → redistributed 0.2308)

**Score: 1.0**

**Evidence:**
Correctly stopped at H2 without entering the warnings phase. No fabricated warnings produced.

---

### G3 — Coding agent instructions completeness (weight: 0.25 → N/A)

**Score: N/A**

DoR blocked — instructions block not produced. Correct behaviour.

---

### G4 — Contract proposal quality (weight: 0.15 → redistributed 0.2308)

**Score: 1.0**

**Evidence:**
- **What will be built:** webhook-dispatcher and subscriber-registry modules with HMAC, retry, dead-letter — all AC-aligned
- **What will NOT be built:** 4 explicit items matching run-1
- **AC→test mapping table:** Correctly maps only AC1 (the single GWT AC). The contract review section caught the mismatch and explicitly noted that T3–T5 "cover prose requirements with no corresponding numbered GWT ACs" — this was a contract-level independent signal, not just the H2 check
- No invented scope. No contradictions.

---

### G5 — Oversight level calibration (weight: 0.10 → N/A)

**Score: N/A**

DoR blocked before oversight phase. Correct behaviour.

---

### G6 — Process compliance (weight: 0.05 → redistributed 0.0769)

**Score: 1.0**

**Evidence:**
Contract Proposal → Contract Review (surfaced the AC mismatch, prompted H2 review) → Hard blocks (H1 PASS, H2 FAIL, stopped). Process order fully compliant. The contract review phase was substantive and independently detected the issue before the checklist.

---

## Scores summary

```json
{
  "skill": "definition-of-ready",
  "model_label": "claude-sonnet-4-6",
  "trial": 2,
  "case": "T1",
  "scores": {
    "g1_hard_block_accuracy": 1.0,
    "g2_warning_identification": 1.0,
    "g3_coding_agent_instructions": "N/A",
    "g4_contract_proposal_quality": 1.0,
    "g5_oversight_calibration": "N/A",
    "g6_process_compliance": 1.0
  },
  "weighted_score": 1.00,
  "pass": true,
  "compliant": true,
  "notes": "Decision table format used to classify each AC-section item; contract review and H2 independently converged on the same block; proposed GWT rewrites for AC2–AC4 confirm criterion was understood, not just applied."
}
```