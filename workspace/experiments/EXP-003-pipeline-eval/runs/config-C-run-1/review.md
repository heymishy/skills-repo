# Review Report — Disaster Recovery RTO + AML/CFT Compliance Modernisation

**Run:** 1  
**Date:** 2026-05-14  
**Scope:** Full definition artefact (3 epics, 9 stories)  
**Categories:** A (Traceability), B (Scope Discipline), C (AC Quality), D (NFR Coverage), E (Constraint Propagation)  
**Source discovery:** `runs/config-C-run-1/discovery.md`  
**Source definition:** `runs/config-C-run-1/definition.md`  

---

## FINDINGS

### HIGH findings

#### H1 — RPO target not specified in AC or NFR text (Stories 1.1, 1.2)

**Category:** C (AC Quality), D (NFR Coverage)  
**Affected stories:** S1.1-replication-strategy, S1.2-replication-impl  

The discovery states "RPO must be specified and aligned with transaction completeness requirements" as an open constraint. S1.1 AC4 calculates replication lag targets but never commits to an RPO value in any AC or NFR. S1.2 NFRs say "Replication lag ≤ 30 seconds (if synchronous) or ≤ 5 minutes (if asynchronous)" but these are framed as examples, not binding targets. An RPO is therefore not pinned in any story acceptance criterion.

**Impact:** The coding agent cannot know what "done" looks like for RPO. S1.2 AC3 says "checksum verification confirms zero data loss" for a test dataset — but a test dataset is not a production-volume test and does not address replication timing. The DoR contract will have no RPO gate to enforce.

**Remediation:** S1.1 AC5 must commit to a specific RPO value as a decision output. S1.2 AC3 or a new AC6 must assert that replication lag is measured and confirmed ≤ the agreed RPO value under sustained production-volume load.

---

#### H2 — PCI DSS QSA gate absent from all story ACs and NFRs (all epics)

**Category:** E (Constraint Propagation), C (AC Quality)  
**Affected stories:** All stories in E1 and E2  

The discovery explicitly names C2: "Any architectural changes to the payment authorisation service must be assessed by our QSA before go-live." This constraint does not appear in any story AC or NFR in the definition artefact. The Constraint Propagation Analysis table in the definition does not list PCI DSS. The only constraints listed are AML/CFT, RTO, operational skill level, existing infrastructure, and audit cycle — a set that omits C2 entirely.

**Impact:** A coding agent working from these stories will implement replication and failover automation against the payment authorisation service without any gate requiring QSA sign-off. This is a compliance defect that would survive all AC checks. The story set cannot be handed to a coding agent without an explicit QSA gate in at least one story's DoR contract.

**Remediation:** Add an NFR to S1.2, S2.2 (the stories implementing architectural changes): "No production deployment of this story's changes may proceed without documented QSA assessment scope alignment and, where required, QSA approval." Add a DoR check item: "QSA engagement scoping has been completed and any required assessment is scheduled."

---

#### H3 — PCI DSS not named in discovery Constraints section

**Category:** E (Constraint Propagation)  
**Affected artefact:** discovery.md Constraints section  

The discovery Constraints section lists Regulatory (AML/CFT only), Operational, Business, and Technical constraints. PCI DSS (C2) does not appear. The problem statement paragraph mentions it obliquely — "The payment card data we process is in scope for PCI DSS" — but it is not captured as a named constraint. This means C2 was not propagated from the input brief into the Constraints section, the natural anchor point for downstream propagation into story NFRs and DoR contracts.

**Impact:** Because PCI DSS was not named in the Constraints section of the discovery, it was predictably absent in the definition's constraint propagation analysis. The failure mode is structural: PCI DSS was mentioned in the narrative but not formalised as a constraint, so the pipeline treated it as background context rather than a binding gate.

**Remediation:** Add PCI DSS to the discovery Constraints section under Regulatory: "PCI DSS (Payment Card Industry Data Security Standard) — any architectural change to the payment authorisation service must be assessed by the organisation's Qualified Security Assessor (QSA) before go-live. This applies to all Epic 1 and Epic 2 changes."

---

### MEDIUM findings

