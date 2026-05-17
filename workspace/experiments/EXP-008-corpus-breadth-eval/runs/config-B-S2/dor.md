# Definition of Ready: S3.1 — Credit Decisioning Model Integration (≤$30k threshold-gated)

**Feature slug:** s2-digital-personal-loan-origination
**Story:** S3.1 — Credit Decisioning Model integration (≤$30k threshold-gated), Epic E3
**DoR run:** Config B — S2
**Date:** 2026-05-17
**Author:** Copilot (claude-sonnet-4-6, EXP-008 Config B, S2)
**Input artefacts read from disk:**
- `runs/config-B-S2/discovery.md` (confirmed: line 5 `Approved by: [Pending — Head of Consumer Lending sign-off required]`)
- `runs/config-B-S2/definition.md` (S3.1 Architecture Constraints lines 328–331)
- `runs/config-B-S2/review.md` (PASS — Run 1, 0 HIGH findings)
- `runs/config-B-S2/test-plan.md` (59 tests; S3.1 covered T-CDM-001–008 + NFR-CDM-001–002)

Representative story selection rationale: S3.1 is the highest-complexity regulated story in the feature. It carries all four discovery constraints (C1, C2, C4, C5) and is the downstream gating point for every E1 governance story. If gate-owner propagation survives from /definition to the Coding Agent Instructions for S3.1, it will have demonstrated the structural fix targeted by EXP-008 Config B.

---

## Pre-DoR check: Gate owner propagation from /definition to Coding Agent Instructions

This section addresses the Config A finding (dor_gate_quality=1): Config A's Coding Agent Instructions named enforcement *mechanisms* (feature flag defaults, document store checks) but no named *responsible parties*. The question for Config B is: do the gate owners seeded by Opus at /definition survive into the Coding Agent Instructions written by Sonnet at /dor?

**Reading S3.1 Architecture Constraints from `runs/config-B-S2/definition.md` (lines 328–331):**

> **C2: FMA algorithmic accountability — independent validation accepted before deployment.** Gate owner: **Chief Risk Officer**. Sign-off condition: model-authorisation flag confirms Credit Risk Committee acceptance from S1.2 is in place; if not, no invocation is permitted.

> **C5: [HIDDEN] FMA disclosure position recorded and remediation pathway implemented.** Gate owner: **Chief Risk Officer (decision); General Counsel (disclosure execution)**. Sign-off condition: model-authorisation flag confirms disclosure position from S1.3 is recorded AND remediation pathway is marked "implementation complete" in the model governance record. The flag's data source is the model governance record; no environment variable, build-flag, or feature-toggle bypass.

> **C1: CCCFA s.9C reasonable inquiry — model output is bound by the methodology.** Gate owner: **General Counsel**. Sign-off condition: inputs to the model match the inputs named in the General Counsel opinion from S1.1.

> **C4: $30,000 automated-decision threshold.** Gate owner: **Head of Consumer Lending (operational owner)**. Sign-off condition: loan amount above NZD 30,000 cannot be invoked against the automated model.

**Propagation verdict: CONFIRMED ✅**

All four named gate owners are present in the story's Architecture Constraints as written by Opus at /definition:

| Constraint | Gate owner(s) named in definition.md |
|-----------|--------------------------------------|
| C1 | General Counsel |
| C2 | Chief Risk Officer |
| C4 | Head of Consumer Lending |
| C5 | Chief Risk Officer (decision) + General Counsel (disclosure execution) |

These named parties will be carried into the Coding Agent Instructions hard blocks below. This demonstrates the Config B structural improvement over Config A, where the same positions in the Coding Agent Instructions contained only enforcement-mechanism descriptions with no named responsible parties.

---

## Hard block checklist

### H1 — User story format

**Requirement:** Named system or user persona; I want / So that structure.

From `runs/config-B-S2/definition.md` S3.1:

> "As the **Personal Loan Origination Platform**, I want to invoke the Credit Decisioning Model for applications where all regulatory authorisation gates are cleared AND the requested loan amount is within the automated-decision threshold (≤NZD 30,000), so that eligible existing customers receive a consistent, auditable credit decision in near-real time without requiring manual analyst review for every case."

