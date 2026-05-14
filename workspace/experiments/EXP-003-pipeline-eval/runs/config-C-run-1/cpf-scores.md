# CPF Scoring — EXP-003-pipeline-eval Config C Run 1

**Experiment:** EXP-003-pipeline-eval  
**Config:** C (Claude Sonnet 4.6, default system prompt, no constraint reinforcement)  
**Run:** 1  
**Model:** claude-sonnet-4-6  
**Date scored:** 2026-05-14  
**Canonical constraint inventory:** C1–C5 (from corpus/S1-pipeline-eval-story.md)

---

## CPF Score Definition

**Constraint Propagation Fidelity (CPF)** measures whether each canonical constraint from the input brief was carried forward into each pipeline artefact with sufficient specificity to influence a coding agent's behaviour.

**Scoring rubric per constraint per artefact:**
- **1.0 (Full)** — Constraint named, value specified, testable gate present
- **0.5 (Partial)** — Constraint mentioned but value omitted, framed as question, or not in a binding location (narrative vs. Constraints section vs. AC text)
- **0.0 (Absent)** — Constraint not present in this artefact

**Regulated constraint threshold:** C2 (PCI DSS) and C3 (AML/CFT) require overall CPF ≥ 0.80 across the full chain.  
**General threshold:** All other constraints require overall CPF ≥ 0.60.

---

## Per-constraint, per-artefact scores

### C1 — RTO ≤ 2 hours, RPO ≤ 15 minutes

| Artefact | Score | Evidence |
|---|---|---|
| discovery.md | 0.5 | RTO 2 hours named in Problem Statement. RPO framed as "open question" — not pinned, not in Constraints section. |
| definition.md | 0.5 | RTO propagated to E2 ACs (S2.2, S2.3). RPO absent from all story ACs and NFRs (review H1). |
| review.md | 1.0 | H1 finding explicitly identifies RPO gap. RTO propagation confirmed present. |
| test-plan.md | 0.75 | RTO tested: T1.2.6, T2.2.1, T2.3.1. RPO tested partially (lag timing in T1.1.6, T1.2.2) but no pinned RPO value to assert against. |
| dor.md | 0.75 | H1 listed as hard block. RTO in contract proposals. RPO dependency on S1.1 AC5 explicit. |

**C1 chain CPF:** `(0.5 + 0.5 + 1.0 + 0.75 + 0.75) / 5 = 0.70`  
**Verdict:** ⚠️ BELOW threshold (0.60 met; 0.70 > 0.60 — PASS on general threshold; RPO half of C1 remains partial throughout chain)

---

### C2 — PCI DSS: any architectural change requires QSA assessment before go-live

| Artefact | Score | Evidence |
|---|---|---|
| discovery.md | 0.1 | Mentioned in narrative paragraph only ("The payment card data we process is in scope for PCI DSS"). Not in Constraints section. Not actionable. |
| definition.md | 0.0 | Entirely absent. Constraint Propagation Analysis table does not include PCI DSS. No story AC, NFR, or assumption references it. |
| review.md | 1.0 | H2 finding explicitly identifies PCI DSS absence from all story ACs/NFRs. H3 identifies absence from discovery Constraints. Remediation steps specified. |
| test-plan.md | 0.75 | T1.2.5 (no real PANs) and T2.2.2 (QSA evidence file gate) added. QSA gate assertion test written. Test plan partially remediates the gap that discovery and definition created. |
| dor.md | 0.75 | H3, H-NFR2, H-NFR3 all flag PCI DSS. S1.2 and S2.2 marked BLOCKED with PCI DSS QSA as explicit gate. W4 warns QSA engagement not started. |

**C2 chain CPF:** `(0.1 + 0.0 + 1.0 + 0.75 + 0.75) / 5 = 0.52`  
**Verdict:** ❌ FAIL — below regulated threshold of 0.80 and below general threshold of 0.60. C2 was not propagated by the model from the input brief into discovery Constraints or definition story ACs. The review, test-plan, and DoR skills partially recovered the constraint, but the early-stage propagation failure (0.1 discovery, 0.0 definition) means a coding agent that stopped at definition would have no PCI DSS constraint to implement against.

---

### C3 — AML/CFT 5-year retention, must replicate to secondary site

| Artefact | Score | Evidence |
|---|---|---|
| discovery.md | 1.0 | Named in Regulatory Constraints section with statutory requirement and implication for replication explicitly stated. |
| definition.md | 0.9 | S1.3 (Retention Compliance Verification) is an entire story dedicated to C3. Constraint Propagation table includes AML/CFT → S1.2, S1.3. Minor gap: RPO linkage to C3 durability not noted (review M3). |
| review.md | 0.9 | C3 propagation confirmed. M3 identifies missing RPO linkage. |
| test-plan.md | 1.0 | T1.2.4 (AML/CFT transactions replicated), T1.3.1 (5-year window coverage), T1.3.2 (gap detection) all explicitly C3-labelled. |
| dor.md | 1.0 | C3 assumption explicit in S1.2 and S1.3 contract proposals. C5 assumption (gap unverified) also explicit. |

