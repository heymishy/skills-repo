# Review: Trans-Tasman Payment Corridor — Proprietary Intra-Group Routing Channel

**Feature:** trans-tasman-payment-corridor
**Discovery status:** Approved (read from disk: `runs/config-B-S13/discovery.md`)
**Definition status:** Complete (read from disk: `runs/config-B-S13/definition.md`)
**Review model:** claude-sonnet-4-6 (Config B — Sonnet for /review, /test-plan, /definition-of-ready)
**Date:** 2026-05-17
**Run:** EXP-008 Config B S13

---

## Review scope and inputs

Artefacts reviewed:
- `runs/config-B-S13/discovery.md` — Approved, Opus-authored, all five constraints (C1–C5) present
- `runs/config-B-S13/definition.md` — Complete, Opus-authored, 12 stories across 3 epics

Review categories applied: A (discovery completeness), B (scope discipline), C (story quality and AC testability), D (architecture and NFR), E (security and compliance), H (regulated constraints — hard blocks for multi-jurisdiction payment systems).

---

## Category A — Discovery Completeness

### A1 — Problem framing quality
**Finding level: PASS**
Discovery names both a competitive gap (NZD $4.2M annual revenue loss to alternative services) and a regulatory/contractual perimeter (five distinct obligations across NZ, AU, and cross-border contractual legs). Personas are named with jurisdiction-scoped roles (RBNZ AML/CFT Compliance Officer, Regulatory Affairs Manager, Treasury Legal Counsel, Enterprise Treasury Manager, Payments Compliance Officer). Success indicators include a measurable revenue recovery target (NZD $1M+ within 12 months), a pricing threshold (≤NZD $5), a settlement SLA (2 hours), and regulated compliance outcomes with zero-finding targets.

### A2 — Assumptions and risks completeness
**Finding level: PASS**
Five assumptions (A1–A5) are documented with specific validation mechanisms. All five constraints have corresponding BLOCKER (B1–B4) or escalating RISK (R1/C5) entries. R1 includes an explicit escalation condition (from RISK to BLOCKER on confirmation of JPMorgan Chase notification obligation) and the surfacing chain (TTPS-SWIFT-001 + TTPS-RISK-001 HIGH + ADR-CB-002 Note). R2–R4 cover timeline, data quality, and SLA risks. Discovery does not under-report risk.

### A3 — Context injection signals processed
**Finding level: PASS**
All three context injection files are processed at depth. EA registry signals: TTPS-RISK-001 through TTPS-RISK-005 all carried. ADR-CB-002 through ADR-CB-008 all mapped. Policy doc signals from all four parts (A, B, C, D) present in discovery, with specific section references. No injection signal left unprocessed.

---

## Category B — Scope Discipline

### B1 — MVP scope boundary
**Finding level: PASS**
MVP scope lists 8 items (items 1–8) in explicit scope. Out-of-scope section lists 8 items explicitly excluded with stated rationale for each exclusion. Notable: JPMorgan Chase commercial relationship management is correctly excluded as a Finance/Treasury matter distinct from the contractual notification obligation (which is in scope as a pre-launch gate). The distinction is clearly articulated. No scope creep identified.

### B2 — Story count proportionality
**Finding level: PASS**
12 stories (5 Epic 1 pre-condition stories, 5 Epic 2 channel core stories, 2 Epic 3 settlement/confirmation stories) map directly 1:1 to the 8 MVP scope items and 5 pre-launch pre-conditions (B1–B5/C1–C5). The scope accumulator in the definition confirms no drift and no omissions.

### B3 — Future phase contamination
**Finding level: PASS**
AU-to-NZ reverse direction (out-of-scope item 1), above-threshold transactions (item 2), and additional corridors (item 3) are all explicitly excluded from the story set and do not appear in any AC as a "future consideration" or "phase 2" candidate without explicit labelling. Story 3.2 correctly limits to confirmation of credit instruction acknowledgement (no reverse-direction logic introduced).

---

## Category C — Story Quality and AC Testability

