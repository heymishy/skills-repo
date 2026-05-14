# Review Report — Disaster Recovery RTO + AML/CFT Compliance Modernisation

**Run:** 2  
**Date:** 2026-05-14  
**Scope:** Full definition artefact (3 epics, 9 stories)  
**Categories:** A (Traceability), B (Scope Discipline), C (AC Quality), D (NFR Coverage), E (Constraint Propagation)  
**Source discovery:** `runs/config-C-run-2/discovery.md`  
**Source definition:** `runs/config-C-run-2/definition.md`  
**Model:** claude-haiku-4-5  
**Eval mode:** true  

---

## FINDINGS

### HIGH findings

#### H1 — RPO not pinned as committed decision output in S1.1 ACs

**Category:** C (AC Quality), D (NFR Coverage)  
**Affected stories:** S1.1-replication-strategy  

S1.1 AC4 states "RPO targets (≤ 15 minutes) confirmed achievable" but does not commit to an RPO value as a deliverable. The AC evaluates feasibility but leaves the decision uncommitted. AC5 schedules QSA pre-engagement but does not record an RPO decision. Without a pinned RPO in any AC, S1.2 implementation cannot have a measurable acceptance criterion for replication lag.

**Impact:** Coding agent cannot verify replication lag meets requirements without a committed RPO value. Test plan will lack a clear pass/fail threshold for lag measurement.

**Remediation:** S1.1 AC5 must include deliverable: "RPO value of [N minutes] is committed and recorded in decisions.md with signed approval."

---

#### H2 — PCI DSS constraint absent from definition story ACs and NFRs

**Category:** E (Constraint Propagation), C (AC Quality)  
**Affected stories:** All stories in E1 and E2  

The discovery identifies "PCI DSS compliance — any architectural change requires QSA assessment before go-live" (C2) in its Constraints section. However, the definition artefact does not name PCI DSS in any story's AC or NFR. No story includes a gate test for QSA engagement or assessment completion. Story 1.1 and 2.2 (which make architectural changes) lack explicit QSA prerequisites in their ACs.

**Impact:** A coding agent will implement replication and failover without any QSA gate in the story set. The constraint is named in discovery but not propagated to story-level acceptance criteria where it becomes testable.

**Remediation:** S1.1 AC5 must include: "QSA pre-assessment scoping is scheduled and documented at [path]." S1.2 AC must include: "No production deployment before QSA architectural assessment is completed."

---

#### H3 — Slicing strategy not stated explicitly (refers to "vertical slice" but does not record the choice)

**Category:** B (Scope Discipline)  
**Affected artefact:** definition.md  

The definition heading states "Slicing Strategy: Vertical Slice" but does not capture this as a formal decision in the epic or feature artefact structure. The /definition skill requires that "the chosen strategy in every epic artefact — not implied, written explicitly" be recorded. This is recorded at feature level, not at epic level.

**Impact:** CPF scoring — slicing strategy choice is documented but not in the canonical location (each epic should record its strategy). Minor structural issue, not a blocker.

**Remediation:** Repeat the slicing strategy statement in each epic heading or rationale section.

---

### MEDIUM findings

#### M1 — C5 (hidden AML gap) surfaces as explicit assumption but not as assumption marker in discovery

**Category:** E (Constraint Propagation)  
**Affected artefact:** discovery.md  

The discovery /clarify recommendation block includes C5 as an `[ASSUMPTION]` item: "AML/CFT replication gap at the Hamilton site is unverified and may require a mechanism upgrade." This is correctly identified. However, the discovery Assumptions and Risks section does not include this as an explicit assumption — it appears only in the /clarify block. S1.3 addresses this via monthly gap reports, but the assumption is not carried forward in the definition as an explicit precondition.

**Impact:** CPF partial — C5 is visible in the discovery /clarify block and addressed in S1.3, but not marked as an ongoing assumption in the story set. A model evaluated on C5 propagation receives partial credit.

---

#### M2 — C4 (single data centre) present in constraints but not explicitly named as a prerequisite for S1.2

**Category:** E (Constraint Propagation)  
**Affected stories:** S1.2, S2.1  

The discovery Constraints section includes C4: "Single active data centre (Auckland); no secondary processing capability currently exists." The definition mentions Hamilton facility infrastructure but does not include an explicit prerequisite AC stating "secondary site must be provisioned before S1.2 implementation." Stories S1.2 and S2.1 assume secondary site is ready without naming a preparatory step.

**Impact:** CPF partial — C4 is named but not propagated as a sequencing prerequisite. The definition correctly sequences E1 before E2, but does not explicitly call out the secondary site provisioning step.

---

#### M3 — RPO target range ambiguous: "≤ 15 minutes" in discovery, "(≤ 30 sec synchronous or ≤ 5 min asynchronous)" in S1.2

