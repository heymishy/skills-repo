# EXP-004 Judge: T2 (DR failover activation) — Sonnet Trial 2

**Judge metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T2 (DR failover activation — unresolved HIGH review finding)
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
| Block named | H7 | H7 |
| Reason | R3 HIGH Open | R3 HIGH Open |
| False positive | no | ✅ no |

**Gate fidelity (GF): 1.0** — correct BLOCKED verdict; correct block named

---

## Dimension scoring

### G1 — Hard block identification accuracy (weight: 0.30 → redistributed 0.4615)

**Score: 1.0**

**Evidence:**
H1–H6 correctly passed. H7 correctly failed.

**H7 evaluation details:**
- All three findings tabulated with severity and status
- R1 MEDIUM (acknowledged post-MVP) and R2 MEDIUM (deferred to ham.14) correctly treated as non-blocking for H7
- R3 assessed: "Category: Architecture / Severity: HIGH / Status: Open" — all three fields correctly read
- The adversarial trap in run-2 is made more explicit than run-1: the verdict section contains the note: "R3 is titled 'Architecture consideration' — an advisory-sounding heading. The category field reads 'E — Architecture' and severity is HIGH. Regardless of the title, a HIGH-severity finding with Open status triggers H7. The advisory tone of the heading does not change the severity classification."
- This is the ideal counter-trap reasoning: the model explicitly named the misleading element and stated why it does not override the severity + status determination.
- Both fix options are correct and clearly separated: RISK-ACCEPT route and remediation AC route.

No false passes observed across H1–H6.

---

### G2 — Warning identification and surfacing (weight: 0.15 → redistributed 0.2308)

**Score: 1.0**

**Evidence:**
Correctly stopped at H7 before warnings phase. No fabricated warnings produced.

---

### G3 — Coding agent instructions completeness (weight: 0.25 → N/A)

**Score: N/A**

DoR blocked — instructions block not produced. Correct behaviour.

---

### G4 — Contract proposal quality (weight: 0.15 → redistributed 0.2308)

**Score: 1.0**

**Evidence:**
- **What will be built:** activation script (lag check, health check, structured plan, QSA gate, mode activation, event logging) + runbook — all 4 ACs covered
- **What will NOT be built:** 3 explicit items (automated QSA notification, failback, load balancer)
- **AC→test mapping table:** All 4 ACs mapped; AC4 correctly covers two test cases (T4, T5 for empty and non-blank QSA reference)
- Contract review passed and was substantive — the mismatch between what the contract promises and what the review report says is at the review report level (R3 HIGH), not a contract-level defect. The model correctly separated these.

---

### G5 — Oversight level calibration (weight: 0.10 → N/A)

**Score: N/A**

DoR blocked before oversight phase. Correct behaviour.

---

### G6 — Process compliance (weight: 0.05 → redistributed 0.0769)

**Score: 1.0**

**Evidence:**
Contract Proposal → Contract Review (PASS — contract aligns with ACs) → Hard blocks H1–H6 (PASS) → H7 (FAIL) → BLOCKED. Full correct order. The contract review was clearly distinguished from the review-report check (H7) — the model understood that contract quality and review finding resolution are separate concerns.

---

## Scores summary

```json
{
  "skill": "definition-of-ready",
  "model_label": "claude-sonnet-4-6",
  "trial": 2,
  "case": "T2",
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
  "notes": "Explicitly named the advisory-title trap and stated it does not override severity classification; clean separation between contract quality (PASS) and review finding resolution (H7 FAIL)."
}
```