### C1 — AC completeness: Epic 1 (pre-condition) stories
**Finding level: PASS**
Each Epic 1 story (1.1–1.5) follows a complete structure: persona with named jurisdiction-appropriate role, "I want to… so that…" framing anchored to the specific regulatory/contractual obligation, ACs covering (a) the validation/confirmation action, (b) the document filing/tracking evidence, (c) the deployment configuration flag establishment with defaults, (d) the non-delegable enforcement mechanism in change-control, and (e) automated test coverage for gate-flag behaviour. No AC left at the aspirational/untestable level.

### C2 — AC testability: gate-flag enforcement ACs
**Finding level: PASS**
All flag-enforcement ACs in Epic 2 stories (2.1, 2.2, 2.4) and Epic 3 (3.1) follow the pattern: "flag=false → [specific error message]" and "flag=true → [specific behaviour]". These are unambiguous pass/fail conditions verifiable by automated tests. The specific error messages are named (e.g., "channel not activated", "AUSTRAC confirmation not yet received", "correspondent agreement not authorised") rather than generic ("error returned"), which makes test assertion writing deterministic.

### C3 — AC completeness: Epic 2 (engineering) stories
**Finding level: PASS**
Stories 2.1–2.5 ACs cover intake eligibility rules (AU beneficiary + ≤NZD $10,000), state machine transitions with named states (ACCEPTED_PENDING_SCREENING → SCREENING_IN_PROGRESS → SCREENING_PASSED | SCREENING_BLOCKED | SCREENING_ERROR_DECLINED), fail-closed screening behaviour, originator information field completeness validation, and RBNZ threshold transaction reporting. Each AC is a testable condition.

### C4 — Minor: Story 2.4 acknowledgement timeout handling
**Finding level: LOW**
Story 2.4 AC3 specifies that if acknowledgement is not received within "configured timeout", the instruction moves to PENDING_ACKNOWLEDGEMENT state and an alert is raised. The timeout value and the retry policy are referenced as "Treasury Operations runbook" rather than named in the AC. This is acceptable for a definition story (the exact value is a deployment configuration decision) but the test plan should include a specific timeout boundary test to ensure the state machine is exercised. No AC change required; flagged for test-plan coverage.

### C5 — Minor: Story 3.2 SLA definition completeness
**Finding level: LOW**
Story 3.2 AC2 defines the SLA timer starts at intake (Story 2.1) and stops at customer confirmation issuance. AC3 references "instructions submitted near or past the intra-group channel processing cut-off" with a fallback to SWIFT or customer notification. The cut-off time is not defined in the AC (reasonable — it is a deployment configuration). However, the test plan should include a test for instructions at and past the cut-off boundary. Flagged for test-plan coverage. No AC change required.

---

## Category D — Architecture and Non-Functional Requirements

### D1 — Architecture guardrail compliance
**Finding level: PASS**
All eight active architecture guardrails (ADR-CB-001 through ADR-CB-008) are addressed in the story set. ADR-CB-002 (routing change review + correspondent agreement review) addressed by Story 1.5 and the architecture constraints scan. ADR-CB-003/004 (mandatory synchronous screening + fail-closed) addressed by Story 2.2 AC1 and AC2. ADR-CB-005 (dual-jurisdiction AML/CFT obligation map) addressed by Table 1 and C1+C2 constraint mapping. ADR-CB-006 (AUSTRAC originator information standards) addressed by Stories 1.2 and 2.3. ADR-CB-007 (DIA assessment before retail launch) addressed by Story 1.4 and the `DIA_REGISTRATION_CLEARED` gate. ADR-CB-008 (FX reporting Treasury sign-off as DoR prerequisite) addressed by Story 1.3 and `FX_REPORTING_VALIDATED` gate; the DoR prerequisite language is noted in the architecture constraints of Story 3.1.

### D2 — Retention obligation coverage
**Finding level: PASS**
RBNZ 7-year originator information retention (s.A.4.3) is addressed in Story 2.2 AC4 (screening record retention) and Story 2.3 AC1 (originator information data model). The retention obligation is explicit rather than implicit.