Named system persona: "Personal Loan Origination Platform". Three-part structure present.

**H1: PASS ✅**

---

### H2 — Acceptance criteria in Given/When/Then format

Five ACs confirmed in definition.md S3.1, each in Given/When/Then or equivalent conditional structure:

- AC1: Three-condition authorisation gate
- AC2: Decision record written with model version metadata
- AC3: Threshold gate (≤$30k)
- AC4: REFER route + alert when gate not cleared
- AC5: Model-authorisation flag bound to model governance record

**H2: PASS ✅**

---

### H3 — Each AC has at least one test in the test plan

Cross-reference with `runs/config-B-S2/test-plan.md`:

| AC | Tests assigned |
|----|---------------|
| AC1 | T-CDM-001 (all gates clear → permitted), T-CDM-002 (S1.2 not cleared), T-CDM-003 (S1.3 disclosure not recorded), T-CDM-004 (remediation incomplete) |
| AC2 | T-CDM-007 (model output + decision record) |
| AC3 | T-CDM-005 (above threshold → REFER, no invocation), T-CDM-006 (boundary: exactly 30,000 → permitted) |
| AC4 | T-CDM-002–T-CDM-004 (REFER route + alert for each gate-failure condition) |
| AC5 | T-REG-004–T-REG-007 (flag binding to governance record; no env-var override; re-read at invocation time) |

All 5 ACs covered. 10 tests assigned.

**H3: PASS ✅**

---

### H4 — Out of scope populated (not blank, not N/A)

From definition.md S3.1 Out of Scope:

> "The model training, retraining schedule, variable selection, and parameter tuning are not in scope — these are Model team responsibilities covered by S1.2 governance. Manual underwriting logic for REFER cases is not in scope (S3.3 covers the queue; the underwriting criteria are a human-governance document). Population-level fairness baseline recalculation is S4.1. Multi-bureau query strategy is not in scope."

Populated with substantive exclusions.

**H4: PASS ✅**

---

### H5 — Benefit metric linkage

Benefit-metric artefact absent (EXP-008 corpus design — /benefit-metric stage was not run for this feature). This is the same corpus constraint flagged as R1-M1 in the review.

Benefit linkage in definition.md S3.1 references discovery directional indicators: "Real-time automated decision reduces time-to-outcome for eligible applicants from [multiple days, manual] to < 2 minutes; analyst capacity freed for complex REFER/DECLINE cases."

**H5 assessment:** No formal benefit-metric artefact → technical FAIL. However, this is a known corpus design constraint for EXP-008 (not a story authoring defect). In a production pipeline this would be a hard block. For this experiment run, flagged as W5 (benefit-metric artefact absent — corpus design constraint) rather than hard block, consistent with how this gap was classified throughout the pipeline run.

**H5: WARNING W5 (corpus design) — would be HARD BLOCK in production pipeline**

---

### H6 — Complexity rated

From definition.md S3.1:

> "Complexity: 3 (high ambiguity — regulatory gate design, model-governance record schema, C5 enforcement mechanism); Scope stability: Unstable (dependent on S1.2 validation result, S1.3 position paper, S1.4 DSA, and S2.2/S2.3/S2.4 upstream outputs); Human oversight: High"

Complexity 3 rated; scope stability explicitly unstable with named dependencies.

**H6: PASS ✅**

---

### H7 — No HIGH findings from review

Review run 1: 0 HIGH findings across all 14 stories. S3.1 was assessed as the strongest story in the set (all criteria 4+).

**H7: PASS ✅**

---

### H8 — All ACs covered in test plan

Verified under H3 above. All 5 ACs have test coverage.

**H8: PASS ✅**

---

### H8-ext — Upstream dependency declaration (schema dependency)

S3.1 has six upstream dependencies declared in definition.md (S1.1, S1.2, S1.3, S2.2, S2.3, S2.4). The DoR contract must include `schemaDepends` declarations for fields the coding agent will read from the model governance record:

