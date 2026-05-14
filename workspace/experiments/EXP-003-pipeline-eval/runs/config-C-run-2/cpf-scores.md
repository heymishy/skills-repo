# CPF Scores — Config C Run 2

**Feature:** Disaster Recovery RTO + AML/CFT Compliance Modernisation  
**Run:** 2  
**Date:** 2026-05-14  
**Config:** C (Sonnet: discovery + definition / Haiku: review + test-plan + DoR)  
**Judge model:** claude-sonnet-4-6  
**Eval mode:** true  

---

## Canonical Constraint Inventory

| ID | Constraint | Type | Source |
|----|------------|------|--------|
| C1 | Board-approved SLA: RTO ≤ 2 hours, RPO ≤ 15 minutes (non-negotiable) | Operational / Policy | Discovery — Problem Statement, Success Indicators |
| C2 | PCI DSS: any architectural change requires QSA assessment before go-live | Regulatory | Discovery — Constraints section, MVP item 5 |
| C3 | AML/CFT Act: 5-year transaction record retention on secondary site, fully auditable | Regulatory | Discovery — Constraints section, MVP item 4 |
| C4 | Current state: single Auckland data centre — Hamilton secondary exists but not configured for active processing | Technical / Architectural | Discovery — Constraints section, Problem Statement |
| C5 | Hidden assumption: AML/CFT replication gap to secondary site unverified; batch replication mechanism may not satisfy statutory window without modification | Hidden constraint (assumption) | Discovery — Assumptions section |

---

## Scoring Methodology

**Scale:** 0.00 – 1.00 per constraint per stage  
- **1.00** — Constraint explicitly named with full value, enforceable as a deliverable (AC, gate, test, or formal prerequisite)  
- **0.75** — Constraint named with value, present in NFRs or assumptions, but not a hard deliverable or gate  
- **0.65** — Constraint implied or referenced but not in the canonical AC/NFR location for its story  
- **0.50** — Constraint present in one artefact but absent from directly affected stories  
- **0.35** — Constraint named at feature level but not propagated into any story AC or NFR  
- **0.00** — Constraint absent from artefact  

**Chain score (min):** Minimum score across all stages — the floor CPF achievable on a constraint if each stage is taken at face value.  
**Final-stage score:** Score at the DoR stage — what the coding agent actually receives.  

**Pass threshold:** 0.80 general (all constraints), 0.80 regulated (C2, C3 only).

---

## Per-Constraint, Per-Stage Scores

### C1 — RTO ≤ 2 hours, RPO ≤ 15 minutes

| Stage | Score | Evidence | Notes |
|-------|-------|----------|-------|
| Discovery | 1.00 | Problem Statement names both values explicitly. MVP items 2 and 3 bound both targets. Success Indicators define both with measurement approach. | Full; both values precise and enforceable. |
| Definition | 0.75 | RTO propagated: E2 objective, S2.1/S2.2/S2.3 NFRs all cite RTO < 2h. RPO named in S1.2 NFRs as "≤ 15 min" but then introduces "≤ 30 sec sync / ≤ 5 min async" as implementation options without committing the policy value. S1.1 AC4 confirms feasibility but does not output RPO as a committed decision deliverable. | **First weakening (RPO).** RPO referenced but not committed as a story AC output. RTO strong throughout. |
| Review | 0.75 | Review H1 finding explicitly identifies RPO not pinned. CPF pre-score table records: "C1 — Partial — RTO propagated; RPO not committed." Weakness correctly surfaced. | Same underlying weakness. Review naming it is not remediation. |
| Test-plan | 0.80 | T1.1.4 ("RPO value documented with numeric commitment") forces RPO to be a committed deliverable before S1.2 can start. T1.2.2 tests replication within RPO threshold. T2.2.4 tests failover ≤ 5 min. T2.2.7 tests full RTO ≤ 2 hours. Test coverage enforces both targets. | Slight recovery. T1.1.4 adds enforcement gate; RTO fully tested; RPO tested once committed. |
| DoR | 0.75 | H9 FAIL: "RPO value not decided" named as open unknown. H-NFR PARTIAL: "RTO testable; RPO not measurable without committed value." Contract for S1.2 includes assumption: "S1.1 complete with RPO value committed." | RPO weakness carried forward correctly; gate still open. |

**Chain score (min):** 0.75 — Weakens at Definition, stays consistent through DoR.  
**First weakening:** Definition — S1.1 AC5 does not output RPO value as committed decision deliverable.