#### M1 — C5 (AML replication gap unverified) surfaced only as "open question" — not as an explicit assumption or investigation item

**Category:** E (Constraint Propagation), C (AC Quality)  
**Affected artefact:** discovery.md Open Questions section  

The AML replication gap (C5: replication to secondary site within statutory retention window is unverified) appears in the discovery as Open Question 1: "Is the current asynchronous replication lag acceptable for the 5-year AML/CFT retention requirement?" This captures the spirit of C5 but does not explicitly state the assumption that the gap is currently unresolved — it is framed as a design decision rather than a known compliance risk requiring investigation.

S1.3 AC4 (monthly gap report) and S1.3 AC5 (zero gaps in first three months) address the resolution mechanism but do not name the pre-existing gap as an assumption to carry through. The DoR contract will not have an explicit assumption stating "it has not been verified that current replication captures all transactions within the 5-year window."

**Impact:** CPF scoring — C5 partially propagated (narrative present; missing explicit assumption marker). A model scored by a judge on C5 propagation would receive partial credit, not full credit.

**Remediation:** Add to discovery Assumptions section: "The current batch replication process to the secondary site has not been verified to capture all transactions within the AML/CFT 5-year statutory retention window. This must be verified as a deliverable of Story 1.3."

---

#### M2 — C4 (single data centre) treated as background context, not a formal constraint

**Category:** E (Constraint Propagation)  
**Affected artefact:** discovery.md  

C4 (Auckland-only data centre, no existing secondary site infrastructure configured for workload processing) is mentioned in the Feature Overview and implied throughout, but does not appear as a named constraint in the Constraints section. The definition correctly notes "Secondary site infrastructure exists and is available for upgrade" but this is under Technical constraints without acknowledging that C4 is a starting state — the secondary site exists but is not currently configured for active transaction processing.

**Impact:** Stories S1.2 and S2.2 assume the secondary site is ready for workload, which is only true after provisioning. No story AC covers secondary site infrastructure readiness as a prerequisite or first deliverable. If C4 were formalised as a constraint, a prerequisite story or AC covering "secondary site prepared for active workload processing" would be a natural output.

**Remediation:** Add C4 to discovery Constraints (Technical): "Current secondary site (Hamilton co-location facility) is configured only for backup storage and is not provisioned for active workload processing. Provisioning the secondary site for transaction workload is a prerequisite to all E1 and E2 stories."

---

#### M3 — No RPO linked to AML/CFT retention in constraint propagation table

**Category:** D (NFR Coverage)  
**Affected artefact:** definition.md Constraint Propagation Analysis  

The constraint propagation table lists AML/CFT as propagated to S1.2 and S1.3, but does not link it to an RPO requirement. The AML/CFT 5-year retention window is a durability constraint (no transaction loss), not a latency constraint. The RPO constraint governs how much data may be lost in a failure scenario — and that is directly relevant to whether AML/CFT compliance can be maintained through a failover. If the RPO is 1 hour and a failover occurs after a 45-minute replication lag, transactions in that window may not be on the secondary site, violating the 5-year retention requirement. This linkage is absent.

**Remediation:** Add to constraint propagation table: AML/CFT → RPO must be ≤ replication lag threshold → propagates to S1.1 AC4 (RPO calculation) and S1.2 NFR (replication lag).

---

#### M4 — Success criteria use "three consecutive DR drills" without a sample size or statistical basis

**Category:** C (AC Quality)  
**Affected stories:** S2.2, feature success criteria  

"Three consecutive successful DR drills" appears as the RTO verification criterion. Three consecutive successes is an intuitively reasonable sample, but there is no basis stated for why three is sufficient. In a regulated payment environment, a more rigorous standard would specify either a minimum number of drills per year or a confidence interval on the RTO measurement. This is a quality finding rather than a blocking defect, but it weakens the definition's claim that it satisfies the Board's DR policy requirements.

---

### LOW findings

#### L1 — Known Constraints & Architecture Notes section in discovery contains placeholders

**Category:** A (Traceability)  
**Affected artefact:** discovery.md  