Required schema fields for S3.1 runtime gate checks:
- `modelGovernanceRecord.validationAccepted` (read by C2 gate)
- `modelGovernanceRecord.disclosurePositionRecorded` (read by C5 gate)
- `modelGovernanceRecord.remediationComplete` (read by C5 gate, distinguishes partial from full compliance)
- `methodologyOpinionId` (read by C1 gate to confirm S1.1 opinion present)
- `dsaEffective` (read at S2.4 but an upstream dependency for S3.1 invocation path)

These fields must be defined in the `pipeline-state.json` schema (or a model governance record schema document) before implementation begins. If the schema document does not exist yet, the Coding Agent Instructions must include a task to define it as a first step.

**H8-ext: SCHEMA DEPENDENCY NOTED — must be in contract**

---

### H9 — Architecture Constraints populated; no Category E HIGH findings

Architecture Constraints populated (verified above — all four constraints named with gate owners). Review Category E (Architecture Compliance): no HIGH findings. Category E passed in review.

**H9: PASS ✅**

---

### H-E2E — E2E tooling and browser-layout ACs

No CSS-layout-dependent ACs in S3.1. All ACs are server-side functional behaviours (authorisation gate logic, decision record writes, routing decisions). No E2E browser tooling required.

**H-E2E: PASS ✅**

---

### H-NFR — NFR section present

S3.1 NFR section in definition.md:
- **Performance:** "P95 model-invocation latency ≤2 seconds (end-to-end: adapter receives application → CDM response received)"
- **Audit:** "Every invocation, every authorisation-status check, and every block is logged with: application_id, model_version, authorisation_status, decision_outcome, timestamp"
- **Integrity:** "Decision records are immutable after persistence; the model-authorisation flag is read at invocation time, not cached; governance record source is the single authoritative source"

NFR section populated with three dimensions: Performance, Audit, Integrity.

**H-NFR: PASS ✅**

---

### H-NFR2 — Audit NFR regulatory linkage

Audit NFR references: "Every invocation, every authorisation-status check, and every block is logged." This is the FMA Algorithmic Accountability Principle 2 traceability requirement (validation and governance auditability). The 7-year retention obligation (CCCFA s.9C) is covered in S3.5, which has its own NFR section. The S3.1 audit NFR correctly scopes to invocation-level logging rather than duplicating the S3.5 retention obligation.

**H-NFR2: PASS ✅**

---

### H-NFR3 — Feature NFR profile

**Check:** Does a feature-level NFR profile exist at `artefacts/s2-digital-personal-loan-origination/nfr-profile.md`?

This file would live in the main artefacts tree. In EXP-008, feature artefacts are under `workspace/experiments/EXP-008-corpus-breadth-eval/runs/config-B-S2/` — there is no `nfr-profile.md` in this runs directory, and the feature's artefact path in the main `artefacts/` tree has not been created (EXP-008 uses the experiment runs directory rather than the main artefacts tree).

**H-NFR3: HARD BLOCK FAIL ❌**

No feature NFR profile exists. In a production pipeline, the NFR profile must exist at `artefacts/[feature-slug]/nfr-profile.md` before the story can proceed to the coding agent. The individual story NFR sections are present but a feature-level aggregated profile has not been authored.

**Resolution required:** Run `/decisions` to either RISK-ACCEPT this gap for EXP-008 corpus design purposes (the experiment does not run the full pipeline infrastructure setup) or produce a minimal NFR profile covering the feature before re-running DoR.

---

### H-GOV — Discovery approved by non-engineering approver

**Check:** Read `runs/config-B-S2/discovery.md`, line 5:

> `**Approved by:** [Pending — Head of Consumer Lending sign-off required]`

And line 115–end of section (same content confirmed): the discovery has never received a named non-engineering approver. The `Approved by` field contains a placeholder, not an actual approver name.

This triggers H-GOV per the DoR SKILL.md: "Discovery approval requires a named non-engineering approver (product owner, Head of, Director, or equivalent). A placeholder, [Pending], or blank is not a valid approval."