---

### C2 — PCI DSS QSA assessment before go-live

| Stage | Score | Evidence | Notes |
|-------|-------|----------|-------|
| Discovery | 1.00 | Named in Constraints section ("PCI DSS compliance — any architectural change requires QSA assessment before go-live"). Named in MVP Scope item 5 as explicit in-scope deliverable. Named in Risks with scenario detail. | Full; named three times with clear gate semantics. |
| Definition | 0.35 | Definition constraint table records C2 as "Named in S1.1 AC5 (QSA pre-engagement); S1.3 includes Compliance team validation." However: S1.1 AC5 only schedules a scoping conversation — it does not create a QSA gate test. S1.2 (the story that implements the architectural change) has no QSA AC or NFR. S2.2 (the story that deploys failover automation) has no QSA AC or NFR. PCI DSS does not appear in any story NFR body text. | **First weakening (catastrophic drop).** Discovery → Definition: 1.00 → 0.35. Constraint named at feature analysis level but absent from directly affected story ACs/NFRs. Review H2 finding confirms this. |
| Review | 0.40 | Review H2 finding: "The definition artefact does not name PCI DSS in any story's AC or NFR." CPF pre-score: "❌ Absent from story ACs/NFRs; H2 finding." Review correctly surfaces the gap and names required remediation. Score increases marginally over definition because review makes the gap explicit and actionable. | Gap surfaced as HIGH finding. No remediation applied. |
| Test-plan | 0.50 | T2.2.2 ("QSA architectural assessment documentation exists") is an explicit H2 remediation gate test for S2.2. One gate test exists and is named in Output 2 verification script. However: no equivalent gate test for S1.2 (the story deploying replication — the primary architectural change). T1.2.x tests cover data security (no real PANs) but not the QSA architectural gate. | Partial recovery. One QSA gate test introduced but covers only S2.2; S1.2 remains without a gate. |
| DoR | 0.60 | Contract for S1.2: "Prerequisite: docs/compliance/qsa-assessment-dr-2026.md must exist with QSA architectural scope alignment before S1.2 implementation begins." Contract for S2.2: same gate. H-NFR3 FAIL: "C2 (PCI DSS) absent from story ACs/NFRs; only 1 of 2 regulated constraints propagated." Stories S1.1, S1.2, S2.2 all have explicit gate or [BLOCKED] marker. | Further recovery. Gate now propagated to both S1.2 and S2.2 contracts. Underlying definition ACs not fixed; hard blocks remain open. |

**Chain score (min):** 0.35 — Catastrophic weakening at Definition.  
**First weakening:** Definition — PCI DSS absent from S1.2 and S2.2 story ACs despite being a named constraint in discovery with direct impact on those stories.

---

### C3 — AML/CFT 5-year retention

| Stage | Score | Evidence | Notes |
|-------|-------|----------|-------|
| Discovery | 1.00 | Named in Problem Statement (internal audit finding), MVP item 4 (explicit deliverable with gap-closure requirement), Constraints section. Success Indicators include "AML/CFT internal audit finding closed" with measurement method. | Full; named with statutory source, explicit value (5 years), and measurable closure criterion. |
| Definition | 1.00 | S1.3 (5 ACs) fully addresses retention schema, automated recording, retention policy, monthly gap reports, and internal audit closure. S1.2 NFRs include AML/CFT explicitly. Constraint propagation table confirms C3 in S1.2 and S1.3. S1.3 persona is "Compliance/Internal Audit." | Full propagation. Story purpose and all ACs directly address constraint. |
| Review | 1.00 | Review CPF pre-score: "C3 — AML/CFT 5-year retention — ✅ Propagated." No HIGH or MEDIUM finding for C3. | No weakening detected. |
| Test-plan | 1.00 | T1.3.1–T1.3.7 cover all aspects: schema (T1.3.1), recording latency (T1.3.2), retention policy (T1.3.3), gap report (T1.3.4), audit closure (T1.3.5), gap detection (T1.3.6), retention preservation across failover (T1.3.7). 7 tests for 5 ACs. | Full test coverage; cross-failover retention explicitly tested. |
| DoR | 1.00 | S1.3 contract not blocked. H-NFR3 FAIL cites C2 specifically; C3 explicitly noted as "present in S1.3." Oversight for E1 includes "Compliance team in review loop." | No weakening throughout chain. |

**Chain score (min):** 1.00 — Perfect propagation across all five stages.  
**First weakening:** None.

