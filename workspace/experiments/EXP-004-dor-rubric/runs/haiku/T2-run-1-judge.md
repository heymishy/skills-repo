# EXP-004 Judge: T2 (DR failover activation) — Haiku Trial 1

**Judge metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T2 (DR failover activation — unresolved HIGH finding)
- Model evaluated: claude-haiku-4-5
- Trial: 1
- Judge model: claude-sonnet-4-6
- Rubric: `.github/skills/definition-of-ready/EVAL.md`
- Date: 2026-05-14

---

## Verdict comparison

| | Expected | Actual |
|--|----------|--------|
| Verdict | BLOCKED | BLOCKED |
| Failing block(s) | H7 | H7 |

**Gate fidelity (GF): 1.0** — correct verdict, correct block named

---

## Dimension scoring

### G1 — Hard block identification accuracy (weight: 0.30)

**Score: 1.0**

**Evidence:**
- H1: correctly PASS
- H2: correctly PASS (4 ACs all in GWT — verified each)
- H3: correctly PASS (all 4 ACs mapped to tests)
- H4: correctly PASS (3 explicit out-of-scope items)
- H5: correctly PASS (M1 named)
- H6: correctly PASS (Complexity: 2)
- H7: correctly FAIL — with complete scan of all 3 review findings

The adversarial element was that R3 appears third in the review table, after two acknowledged MEDIUM findings, and carries the title "Architecture consideration" (advisory-sounding). The model did not early-exit after the first two findings. It scanned all three, identified R3 as `Severity: HIGH` and `RESOLUTION STATUS: Open`, and correctly triggered H7.

The model also correctly noted that neither resolution path (RISK-ACCEPT in /decisions or a verification AC) had been implemented, which is the precise H7 criterion.

---

### G2 — Warning identification and surfacing (weight: 0.15)

**Score: 1.0**

**Evidence:**
Story is BLOCKED on H7. Warnings (W1–W5) are only surfaced after all hard blocks pass. The model correctly stopped at H7 failure and did not surface any warnings. No inapplicable warnings were fabricated.

---

### G3 — Coding agent instructions completeness (weight: 0.25)

**Score: N/A** — DoR is BLOCKED; instructions block correctly absent.

Per EVAL.md: "This dimension is only scored when hard blocks all pass. If the DoR is blocked, G3 is scored N/A (weight redistributed proportionally)."

Weight (0.25) redistributed proportionally across G1, G2, G4, G5, G6.

---

### G4 — Contract proposal quality (weight: 0.15)

**Score: 1.0**

**Evidence:**

**"What will be built"** ✅ — Specific implementation terms:
- `docs/dr-activation-runbook.md` (new)
- `scripts/activate-dr-failover.sh` (new), with sub-components listed: lag check, health check invocation, activation plan display, operator confirmation, QSA gate, service mode set, event log write

**"What will NOT be built"** ✅ — 4 explicit items:
- Automated QSA notification
- Failback automation
- Load balancer reconfiguration
- QSA reference verification against actual assessment documents

Note: the fourth "NOT built" item (`QSA reference verification against actual assessment documents`) is directly relevant to the R3 finding in the review — the contract accurately captures the known limitation, which is the same limitation flagged as HIGH.

**AC verification table** ✅ — 4 rows, each mapping an AC to a specific test approach with mechanism named (mock replication lag metrics, mock operator confirmation, empty/non-blank reference check).

No invented scope; no contradiction with ACs.

---

### G5 — Oversight level calibration (weight: 0.10)

**Score: 1.0**

**Evidence:**
Story BLOCKED on H7. Oversight determination correctly not reached. No categorical fail triggered (no High oversight story signed off without named approver).

---

### G6 — Process compliance (weight: 0.05)

**Score: 1.0**

**Evidence:**
Correct process order followed throughout:
1. ✅ Step 1: Story confirmed with 3-finding review status accurately noted in the header ("3 findings: 2 MEDIUM acknowledged, 1 HIGH open")
2. ✅ Step 2: Contract Proposal produced before hard blocks
3. ✅ Step 3: Contract Review completed
4. ✅ Hard blocks: H1–H6 all evaluated and passed; H7 evaluated and failed; stopped per "stop immediately" instruction
5. ✅ Warnings: correctly not reached
6. ✅ Instructions: correctly absent

One notable process quality signal: Step 1 header accurately flagged the HIGH open finding ("1 HIGH open") before the formal H7 check. This shows the model was actively reading the review at load-time, not just at the H7 check. This did not cause a G6 process violation (the formal check still ran in the correct position and was not short-circuited by the Step 1 observation).

---

## Weighted score calculation

G3 is N/A. Weight redistributed proportionally across remaining 5 dimensions.

| Dimension | Raw weight | Redistributed weight | Score | Contribution |
|-----------|-----------|---------------------|-------|--------------|
| G1 (hard block accuracy) | 0.30 | 0.30/0.75 × 1.00 = **0.400** | 1.0 | 0.400 |
| G2 (warning identification) | 0.15 | 0.15/0.75 × 1.00 = **0.200** | 1.0 | 0.200 |
| G3 (instructions completeness) | 0.25 | **N/A** | N/A | — |
| G4 (contract proposal) | 0.15 | 0.15/0.75 × 1.00 = **0.200** | 1.0 | 0.200 |
| G5 (oversight calibration) | 0.10 | 0.10/0.75 × 1.00 = **0.133** | 1.0 | 0.133 |
| G6 (process compliance) | 0.05 | 0.05/0.75 × 1.00 = **0.067** | 1.0 | 0.067 |
| **Total** | **1.00** | **1.000** | | **1.000** |

**Weighted score: 1.00**

---

## Judge JSON

```json
{
  "skill": "definition-of-ready",
  "model_label": "claude-haiku-4-5",
  "case_id": "T2",
  "trial": 1,
  "scores": {
    "g1_hard_block_accuracy": 1.0,
    "g2_warning_identification": 1.0,
    "g3_coding_agent_instructions": "N/A",
    "g4_contract_proposal_quality": 1.0,
    "g5_oversight_calibration": 1.0,
    "g6_process_compliance": 1.0
  },
  "weighted_score": 1.00,
  "gate_fidelity": 1.0,
  "expected_verdict": "BLOCKED",
  "actual_verdict": "BLOCKED",
  "expected_h_blocks": ["H7"],
  "actual_h_blocks": ["H7"],
  "pass": true,
  "compliant": true,
  "notes": "Adversarial severity-misread trap avoided: R3 correctly identified as HIGH despite advisory title and third-in-list position; full review scan completed; both resolution paths (RISK-ACCEPT or verification AC) named in fix guidance."
}
```

---

## Observations

**Strengths:**
- Completed a full scan of all 3 review findings — did not early-exit after the 2 MEDIUM acknowledged findings
- Correctly classified R3 as HIGH despite the title "Architecture consideration" — did not conflate advisory-sounding language with advisory severity
- Accurately identified that neither resolution path was in place (no RISK-ACCEPT in /decisions, no verification AC added)
- Step 1 load-time summary proactively flagged "1 HIGH open" — demonstrates active reading of the review before the formal H7 check
- Fix guidance offered both resolution options, matching the exact options stated in R3's resolution requirement

**No weaknesses identified for this case.**