Four fields in Known Constraints & Architecture Notes contain `[insert current TPS/daily transaction count]`, `[existing solution specifics]`, `[primary to secondary; impacts RPO]`, and `[current audit logging]`. These are not assumptions — they are empty data fields. The discovery was approved with unresolved data requirements. Stories S1.1 (AC2, AC3) are designed to gather these, but the discovery artefact should note these as known unknowns explicitly rather than leaving blank fields.

#### L2 — Complexity 3 assigned to E1 and E2 at epic level but not reconciled with story-level complexity estimates

**Category:** B (Scope Discipline)  
**Affected artefact:** definition.md  

Epic 1 and Epic 2 are marked Complexity 3. Individual stories within them are Complexity 1, 2, or 3. No story-level total or reconciliation is provided. Story S3.3 (Runbook) is Complexity 1 despite depending on all other stories completing successfully — the complexity score should reflect the dependency chain risk. This is a minor consistency issue, not a blocking defect.

#### L3 — "No architectural changes to transaction core processing" constraint inconsistent with Epic 2 scope

**Category:** B (Scope Discipline)  
**Affected artefact:** discovery.md Technical constraints  

The discovery states a Technical constraint: "No architectural changes to transaction core processing." Epic 2 (Failover Automation) includes DNS/connection string updates, split-brain prevention, and write-traffic routing changes — all of which affect how transaction processing is addressed at the infrastructure layer. This may not violate the spirit of the constraint (the intent was likely to exclude changes to business logic), but the constraint as written is ambiguous and will confuse a coding agent that reads both the constraint and the Epic 2 scope.

**Remediation:** Clarify constraint wording: "No changes to transaction business logic, message formats, or payment processing rules." The infrastructure/failover layer is explicitly in scope.

---

## SCORE

| Category | Finding counts | Score |
|---|---|---|
| A — Traceability | 0 HIGH, 0 MEDIUM, 1 LOW | 0.85 |
| B — Scope Discipline | 0 HIGH, 0 MEDIUM, 2 LOW | 0.80 |
| C — AC Quality | 2 HIGH, 1 MEDIUM, 0 LOW | 0.45 |
| D — NFR Coverage | 1 HIGH, 1 MEDIUM, 0 LOW | 0.55 |
| E — Constraint Propagation | 2 HIGH, 2 MEDIUM, 0 LOW | 0.35 |

**Overall: FAIL**

Constraint propagation (E) score is 0.35 — well below the 0.60 general threshold and the 0.80 threshold required for regulated constraints C2 and C3. H2 and H3 (PCI DSS absent) are the primary cause.

---

## VERDICT

**FAIL — blocked on H1, H2, H3.**

The definition artefact may not proceed to /test-plan without resolving:
- H2: PCI DSS QSA gate added to S1.2 and S2.2 story ACs/NFRs
- H3: PCI DSS formalised as a Regulatory constraint in the discovery
- H1: RPO pinned in S1.1 AC5 as a committed decision output

M1 (C5 partial propagation) and M2 (C4 as formal constraint) should be resolved before test-plan to avoid the same propagation gap appearing in the DoR contract.

---

## CPF Pre-score (Discovery + Definition, pre-remediation)

| Constraint | Present in Discovery | Present in Definition Story ACs/NFRs | Propagation verdict |
|---|---|---|---|
| C1 — RTO ≤ 2h / RPO ≤ 15min | ✅ Named (RTO explicit) / ⚠️ RPO open question | ✅ RTO in E2 ACs / ❌ RPO not pinned | Partial — C1 RTO propagated; RPO not pinned |
| C2 — PCI DSS QSA before go-live | ❌ Not in Constraints section (narrative mention only) | ❌ Absent from all story ACs, NFRs, propagation table | Not propagated |
| C3 — AML/CFT 5-year retention | ✅ Named in Constraints | ✅ S1.3 ACs address retention | Propagated |
| C4 — Single data centre / no secondary site configured | ⚠️ Background context only — not in Constraints section | ⚠️ Implied in S1.1/S1.2 but no prerequisite story | Partial |
| C5 — AML replication gap unverified (hidden) | ⚠️ Open question (not named as assumption) | ⚠️ Addressed by S1.3 mechanism but no explicit assumption carried | Partial |

<!-- eval-mode: true -->