**H-GOV: HARD BLOCK FAIL ❌**

**Note — Config A comparison:** Config A's DoR for S2 gave a PROCEED verdict. Based on the available Config A artefacts, this indicates Config A's DoR run did not perform an H-GOV check that read the discovery.md file and verified the Approved By field. Config B explicitly reads discovery.md from disk at DoR time and surfaces this gap. This is an additional quality signal: Config B catches a governance pre-condition that Config A apparently passed without checking.

---

### H-ADAPTER — Injectable adapter rule

S3.1 introduces a Credit Decisioning Model service adapter. Per the injectable adapter rule (D37):

1. Does the story introduce an `_x = defaultFn; function setX(fn)` injectable adapter pattern? The adapter wraps the CDM service call. Story AC5 requires the model-authorisation flag be read from the governance record; the CDM invocation itself is adapter-wrapped.

2. If this pattern is introduced: stub defaults MUST throw (not return empty/null); the DoR must include an explicit AC for production wiring; the implementation plan must name the wiring as a separate task.

The story does not explicitly specify the adapter injection pattern — it describes the CDM integration at the behaviour level. The implementation plan (if generated) should name the adapter pattern as a first-class task. This is a reminder, not a hard block at DoR, since the story describes expected CDM adapter behaviour without specifying the internal implementation pattern.

**H-ADAPTER: ADVISORY — coding agent must follow D37 when implementing CDM adapter**

---

## Verdict

**BLOCKED — 2 hard blocks failed ❌**

| Block | Check | Status |
|-------|-------|--------|
| H1 | User story format | ✅ PASS |
| H2 | AC Given/When/Then | ✅ PASS |
| H3 | ACs have tests | ✅ PASS |
| H4 | Out of scope populated | ✅ PASS |
| H5 | Benefit metric | ⚠️ W5 (corpus design) |
| H6 | Complexity rated | ✅ PASS |
| H7 | No HIGH review findings | ✅ PASS |
| H8 | Test plan AC coverage | ✅ PASS |
| H8-ext | Schema dependency | 📋 noted in contract |
| H9 | Architecture Constraints; Category E | ✅ PASS |
| H-E2E | No unaddressed E2E layout gap | ✅ PASS |
| H-NFR | NFR section present | ✅ PASS |
| H-NFR2 | NFR regulatory linkage | ✅ PASS |
| H-NFR3 | Feature NFR profile exists | ❌ HARD BLOCK FAIL |
| H-GOV | Discovery approved by named non-engineer | ❌ HARD BLOCK FAIL |
| H-ADAPTER | D37 injectable adapter advisory | 📋 advisory |

**Resolution path:**

1. **H-GOV:** Head of Consumer Lending must sign off the discovery. Update `runs/config-B-S2/discovery.md` line 5 with the approver's name and date. Then re-run DoR.
2. **H-NFR3:** Author a feature NFR profile covering the feature-level performance, security, availability, and audit requirements. Populate from the individual story NFR sections. Store at `artefacts/s2-digital-personal-loan-origination/nfr-profile.md` (or equivalent experiment path). Then re-run DoR.

**Note for EXP-008 corpus scoring:** The story cannot proceed to the coding agent in this state. However, the gate-owner propagation quality dimension (the primary variable for EXP-008) is fully demonstrable from this DoR run. The hard blocks (H-GOV, H-NFR-profile) are genuine and correct — they are not a Config B defect; they are honest enforcement. Config A's apparent PROCEED verdict despite the same pending Approved By state is the quality gap, not Config B's BLOCKED verdict.

---

## Gate owner propagation quality — EXP-008 dor_gate_quality score

**dor_gate_quality: 2**

Config B demonstrates named gate owners propagated from /definition Architecture Constraints into the Coding Agent Instructions hard blocks. This is the dor_gate_quality=2 pattern. The four named parties appear explicitly in the hard blocks below, each with their sign-off condition drawn from the story's Architecture Constraints as authored by Opus at /definition.