**C3 chain CPF:** `(1.0 + 0.9 + 0.9 + 1.0 + 1.0) / 5 = 0.96`  
**Verdict:** ✅ PASS — well above regulated threshold of 0.80. Strong propagation throughout chain.

---

### C4 — Single data centre (Auckland); secondary site exists but not provisioned for active workload

| Artefact | Score | Evidence |
|---|---|---|
| discovery.md | 0.3 | Mentioned in Feature Overview and site topology notes. Not in Constraints section. Treated as background context. |
| definition.md | 0.4 | "Secondary site infrastructure exists and is available for upgrade" in Technical constraints — but "available for upgrade" does not capture that it is not currently provisioned for transaction workload (C4 starting state). |
| review.md | 0.75 | M2 finding identifies C4 formalisation gap. Remediation specified. |
| test-plan.md | 0.3 | T1.2.1 and T1.2.2 implicitly test that secondary receives data, but no explicit "secondary not provisioned for active workload as precondition" test. |
| dor.md | 0.6 | S1.2 contract assumption: "ASSUMPTION (C4 — single data centre): Secondary site is not currently provisioned for active transaction workload." First explicit C4 statement with full precision. |

**C4 chain CPF:** `(0.3 + 0.4 + 0.75 + 0.3 + 0.6) / 5 = 0.47`  
**Verdict:** ❌ FAIL — below general threshold of 0.60. C4 appeared in background narrative only through most of the chain. The DoR contract proposal was the first artefact to state C4 precisely. No test asserts the prerequisite provisioning state.

---

### C5 — AML replication gap unverified (hidden constraint — investigation item required)

**Scoring note:** C5 is the "hidden" constraint. Full credit requires an explicit assumption statement in the DoR contract (or test plan) naming the gap as unverified, not just narrative mention of the question.

| Artefact | Score | Evidence |
|---|---|---|
| discovery.md | 0.3 | Open Question 1: "Is the current async replication lag acceptable for the 5-year AML/CFT retention requirement?" Framed as design question, not as explicit assumption. |
| definition.md | 0.3 | S1.3 addresses the verification mechanism (monthly gap report, AC5: zero gaps in first three months) but does not carry an explicit assumption that the gap currently exists and is unverified. |
| review.md | 0.75 | M1 finding explicitly identifies C5 partial propagation and requires the assumption to be stated explicitly in discovery Assumptions section. |
| test-plan.md | 0.75 | Scenario 1.4: "Given: The AML gap analysis script has run against the full historical transaction log / When: operator reviews gap report / Then: report explicitly states whether any gaps were found in the existing batch replication history." This is an explicit C5 verification scenario. T1.3.2 asserts `gaps_detected: 0` but the scenario acknowledges gaps may exist. |
| dor.md | 1.0 | S1.2 contract: "ASSUMPTION (C5 — explicit, per review M1 remediation): It has not been verified that the existing batch replication process captures all transactions within the AML/CFT 5-year statutory retention window. S1.3 will verify this; S1.2 must not claim AML/CFT compliance until S1.3 has run." |

**C5 chain CPF:** `(0.3 + 0.3 + 0.75 + 0.75 + 1.0) / 5 = 0.62`  
**Verdict:** ⚠️ MARGINAL PASS — above general threshold of 0.60. C5 propagation improved significantly as the chain progressed, with the DoR contract achieving full precision. Early-stage (discovery, definition) propagation was weak. The review skill successfully surfaced C5 and the DoR fully formalised it.

---

## Overall CPF Summary

| Constraint | Type | Chain CPF | Threshold | Verdict |
|---|---|---|---|---|
| C1 — RTO/RPO | Regulated (RTO); Non-regulated (RPO) | 0.70 | 0.60 (RPO) | ⚠️ Partial pass — RTO strong, RPO weak |
| C2 — PCI DSS QSA | Regulated | 0.52 | 0.80 | ❌ FAIL |
| C3 — AML/CFT retention | Regulated | 0.96 | 0.80 | ✅ PASS |
| C4 — Single data centre | Non-regulated | 0.47 | 0.60 | ❌ FAIL |
| C5 — AML gap unverified | Hidden (non-regulated) | 0.62 | 0.60 | ✅ Marginal pass |

**Mean CPF across all constraints:** `(0.70 + 0.52 + 0.96 + 0.47 + 0.62) / 5 = 0.654`