### D3 — NFR observation: performance characteristics absent from definition stories
**Finding level: LOW (expected at definition stage; test-plan coverage required)**
The story set does not include performance or throughput NFRs (e.g., maximum intake processing latency, screening service timeout threshold, TTPS-ROUTE-001 transmission timeout). These are appropriate to specify in the test plan rather than the definition stories. Flagged to ensure the test plan includes specific thresholds rather than generic "performant" language. No story change required.

---

## Category E — Security and Compliance

### E1 — Channel activation gate security
**Finding level: PASS**
Story 1.1 AC3, 1.2 AC4, 1.3 AC3, 1.4 AC3, and 1.5 AC3 each specify: (a) flag defaults to `false`; (b) production deployment-configuration change requires change-control evidence linking to the named owner's written confirmation document ID; (c) change-control rejects flag changes not linked to the required document IDs and not authorised by the named role. This addresses the risk of a flag being set to `true` without the actual compliance/legal work being complete.

### E2 — Fail-closed screening enforcement
**Finding level: PASS**
Story 2.2 AC2 explicitly handles the ERROR result (screening service unavailable) as decline with reason "screening service unavailable — fail-closed". No "proceed without screening" path. The double-gate (Story 2.1 intake + Story 2.2 screening boundary) is intentional and documented as defence-in-depth in Story 2.2 AC3. ADR-CB-004 CISO RISK-ACCEPT requirement for any deviation is preserved.

### E3 — Originator information data quality enforcement
**Finding level: PASS**
Story 2.3 AC2 specifies structured intake rejection with field-level error messages when required AUSTRAC fields are missing or fail format requirements. Story 2.4 AC2 adds a second transmission-boundary completeness check. The double-validation matches the defence-in-depth pattern required by ADR-CB-006.

### E4 — Path traversal and deployment configuration security (web-ui patterns note)
**Finding level: LOW (out of scope for this story set; noted for implementation phase)**
The deployment configuration flags (AMLCFT_CHANNEL_VALIDATED etc.) are likely to be managed via a configuration API or admin interface. The implementation phase should apply the path traversal guard (web-ui-patterns.md) and RBAC enforcement for any API endpoints that read or write these flags. Not an AC-level gap at definition stage; flagged for the DoR pre-check.

---

## Category H — Regulated Constraint Hard Checks

### H1 — C1 (RBNZ AML/CFT) — NZ leg
**Finding level: PASS — hard block satisfied**
C1 is PRIMARY in Story 1.1 and present in Architecture Constraints of Stories 2.2, 2.3, 2.4, 2.5, 3.1, and 3.2. Named gate owner is RBNZ AML/CFT Compliance Officer with non-delegable boundary listing five excluded roles with jurisdiction-specific rationale. Flag `AMLCFT_CHANNEL_VALIDATED` established with `false` default and change-control enforcement. BS11 notification gate (`BS11_NOTIFICATION_DATE` + 30-business-day deployment check) fully specified.