---

### C4 — Single Auckland data centre / secondary site not configured for active processing

| Stage | Score | Evidence | Notes |
|-------|-------|----------|-------|
| Discovery | 1.00 | Named in Problem Statement ("single data centre in Auckland with no automated failover"). Named in Constraints section ("Single active data centre (Auckland); no secondary processing capability currently exists"). MVP items 1–2 address it directly. | Full; constraint stated as current-state fact with direct scope consequence. |
| Definition | 0.65 | Definition constraint table records C4 as "Named as technical constraint in S1.1 (Hamilton site capacity assessment)." S1.1 AC2 (network latency) and AC3 (TPS baseline) assess the constraint. But S1.2 does not include an explicit prerequisite AC: "Secondary site provisioned before this story can begin." The secondary site readiness is implied by sequencing (E1 before E2) but not enforced in an AC. | **First weakening.** Implied by sequencing, not named as a hard prerequisite. Review M2 finding confirms. |
| Review | 0.65 | Review M2 finding: "C4 as background context not formal constraint. S1.2 assumes secondary site ready without naming a preparatory step." CPF pre-score: "⚠️ Implied; not explicit prerequisite AC in S1.2." | Same weakness; correctly identified as MEDIUM finding. |
| Test-plan | 0.60 | No specific gate test for secondary site not being provisioned. Tests for S1.2 (T1.2.1–T1.2.8) assume secondary infrastructure is available. No T1.2.x test asserting: "secondary site passes readiness check before replication begins." | Slight weakening. C4 implicit in test infrastructure assumptions; no explicit readiness gate test. |
| DoR | 0.65 | Contract for S1.2 includes: "ASSUMPTION (C4 — secondary site readiness): Secondary site must be provisioned for active workload processing before S1.2 tests can run." Named assumption, not a hard prerequisite AC. Improvement over test-plan (explicitly named) but not an enforceable gate. | Named assumption recovers slightly; still not a hard gate. |

**Chain score (min):** 0.60 — Consistent weakness from Definition through test-plan.  
**First weakening:** Definition — no explicit prerequisite AC enforcing secondary site provisioning before S1.2 begins.

---

### C5 — AML replication gap unverified (hidden assumption)

| Stage | Score | Evidence | Notes |
|-------|-------|----------|-------|
| Discovery | 0.80 | Named explicitly in Assumptions section as "[ASSUMPTION] AML/CFT replication gap at the Hamilton site is unverified and may require a mechanism upgrade." Includes specific implication: "design for closing this gap cannot be finalised until a verification exercise confirms." Not in the Constraints section (appropriate for a hidden constraint — correctly classified as assumption). | Good surface. Named with clear implications. Lower than 1.00 because it's an assumption, not a named constraint with a value. |
| Definition | 0.70 | Definition constraint table records C5 as "Named as [ASSUMPTION] in /clarify block; S1.1 explicitly lists as assumption to verify; S1.3 implements verification mechanism." But C5 is not carried as an `[ASSUMPTION]` marker in S1.2 or S1.3 story preamble text. S1.3 solves for it (AC4: monthly gap reports, AC5: audit closure) without explicitly naming the assumption it is closing. Review M1 finding identifies this gap. | **First weakening.** Addressed in solution (S1.3) without being explicitly labelled as a precondition assumption in affected stories. |
| Review | 0.70 | Review M1 finding: "C5 is visible in the discovery /clarify block and addressed in S1.3, but not marked as an ongoing assumption in the story set. A model evaluated on C5 propagation receives partial credit." CPF pre-score: "Partial — propagated in solution, not carried as assumption marker." | Same weakness acknowledged. |
| Test-plan | 0.80 | T1.3.6 (gap detection across sites), T1.3.7 (retention preservation across failover), T1.2.8 (audit trail records replication event) all indirectly test C5 implications. Test data strategy includes "TIME_SCALE=365 compresses 1 real second = 1 simulated day for testing" — designed specifically for the 5-year window verification requirement. | Slight recovery. Multiple tests target the gap verification need, including cross-failover scenario. |
| DoR | 0.80 | Contract for S1.2: "ASSUMPTION (C5 — AML replication gap unverified): Current batch replication has not been verified to capture all transactions within AML/CFT 5-year window. S1.2 must not claim AML/CFT compliance until S1.3 complete." C5 explicitly named as a cross-story precondition in the contract. | Recovery to 0.80. Contract carries C5 as a named, cross-story assumption that prevents premature compliance claims. |

