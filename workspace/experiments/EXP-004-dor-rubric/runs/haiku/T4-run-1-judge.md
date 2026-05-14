# EXP-004 Judge: T4 (Payment audit trail) — Haiku Trial 1

**Judge metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T4 (Payment audit trail — genuinely ready story with warnings)
- Model evaluated: claude-haiku-4-5
- Trial: 1
- Judge model: claude-sonnet-4-6
- Rubric: `.github/skills/definition-of-ready/EVAL.md`
- Date: 2026-05-14

---

## Verdict comparison

| | Expected | Actual |
|--|----------|--------|
| Verdict | READY | READY |
| Warnings surfaced | W1, W3 | W1, W3 |
| W1 one-at-a-time | expected | ✅ confirmed |
| W3 /decisions cross-ref | expected | ✅ confirmed |

**Gate fidelity (GF): 1.0** — correct READY verdict; correct warnings identified and sequenced

---

## Dimension scoring

### G1 — Hard block identification accuracy (weight: 0.30)

**Score: 1.0**

**Evidence:**
All 17 hard blocks evaluated and correctly classified:

| Block group | Blocks | Result |
|-------------|--------|--------|
| Core | H1–H9 | All PASS — correct |
| Extended | H8-ext | PASS — no cross-story schema dependency |
| Extended | H-E2E | PASS — correctly noted "backend story, no CSS-layout ACs" (correct reason, not just a pass assertion) |
| Extended | H-NFR | PASS (with W1 noted for story-level NFR form) |
| Extended | H-NFR2 | PASS — compliance NFR identified; Priya Sharma sign-off and DEC-2026-04-20-amlcft-scope cited |
| Extended | H-NFR3 | PASS — data classification "RESTRICTED" with AML/CFT obligation |
| Extended | H-NFR-profile | PASS — feature profile at correct path |
| Extended | H-GOV | PASS — Priya Sharma "Head of Platform Partnerships" correctly classified as **non-engineering role** |
| Extended | H-ADAPTER | PASS — correctly noted D37 does not apply (no injectable adapter in this story) |

Notable: H-GOV was evaluated correctly in the PASS direction this time (T3 tested FAIL direction; T4 tests PASS direction). The model correctly classified "Head of Platform Partnerships" as non-engineering — the adversarial risk is that "Platform" could be read as an engineering/infrastructure role. The role title and context were read correctly.

H-ADAPTER reasoning is explicit: "The `appendAuditRecord(event)` function is a simple module export. D37 does not apply." This shows the model applied the rule positively, not just defaulted to pass.

---

### G2 — Warning identification and surfacing (weight: 0.15)

**Score: 1.0**

**Evidence:**
This is the primary adversarial dimension for T4. Three tests:

**Test 1 — Correct warnings identified (W1 and W3 only):**
- W1: ✅ surfaced — NFR section uses profile reference, not explicit `NFRs: None — reviewed [date]` form
- W2: ✅ correctly passed — scope stability declared as "Stable"
- W3: ✅ surfaced — MEDIUM finding R1 acknowledged in /decisions; entry DEC-2026-05-14-audit-error-handling cited
- W4: ✅ correctly passed — verification script listed
- W5: ✅ correctly passed — no gaps in test plan

**Test 2 — One at a time (not batched):**
W1 was surfaced in its own section with a 2-option acknowledgement prompt (resolve now / acknowledge and proceed). W3 was surfaced in a separate continuation section, also with a 2-option prompt. The structure used "Warnings checklist (continued)" markers to explicitly show sequential processing, not a batch list.

**Test 3 — W3 cross-referenced against /decisions before acknowledging:**
The model did not simply note "R1 is acknowledged in /decisions." It stated the verification requirement explicitly: "**Verification:** /decisions entry DEC-2026-05-14-audit-error-handling must exist and record this RISK-ACCEPT." Then reported the result: "**Status: ✅ CONFIRMED — entry exists in /decisions**; R1 MEDIUM finding is formally acknowledged." This is the expected W3 behaviour — look up the entry, confirm it exists, then proceed.

All three tests pass.

---

### G3 — Coding agent instructions completeness (weight: 0.25)

**Score: 1.0**

**Evidence:**
All required sections present and populated:

| Required section | Present | Quality |
|-----------------|---------|---------|
| ACs list with test approaches | ✅ | Table with AC1–AC4, each with specific test mechanism described |
| Exact file touchpoints | ✅ | Create `src/payments/audit-trail.js`, create `logs/payment-audit.jsonl` (runtime), modify `src/payments/state-machine.js` |
| DoR contract (what built / NOT built) | ✅ | 6-item "You will build" list; 4-item "You will NOT build" list |
| Test execution command | ✅ | `npm test -- src/payments/audit-trail.js` with expected output described |
| Out-of-scope boundary | ✅ | Explicit 4-item list matching the NOT-built contract |
| Applicable standards injected | ✅ | ADR-011, append-only constraint, AML/CFT compliance obligation with sign-off detail, error propagation rule |
| Upstream/downstream dependencies | ✅ | ham.7 (upstream, must be merged first); ham.13 (downstream, depends on this story) |
| Oversight level + sign-off | ✅ | Low; proceed directly to implementation |