### H2 — C2 (AUSTRAC AML/CTF) — AU leg
**Finding level: PASS — hard block satisfied**
C2 is PRIMARY in Story 1.2 and Story 2.3. Joint gate ownership (NZ Payments Compliance Officer + AU-side Enterprise's Australian Counterpart Compliance Liaison) is clearly specified with explicit non-delegable boundary: AU-side confirmation is non-delegable to any NZ-side role alone. Flag `AUSTRAC_CONFIRMATION_RECEIVED` with `false` default and joint-sign-off change-control enforcement. Cross-border jurisdiction boundary preserved.

### H3 — C3 (RBNZ FX Transaction Reporting) — NZ leg
**Finding level: PASS — hard block satisfied**
C3 is PRIMARY in Stories 1.3 and 3.1. Named gate owners (Enterprise Treasury Manager + Regulatory Affairs team lead — joint sign-off) with non-delegable boundary distinguishing C3 from C1 within the RBNZ remit. ADR-CB-008 Treasury sign-off as DoR prerequisite for Story 3.1 is present in Story 3.1's Architecture Constraints. Flag `FX_REPORTING_VALIDATED` with `false` default.

### H4 — C4 (Payment Services Regulations 2021 / DIA) — NZ leg
**Finding level: PASS — hard block satisfied**
C4 is PRIMARY in Story 1.4. Named gate owner Regulatory Affairs Manager with non-delegable boundary listing four excluded roles with specific functional-jurisdiction rationale (not functional-level substitutes). Two-path determination (existing-licence-coverage via `DIA_ASSESSMENT_ID` or new-type-registration via `DIA_REGISTRATION_ID`) is fully specified. Flag `DIA_REGISTRATION_CLEARED` with `false` default.

### H5 — C5 (SWIFT correspondent bank agreement — JPMorgan Chase) — Cross-border contractual
**Finding level: PASS — hard block satisfied**
C5 is PRIMARY in Story 1.5 and Story 2.4 (gate enforcement). Named gate owner is Treasury Legal Counsel with an explicit non-delegable boundary that names five excluded roles and states the contractual-vs-regulatory functional jurisdiction rationale for each exclusion. The regulatory/contractual functional boundary is clearly articulated (Story 1.5 AC3: "change-control explicitly rejects any flag change authorised by a regulatory function [RBNZ AML/CFT Compliance, AUSTRAC compliance, Regulatory Affairs, AUSTRAC compliance] because the obligation under C5 is contractual rather than regulatory"). RISK R1 escalation condition from discovery (BLOCKER on confirmation of notification obligation) is preserved in Story 1.5 AC2 determination (b). Clearance path (no obligation) and notification/consent path (obligation confirmed) are both fully specified. Flag `CORRESPONDENT_AGREEMENT_CLEARED` with `false` default and legal-sign-off-only change-control.

### H6 — Multi-jurisdiction constraint independence verification
**Finding level: PASS**
The five constraints are treated as independent gates. C1 and C3 share the RBNZ remit but are procedurally separate (confirmed in Story 1.1 Architecture Constraints Note and Story 2.5 Architecture Constraints Note). C2 and C5 share the cross-border dimension but are categorically distinct (regulatory vs. contractual). No constraint is collapsed into another's gate. No gate owner is shared across constraints except the intentional joint-ownership structures (C2 joint NZ/AU, C3 joint Treasury/Regulatory Affairs).

---

## Review verdict

**PASSED** — No HIGH findings. All five regulated constraint hard blocks (H1–H5) passed. Six LOW findings noted, all appropriate for test-plan and implementation stage rather than definition correction. Definition artefacts are ready to proceed to /test-plan.

**LOW findings summary (all carry to /test-plan and /definition-of-ready for coverage verification):**

| ID | Finding | Carry-forward action |
|----|---------|---------------------|
| C4 | Story 2.4: acknowledgement timeout value referenced as "runbook" — test plan must include specific timeout boundary test | Test plan NFR: timeout boundary and state machine transition test |
| C5 | Story 3.2: processing cut-off time referenced implicitly — test plan must include cut-off boundary test | Test plan: SLA cut-off boundary test with SWIFT fallback path |
| D3 | Performance NFRs absent from stories — test plan must specify latency/throughput thresholds | Test plan NFR: P95 intake latency, screening timeout, transmission timeout |
| E4 | Deployment configuration API security (path traversal, RBAC) — flag for implementation stage | DoR pre-check: flag API security as implementation-phase NFR |

<!-- REVIEW-TRACE
model: claude-sonnet-4-6
config: B
experiment: EXP-008-corpus-breadth-eval
run: config-B-S13
date: 2026-05-17
upstream_artefact: runs/config-B-S13/definition.md

findings_by_level:
  HIGH: 0
  MEDIUM: 0
  LOW: 4 (C4 timeout boundary, C5 cut-off boundary, D3 performance NFRs, E4 config API security)
  PASS: 11 (A1, A2, A3, B1, B2, B3, C1, C2, C3, D1, D2; E1, E2, E3; H1, H2, H3, H4, H5, H6)

verdict: PASSED — ready for /test-plan
c5_preserved: true
c5_gate_owner: Treasury Legal Counsel (non-delegable to regulatory functions)
multi_jurisdiction_check: PASS — C1/C3/C4 (NZ), C2 (AU), C5 (cross-border contractual) treated as independent gates
-->
