# EXP-004 Judge: T3 (Session token refresh) — Sonnet Trial 1

**Judge metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T3 (Session token refresh — H-GOV engineer-only approvers)
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
| Block named | H-GOV (AC4) | H-GOV (AC4) |
| Reason | Both approvers engineering roles | Both approvers engineering roles |
| False positive | no | ✅ no |

**Gate fidelity (GF): 1.0** — correct BLOCKED verdict; correct block and sub-clause named

---

## Dimension scoring

### G1 — Hard block identification accuracy (weight: 0.30 → redistributed 0.4615)

**Score: 1.0**

**Evidence:**
The model ran all 17 hard blocks in full. H1 through H-NFR-profile all passed correctly. H-GOV correctly failed.

**Evaluating the H-GOV check (the critical dimension):**
- The model read the `## Approved By` section directly from the discovery artefact (not from pipeline-state.json — correct per H-GOV instruction)
- Correctly cited both entries: "Dr. James Hamilton — Lead Engineer" and "Marcus Webb — Tech Lead"
- Evaluated each entry's role type: "Lead Engineer" → engineering ✅; "Tech Lead" → engineering ✅
- Correctly identified H-GOV AC4 as the applicable sub-clause: "All entries in `## Approved By` are engineering roles"
- The adversarial trap is that the section is fully populated with named entries, dates, and titles — a presence-only check would pass. The model correctly performed role-type evaluation, not just presence detection.
- Explicit quote: "H-GOV requires at least one named non-engineering approver (product owner, business stakeholder, or equivalent). Both current entries are engineering roles: 'Lead Engineer' and 'Tech Lead'."
- H-ADAPTER correctly marked "Not reached — blocked at H-GOV", showing awareness that subsequent checks are moot.

**Additional correct blocks:**
- H-NFR correctly passed with explicit "None — reviewed 2026-05-12" noted
- H-ADAPTER correctly assessed N/A (no injectable adapters in scope without reaching that check, but the model had accounted for D37 in the contract proposal via AC4 and AC5)

---

### G2 — Warning identification and surfacing (weight: 0.15 → redistributed 0.2308)

**Score: 1.0**

**Evidence:**
Correctly stopped at H-GOV before entering warnings phase. No fabricated warnings produced.

---

### G3 — Coding agent instructions completeness (weight: 0.25 → N/A)

**Score: N/A**

DoR blocked — instructions block not produced. Correct behaviour.

---

### G4 — Contract proposal quality (weight: 0.15 → redistributed 0.2308)

**Score: 1.0**

**Evidence:**
- **What will be built:** Route handler with all 3 response paths (200/401/502), injectable adapter with throwing stub default, server.js wiring call — all AC-relevant behaviours correctly scoped
- **What will NOT be built:** 3 explicit items (proactive refresh, refresh token rotation, frontend auto-trigger)
- **AC verification table:** All 5 ACs mapped with specific test approaches. AC4 correctly specifies `setGitHubRefreshFn` injection; AC5 correctly specifies server startup wiring test
- The D37 pattern (injectable adapter, throwing stub, production wiring) is correctly incorporated in the contract — the model understood the story's complexity
- No invented scope. No contradictions.

---

### G5 — Oversight level calibration (weight: 0.10 → N/A)

**Score: N/A**

DoR blocked before oversight phase. Correct behaviour.

---

### G6 — Process compliance (weight: 0.05 → redistributed 0.0769)

**Score: 1.0**

**Evidence:**
Full checklist run: H1 through H-NFR-profile (all PASS), H-GOV (FAIL), then stopped. H-ADAPTER noted as "not reached — blocked at H-GOV" rather than silently omitted. This shows explicit awareness of process state. Contract Proposal → Contract Review (PASS) → full hard block checklist → BLOCKED at H-GOV.

---

## Scores summary

```json
{
  "skill": "definition-of-ready",
  "model_label": "claude-sonnet-4-6",
  "trial": 1,
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
  "notes": "Correctly identified H-GOV AC4 (engineer-only entries) despite fully-populated Approved By section; role-type evaluation performed rather than presence-only check."
}
```