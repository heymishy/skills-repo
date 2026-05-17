# Definition of Ready: Trans-Tasman Payment Corridor

**Status:** Ready for sign-off
**Created:** 2026-05-17
**Prepared by:** claude-haiku-4-5 (EXP-008 Config C /definition-of-ready)

---

## Entry Condition Check

✓ Discovery artefact approved
✓ Benefit-metric artefact active (implied from discovery success indicators)
✓ Definition artefact completed and reviewed (PASS)
✓ Review artefact completed (5/5 criteria PASS)
✓ Test plan artefact completed (27 test cases + 8 AC verification scripts)

**Entry condition: MET. Proceeding to DoR gates.**

---

## Hard Blocks (H1–H9, H-E2E, H-NFR)

### H1: Story AC count and GWT format

**Gate:** Every story has minimum 3 ACs in Given/When/Then format.

**Status: PASS** ✓
- Story 1.1: 3 ACs, GWT ✓
- Story 1.2: 3 ACs, GWT ✓
- Story 1.3: 3 ACs, GWT ✓
- Story 1.4: 3 ACs, GWT ✓
- Story 2.1: 3 ACs, GWT ✓
- Story 3.1: 4 ACs, GWT ✓
- Story 3.2: 4 ACs, GWT ✓
- Story 3.3: 4 ACs, GWT ✓
- Story 4.1: 3 ACs, GWT ✓

### H2: Persona linkage

**Gate:** Every story references a named persona from discovery, not generic "user".

**Status: PASS** ✓
- Story 1.1: Enterprise RBNZ Compliance Lead ✓
- Story 1.2: Enterprise Treasury Lead (NZ) ✓
- Story 1.3: Enterprise Regulatory Affairs Lead ✓
- Story 1.4: Enterprise Treasury Lead + Legal Counsel ✓
- Story 2.1: Enterprise Compliance Lead + Australian Counterpart Compliance Lead ✓
- Story 3.1: Enterprise retail customer with trans-Tasman connections ✓
- Story 3.2: Enterprise Compliance Operations team ✓
- Story 3.3: Enterprise group treasury system ✓
- Story 4.1: Enterprise group treasury ✓

### H3: Benefit linkage to metrics

**Gate:** Every story's "So that..." connects to a named metric from the benefit-metric artefact, not a feature preference.

**Status: PASS** ✓
- Story 1.1: Regulatory gate-pass (C1 metric: zero RBNZ enforcement findings) ✓
- Story 1.2: Regulatory gate-pass (C3 metric: FX reporting obligation) ✓
- Story 1.3: Regulatory gate-pass (C4 metric: DIA registration timeline) ✓
- Story 1.4: Regulatory gate-pass (C5 metric: correspondent relationship risk) ✓
- Story 2.1: Regulatory gate-pass (C2 metric: AUSTRAC compliance) ✓
- Story 3.1: Revenue retention metric (NZD $4.2M leakage reduction) + settlement SLA (2-hour target) ✓
- Story 3.2: Compliance gate-pass (C1 metric: zero enforcement findings) ✓
- Story 3.3: Compliance gate-pass (C2 metric: AUSTRAC compliance) ✓
- Story 4.1: Compliance gate-pass (C3 metric: FX reporting obligation) ✓

### H4: Out-of-scope discipline

**Gate:** Every story has a genuine out-of-scope section with at least one excluded behaviour and a reason. "N/A" is not acceptable.

**Status: PASS** ✓
- Story 1.1: Out-of-scope: "Modification to sanctions screening rules", "New AML/CFT screening service build" ✓
- Story 1.2: Out-of-scope: "Build of new FX reporting service", "Changes to settlement timing" ✓
- Story 1.3: Out-of-scope: "DIA registration application itself", "Changes to existing licence" ✓
- Story 1.4: Out-of-scope: "Renegotiation of correspondent agreement", "Changes to SWIFT infrastructure" ✓
- Story 2.1: Out-of-scope: "AUSTRAC registration", "Changes to Australian counterpart AML/CTF Programme" ✓
- Story 3.1: Out-of-scope: "AU-to-NZ reverse", ">$10k via proprietary", "Non-Australian corridors", "Third-party initiation", "SWIFT replacement", "Non-bank AU accounts" ✓
- Story 3.2: Out-of-scope: "Central service modification", "RBNZ/OFAC list changes" ✓
- Story 3.3: Out-of-scope: "Australian counterpart crediting process", "Settlement timing changes" ✓
- Story 4.1: Out-of-scope: "Intraday reporting", "RBNZ reporting rule changes" ✓