**Category:** C (AC Quality)  
**Affected stories:** S1.1, S1.2  

The discovery states RPO ≤ 15 minutes. S1.2 NFRs offer two options: "≤ 30 sec synchronous or ≤ 5 min asynchronous." The 5-minute option conflicts with the 15-minute discovery target. This ambiguity means S1.1 must decide which RPO to target (15 min? 5 min? 30 sec?), and the definition does not require that decision to be made in a story AC.

**Impact:** Stories will be handed to coding agent without clarity on the RPO target. Implementation will proceed with an unstated replication lag requirement.

**Remediation:** S1.1 AC5 must commit to a specific RPO value, reconciling the 15-minute discovery target with the technical options (sync/async).

---

#### M4 — "Two consecutive DR drills" success criterion appears in multiple places without alignment

**Category:** C (AC Quality)  
**Affected stories:** S2.2, S2.3  

S2.2 Epic success criteria mention "Two consecutive DR drills"; S2.3 AC3 mentions "three times"; Scope Accumulator table mentions "2 of 2 controlled DR drills." The number is inconsistent across the definition. For RTO verification rigor, consistency is important.

**Impact:** Coding agent cannot determine how many DR drills satisfy the AC. This is a quality issue, not a blocker, but it weakens the definition's precision.

---

### LOW findings

#### L1 — Complexity scoring at feature/epic level not reconciled with story effort estimates

**Category:** B (Scope Discipline)  
**Affected artefact:** definition.md  

Epics E1 and E2 are marked Complexity 3. Stories within them range from S (3–5 days) to L (2–3 weeks). No rollup or reconciliation is provided. Story 3.3 (Runbook, Complexity 1) has a dependency chain risk that makes its actual complexity higher than 1; this is not reflected.

**Impact:** Estimate clarity is reduced. Not a blocker.

---

#### L2 — "No changes to transaction core processing" constraint wording ambiguous

**Category:** B (Scope Discipline)  
**Affected artefact:** discovery.md  

The constraint "No architectural changes to transaction core processing" may conflict with Epic 2's failover automation (DNS updates, write-traffic routing, split-brain prevention). The constraint likely intended to exclude business logic changes, but the wording is broad.

**Impact:** Minor ambiguity; not a blocker.

---

## SCORE

| Category | Finding counts | Score |
|---|---|---|
| A — Traceability | 0 HIGH, 0 MEDIUM, 0 LOW | 1.0 |
| B — Scope Discipline | 1 HIGH, 1 MEDIUM, 2 LOW | 0.60 |
| C — AC Quality | 2 HIGH, 2 MEDIUM, 0 LOW | 0.40 |
| D — NFR Coverage | 0 HIGH, 1 MEDIUM, 0 LOW | 0.80 |
| E — Constraint Propagation | 1 HIGH, 1 MEDIUM, 0 LOW | 0.60 |

**Overall: FAIL**

Constraint Propagation (E) score is 0.60 — at the general threshold but below the 0.80 threshold required for regulated constraints (C2 PCI DSS). AC Quality (C) score is 0.40, indicating RPO commitment missing and constraint propagation weak.

---

## VERDICT

**FAIL — blocked on H1, H2, H3.**

The definition artefact may not proceed to /test-plan without resolving:
- **H2:** PCI DSS QSA gate added to S1.1 AC5 and S1.2/S2.2 story acceptance criteria
- **H1:** RPO pinned in S1.1 AC5 as a committed decision output
- **H3:** Slicing strategy recorded explicitly in each epic (not just feature level)

M1–M4 should be resolved before test-plan to improve constraint propagation and AC clarity.

---

## CPF Pre-score (Discovery + Definition, pre-remediation)

| Constraint | Present in Discovery | Present in Definition Story ACs/NFRs | Propagation verdict |
|---|---|---|---|
| C1 — RTO ≤ 2h / RPO ≤ 15min | ✅ Named; RTO explicit, RPO open | ✅ RTO in E2; ⚠️ RPO not pinned in AC | Partial — RTO propagated; RPO not committed |
| C2 — PCI DSS QSA before go-live | ✅ Named in Constraints | ❌ Absent from story ACs/NFRs; H2 finding | Not propagated |
| C3 — AML/CFT 5-year retention | ✅ Named in Constraints | ✅ S1.3 ACs address retention verification | Propagated |
| C4 — Single data centre / no secondary site configured | ✅ Named in Constraints | ⚠️ Implied; not explicit prerequisite AC in S1.2 | Partial |
| C5 — AML replication gap unverified (hidden) | ✅ Named in /clarify block as `[ASSUMPTION]` | ✅ S1.3 monthly gap report verifies; assumption carried | Partial — propagated in solution, not carried as assumption marker |

---

<!-- eval-mode: true -->
