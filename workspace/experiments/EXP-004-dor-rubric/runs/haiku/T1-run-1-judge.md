# EXP-004 Judge: T1 (Payment webhook) — Haiku Trial 1

**Judge metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T1 (Payment webhook handler — missing ACs)
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
| Failing block(s) | H2 | H2 |

**Gate fidelity (GF): 1.0** — correct verdict, correct block named

---

## Dimension scoring

### G1 — Hard block identification accuracy (weight: 0.30)

**Score: 1.0**

**Evidence:**
- H1: correctly identified as PASS (As/Want/So with named persona — "Hamilton platform integration partner")
- H2: correctly identified as FAIL, with precise breakdown:
  - AC1 correctly classified as GWT ✅
  - Retry behaviour correctly identified as prose bullet (no GWT), no AC number ❌
  - Subscriber filtering correctly identified as prose bullet (no GWT), no AC number ❌
  - Secret rotation correctly identified as prose bullet (no GWT), no AC number ❌
- Model stopped at H2 per SKILL.md "stop immediately" instruction — correct

The adversarial failure mode (AC-count-only check: "story has 4 bullet items, therefore H2 passes") was avoided. The model distinguished between prose requirements and GWT-formatted ACs with item-level specificity. Fix guidance included rewritten GWT forms for AC2, AC3, AC4.

---

### G2 — Warning identification and surfacing (weight: 0.15)

**Score: 1.0**

**Evidence:**
The story is BLOCKED on H2. Per SKILL.md process, warnings (W1–W5) are only surfaced after all hard blocks pass. No warnings were surfaced — which is the correct behaviour for a BLOCKED state. The model did not fabricate any inapplicable warnings, and did not skip to warnings prematurely before the hard block checklist completed.

No warnings were applicable; none were fabricated.

---

### G3 — Coding agent instructions completeness (weight: 0.25)

**Score: N/A** — DoR is BLOCKED; instructions block correctly absent.

Per EVAL.md: "This dimension is only scored when hard blocks all pass. If the DoR is blocked, G3 is scored N/A (weight redistributed proportionally)."

Weight (0.25) redistributed proportionally across G1, G2, G4, G5, G6.

---

### G4 — Contract proposal quality (weight: 0.15)

**Score: 1.0**

**Evidence:**
All three required elements present and accurate:

**"What will be built"** ✅ — Specific implementation terms used throughout:
- `src/payments/webhook-dispatcher.js` (new module) named
- Retry logic (3 retries, 1s/2s/4s backoff) described
- Subscriber filtering via `statusFilter` described
- Secret rotation (read at dispatch time) described
- Dead-letter log at `logs/webhook-dead-letter.jsonl` named

**"What will NOT be built"** ✅ — 5 explicit items:
- Persistent subscriber registry
- Rate limiting per subscriber
- Historical event replay
- Subscriber-side signature verification
- Log rotation or encryption

**AC verification table** ✅ — 4 rows mapping AC1 and all 3 prose requirements to specific test approaches with test types. Each entry names the specific mechanism (spy on https.request, filter array check, env spy).

No invented scope. No contradiction with story ACs. The contract correctly treats the prose requirements as implementation targets even before the H2 failure is formally flagged — the contract phase reveals implementable intent; H2 flags the specification deficiency separately.

---

### G5 — Oversight level calibration (weight: 0.10)

**Score: 1.0**

**Evidence:**
Oversight determination is downstream of all hard blocks passing. For a BLOCKED story the process correctly stops before reaching the oversight step. The model did not attempt to determine oversight level on a blocked story, and no categorical fail was triggered (no High oversight story signed off without named approver).

Behaviour is correct: oversight not assessed on blocked story.

---

### G6 — Process compliance (weight: 0.05)

**Score: 1.0**

**Evidence:**
Full correct process order followed:
1. ✅ Step 1: Story confirmed with review/test plan/verification script referenced
2. ✅ Step 2: Contract Proposal produced (what built / NOT built / AC-test table / assumptions / touch points)
3. ✅ Step 3: Contract Review completed before hard blocks
4. ✅ Hard blocks: H1 evaluated, H2 evaluated, stopped at H2 FAIL per "stop immediately" instruction
5. ✅ Warnings: not reached (correct — only applicable after all blocks pass)
6. ✅ Instructions: correctly absent (blocked)

No phases skipped; no phases out of order; no instructions produced without running hard blocks.

---

## Weighted score calculation

G3 is N/A. EVAL.md redistribution: weight redistributed proportionally across remaining 5 dimensions.

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
  "case_id": "T1",
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
  "expected_h_blocks": ["H2"],
  "actual_h_blocks": ["H2"],
  "pass": true,
  "compliant": true,
  "notes": "Perfect execution: H2 correctly caught with item-level prose-vs-GWT breakdown; adversarial AC-count trap avoided; contract proposal complete and accurate; process order followed; no warnings fabricated on blocked story."
}
```

---

## Observations

**Strengths:**
- Did not fall for the adversarial trap (story has 4 bullet items under ACs, model counted GWT format not items)
- Breakdown was item-level: each of the 3 prose requirements was individually identified and the missing GWT structure called out explicitly
- Fix guidance was concrete: provided rewritten GWT forms for AC2, AC3, AC4
- Contract proposal complete and thorough with all required elements

**No weaknesses identified for this case.**