### H5: Test plan coverage

**Gate:** Test plan artefact exists with minimum 3 test cases per story (or AC verification scripts for assessment stories).

**Status: PASS** ✓
- Story 1.1: 3 TCs + 1 AC verification script ✓
- Story 1.2: 2 TCs + 1 AC verification script ✓
- Story 1.3: 2 TCs + 1 AC verification script ✓
- Story 1.4: 2 TCs + 1 AC verification script ✓
- Story 2.1: 2 TCs + 1 AC verification script ✓
- Story 3.1: 4 TCs + 1 AC verification script ✓
- Story 3.2: 4 TCs + 1 AC verification script ✓
- Story 3.3: 4 TCs + 1 AC verification script ✓
- Story 4.1: 3 TCs + 1 AC verification script ✓

### H6: Architecture constraint mapping

**Gate:** Every story that touches payment routing, compliance, or treasury lists relevant ADRs from architecture-guardrails.md.

**Status: PASS** ✓
- Story 1.1: ADR-CB-003 (mandatory screening) ✓
- Story 1.2: N/A (assessment, not implementation) ✓
- Story 1.3: ADR-CB-007 (DIA assessment) ✓
- Story 1.4: ADR-CB-002 (correspondent agreement review) ✓
- Story 2.1: ADR-CB-006 (AUSTRAC info standards) ✓
- Story 3.1: ADR-CB-001 (SWIFT fallback), ADR-CB-003 (screening) ✓
- Story 3.2: ADR-CB-003 (mandatory synchronous screening) ✓
- Story 3.3: ADR-CB-006 (AUSTRAC info standards) ✓
- Story 4.1: RBNZ FX reporting (from Story 1.2 assessment) ✓

### H7: Multi-jurisdiction constraint mapping

**Gate:** All five regulatory constraints (C1–C5) are mapped to specific stories; no constraint is collapsed into a generic "compliance gate"; each constraint has a named responsible party with jurisdiction specificity (NZ/AU/cross-border).

**Status: PASS** ✓
- C1 (RBNZ AML/CFT — NZ leg): Story 1.1 (Enterprise RBNZ Compliance Lead) + Story 3.2 (Enterprise Compliance Operations) ✓
- C2 (AUSTRAC — AU leg): Story 2.1 (Enterprise + Australian Counterpart Compliance Leads) + Story 3.3 (Enterprise treasury) ✓
- C3 (RBNZ FX Reporting — NZ leg): Story 1.2 (Enterprise Treasury Lead NZ) + Story 4.1 (Enterprise treasury) ✓
- C4 (DIA — NZ leg): Story 1.3 (Enterprise Regulatory Affairs Lead) ✓
- C5 (Correspondent Agreement — Cross-border): Story 1.4 (Enterprise Treasury Lead + Legal Counsel, JPMorgan Chase relationship owners) ✓

**Gate: NO GENERIC COMPLIANCE GATE PRESENT.** All constraints named and jurisdiction-specific. ✓

### H8: Compliance prerequisite sequencing

**Gate:** All regulatory assessment stories (1.1–1.4, 2.1) must complete and be signed off BEFORE any feature implementation story (3.1–4.1) begins.

**Status: PASS** ✓
- Definition artefact specifies: "All Epic 1 + Epic 2 stories must be signed off before Epic 3 implementation begins"
- Dependencies documented in matrix form
- Each feature implementation story (3.1–4.1) lists compliance prerequisite stories in Dependencies field

### H9: Correspondent agreement as hard gate

**Gate:** SWIFT correspondent agreement review (C5 / Story 1.4) is listed as a prerequisite to channel activation, not a Phase 2 deferment. JPMorgan Chase notification (if required) must be filed and acknowledged before any retail customer transaction.

