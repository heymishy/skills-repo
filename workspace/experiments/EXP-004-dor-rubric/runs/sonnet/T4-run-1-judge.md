# EXP-004 Judge: T4 (Payment audit trail) — Sonnet Trial 1

**Judge metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T4 (Payment audit trail — genuinely ready story with warnings)
- Model evaluated: claude-sonnet-4-6
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
| False positive | n/a (correct READY) | — |

**Gate fidelity (GF): 1.0** — correct READY verdict; correct warnings identified and sequenced

---

## Dimension scoring

### G1 — Hard block identification accuracy (weight: 0.30)

**Score: 1.0**

**Evidence:**
All 17 hard blocks evaluated in full and correctly classified:

| Block group | Blocks | Result |
|-------------|--------|--------|
| Core | H1–H9 | All PASS — correct |
| Extended | H8-ext | PASS — no cross-story schema dependency (correct N/A reasoning) |
| Extended | H-E2E | PASS — correctly noted "backend audit trail module, no CSS-layout ACs" |
| Extended | H-NFR | PASS (substantive) — profile exists; W1 noted for delegation form |
| Extended | H-NFR2 | PASS — AML/CFT Act 2009 Schedule 2 §4(b) identified; Priya Sharma sign-off + DEC-2026-04-20-amlcft-scope cited |
| Extended | H-NFR3 | PASS — "RESTRICTED" data classification found in NFR profile |
| Extended | H-NFR-profile | PASS — `artefacts/2026-04-15-hamilton-dr-failover/nfr-profile.md` present |
| Extended | H-GOV | PASS — "Priya Sharma — Head of Platform Partnerships" correctly classified as non-engineering role |
| Extended | H-ADAPTER | PASS (N/A) — explicit reasoning: "appendAuditRecord is a plain file-write export; no setX() injectable adapter introduced; D37 does not apply" |

Notable H-GOV evaluation: T4 tests the PASS direction for H-GOV (T3 tested FAIL). The model correctly classified "Head of Platform Partnerships" as non-engineering. The adversarial risk here is that "Platform" could be read as infrastructure/engineering. The model identified the partnerships/business nature of the role and recorded a positive M1 signal.

Notable H-ADAPTER evaluation: explicit positive reasoning (D37 does not apply because no injectable adapter is present) rather than a default pass assertion.

---

### G2 — Warning identification and surfacing (weight: 0.15)

**Score: 1.0**

**Evidence:**

**Test 1 — Correct warnings identified (W1 and W3 only):**
- W1 ✅ — NFR section uses `"See .../nfr-profile.md..."` delegation form, not `NFRs: None — reviewed [date]` canonical form. Correctly surfaced.
- W2 ✅ — correctly passed (`Scope Stability: Stable` present)
- W3 ✅ — MEDIUM finding R1 correctly surfaced; /decisions entry DEC-2026-05-14-audit-error-handling cited
- W4 ✅ — correctly passed (verification script referenced)
- W5 ✅ — correctly passed (no gaps in test plan)

**Test 2 — Surfaced one at a time:**
W1 was surfaced in a dedicated "Warning W1" section with a 2-option acknowledgement prompt ("Assume: 2 — acknowledge and proceed"). W3 was surfaced separately in its own "Warning W3" section, also with a 2-option acknowledgement prompt. Sequential structure confirmed — not a batched list.

**Test 3 — W3 /decisions cross-reference:**
The model verified the /decisions entry before acknowledging W3: "Verifying /decisions acknowledgement: Entry `DEC-2026-05-14-audit-error-handling` is stated in the review report status field. ✅ Confirmed acknowledged." This is the expected W3 behaviour — the model did not accept the review report's claim at face value but explicitly confirmed the entry exists.

---

### G3 — Coding agent instructions completeness (weight: 0.25)

**Score: 1.0**

**Evidence:**
All required sections present and populated:

| Required section | Present | Quality |
|-----------------|---------|---------|
| ACs list with test mappings | ✅ | Table: AC1–AC4, each with test approach and test IDs |
| Exact file touchpoints | ✅ | 3 files: `src/payments/audit-trail.js` (Create), `logs/payment-audit.jsonl` (runtime), `src/payments/state-machine.js` (Modify) |
| DoR contract (build / NOT build) | ✅ | 3-item build list; 4-item NOT-build list |
| Test execution command | ✅ | `npm test` with expected result described |
| Out-of-scope boundary | ✅ | 4 explicit "Do not" items matching NOT-build contract |
| Applicable standards | ✅ | Append-only ADR constraint, ADR-011 artefact-first, AML/CFT Act 2009 with sign-off detail, error propagation rule, data classification |
| Dependencies | ✅ | ham.7 upstream (must be merged first); ham.13 downstream noted |
| Oversight level | ✅ | Low; proceed directly to implementation |

A cold-context coding agent has everything needed: exact file paths, specific Node.js API to use (`fs.appendFileSync`), the full compliance context, and the dependency order.

---

### G4 — Contract proposal quality (weight: 0.15)

**Score: 1.0**

**Evidence:**
- **What will be built:** Module with `appendAuditRecord`, `_getLogPath`, JSONL schema (all 6 fields named), error propagation, event subscription — all drawn from story ACs
- **What will NOT be built:** 4 explicit items (application-layer encryption, query/reporting UI, log rotation, tamper-evident hashing) — no invented scope, all justified
- **AC verification table:** All 4 ACs mapped with concrete test mechanisms. AC3 (API surface check) correctly identified as an import + export inspection test. AC4 (error propagation) correctly identified as a `fs.appendFileSync` mock + throw assertion.
- The "append flag — no overwrite path" constraint was explicitly stated in the build description, showing comprehension beyond surface-level AC reading.

---

### G5 — Oversight level calibration (weight: 0.10)

**Score: 1.0**

**Evidence:**
Oversight level: Low. Correct protocol: "No formal sign-off required. Proceed directly to coding agent assignment." The epic reference was cited (`ham-epic-2-notification-and-reporting`). The Low protocol was applied correctly in the instructions block: no tech lead notification step, no named approver capture.

---

### G6 — Process compliance (weight: 0.05)

**Score: 1.0**

**Evidence:**
Full correct order: Contract Proposal → Contract Review (PASS) → Hard blocks H1–H-ADAPTER (all PASS) → Warnings W1–W5 (W1 then W3 surfaced sequentially) → Oversight (Low) → Standards injection (skipped — no domain field) → Coding Agent Instructions block → READY verdict. All five phases present in correct order.

---

## Scores summary

```json
{
  "skill": "definition-of-ready",
  "model_label": "claude-sonnet-4-6",
  "trial": 1,
  "case": "T4",
  "scores": {
    "g1_hard_block_accuracy": 1.0,
    "g2_warning_identification": 1.0,
    "g3_coding_agent_instructions": 1.0,
    "g4_contract_proposal_quality": 1.0,
    "g5_oversight_calibration": 1.0,
    "g6_process_compliance": 1.0
  },
  "weighted_score": 1.00,
  "pass": true,
  "compliant": true,
  "notes": "All 17 hard blocks correctly evaluated; W1 and W3 surfaced sequentially with acknowledgement prompts; W3 cross-referenced /decisions before acknowledging; complete instructions block produced; H-GOV PASS direction correctly identified."
}
```