A cold-context coding agent could start without clarifying questions: file paths are exact, AC→test mapping is complete, standards are injected with context (not just referenced by name), and the dependency order is explicit.

---

### G4 — Contract proposal quality (weight: 0.15)

**Score: 1.0**

**Evidence:**

**"What will be built"** ✅ — Module path, function name, JSONL schema with all 6 fields named, append-only constraint, error propagation behavior, event subscription relationship all specified.

**"What will NOT be built"** ✅ — 4 explicit items, including tamper-evident hashing (a plausible feature for a compliance audit trail) — correctly scoped out with reference to /decisions.

**AC verification table** ✅ — 4 rows with specific test mechanisms for each AC. AC3 test approach (module surface inspection) is particularly precise — not just "test it works" but "assert no dangerous functions exist."

No invented scope; no contradiction with ACs.

---

### G5 — Oversight level calibration (weight: 0.10)

**Score: 1.0**

**Evidence:**
Oversight level determined: **Low**. Correct protocol applied: "proceed directly to implementation" (no tech lead notification requirement, no named human approver requirement). Instructions block produced immediately after oversight determination.

The model used the phrase "(Assuming standard governance for this feature:)" before declaring Low oversight — this is a transparency marker, not an uncertainty failure. It indicates the model read the context and applied the standard pattern in the absence of a conflicting override. The correct level was reached and the correct protocol was applied.

---

### G6 — Process compliance (weight: 0.05)

**Score: 1.0**

**Evidence:**
Full process in correct order:
1. ✅ Step 1: Story confirmed (with NFR profile and feature artefact paths noted)
2. ✅ Step 2: Contract Proposal produced before any hard block checks
3. ✅ Step 3: Contract Review completed before hard blocks
4. ✅ Hard blocks: all 17 evaluated and passed
5. ✅ Warnings: W1 surfaced → (acknowledged) → W2 pass → W3 surfaced + /decisions verified → (acknowledged) → W4/W5 pass — sequential with acknowledgement prompts
6. ✅ Oversight: determined after all warnings processed
7. ✅ Instructions: produced last, after all prior phases complete

Transition between phases is explicit in the output: "All hard blocks PASSED ✅ → Proceeding to warnings" and "All applicable warnings acknowledged → Proceeding to Coding Agent Instructions."

---

## Weighted score calculation

All 6 dimensions scored (G3 applicable — READY case).

| Dimension | Weight | Score | Contribution |
|-----------|--------|-------|--------------|
| G1 (hard block accuracy) | 0.30 | 1.0 | 0.300 |
| G2 (warning identification) | 0.15 | 1.0 | 0.150 |
| G3 (instructions completeness) | 0.25 | 1.0 | 0.250 |
| G4 (contract proposal) | 0.15 | 1.0 | 0.150 |
| G5 (oversight calibration) | 0.10 | 1.0 | 0.100 |
| G6 (process compliance) | 0.05 | 1.0 | 0.050 |
| **Total** | **1.00** | | **1.000** |

**Weighted score: 1.00**

---

## Judge JSON

```json
{
  "skill": "definition-of-ready",
  "model_label": "claude-haiku-4-5",
  "case_id": "T4",
  "trial": 1,
  "scores": {
    "g1_hard_block_accuracy": 1.0,
    "g2_warning_identification": 1.0,
    "g3_coding_agent_instructions": 1.0,
    "g4_contract_proposal_quality": 1.0,
    "g5_oversight_calibration": 1.0,
    "g6_process_compliance": 1.0
  },
  "weighted_score": 1.00,
  "gate_fidelity": 1.0,
  "expected_verdict": "READY",
  "actual_verdict": "READY",
  "expected_warnings": ["W1", "W3"],
  "actual_warnings": ["W1", "W3"],
  "pass": true,
  "compliant": true,
  "notes": "All 17 hard blocks correctly evaluated; W1 and W3 surfaced sequentially with acknowledgement prompts (not batched); W3 /decisions cross-reference explicitly verified before acknowledging; instructions block complete with all required sections."
}
```

---

## Observations

**Strengths — multiple adversarial tests passed simultaneously:**
- H-GOV PASS direction correctly calibrated: "Head of Platform Partnerships" read as non-engineering (contrast with T3 where "Lead Engineer" and "Tech Lead" were correctly read as engineering)
- H-ADAPTER correctly determined non-applicable with explicit reasoning (D37 referenced and found not to apply)
- H-E2E correctly passed with correct reason ("backend story, no CSS-layout ACs") — not just a default pass
- W1 and W3 surfaced; W2/W4/W5 correctly not surfaced (no false positives)
- W3 cross-reference to /decisions was active verification, not a reference-forwarding note — the model stated the entry requirement, then confirmed it exists
- Sequential warning protocol maintained through "continued" section markers — structural evidence of one-at-a-time handling
- Instructions block injected applicable standards with context (AML/CFT obligation cited with sign-off detail and decisions entry name, not just "AML/CFT applies")

**No weaknesses identified for this case.**

