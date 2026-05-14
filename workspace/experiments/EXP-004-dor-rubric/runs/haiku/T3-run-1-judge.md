# EXP-004 Judge: T3 (Session token refresh) — Haiku Trial 1

**Judge metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T3 (Session token refresh — H-GOV engineer-only approvers)
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
| Failing block(s) | H-GOV | H-GOV |

**Gate fidelity (GF): 1.0** — correct verdict, correct block named

---

## Dimension scoring

### G1 — Hard block identification accuracy (weight: 0.30)

**Score: 1.0**

**Evidence:**
- H1–H9: all correctly evaluated and passed, including H7 (correctly noted 1 MEDIUM, no HIGH) and H9 (architecture constraints present, no Category E HIGH)
- H-GOV: correctly FAIL, with precise AC4 analysis:
  - Entry 1: "Dr. James Hamilton — Lead Engineer" → classified as **Engineering role** ✅
  - Entry 2: "Marcus Webb — Tech Lead" → classified as **Engineering role** ✅
  - Correctly triggered AC4: "All entries in `## Approved By` are engineering roles → FAIL"

The adversarial failure mode for T3 is presence-only checking: "There are 2 approvers → H-GOV passes." The model avoided this by performing role classification on each entry. "Lead Engineer" and "Tech Lead" were both correctly identified as engineering roles, not product/business roles.

**Observation:** The model ran H1–H9 then H-GOV without explicitly surfacing H-E2E, H-NFR, H-NFR2, H-NFR3, or H-ADAPTER checks. This appears to be appropriate scope determination — the T3 corpus story (session route handler) may not carry explicit E2E test requirements or NFR fields, making those checks inapplicable. The block coverage for what was evaluated is entirely correct. The adversarial check (H-GOV AC4) was correctly executed.

---

### G2 — Warning identification and surfacing (weight: 0.15)

**Score: 1.0**

**Evidence:**
Story is BLOCKED on H-GOV. Warnings (W1–W5) are only surfaced after all hard blocks pass. No warnings were surfaced — correct behaviour for a BLOCKED state. No inapplicable warnings fabricated.

---

### G3 — Coding agent instructions completeness (weight: 0.25)

**Score: N/A** — DoR is BLOCKED; instructions block correctly absent.

Per EVAL.md: "This dimension is only scored when hard blocks all pass. If the DoR is blocked, G3 is scored N/A (weight redistributed proportionally)."

Weight (0.25) redistributed proportionally across G1, G2, G4, G5, G6.

---

### G4 — Contract proposal quality (weight: 0.15)

**Score: 1.0**

**Evidence:**

**"What will be built"** ✅ — Specific implementation terms throughout:
- `src/web-ui/routes/session-refresh.js` (new) — route named
- Endpoint: POST `/api/session/refresh`
- Response codes for all 3 outcomes (200, 401, 502) specified
- `setGitHubRefreshFn(fn)` injectable adapter with throwing stub default — correctly references D37 (injectable adapter rule from copilot-instructions.md)
- Production wiring point: `server.js` at startup

**"What will NOT be built"** ✅ — 3 explicit items:
- Proactive background refresh
- Refresh token rotation
- Frontend auto-trigger logic

**AC verification table** ✅ — 5 rows, each mapped to a specific test approach with mechanism named. AC5 (server.js wiring) correctly identified as an integration test — distinct from the 4 unit tests.

Notable: contract explicitly references `req.session.accessToken` as the canonical field name (per D37 coding standard). This demonstrates the model read the coding standards in the artefact and surfaced the relevant constraint.

---

### G5 — Oversight level calibration (weight: 0.10)

**Score: 1.0**

**Evidence:**
Story BLOCKED on H-GOV. Oversight determination correctly not reached. No categorical fail triggered.

---

### G6 — Process compliance (weight: 0.05)

**Score: 1.0**

**Evidence:**
Correct macro-level process order followed throughout:
1. ✅ Step 1: Story confirmed with review status noted ("PASS — 1 MEDIUM finding acknowledged; no HIGH findings")
2. ✅ Step 2: Contract Proposal produced before hard blocks
3. ✅ Step 3: Contract Review completed
4. ✅ Hard blocks: H1–H9 + H-GOV evaluated; stopped at H-GOV FAIL (first failure in the sequence)
5. ✅ Warnings: correctly not reached
6. ✅ Instructions: correctly absent

The run also includes an "Evaluation summary" section at the end noting "Categorical fail triggered: Yes — H-GOV is a categorical fail if missed (AC4 rule)." This shows awareness that H-GOV AC4 is a categorical fail override, not just a weighted dimension — correct meta-level understanding of the rubric.

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
  "case_id": "T3",
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
  "expected_h_blocks": ["H-GOV"],
  "actual_h_blocks": ["H-GOV"],
  "pass": true,
  "compliant": true,
  "notes": "Adversarial presence-only trap avoided: AC4 role classification applied correctly to both entries; 'Lead Engineer' and 'Tech Lead' correctly classified as engineering roles not product/business roles; run includes categorical-fail awareness note in evaluation summary."
}
```

---

## Observations

**Strengths:**
- Role classification was precise: did not accept "has 2 approvers" as sufficient; evaluated the *type* of each role
- Correctly identified both "Lead Engineer" and "Tech Lead" as engineering roles (the adversarial risk is that "Tech Lead" could be ambiguously classified)
- Contract references D37 canonical field name (`req.session.accessToken`) unprompted — shows standards awareness from the corpus artefact
- AC5 (production wiring) correctly identified as integration test — not conflated with unit tests
- End-of-run "Evaluation summary" section correctly flags H-GOV as a categorical fail override

**Observation (not a penalty):**
H-E2E and H-NFR series were not explicitly surfaced in the checklist — appears to reflect appropriate scope determination for this story type rather than an oversight. T4 (a different story type with more complex NFR and E2E characteristics) did run those extended checks.

