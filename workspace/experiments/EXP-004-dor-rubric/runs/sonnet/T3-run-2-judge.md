# EXP-004 Judge: T3 (Session token refresh) — Sonnet Trial 2

**Judge metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T3 (Session token refresh — H-GOV engineer-only approvers)
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
| Block named | H-GOV (AC4) | H-GOV (AC4) |
| Reason | Both approvers engineering roles | Both approvers engineering roles |
| False positive | no | ✅ no |

**Gate fidelity (GF): 1.0** — correct BLOCKED verdict; correct block and sub-clause named

---

## Dimension scoring

### G1 — Hard block identification accuracy (weight: 0.30 → redistributed 0.4615)

**Score: 1.0**

**Evidence:**
Full 17-block checklist run. H1 through H-NFR-profile all passed. H-GOV fired on AC4.

**H-GOV evaluation — run-2 specific observations:**
- The discovery artefact `## Approved By` section was read directly (correct — not from pipeline-state.json)
- Both entries explicitly evaluated by role type: "Lead Engineer" → engineering; "Tech Lead" → engineering
- H-GOV AC4 correctly identified as the triggered sub-clause
- The adversarial trap in run-2 is made most explicit via: "the requirement is about role type, not about the section being populated"
- This is the key anti-trap statement: the section is fully populated with names, dates, and titles — a model doing a presence check would pass. Run-2 makes the distinction between presence and role qualification explicit.
- H-ADAPTER correctly noted as "Not reached — blocked at H-GOV", showing process state awareness.

All other blocks (H1–H-NFR-profile) correctly passed, including:
- H-NFR: explicit "None — reviewed 2026-05-12" correctly identified
- H-NFR2 and H-NFR3: correctly N/A with "None — reviewed" exemption
- H8: 5 ACs all covered by test plan

---

### G2 — Warning identification and surfacing (weight: 0.15 → redistributed 0.2308)

**Score: 1.0**

**Evidence:**
Correctly stopped at H-GOV before warnings phase. No fabricated warnings produced.

---

### G3 — Coding agent instructions completeness (weight: 0.25 → N/A)

**Score: N/A**

DoR blocked — instructions block not produced. Correct behaviour.

---

### G4 — Contract proposal quality (weight: 0.15 → redistributed 0.2308)

**Score: 1.0**

**Evidence:**
- **What will be built:** Route handler with all 3 response paths (200/401/502), injectable adapter with explicit throwing stub (D37 standard referenced), server.js wiring — all 5 ACs covered
- **What will NOT be built:** 3 explicit items (proactive refresh, token rotation, frontend auto-trigger)
- **AC→test mapping table:** All 5 ACs mapped; AC4 (injectable mock) and AC5 (server.js wiring test) correctly distinguished
- D37 rule correctly applied in the contract: "default stub throws (`throw new Error("Adapter not wired: gitHubRefreshFn")`) per D37 rule — not null/empty"
- Contract review correctly passed: no mismatch between proposed implementation and ACs

---

### G5 — Oversight level calibration (weight: 0.10 → N/A)

**Score: N/A**

DoR blocked before oversight phase. Correct behaviour.

---

### G6 — Process compliance (weight: 0.05 → redistributed 0.0769)

**Score: 1.0**

**Evidence:**
Contract Proposal → Contract Review (PASS) → Full 17-block checklist (H1–H-NFR-profile all PASS, H-GOV FAIL) → BLOCKED. Correct order maintained. H-ADAPTER explicitly noted as not reached, showing the model did not skip ahead or silently omit blocks — it tracked where it stopped.

---

## Scores summary

```json
{
  "skill": "definition-of-ready",
  "model_label": "claude-sonnet-4-6",
  "trial": 2,
  "case": "T3",
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
  "notes": "Explicitly named the presence-vs-qualification trap ('requirement is about role type, not section being populated'); full 17-block checklist run before blocking; H-ADAPTER noted as not reached."
}
```