**Chain score (min):** 0.70 — Weakens at Definition, partially recovers at test-plan and DoR.  
**First weakening:** Definition — C5 addressed in S1.3 solution but not labelled as an explicit assumption in story preambles.

---

## Summary Table

| Constraint | Discovery | Definition | Review | Test-plan | DoR | Chain (min) | First weakening |
|------------|-----------|------------|--------|-----------|-----|-------------|-----------------|
| C1 — RTO/RPO | 1.00 | **0.75** | 0.75 | 0.80 | 0.75 | **0.75** | Definition — RPO not output as committed AC deliverable |
| C2 — PCI DSS | 1.00 | **0.35** | 0.40 | 0.50 | 0.60 | **0.35** | Definition — absent from S1.2 and S2.2 ACs/NFRs |
| C3 — AML/CFT | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | **1.00** | Never weakens |
| C4 — Single site | 1.00 | **0.65** | 0.65 | 0.60 | 0.65 | **0.60** | Definition — no explicit prerequisite AC in S1.2 |
| C5 — AML gap | 0.80 | **0.70** | 0.70 | 0.80 | 0.80 | **0.70** | Definition — not labelled as assumption in story preambles |
| **Stage average** | **0.96** | **0.69** | **0.70** | **0.74** | **0.76** | **0.68** | |

---

## Aggregate CPF Scores

### Final-stage CPF (DoR scores — what the coding agent receives)

| Scope | Constraints | Avg score | Threshold | Result |
|-------|-------------|-----------|-----------|--------|
| General (all) | C1–C5 | (0.75 + 0.60 + 1.00 + 0.65 + 0.80) / 5 = **0.76** | 0.80 | **FAIL** |
| Regulated only | C2, C3 | (0.60 + 1.00) / 2 = **0.80** | 0.80 | **PASS (borderline)** |

### Chain CPF (minimum across all stages — permanent loss indicator)

| Scope | Constraints | Avg score | Threshold | Result |
|-------|-------------|-----------|-----------|--------|
| General (all) | C1–C5 | (0.75 + 0.35 + 1.00 + 0.60 + 0.70) / 5 = **0.68** | 0.80 | **FAIL** |
| Regulated only | C2, C3 | (0.35 + 1.00) / 2 = **0.675** | 0.80 | **FAIL** |

---

## Stage-Level CPF Trend

```
Stage avg CPF:

Discovery  0.96  ████████████████████ 
Definition 0.69  ██████████████       ← Major drop (-0.27)
Review     0.70  ██████████████       ← Marginal recovery (+0.01)
Test-plan  0.74  ███████████████      ← Partial recovery (+0.04)
DoR        0.76  ███████████████      ← Marginal recovery (+0.02)
                                         Does not recover to threshold
```

**Discovery → Definition** is the critical failure point. The -0.27 drop is attributable entirely to the Haiku model at /definition failing to:
- Propagate C2 (PCI DSS) into S1.2 and S2.2 story ACs (catastrophic: 1.00 → 0.35)
- Commit C1 RPO as a deliverable AC output (0.75 instead of 1.00)
- Enforce C4 as an explicit prerequisite AC in S1.2 (0.65)
- Label C5 explicitly in S1.2/S1.3 story preambles (0.70)

Wait — definition was produced by **Sonnet** (Config C: Sonnet for discovery + definition). The failure at Definition is attributable to **claude-sonnet-4-6**, not Haiku.

---

## Model Attribution

| Stage | Model | Stage CPF | Notes |
|-------|-------|-----------|-------|
| Discovery | claude-sonnet-4-6 | 0.96 | Strong constraint capture; all five constraints surfaced |
| Definition | claude-sonnet-4-6 | 0.69 | **Sonnet failure:** C2 not propagated to story ACs; C1 RPO not committed |
| Review | claude-haiku-4-5 | 0.70 | Haiku correctly identifies gaps (H1, H2); does not fix them (expected) |
| Test-plan | claude-haiku-4-5 | 0.74 | Haiku adds T2.2.2 gate test for C2; partial recovery |
| DoR | claude-haiku-4-5 | 0.76 | Haiku propagates gates in contracts; H-NFR3 FAIL correctly issued |

**Key finding:** The CPF degradation at Definition is a **Sonnet defect**, not a Haiku defect. Haiku's downstream work (review, test-plan, DoR) shows consistent identification and partial remediation of the gaps it received. Haiku's chain CPF contribution (from 0.69 at Definition to 0.76 at DoR) is a +0.07 incremental improvement. The primary failure is C2 not being placed in S1.2 and S2.2 story ACs during /definition.