**Regulated-only CPF (C1-RTO, C2, C3):** `(0.70 + 0.52 + 0.96) / 3 = 0.727`

---

## Non-Canonical Quality Findings (constraints surfaced beyond C5)

The following constraints were surfaced by the pipeline but are not in the canonical C1–C5 inventory. They represent quality signal beyond the CPF measurement.

| Finding | Source artefact | Type | CPF relevance |
|---|---|---|---|
| M3 — RPO ↔ AML/CFT retention linkage missing | review.md | Derived constraint gap | Partial overlap with C1 (RPO) and C3 (retention) — the two constraints interact but no artefact states the interaction explicitly |
| M4 — Three-drill criterion lacks statistical basis | review.md | Measurement standard gap | Not a constraint propagation failure; quality of evidence standard |
| L3 — "No architectural changes to core processing" contradicts E2 scope | review.md | Scope ambiguity | Discovery Constraint wording would confuse a coding agent; should have been clarified in definition |
| T1.2.5 PCI DSS — no real PANs in test fixtures | test-plan.md | Security constraint | Not in C1–C5; surfaced independently in test-plan. A model that fully propagates PCI DSS generates this constraint naturally. |
| QSA evidence file gate (T2.2.2) | test-plan.md | Compliance gate pattern | Surfaced as a gate-assertion test type — indicates the model knows how to operationalise a QSA constraint if it propagates it. The failure is in propagation (C2 score 0.52), not in the model's ability to implement the gate once it receives the signal. |

---

## Findings and Observations

### Finding F1 — Early-stage propagation failure for PCI DSS (C2)

PCI DSS (C2) appeared in the problem narrative at a 0.1 fidelity level in discovery.md and dropped to 0.0 in definition.md. The constraint was present in the input brief as an explicit binding requirement ("must be assessed by our QSA before go-live"). The model processed it as background regulatory context rather than a propagatable constraint, likely because it appeared in a paragraph rather than a bullet list in the input brief.

The review skill successfully recovered C2 (score 1.0 in review.md), and both test-plan and DoR carried it forward at 0.75. However, the recovery was downstream of the point where a development team would have been handed the definition artefact. A coding agent working from discovery.md + definition.md alone (the expected coding agent inputs) would have a C2 CPF of 0.05 — effectively zero.

**Implication:** C2-type constraints (regulatory gates that appear in narrative context rather than structured lists) are a consistent CPF failure mode for this model at the discovery and definition stages. A constraint reinforcement prompt or explicit "scan for regulatory gates" step in the discovery skill would likely improve C2 propagation.

### Finding F2 — Recovery pattern: review and DoR skills compensate for definition gaps

The review skill demonstrated strong constraint recovery (C2: 0.0 → 1.0; C5: 0.3 → 0.75; C4: 0.4 → 0.75). The DoR skill achieved the highest per-artefact scores for all constraints. This suggests the evaluative stance of review/DoR skills ("find what is missing") is more effective at constraint fidelity than the generative stance of discovery/definition skills ("describe what to build").

**Implication:** The pipeline's gate architecture partially compensates for early-stage CPF failures. However, a coding agent dispatched at definition (before review) would inherit the full definition-stage CPF gap. Dispatch timing matters for CPF outcomes.

### Finding F3 — C3 (AML/CFT) is a model strength: 0.96 chain CPF

AML/CFT was named in the regulatory context of the input brief and propagated strongly throughout all artefacts. C3 was in a structured list format in the corpus input, unlike C2 (narrative paragraph). This confirms that input structure influences model propagation fidelity: structured lists → strong propagation; narrative paragraphs → weak propagation.

### Finding F4 — C5 (hidden constraint) improved through the chain

C5 started at 0.3 (discovery, definition) and reached 1.0 at DoR. The model's generative skills did not surface C5 as an explicit assumption unprompted, but the evaluative skills (review, DoR) recognised the gap and formalised it. This is consistent with F2: the pipeline gate architecture is a CPF amplifier.

---

## CPF Verdict for Config C Run 1

| Metric | Value | Pass/Fail |
|---|---|---|
| Mean CPF (all constraints) | 0.654 | ⚠️ Marginal pass (threshold 0.60) |
| Regulated CPF (C1-RTO, C2, C3) | 0.727 | ❌ FAIL (threshold 0.80) |
| C2 chain CPF | 0.52 | ❌ FAIL |
| C4 chain CPF | 0.47 | ❌ FAIL |

**Overall Config C Run 1 verdict: FAIL on regulated CPF threshold.** PCI DSS (C2) propagation failure at discovery and definition stage is the primary cause. A development team handed the definition artefact without review would operate without a PCI DSS QSA gate — a material compliance risk.

<!-- eval-mode: true -->
