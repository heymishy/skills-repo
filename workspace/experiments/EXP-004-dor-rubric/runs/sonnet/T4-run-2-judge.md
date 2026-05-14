# EXP-004 Judge: T4 (Payment audit trail) — Sonnet Trial 2

**Judge metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T4 (Payment audit trail — genuinely ready story with warnings)
- Model evaluated: claude-sonnet-4-6
- Trial: 2
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
All 17 hard blocks evaluated and correctly classified:

| Block group | Blocks | Result |
|-------------|--------|--------|
| Core | H1–H9 | All PASS |
| Extended | H8-ext | PASS — correct N/A (no schema fields introduced) |
| Extended | H-E2E | PASS — "Backend module; no CSS-layout AC types" |
| Extended | H-NFR | PASS (substantive) — NFR profile exists; W1 flagged for delegation form |
| Extended | H-NFR2 | PASS — AML/CFT Act 2009 Schedule 2 §4(b); Priya Sharma sign-off + DEC-2026-04-20-amlcft-scope |
| Extended | H-NFR3 | PASS — "RESTRICTED — payment transaction data with AML/CFT regulatory obligation" |
| Extended | H-NFR-profile | PASS — profile path confirmed in input bundle |
| Extended | H-GOV | PASS — "Head of Platform Partnerships" classified as non-engineering; "Positive M1 signal: approver role is unambiguously non-engineering" |
| Extended | H-ADAPTER | PASS (N/A) — "plain file-write module; no setX() injectable adapter; D37 does not apply" |

H-GOV PASS direction confirmed: the model correctly classified "Head of Platform Partnerships" as non-engineering. H-ADAPTER N/A reasoning is explicit and correct.

---

### G2 — Warning identification and surfacing (weight: 0.15)

**Score: 1.0**

**Evidence:**

**Test 1 — Correct warnings identified:**
- W1 ✅ — NFR section uses `"See .../nfr-profile.md"` delegation reference, not `NFRs: None — reviewed [date]` canonical form
- W2 ✅ — correctly passed (`Scope Stability: Stable`)
- W3 ✅ — R1 MEDIUM surfaced; /decisions entry DEC-2026-05-14-audit-error-handling cited
- W4 ✅ — correctly passed
- W5 ✅ — correctly passed (no gaps)

**Test 2 — Surfaced one at a time:**
W1 surfaced in a dedicated "Warning W1" section with 2-option acknowledgement prompt ("Assume: 2 — acknowledged. Proceeding."). W3 surfaced in a separate "Warning W3" section, also with a 2-option prompt. Sequential structure confirmed.

**Test 3 — W3 /decisions cross-reference:**
"Verifying the /decisions cross-reference: entry `DEC-2026-05-14-audit-error-handling` is cited directly in the review report status field. ✅ Confirmed in /decisions." The model verified the entry before acknowledging rather than accepting the review report's assertion at face value.

---

### G3 — Coding agent instructions completeness (weight: 0.25)

**Score: 1.0**

**Evidence:**
Instructions block is more compact than run-1 but contains all required content:

| Required section | Present | Notes |
|-----------------|---------|-------|
| ACs list | ✅ | Table: AC1–AC4, each with requirement (test IDs not duplicated in table — present in AC→test mapping in Step 2) |
| Exact file touchpoints | ✅ | 3 files: `src/payments/audit-trail.js` (Create), `src/payments/state-machine.js` (Modify), `logs/payment-audit.jsonl` (runtime) |
| DoR contract (build / NOT build) | ✅ | Build list + "Do not build" list |
| Test execution command | ✅ | "Run `npm test` and walk verification script before claiming complete" |
| Key constraints / standards | ✅ | `fs.appendFileSync` only, API surface restriction, error propagation, data classification RESTRICTED, AML/CFT Act 2009 Schedule 2 §4(b), ADR-011 |
| Dependencies | ✅ | ham.7 upstream; ham.13 downstream |
| Oversight level | ✅ | Low — proceed directly |

A cold-context coding agent has the essential information: exact file paths, the specific API to use, the compliance context, and the dependency order. The more compact format does not omit any required element.

---

### G4 — Contract proposal quality (weight: 0.15)

**Score: 1.0**

**Evidence:**
- **What will be built:** `appendAuditRecord` + `_getLogPath` with JSONL schema (all 6 fields named), ham.7 event subscription, error propagation, API surface constraint — all AC-derived
- **What will NOT be built:** 4 explicit items (encryption, query/reporting, log rotation, tamper-evident hashing)
- **AC→test mapping table:** All 4 ACs mapped; AC2 correctly has 2 tests (T2, T3)
- The append-only API surface constraint is explicitly stated as a build requirement ("API surface constraint: no truncate, overwrite, or clear functions exported at any time")
- No invented scope. No contradictions.

---

### G5 — Oversight level calibration (weight: 0.10)

**Score: 1.0**

**Evidence:**
Oversight level: Low. Correct protocol applied: "Proceed directly to coding agent assignment." Epic `ham-epic-2-notification-and-reporting` cited. No sign-off step added (correct for Low).

---

### G6 — Process compliance (weight: 0.05)

**Score: 1.0**

**Evidence:**
Full correct order: Contract Proposal → Contract Review (PASS) → Hard blocks H1–H-ADAPTER (all PASS) → Warnings W1 then W3 (sequential) → Oversight (Low) → Standards injection (skipped — no domain field) → Coding Agent Instructions → READY verdict.

---

## Scores summary

```json
{
  "skill": "definition-of-ready",
  "model_label": "claude-sonnet-4-6",
  "trial": 2,
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
  "notes": "All 17 hard blocks correct; W1 and W3 surfaced sequentially with W3 /decisions cross-reference verified; compact instructions block complete; H-GOV PASS direction correctly confirmed with explicit non-engineering role classification."
}
```