---

## Constraint Propagation Diagnosis

### C2 — Root cause analysis

**Where it broke:** Definition, S1.2 and S2.2 story ACs  
**Why:** The definition model produced a Constraint Propagation Analysis table (in definition.md) that self-assessed C2 as "Named in S1.1 AC5 (QSA pre-engagement); S1.3 includes Compliance team validation." This is a false positive in the model's own self-check. The table is correct that C2 appears somewhere, but misses that S1.2 and S2.2 — the stories that require the gate — have no PCI DSS AC.

The self-assessment pattern is a known CPF failure mode: a model correctly names the constraint in a summary table but does not carry it into the individual story ACs where it is actionable.

**Haiku recovery:** Review correctly identified H2. Test-plan added T2.2.2. DoR contracts added the gate for S1.2 and S2.2. The underlying definition was not fixed (eval mode constraint), but Haiku progressively increased C2 enforcement: 0.35 → 0.40 → 0.50 → 0.60.

### C3 — Why it succeeded

C3 is the only constraint that achieved a 1.00 chain score. Reasons:
- The constraint has a single, specific value (5 years) and a clear owner (Compliance team)
- The solution space is clearly bounded (one story: S1.3 owns all C3 ACs)
- The constraint maps to a concrete deliverable (closed audit finding with sign-off document)
- Both Sonnet (definition) and Haiku (downstream) maintained full propagation

### C2 vs C3 comparison (regulated constraints)

| Aspect | C2 — PCI DSS | C3 — AML/CFT |
|--------|-------------|--------------|
| Chain score | 0.35 | 1.00 |
| Story ownership | Diffuse (affects S1.2, S2.2, S1.3; no single owner) | Clear (S1.3 is explicitly the AML/CFT story) |
| Constraint type | Gate (process) — requires external assessment | Technical — requires specific implementation |
| Value specificity | High (QSA gate) but gate semantics are implicit | High (5 years) and technical implementation obvious |
| Where it dropped | Definition: no story "owns" the PCI DSS gate | Never dropped |

---

## Pass / Fail Summary

| Metric | Score | Threshold | Result |
|--------|-------|-----------|--------|
| General CPF — final stage | 0.76 | 0.80 | **FAIL** |
| Regulated CPF — final stage | 0.80 | 0.80 | **PASS (borderline)** |
| General CPF — chain (min) | 0.68 | 0.80 | **FAIL** |
| Regulated CPF — chain (min) | 0.675 | 0.80 | **FAIL** |
| C3 (AML/CFT) — chain | 1.00 | 0.80 | PASS |
| C2 (PCI DSS) — chain | 0.35 | 0.80 | **FAIL** |
| C1 (RTO/RPO) — chain | 0.75 | 0.80 | FAIL |
| C4 (single site) — chain | 0.60 | 0.80 | FAIL |
| C5 (AML gap) — chain | 0.70 | 0.80 | FAIL |

**Overall Config C run 2 result: FAIL**  
Primary failure driver: C2 (PCI DSS) — catastrophic weakening at Definition stage (Sonnet model).  
Secondary failure driver: C1 RPO not committed, C4 not enforced as prerequisite.  
Bright spot: C3 (AML/CFT) maintained perfect propagation chain.

---

---

## Investigation: C2 drop at Definition — variability vs. context-specificity

**Question:** Is the C2 (PCI DSS) drop at Definition in Config C run 2 a Sonnet variability problem (Config A got lucky; both are plausible draws from the same distribution) or a context-specific failure (something about the Config C run 2 input caused Sonnet to self-check incorrectly)?

### Evidence gathered

Three definitions compared — all under similar story corpus conditions:

| Run | Model | Slicing strategy | C2 in story ACs? | C2 propagation |
|-----|-------|-----------------|------------------|----------------|
| Config A run 1 | claude-sonnet-4-6 | **Risk-first** — explicitly names C2 and C5 as rationale: "most likely to expand scope or block go-live" | Yes — S1.2 AC3, S1.2 NFRs, S1.3 NFRs, S2.1 NFRs | Full; dedicated Epic 3 for regulatory confirmation |
| Config C run 1 | claude-sonnet-4-6 (Haiku switch not executed) | Vertical slice; no C2 mention in rationale | No — C2 absent from propagation table entirely | Complete drop; C2 scored 0.00 at definition |
| Config C run 2 | claude-sonnet-4-6 | **Vertical slice** — rationale: "end-to-end demonstrable capability; surfaces integration issues early" — no mention of PCI DSS | No for S1.2 and S2.2 (the architectural-change stories) | Partial; C2 in propagation table but only credited to S1.1/S1.3 |

