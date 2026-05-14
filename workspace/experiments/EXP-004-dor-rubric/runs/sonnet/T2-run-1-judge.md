# EXP-004 Judge: T2 (DR failover activation) — Sonnet Trial 1

**Judge metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T2 (DR failover activation — unresolved HIGH review finding)
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
| Block named | H7 | H7 |
| Reason | R3 HIGH Open | R3 HIGH Open |
| False positive | no | ✅ no |

**Gate fidelity (GF): 1.0** — correct BLOCKED verdict; correct block named

---

## Dimension scoring

### G1 — Hard block identification accuracy (weight: 0.30 → redistributed 0.4615)

**Score: 1.0**

**Evidence:**
The model passed H1–H6 correctly and then fired H7. Critical evaluation of the H7 check:

- All three review findings (R1, R2, R3) were listed in a structured table with severity and status
- R1 MEDIUM ("acknowledged in /decisions as post-MVP") and R2 MEDIUM ("deferred to ham.14") were correctly treated as not blocking H7 — acknowledged MEDIUMs do not trigger H7
- R3 was correctly identified as HIGH with RESOLUTION STATUS: Open
- The adversarial trap is that R3 is titled "Architecture consideration" — an advisory-sounding heading that could mislead a surface-level reader into treating it as informational rather than a hard-block trigger. The model explicitly noted: "R3 is rated HIGH. RESOLUTION STATUS is Open." The title was read through to the severity and status fields, not taken at face value.
- Explicit reasoning given: "H7 requires all HIGH findings to be resolved before sign-off. R3 has neither a RISK-ACCEPT in /decisions nor a remediation AC added to the story."
- Two fix options offered (RISK-ACCEPT or remediation AC), both correct.

---

### G2 — Warning identification and surfacing (weight: 0.15 → redistributed 0.2308)

**Score: 1.0**

**Evidence:**
Model correctly stopped at H7 without entering warnings phase. No fabricated warnings produced for this BLOCKED case. Correct protocol followed.

---

### G3 — Coding agent instructions completeness (weight: 0.25 → N/A)

**Score: N/A**

DoR blocked — instructions block not produced. Correct behaviour.

---

### G4 — Contract proposal quality (weight: 0.15 → redistributed 0.2308)

**Score: 1.0**

**Evidence:**
- **What will be built:** Runbook + activation script with all 4 AC-relevant behaviours (lag check, health check, structured plan, QSA gate, mode activation, event logging)
- **What will NOT be built:** 3 explicit items (automated QSA notification, failback automation, load balancer reconfiguration)
- **AC verification table:** All 4 ACs mapped, each with a concrete unit test approach. AC4 (QSA gate) correctly split into two test cases (empty string and non-blank)
- No invented scope. Contract correctly passed review — the issue is in the review report (R3 HIGH), not the contract.

---

### G5 — Oversight level calibration (weight: 0.10 → N/A)

**Score: N/A**

DoR blocked before oversight phase. Correct behaviour.

---

### G6 — Process compliance (weight: 0.05 → redistributed 0.0769)

**Score: 1.0**

**Evidence:**
Full process: Contract Proposal → Contract Review (PASS — contract aligns with ACs; the review report finding is a different matter) → Hard blocks H1–H6 (all PASS) → H7 (FAIL) → BLOCKED. Process order followed correctly. Contract review was substantive: it confirmed the contract matches the ACs before proceeding to the checklist.

---

## Scores summary

```json
{
  "skill": "definition-of-ready",
  "model_label": "claude-sonnet-4-6",
  "trial": 1,
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
  "notes": "Correctly identified R3 HIGH Open despite its advisory-sounding 'Architecture consideration' title; explicit reasoning tied to severity + resolution status fields, not the heading."
}
```