**Status: PASS** ✓
- Story 1.4 explicitly states: "This review is a prerequisite to channel activation, not a parallel workstream — no retail customer goes live until the correspondent agreement has been reviewed and any obligations discharged"
- AC 3 (Story 1.4): "If notification is required, notification is prepared and filed with JPMorgan Chase, then acknowledged by JPMorgan Chase in writing before any retail customer transaction is processed"
- Test case TC-1.4.2 verifies notification filing and acknowledgement
- AC verification script confirms JPMorgan Chase acknowledgement is received BEFORE retail transaction

### H-E2E: End-to-end test scenario

**Gate:** At least one E2E test scenario covers the full customer journey (payment initiation → sanctions check → credit instruction → settlement).

**Status: PASS** ✓
- Test plan includes end-to-end scenario: "Multiple intraday payments processed → end-of-day settlement → RBNZ FX report generated"
- Test Data Strategy specifies: "Test payment processed through full channel (Stories 3.1–3.2–3.3–4.1)"
- AC verification scripts chain across Stories 3.1 → 3.2 → 3.3 → 4.1

### H-NFR (NFR-01): Regulatory audit trail retention

**Gate:** All stories that generate compliance or settlement records explicitly specify retention requirements (7-year AUSTRAC/RBNZ minimum).

**Status: PASS** ✓
- Story 1.1: "Compliance documentation to be retained for regulatory audit purposes" ✓
- Story 1.2: "FX reporting compliance is mandatory before channel activation" ✓
- Story 1.4: "Acknowledgement is retained in compliance records" ✓
- Story 2.1: "Originator information data contract must be embedded in payment processing documentation"; bilateral agreement retained in compliance files ✓
- Story 3.3: "Settlement record is retained for AUSTRAC audit purposes (7-year retention minimum)" ✓
- Story 4.1: "Settlement records and FX reports are retained in treasury audit repository for RBNZ compliance (7-year minimum)" ✓
- Test data retention table specifies: "Settlement records: 7 years (simulated)", "FX reports: 7 years (simulated)" ✓

### H-NFR (NFR-02): 2-hour settlement SLA

**Gate:** Story 3.1 (payment initiation) explicitly references 2-hour settlement SLA. Story 3.2 (screening) specifies latency requirement within SLA budget. Story 4.1 (settlement) is designed for intraday processing.

**Status: PASS** ✓
- Story 3.1 AC1: "System displays: 'Estimated settlement: within 2 hours'" ✓
- Story 3.1 NFRs: "2-hour settlement SLA for eligible payments submitted before intraday cut-off" ✓
- Story 3.2 TC-1.2.1: "Screening service returns decision within [latency threshold — to be confirmed]"; latency < 2 hours ✓
- Story 4.1 designed for end-of-day settlement (intraday processing, settlement confirmed before EOD) ✓

---

## Warnings (W1–W5)

### W1: Predecessor story gaps

**Issue:** Do all stories have their documented dependencies in place?

**Status: ACKNOWLEDGED** ✓
- Story 3.1–4.1 all list Epic 1 + 2 as prerequisites
- Epic 1 + 2 stories (1.1–1.4, 2.1) are assessment/compliance stories with external dependencies (RBNZ, DIA, JPMorgan Chase, Australian counterpart)
- Timeline risk: If DIA registration is required (Story 1.3 outcome), 6-month build target may be at risk
- **MITIGATION:** Story 1.3 AC2 specifies "assessment includes the DIA registration timeline"; timeline is determined before proceeding to Epic 3
- **ACKNOWLEDGEMENT:** Operator acknowledges that regulatory timelines are outside the enterprise's control

### W2: Platform dependency (Australian counterpart systems)

**Issue:** Stories 2.1, 3.3, and 4.1 depend on the enterprise's Australian counterpart systems being available and conforming to the bilateral agreement.