### The mediating mechanism: slicing strategy

The critical difference is not the model or the discovery input — it is the **slicing strategy choice** made by the model at the start of /definition.

**Config A Sonnet** selected risk-first slicing, naming C2 and C5 as the motivation: architectural work that could expand scope or block go-live should be de-risked first. This choice had downstream consequences:
- A dedicated Epic 3 ("Regulatory Compliance Confirmation") was created for the QSA DR assessment story
- Because C2 had its own epic, every prior story (S1.2, S1.3, S2.1, S2.2) referenced Epic 3 as a dependency, forcing C2 into their Architecture Constraints sections
- The propagation table accurately reflected this: C2 appeared in 5 stories

**Config C run 2 Sonnet** selected vertical-slice, framing the rationale as technical integration sequencing with no reference to regulatory risk. This choice had the opposite consequence:
- No dedicated compliance epic; C2 was embedded within domain stories (S1.1 and S1.3)
- S1.2 (replication implementation — the architectural change requiring PCI DSS CDE scope) and S2.2 (failover automation — requires PCI DSS-compliant access controls) were written as purely technical stories without a cross-cutting regulatory constraint
- The propagation table then performed a feature-level check ("does C2 appear somewhere?") and found it in S1.1/S1.3, returning a false positive — without checking whether the *architectural-change stories* carried the gate

### Answer to the question

The C2 drop is **not pure variability** and **not a unique context failure**. It is a **slicing strategy selection effect**:

1. Sonnet's choice of slicing strategy is stochastic (same model, same discovery input, different run → different choice). This is the variability component.
2. But once the slicing strategy is chosen, the downstream propagation outcome follows deterministically: risk-first → C2 propagated; vertical-slice → C2 not propagated to architectural stories. This is the mechanism.
3. The self-check false positive (propagation table claiming "ALL FIVE CONSTRAINTS PROPAGATED" when S1.2/S2.2 had no C2 AC) is a secondary failure: the table checks "appears in feature" not "appears in every story that makes an architectural change requiring this gate."

Config A did not "get lucky" in the sense of a random draw — it made a structurally better decomposition choice. But that choice was not forced by the /definition skill prompt; it was an emergent model behaviour. Config C run 2 made a structurally weaker choice for C2 and the self-check missed it.

### Implication for the pipeline

Two failure modes in /definition that compound to cause the C2 gap:

**F6 — Slicing strategy suppresses cross-cutting regulatory constraints.** When vertical-slice is chosen, cross-cutting regulatory process gates (C2 type: "external assessment required before go-live") are assigned to preparation stories (scoping, initial engagement) but are not carried forward as Architecture Constraints in every story that makes a change within the gate's scope. The /definition skill does not require the model to enumerate, for each regulatory constraint, every story that triggers it.

**F7 — Self-check propagation table is feature-scoped, not story-scoped.** The "Constraint Propagation Analysis" table at the end of definition.md validates "does this constraint appear somewhere in the feature?" not "does this constraint appear in every story where it is operationally required?" For C2 (PCI DSS QSA gate), "somewhere in the feature" is insufficient — the gate must be in every story that implements an architectural change. The model's own self-check produced a false positive.

### What additional runs would distinguish variability from context

To definitively separate variability from context: run /definition again on Config C run 2's discovery.md with Sonnet at temperature=0 (or equivalent) three times. If Sonnet consistently chooses vertical-slice and produces C2 = 0.35 (or similar), then vertical-slice is the stable attractor for this discovery context — confirming context-specificity. If slicing strategy varies across those three runs, then the choice is genuinely stochastic — confirming variability. The current evidence (Config A discovery ≠ Config C run 2 discovery) does not allow a direct comparison at identical inputs.

### Remediation direction

The finding is actionable regardless of whether the root cause is variability or context: the /definition skill needs an explicit constraint-enforcement check that is independent of slicing strategy choice. Required: for each regulated constraint in discovery, verify it appears in every story whose implementation scope falls within that constraint's gate. A summary table that only confirms "constraint appears somewhere" is insufficient.

<!-- eval-mode: true -->