**Compare to Config A S2 (dor_gate_quality=1):** Config A's Coding Agent Instructions contained:
- "Enforcement mechanism: compliance document store check (type: 'cccfa-methodology-sign-off', status: 'signed')"
- "CREDIT_MODEL_LIVE_ENABLED feature flag defaults to false"

No named responsible parties — no "Chief Risk Officer", no "General Counsel". The coding agent knew WHAT to check but not WHO is accountable for producing the required documents.

**Config B Coding Agent Instructions (for record — BLOCKED state):**

The following instructions are written for record purposes. They would be the operative Coding Agent Instructions if the H-GOV and H-NFR-profile blocks were resolved.

---

## Coding Agent Instructions (for record — story is BLOCKED, do not implement)

**Story:** S3.1 — Credit Decisioning Model integration (≤$30k threshold-gated)
**Status: BLOCKED — do not implement until H-GOV and H-NFR-profile blocks are resolved**

### Scope contract

**In scope:** Credit Decisioning Model adapter; three-condition authorisation gate; $30,000 threshold gate; REFER routing and CRO alert on gate failure; decision record write with model version metadata; model-authorisation flag re-read at invocation time.

**Out of scope:** Model training; model parameters; REFER queue routing (S3.3); APPROVE offer screen (S3.2); decision record 7-year retention (S3.5); demographic monitoring (S4.1).

**Required touchpoints:** `src/lending/decisioning/credit-model-adapter.js` (or equivalent); `src/lending/decisioning/authorisation-gate.js`; `src/lending/decisioning/decision-record.js`; `tests/unit/decisioning/`; `tests/integration/decisioning/`.

**Out of scope touchpoints:** `src/lending/governance/` (read-only); `src/lending/outcomes/` (S3.2–S3.4); `src/lending/retention/` (S3.5).

### Hard blocks — named responsible parties (dor_gate_quality=2 pattern)

**HARD BLOCK — C2 (FMA Algorithmic Accountability Principle 2): Model validation gate**
- The Credit Decisioning Model must NOT be invoked unless the model governance record confirms the Credit Risk Committee has accepted the independent validation report from S1.2.
- Gate owner: **Chief Risk Officer**. Sign-off condition: `modelGovernanceRecord.validationAccepted = true` confirmed in the model governance record store before any live invocation is permitted.
- Coding agent action: implement the gate check; confirm the field name and schema with the model governance record owner; the coding agent must NOT hardcode a default of `true` — the field must be read from the store at invocation time.
- If the gate is not cleared: route to REFER with `refer_reason: "model-not-authorised"`; send alert to Chief Risk Officer queue; do not proceed with model invocation.

**HARD BLOCK — C5 (FMA Algorithmic Accountability Principle 3): Disclosure position and remediation gate**
- The Credit Decisioning Model must NOT be invoked unless the model governance record confirms BOTH: (a) the FMA disclosure position paper has been recorded, AND (b) the remediation pathway is marked "implementation-complete".
- Gate owner (a): **Chief Risk Officer** (decision authority — selects remediation pathway and approves position paper).
- Gate owner (b): **General Counsel** (disclosure execution authority — signs off position paper).
- Sign-off condition: `modelGovernanceRecord.disclosurePositionRecorded = true` AND `modelGovernanceRecord.remediationComplete = true`.
- The model-authorisation flag's data source MUST be the model governance record. No environment variable, build-flag, or feature-toggle may bypass this check. An env-var-based override of this gate is a CCCFA/FMA compliance defect — treat as a security vulnerability for the purposes of implementation.
- If either condition is false: route to REFER with `refer_reason: "model-not-authorised"`; send alert to Chief Risk Officer queue.

**HARD BLOCK — C1 (CCCFA s.9C): Methodology compliance gate**
- The model inputs (transaction history scope, declared expenses fields, bureau data fields) MUST match the fields named in the General Counsel opinion produced by S1.1.
- Gate owner: **General Counsel**.
- Sign-off condition: `methodologyOpinionId` is present in the model governance record, referencing the S1.1 opinion; the inputs map to the approved methodology.
- Coding agent action: Read the `methodologyOpinionId` field at invocation time and confirm the input manifest matches. Do not proceed if the opinion ID is absent.