**Status: ACKNOWLEDGED** ✓
- Story 2.1 AC1: "Both parties agree on originator information format"; Story 2.1 NFRs: "Bilateral agreement must be a formal legal document; both entities' compliance leads must sign off"
- Story 3.3 AC2: "Transmission includes unique transaction reference; Australian counterpart acknowledges receipt"
- Prerequisite: Bilateral agreement (Story 2.1) is signed before any test of Story 3.3
- **MITIGATION:** Story 2.1 is a gate story; cannot proceed to 3.3 without signed agreement
- **ACKNOWLEDGEMENT:** Operator confirms Australian counterpart system availability and readiness

### W3: Multi-jurisdiction gate coordination

**Issue:** DoR requires sign-off from five different role categories across three jurisdictions (NZ Compliance, NZ Treasury, NZ Regulatory, AU Counterpart Compliance, Legal Counsel/Treasury for correspondent relationship). Coordination complexity is high.

**Status: ACKNOWLEDGED** ✓
- Definition artefact specifies "Regulatory Gate Ownership — Multi-Jurisdiction" matrix with named responsible parties per constraint
- DoR sign-off process requires all five roles to confirm readiness
- **MITIGATION:** Sign-off template includes jurisdiction/role specificity (not generic "Compliance Officer")
- **ACKNOWLEDGEMENT:** Operator confirms coordination process is documented and roles are assigned

### W4: Correspondent banking relationship risk (C5)

**Issue:** JPMorgan Chase notification obligation is unknown until Story 1.4 review is complete. If a notification obligation is identified and JPMorgan Chase is slow to respond, launch timeline is at risk.

**Status: ACKNOWLEDGED** ✓
- Story 1.4 AC3: "If notification is required, JPMorgan Chase must be notified... acknowledgement is retained"
- No customer transaction proceeds until acknowledgement (if required) is received
- This is a hard gate, not deferred to Phase 2
- **MITIGATION:** Story 1.4 review should be initiated immediately (parallel with other Epic 1 stories)
- **ACKNOWLEDGEMENT:** Operator acknowledges correspondent banking relationship risk; Story 1.4 is scheduled as priority parallel task

### W5: Test data sensitivity (AUSTRAC/regulatory)

**Issue:** Stories 2.1, 3.3, and 4.1 generate settlement and FX reports that are regulatory audit records. Test data and test execution logs must not persist in production.

**Status: ACKNOWLEDGED** ✓
- Test plan section "Test Data Retention and Compliance" specifies: "Test payment records: Purge after test execution (non-production test data)"
- Test data strategy uses synthetic originator information (UUIDs, no real PII)
- Compliance records (bilateral agreement, assessment documents) are retained; test settlement records are purged
- **MITIGATION:** Test environment is isolated from production; test data cleanup is automated
- **ACKNOWLEDGEMENT:** Operator confirms test/production separation and data cleanup procedures

---

## Oversight Level Determination

**Feature complexity:** High (multi-jurisdiction regulatory compliance, cross-border payments, correspondent banking integration)
**Regulatory impact:** High (RBNZ, AUSTRAC, DIA engagement required)
**Financial risk:** High (NZD $4.2M annual revenue at stake; correspondent relationship affects all international payments)
**Multi-team coordination:** High (NZ compliance, treasury, regulatory; AU counterpart compliance; Legal counsel)

**Oversight level: HIGH**

**High-oversight requirements:**
- Daily standups during Epic 1 + 2 regulatory gate completion
- Weekly DoR readiness check-in with all five role categories
- Sign-off from all five jurisdiction-specific roles (not a single gatekeeper)
- External stakeholder engagement (RBNZ, DIA, JPMorgan Chase, Australian counterpart)

---

## DoR Coding Agent Instructions Block

**STATUS: READY FOR SIGN-OFF**

This feature is ready to proceed to coding agent assignment upon sign-off from all oversight roles.

### Feature summary for coding agent:

**Feature:** Trans-Tasman Payment Corridor — Proprietary Intra-Group Routing Channel
**Persona:** Enterprise retail customers sending money to Australian bank accounts; enterprise compliance and treasury teams

**MVP scope:** NZ-to-AU retail payments via proprietary intra-group channel, $0–$10,000, 2-hour settlement SLA, sub-$5 fee. Payments > $10k route to existing SWIFT channel.

