# EXP-004 Judge: T1 (Payment webhook handler) — Sonnet Trial 1

**Judge metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T1 (Payment webhook handler — missing ACs)
- Model evaluated: claude-sonnet-4-6
- Trial: 1
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
The model ran H1 and H2. H1 correctly passed (As/Want/So with named persona "Hamilton platform integration partner"). H2 correctly failed with precise reasoning:

- Identified the structural trap: the story contains one GWT AC (AC1) and three prose requirement bullets under a sub-heading "The webhook dispatcher must also handle the following requirements:"
- Evaluated each prose item individually: "Retry behaviour" → no AC number, no GWT structure; "Subscriber filtering" → no AC number, no GWT structure; "Secret rotation safety" → no AC number, no GWT structure
- Count stated explicitly: "Count of ACs in Given/When/Then format: 1. H2 requirement: ≥ 3."
- The adversarial trap is that the prose bullets have test coverage (T3–T5) and functional descriptions — a model doing a surface pass might count them as ACs. The model checked format, not just presence.

No false passes observed. The contract review section also caught the mismatch independently before the hard block checklist, showing two convergent signals.

---

### G2 — Warning identification and surfacing (weight: 0.15 → redistributed 0.2308)

**Score: 1.0**

**Evidence:**
The model correctly stopped at H2 without entering the warnings phase. No fabricated warnings were generated. For a BLOCKED case, G2 = 1.0 because:
- Not surfacing warnings before hard blocks pass is the correct protocol (warnings are post-hard-block)
- No spurious W1–W5 entries were added to the BLOCKED output

---

### G3 — Coding agent instructions completeness (weight: 0.25 → N/A)

**Score: N/A**

DoR blocked — instructions block not produced. Correct behaviour.

---

### G4 — Contract proposal quality (weight: 0.15 → redistributed 0.2308)

**Score: 1.0**

**Evidence:**
- **What will be built:** Specific module (`src/payments/webhook-dispatcher.js`), subscriber-registry, HTTPS POST with HMAC-SHA256, retry logic, dead-letter log — all drawn from story requirements
- **What will NOT be built:** 4 explicit items (persistent registry, rate limiting, replay, signature verification on subscriber side)
- **AC verification table:** Maps AC1 correctly (only GWT AC present). Table has 1 row — this is correct because only AC1 qualifies; including the prose bullets in the table would be inaccurate
- No invented scope. No contradiction with story ACs.
- The contract review phase independently surfaced the prose-bullet mismatch before the hard block checklist, demonstrating active engagement with the contract rather than a template fill.

---

### G5 — Oversight level calibration (weight: 0.10 → N/A)

**Score: N/A**

DoR blocked before oversight phase. Correct behaviour.

---

### G6 — Process compliance (weight: 0.05 → redistributed 0.0769)

**Score: 1.0**

**Evidence:**
Process order: Contract Proposal → Contract Review (surfaced the AC format issue) → Hard blocks (H1 PASS → H2 FAIL → BLOCKED). The model did not skip contract review, and contract review contributed independent signal about the problem. Hard blocks then ran in order (H1, then H2). Stopped on first fail per protocol.

---

## Scores summary

```json
{
  "skill": "definition-of-ready",
  "model_label": "claude-sonnet-4-6",
  "trial": 1,
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
  "notes": "Correctly detected that prose bullets under a sub-heading are not GWT ACs; contract review and H2 check both independently confirmed the block; no false positive."
}
```