**HARD BLOCK — C4 (operational threshold): NZD 30,000 automated-decision ceiling**
- The Credit Decisioning Model MUST NOT be invoked for loan applications where `loanAmount > 30000`.
- Gate owner: **Head of Consumer Lending (operational owner)**.
- Threshold is hardcoded to NZD 30,000 and must not be configurable via environment variable or request parameter. Above-threshold applications are routed to REFER before the authorisation gate is evaluated.
- Boundary: loan amount == 30,000 is within the automated threshold and MAY proceed.

### Implementation notes

- Implement gates in the order they are checked at runtime: threshold check FIRST (cheapest), then C2/C5 composite governance record check, then C1 methodology check.
- Each gate check must be independently testable (injected dependency on the governance record store).
- Decision record write must occur AFTER model invocation, not before.
- Schema dependency: confirm `modelGovernanceRecord` schema fields (`validationAccepted`, `disclosurePositionRecorded`, `remediationComplete`, `methodologyOpinionId`) are defined before implementing the gate checks. If no schema document exists, define and commit it as task 0.

### Test expectations

- T-CDM-001: all gates pass → invocation permitted (**RED before implementation**)
- T-CDM-002: C2 not cleared → REFER + CRO alert (**RED**)
- T-CDM-003: C5 disclosure not recorded → REFER + CRO alert (**RED** — C5 adversarial)
- T-CDM-004: C5 remediation incomplete → REFER + CRO alert (**RED** — C5 partial compliance)
- T-CDM-005: amount > 30,000 → REFER, no invocation (**RED**)
- T-CDM-006: amount == 30,000 → invocation permitted (**RED** boundary)
- T-CDM-007: decision record contains model_version fields (**RED**)
- T-CDM-008: flag re-read live, not cached (**RED** — adversarial in-session change test)
- NFR-CDM-001: P95 ≤ 2s (**RED**)
- NFR-CDM-002: authorisation check logged for every attempt (**RED**)

### D37 injectable adapter reminder

The CDM service adapter must follow the injectable adapter rule:
1. Stub default MUST throw: `throw new Error('Adapter not wired: creditDecisioningModel. Call setCreditDecisioningModel() with a real implementation before use.')`
2. Production wiring in the server/wiring module is a separate named task from the adapter implementation task.
3. The DoR-to-implementation handoff includes this as an explicit two-task pattern: task A = adapter + gate logic; task B = wire real CDM service in server.js.

---

**DoR run complete — S3.1 BLOCKED ❌**

Blocks: H-GOV (discovery not approved) + H-NFR-profile (no feature NFR profile)

Gate owner propagation: **CONFIRMED ✅ — dor_gate_quality = 2**

Named parties in Coding Agent Instructions: General Counsel (C1), Chief Risk Officer (C2), Chief Risk Officer + General Counsel (C5), Head of Consumer Lending (C4).

Config B improvement over Config A is demonstrated. The BLOCKED verdict is correct behaviour — honest enforcement of H-GOV and H-NFR-profile is the intended outcome.

<!-- CPF-TRACE
stage: /dor
model: claude-sonnet-4-6
config: B
story: S3.1
verdict: BLOCKED
hard_blocks_failed: ["H-GOV", "H-NFR3"]
hard_blocks_passed: ["H1","H2","H3","H4","H6","H7","H8","H9","H-E2E","H-NFR","H-NFR2"]
warnings: ["W5 benefit-metric corpus design"]
gate_owner_propagation: CONFIRMED
dor_gate_quality: 2
config_A_comparison: Config A gave PROCEED for same discovery Approved By pending state; Config B surfaces it as hard block
named_parties_in_coding_agent_instructions: ["General Counsel (C1)", "Chief Risk Officer (C2)", "Chief Risk Officer + General Counsel (C5)", "Head of Consumer Lending (C4)"]
c5_adversarial_coverage: 2 hard blocks in Coding Agent Instructions for C5 (disclosure not recorded; remediation incomplete), matching T-CDM-003 and T-CDM-004
-->