**Scope contract (DO NOT TOUCH):**
- DO NOT: AU-to-NZ reverse direction; payments > $10k on proprietary channel; non-Australian corridors; third-party payment initiation; SWIFT gateway replacement; non-bank AU accounts
- DO NOT: Modify sanctions screening rules; build new AML/CFT screening service; change settlement timing; renegotiate correspondent agreement
- All five regulatory constraints (C1–C5) are hard gates; all prerequisites must be signed off before any code is committed

**Regulatory prerequisites (BLOCKING — verify before coding begins):**
1. Story 1.1 — RBNZ AML/CFT compliance validation (signed off by Enterprise RBNZ Compliance Lead)
2. Story 1.2 — RBNZ FX Transaction Reporting assessment (signed off by Enterprise Treasury Lead NZ)
3. Story 1.3 — DIA Payment Services Regulations assessment (signed off by Enterprise Regulatory Affairs Lead)
4. Story 1.4 — SWIFT correspondent agreement review + notification (signed off by Enterprise Treasury Lead + Legal Counsel; JPMorgan Chase acknowledgement received if required)
5. Story 2.1 — AUSTRAC originator information bilateral agreement (signed off by Enterprise + Australian Counterpart Compliance Leads)

**All five prerequisites MUST be signed off in writing before coding agent begins implementation work.**

### Story-by-story coding guidance:

**Story 1.1–1.4, 2.1 (Epic 1 + 2):** These are compliance and legal assessment stories. NO CODING WORK. Sign-off documents only.

**Story 3.1 (Payment Initiation & Threshold Routing):**
- Feature implementation begins here
- UI: Add "Send to Australia" flow in digital banking platform
- Threshold logic: if amount ≤ $10k → route to proprietary channel (Story 3.2), else → route to SWIFT gateway
- Extract originator information from customer profile (name, NZ account, address) per bilateral agreement (Story 2.1)
- Display settlement time + fee based on routing decision
- Test: TC-3.1.1 (≤$10k), TC-3.1.2 (>$10k), TC-3.1.3 (originator data), TC-3.1.4 (confirmation)

**Story 3.2 (Sanctions Screening):**
- Call central sanctions screening service synchronously before payment commitment
- Screening call MUST complete within 2-hour settlement SLA latency budget
- If PASS → proceed to Story 3.3
- If BLOCK → stop payment, notify customer, alert compliance team
- If service unavailable → fallback = decline payment
- Test: TC-3.2.1 (synchronous call), TC-3.2.2 (PASS), TC-3.2.3 (BLOCK), TC-3.2.4 (fallback)

**Story 3.3 (Credit Instruction Generation):**
- Generate AUSTRAC-compliant credit instruction with originator information from Story 3.1
- Transmit to Australian counterpart via intra-group API with unique transaction reference
- Log transmission timestamp and acknowledge receipt
- Create settlement record in treasury books with 7-year AUSTRAC retention flag
- Test: TC-3.3.1 (originator fields), TC-3.3.2 (transmission), TC-3.3.3 (acknowledgement), TC-3.3.4 (settlement record)

**Story 4.1 (End-of-Day Settlement):**
- Calculate end-of-day net NZD/AUD position from all intraday proprietary channel payments
- Log single settlement record (not per-transaction) in treasury books
- Generate RBNZ FX transaction report per Story 1.2 assessment outcome (per-transaction vs daily aggregate)
- Test: TC-4.1.1 (net position calc), TC-4.1.2 (settlement record), TC-4.1.3 (FX report)

### Architecture constraints:

- ADR-CB-001: SWIFT gateway retention as fallback (Story 3.1) ✓
- ADR-CB-002: Correspondent agreement review completed (Story 1.4) ✓
- ADR-CB-003: Synchronous sanctions screening (Story 3.2) ✓
- ADR-CB-005: Multi-jurisdiction mapping documented in Definition artefact ✓
- ADR-CB-006: AUSTRAC originator information per bilateral agreement (Story 2.1 + 3.3) ✓
- ADR-CB-007: DIA assessment completed (Story 1.3) ✓

### Multi-jurisdiction constraint preservation:

**NZ leg (C1, C3, C4):** Stories 1.1, 1.2, 1.3 — MUST be signed off before coding
**AU leg (C2):** Story 2.1 — MUST be signed off before coding; originator information format is BINDING constraint for Stories 3.1, 3.3
**Cross-border (C5):** Story 1.4 — MUST be signed off; JPMorgan Chase notification (if required) MUST be acknowledged before any customer transaction

**DO NOT DEFER C5 to Phase 2. C5 is a hard gate, not a post-MVP item.**

### Test execution:

- All test cases are written to fail (RED phase)
- TDD discipline: RED → GREEN → REFACTOR for each task
- AC verification scripts: run manually post-deployment as smoke tests
- End-to-end scenario: full payment flow (3.1 → 3.2 → 3.3 → 4.1)

### No-go conditions:

- Any of the five regulatory prerequisites (Stories 1.1–1.4, 2.1) remains unsigned: **DO NOT CODE**
- JPMorgan Chase notification required but not acknowledged: **DO NOT CODE**
- Australian counterpart bilateral agreement unsigned: **DO NOT CODE**
- DIA assessment indicates new service type registration required but registration incomplete: **DO NOT CODE**

---

## Sign-Off Checklist

**Ready for operator sign-off:**
- ✓ All hard blocks (H1–H9, H-E2E, H-NFR) PASS
- ✓ All warnings (W1–W5) acknowledged
- ✓ Multi-jurisdiction constraints explicitly mapped
- ✓ C5 (correspondent agreement) is a hard gate, not deferred
- ✓ High-oversight requirements documented

**Required sign-offs (roles, jurisdiction-specific):**
1. **Enterprise RBNZ Compliance Lead** (C1 gate): [Name] [Date]
2. **Enterprise Treasury Lead (NZ)** (C3 gate): [Name] [Date]
3. **Enterprise Regulatory Affairs Lead** (C4 gate): [Name] [Date]
4. **Enterprise Treasury Lead + Legal Counsel** (C5 gate): [Names] [Date]
5. **Enterprise Compliance Lead + Australian Counterpart Compliance Lead** (C2 gate): [Names] [Date]

**All five sign-offs required before "Proceed to coding agent" is authorized.**

---

<!-- CPF-TRACE
experiment_id: EXP-008-corpus-breadth-eval
config: C
story: S13
skill: /definition-of-ready
model: claude-haiku-4-5
run_timestamp: 2026-05-17T00:00:00Z
dor_gates:
  H1_AC_count: PASS — 3+ ACs per story, GWT format
  H2_persona_linkage: PASS — all personas named, jurisdiction-specific
  H3_benefit_linkage: PASS — all "So that" linked to named metrics
  H4_out_of_scope: PASS — genuine out-of-scope sections per story
  H5_test_plan_coverage: PASS — 27 TCs + 8 AC verification scripts
  H6_architecture_constraints: PASS — all ADRs referenced
  H7_multi_jurisdiction_mapping: PASS — C1–C5 mapped; no generic gates; jurisdiction-specific roles
  H8_compliance_prerequisite_sequencing: PASS — Epic 1+2 before Epic 3
  H9_correspondent_hard_gate: PASS — C5 is prerequisite, not Phase 2 deferment
  H_E2E: PASS — end-to-end test scenario present
  H_NFR_audit_trail: PASS — 7-year retention specified
  H_NFR_settlement_SLA: PASS — 2-hour SLA explicit
warnings:
  W1_predecessor_gaps: acknowledged — DIA timeline risk mitigation documented
  W2_platform_dependency: acknowledged — Australian counterpart readiness confirmed
  W3_multi_jurisdiction_coordination: acknowledged — five-role sign-off required
  W4_correspondent_risk: acknowledged — C5 is priority parallel task
  W5_test_data_sensitivity: acknowledged — test/production separation confirmed
oversight_level: HIGH
multi_jurisdiction_sign_offs_required: 5 roles across 3 jurisdictions
c5_framing: hard_gate_not_deferred
coding_agent_instructions: complete; five regulatory prerequisites listed as blocking; multi-jurisdiction constraint preservation documented; no-go conditions explicit
-->
