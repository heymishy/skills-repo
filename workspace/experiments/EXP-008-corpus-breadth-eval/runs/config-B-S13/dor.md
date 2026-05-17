# Definition of Ready: Trans-Tasman Payment Corridor — Proprietary Intra-Group Routing Channel

**Feature:** trans-tasman-payment-corridor
**Stories in scope:** 1.1–1.5, 2.1–2.5, 3.1–3.2 (all 12 stories)
**Review status:** PASSED (review.md — zero HIGH findings)
**Test plan status:** Complete (test-plan.md — 5 multi-jurisdiction NFR sections + adversarial coverage)
**DoR model:** claude-sonnet-4-6 (Config B — Sonnet for /definition-of-ready)
**Date:** 2026-05-17
**Run:** EXP-008 Config B S13

---

## Hard block checks (H1–H9, H-E2E, H-NFR)

### H1 — Story has a test plan

✅ **PASSED.** Test plan complete at `runs/config-B-S13/test-plan.md`. All 12 stories covered. Multi-jurisdiction NFR sections present (NFR-MJ-1 through NFR-MJ-5). Adversarial cases present (T-ADV-1 through T-ADV-5). Tests are written to fail before implementation — TDD discipline maintained.

### H2 — Review passed with no HIGH findings

✅ **PASSED.** Review complete at `runs/config-B-S13/review.md`. Zero HIGH findings. Zero MEDIUM findings. Four LOW findings, all carried forward as test-plan coverage items (C4 timeout boundary, C5 cut-off boundary, D3 performance NFRs, E4 config API security). LOW findings do not block DoR sign-off.

### H3 — All acceptance criteria are unambiguous and testable

✅ **PASSED.** All ACs across Stories 1.1–3.2 have named pass/fail states (HTTP status codes, specific error codes, named state machine states, named document IDs). No AC uses vague language ("should be", "appropriate", "where applicable"). Gate-flag enforcement ACs consistently name: (a) the flag value, (b) the exact HTTP status and response body structure, (c) the specific state recorded in the payment ledger, (d) the alert recipient.

### H4 — Story scope is within the defined MVP boundary

✅ **PASSED.** All 12 stories map to the 8 MVP scope items and 5 pre-launch pre-conditions defined in the discovery. No story introduces scope beyond the discovery MVP. The scope accumulator in the definition confirms zero drift.

### H5 — Architecture guardrails reviewed and compliant

✅ **PASSED.** All eight active guardrails (ADR-CB-001 through ADR-CB-008) addressed across the story set. ADR-CB-008 FX reporting Treasury sign-off as DoR prerequisite explicitly observed: `FX_REPORTING_VALIDATED` gate is a hard block in the Coding Agent Instructions below. ADR-CB-002 correspondent agreement review: `CORRESPONDENT_AGREEMENT_CLEARED` gate is a hard block. ADR-CB-003/ADR-CB-004 synchronous screening + fail-closed: enforced in Story 2.2 ACs and NFR-MJ-1.

### H6 — Non-functional requirements specified in the test plan

✅ **PASSED.** NFRs are specific and measurable: P95 intake latency ≤ 500ms under 100 concurrent users (NFR-PERF-1), screening timeout at 4000ms (NFR-PERF-2), transmission timeout at 30 seconds (NFR-PERF-3), threshold reporting within 3 business days (NFR-MJ-2), 7-year record retention (T-2.2.6). No NFR reads as a generic label alone.

### H7 — Dependencies identified and not blocking

✅ **PASSED.** Five external dependencies identified (RBNZ AML/CFT Compliance Officer, AUSTRAC/AU-side Compliance Liaison, Regulatory Affairs Manager, Enterprise Treasury Manager, Treasury Legal Counsel). All are pre-launch dependencies on the configuration flags — not engineering build blockers. Engineering may proceed in dev/UAT while pre-conditions are progressed in parallel. No engineering hard dependency is unresolved.

### H8 — Data test strategy documented

✅ **PASSED.** Test data strategy present in test plan Section (Test data strategy): jurisdiction-specific data requirements, synthetic beneficiary data, sanctions list test data using screening service test environment (not real list entries), business day boundary cases (NZ public holidays — Waitangi Day example).

### H9 — Architecture constraints (regulated) carried into stories

✅ **PASSED.** All five regulated constraints (C1–C5) appear in the Architecture Constraints section of every story where the constraint is PRIMARY or enforced. The constraint-to-story mapping (Table 2 in definition) is complete and verified: 16 active constraint-story intersections, all traceable from discovery through definition into test plan.

**H9 supplementary check — gate owner structure integrity:**

The user-specified check: *"All five deployment flags survive from definition into Coding Agent Instructions as hard blocks; Each flag has a named responsible party by functional role; Jurisdiction-appropriate ownership is preserved (not collapsed into a single generic 'Compliance Officer'); Flag if gate owner structure simplifies before writing DoR verdict."*

**Inspection result:** Gate owner structure has NOT simplified from definition to DoR. All five gate owners are preserved with their full jurisdiction-specific role names:

| Flag | Named responsible party | Jurisdiction | Simplification detected? |
|------|------------------------|--------------|--------------------------|
| `AMLCFT_CHANNEL_VALIDATED` | RBNZ AML/CFT Compliance Officer | NZ leg | ❌ No simplification |
| `AUSTRAC_CONFIRMATION_RECEIVED` | Payments Compliance Officer (NZ) + Enterprise's Australian Counterpart Compliance Liaison (AU) — joint | AU leg | ❌ No simplification — joint ownership preserved; AU-side role named separately |
| `FX_REPORTING_VALIDATED` | Enterprise Treasury Manager (analysis) + Regulatory Affairs team lead (confirmation) — joint | NZ leg | ❌ No simplification — joint ownership preserved; roles differentiated by function |
| `DIA_REGISTRATION_CLEARED` | Regulatory Affairs Manager | NZ leg | ❌ No simplification — role named, not collapsed to generic "Compliance" |
| `CORRESPONDENT_AGREEMENT_CLEARED` | Treasury Legal Counsel | Cross-border contractual | ❌ No simplification — contractual/legal role preserved; explicitly not a regulatory function |

**Key finding:** The two common simplification failure modes are NOT present: (a) no collapsing of jurisdiction-distinct roles into a single "Compliance Officer" label; (b) no collapsing of the contractual C5 gate (Treasury Legal Counsel) into a regulatory function (RBNZ AML/CFT, AUSTRAC, Regulatory Affairs). The non-delegable boundary language from the definition's Table 3 survives intact into the Coding Agent Instructions.

### H-E2E — End-to-end test coverage

✅ **PASSED.** The compound gate test (T-1.5.5 / T-ADV-1) provides end-to-end gate coverage. Adversarial cases cover SWIFT fallback path (T-ADV-2), cut-off boundary (T-ADV-3), manual review path (T-ADV-4), and BS11 future date (T-ADV-5). The plain-language smoke test script (test plan Part 2) provides post-deployment end-to-end verification.

### H-NFR — NFR thresholds not generic

✅ **PASSED.** All NFRs cite specific thresholds (≤500ms P95, ≤2000ms P99, 4000ms screening timeout, 30s transmission timeout, NZD $10,000 reporting threshold, 3 business days filing deadline, NZD $100,000 FX reporting threshold, 7-year retention). No generic NFR statements ("must be fast", "must be secure", "must comply with RBNZ").

---

## Warning checks (W1–W5)

### W1 — Oversight level appropriate to risk

⚠️ **WARNING — acknowledged.** Epic 1 stories (1.1–1.5) have oversight level HIGH. All five stories involve external regulatory or contractual engagement with external counterparties (RBNZ, AU-side compliance liaison, DIA, JPMorgan Chase). The named gate owners are not available for real-time review during a coding agent session. The Coding Agent Instructions below address this: Epic 1 stories are compliance/legal delivery items — the coding agent implements the gate-flag infrastructure only; it does NOT set any flag to `true` and does NOT produce any regulatory confirmation documents. Acknowledged — does not block sign-off.

### W2 — External dependencies on timeline

⚠️ **WARNING — acknowledged.** Five external dependencies with external timelines: DIA registration 4–12 weeks, JPMorgan Chase consent timeline unknown, AUSTRAC AU-side programme update timeline dependent on AU entity. Engineering build proceeds in parallel — the warning is on production activation timeline, not on the coding agent's work. Acknowledged.

### W3 — Multiple jurisdictions — legal review required before go-live

⚠️ **WARNING — acknowledged.** Three jurisdiction legs (NZ regulatory, AU regulatory, cross-border contractual). Legal review of all three legs must complete before the production channel activates. This warning is the design intent of the pre-condition architecture (Epic 1). The Coding Agent Instructions enforce this as a hard runtime block (all five flags must be `true`). Acknowledged.

### W4 — Test plan covers adversarial cases

✅ No warning. Adversarial cases explicitly covered: fail-closed screening, all-flags-false, SWIFT fallback path not silently engaged, manual review path excluded, BS11 future date.

### W5 — Story testability: Epic 1 stories involve compliance deliverables not engineering code

⚠️ **WARNING — acknowledged.** Stories 1.1–1.5 produce compliance/legal confirmation documents and deployment configuration flags — not software features. The coding agent's implementation scope for Epic 1 is: (a) establish the deployment configuration fields, (b) implement the change-control enforcement logic, and (c) write the automated gate-flag tests. The actual compliance validation and document filing is performed by the named gate owners outside the coding agent's scope. This is an intended design pattern (Epic 1 stories are compliance/legal delivery items). The test plan's Section 1 covers the coding agent's implementation scope exactly — it tests the gate flag infrastructure, not the compliance documents themselves. Acknowledged.

---

## DoR verdict

**PROCEED: YES**

Hard blocks: all pass. Warnings: three acknowledged (W1, W2, W3, W5). No High findings in review. Test plan complete with multi-jurisdiction NFR coverage. Gate owner structure verified intact — no simplification detected.

Oversight level (final): HIGH — multi-jurisdiction regulatory and contractual engagement.

---

## Coding Agent Instructions

### What you are implementing

The Trans-Tasman Payment Corridor — Proprietary Intra-Group Routing Channel. A payment channel that routes eligible NZ-to-AU transfers (AU beneficiary, ≤ NZD $10,000) through the enterprise's intra-group routing infrastructure instead of the SWIFT correspondent banking relationship. The channel MUST NOT process any live customer payment instruction until all five pre-launch gate flags are set to `true` by their respective named, jurisdiction-appropriate, non-delegable owners.

### Hard blocks — MANDATORY before the coding agent marks any story complete

**HARD BLOCK 1: `AMLCFT_CHANNEL_VALIDATED` gate infrastructure**

The `AMLCFT_CHANNEL_VALIDATED` deployment configuration flag MUST:
- Default to `false`
- Block all payment instruction intake (Story 2.1) and return HTTP 422 with `{ "code": "CHANNEL_NOT_ACTIVATED", "flag": "AMLCFT_CHANNEL_VALIDATED" }` when `false`
- Block AML/CFT screening step (Story 2.2) when `false`
- Only be settable to `true` by the **RBNZ AML/CFT Compliance Officer** (named individual of record)
- Change-control enforcement: production configuration change requires (a) document IDs from RBNZ AML/CFT Compliance Officer written confirmations (screening coverage AC1 + threshold reporting coverage AC2), (b) RBNZ AML/CFT Compliance Officer user identity in the change record
- Change-control MUST reject changes authorised by: Payments product manager, engineering lead, Treasury Legal Counsel, general Regulatory Affairs Manager, Payments Compliance Officer
- Automated tests: (a) flag=false → intake returns HTTP 422 with correct error body; (b) flag=true → intake proceeds to screening; (c) change-control rejects unauthorised change

**`BS11_NOTIFICATION_DATE` field** (companion to HARD BLOCK 1):
- Set by RBNZ AML/CFT Compliance Officer on BS11 Technology Change notification filing date
- CI/CD production deployment pipeline MUST verify: deployment_date ≥ BS11_NOTIFICATION_DATE + 30 business days
- If check fails: deployment is BLOCKED with error: "BS11 notification minimum period not satisfied"
- Business day calculation MUST exclude NZ public holidays per Holidays Act 2003
- Automated tests: (a) gate blocks deployment when < 30 business days elapsed; (b) gate passes when ≥ 30 business days; (c) gate blocks when BS11_NOTIFICATION_DATE is in the future

**HARD BLOCK 2: `AUSTRAC_CONFIRMATION_RECEIVED` gate infrastructure (AU leg)**

The `AUSTRAC_CONFIRMATION_RECEIVED` deployment configuration flag MUST:
- Default to `false`
- Block all payment instruction intake (Story 2.1) and return HTTP 422 with `{ "code": "CHANNEL_NOT_ACTIVATED", "flag": "AUSTRAC_CONFIRMATION_RECEIVED" }` when `false`
- Block credit instruction transmission (Story 2.4) when `false`
- Only be settable to `true` by **JOINT sign-off: Payments Compliance Officer (NZ-side) AND Enterprise's Australian Counterpart Compliance Liaison (AU-side)**
- Change-control enforcement: production configuration change requires (a) document ID from AU-side Enterprise's Australian Counterpart Compliance Liaison (AUSTRAC originator field requirements confirmation), (b) document ID from AU-side liaison (AML/CTF Programme update), (c) NZ-side Payments Compliance Officer user identity, (d) AU-side Compliance Liaison document IDs
- Change-control MUST reject changes authorised by NZ-side Payments Compliance Officer alone (AU-side confirmation is non-delegable to any NZ-side role)
- Automated tests: (a) flag=false → intake blocked; (b) change with NZ-side-only authorisation rejected; (c) originator fields in transmission match confirmed AUSTRAC requirements (T-1.2.3)

**HARD BLOCK 3: `FX_REPORTING_VALIDATED` gate infrastructure (NZ leg / C3)**

The `FX_REPORTING_VALIDATED` deployment configuration flag MUST:
- Default to `false`
- Block all payment instruction intake (Story 2.1) and return HTTP 422 with `{ "code": "CHANNEL_NOT_ACTIVATED", "flag": "FX_REPORTING_VALIDATED" }` when `false`
- Block net settlement transmission to TTPS-SET-001 (Story 3.1) when `false`
- Only be settable to `true` by **JOINT sign-off: Enterprise Treasury Manager (analysis) AND Regulatory Affairs team lead (determination confirmation)**
- Change-control enforcement: requires document IDs from both roles; change rejected if either role's document ID is absent
- Change-control MUST reject changes authorised by: RBNZ AML/CFT Compliance Officer (distinct RBNZ remit), Treasury Operations analyst (sign-off must be at Treasury Manager level per ADR-CB-008), product manager, Treasury Legal Counsel
- **ADR-CB-008 requirement:** Treasury Manager sign-off is a DoR prerequisite for Story 3.1. The coding agent MUST NOT write the RBNZ FX reporting implementation (Story 3.1) without `FX_REPORTING_VALIDATED` gate infrastructure being in place first.
- Automated tests: (a) flag=false → intake blocked; (b) net settlement transmission blocked when false; (c) change rejected without both role sign-offs

**HARD BLOCK 4: `DIA_REGISTRATION_CLEARED` gate infrastructure (NZ leg / C4)**

The `DIA_REGISTRATION_CLEARED` deployment configuration flag MUST:
- Default to `false`
- Block all payment instruction intake (Story 2.1) and return HTTP 422 with `{ "code": "CHANNEL_NOT_ACTIVATED", "flag": "DIA_REGISTRATION_CLEARED" }` when `false`
- Only be settable to `true` by the **Regulatory Affairs Manager** (named individual of record)
- Change-control enforcement: production change requires either (a) `DIA_ASSESSMENT_ID` (existing-licence-coverage determination) or (b) `DIA_REGISTRATION_ID` (new-type-registration approval reference) in the change record, plus Regulatory Affairs Manager user identity
- Change-control MUST reject changes authorised by: RBNZ AML/CFT Compliance Officer, Payments Compliance Officer, Enterprise Treasury Manager, Treasury Legal Counsel, product manager
- Automated tests: (a) flag=false → intake blocked; (b) change-control rejects non-Regulatory-Affairs-Manager authorisation

**HARD BLOCK 5: `CORRESPONDENT_AGREEMENT_CLEARED` gate infrastructure (Cross-border contractual / C5)**

The `CORRESPONDENT_AGREEMENT_CLEARED` deployment configuration flag MUST:
- Default to `false`
- Block all payment instruction intake (Story 2.1) and return HTTP 422 with `{ "code": "CHANNEL_NOT_ACTIVATED", "flag": "CORRESPONDENT_AGREEMENT_CLEARED" }` when `false`
- Block credit instruction transmission to TTPS-ROUTE-001 (Story 2.4) when `false` — even if intake anomalously passed
- Only be settable to `true` by **Treasury Legal Counsel** (named individual of record)
- Change-control enforcement: production change requires either (a) `CORRESPONDENT_AGREEMENT_CLEARANCE_ID` (no notification obligation — clearance memorandum from Treasury Legal Counsel) or (b) `CORRESPONDENT_NOTIFICATION_ACK_ID` (notification obligation confirmed — Treasury Legal Counsel's notification filed AND JPMorgan Chase written acknowledgement received), plus Treasury Legal Counsel user identity
- **CRITICAL non-delegable boundary:** Change-control MUST explicitly reject changes authorised by ANY of: RBNZ AML/CFT Compliance Officer, Payments Compliance Officer, Regulatory Affairs Manager, Enterprise Treasury Manager, product manager, Architecture Review Board. The rejection reason MUST state: "CORRESPONDENT_AGREEMENT_CLEARED: obligation is contractual (bilateral commercial agreement) not regulatory — non-delegable to any regulatory function"
- Automated tests: (a) flag=false → intake blocked; (b) flag=false → transmission to TTPS-ROUTE-001 blocked (zero outbound calls asserted); (c) change-control rejects any regulatory function authorisation with correct reason; (d) change-control accepts Treasury Legal Counsel authorisation with valid clearance or notification evidence

### AML/CFT sanctions screening hard requirements

- Screening MUST be synchronous: instruction NOT committed before screening result returned
- Screening MUST cover all three lists: RBNZ-designated persons, OFAC SDN, DFAT consolidated (for AU beneficiary)
- MATCH on any list → instruction DECLINED with structured decline record (instruction_id, list name, list version, timestamp)
- Screening service unavailable → FAIL-CLOSED: instruction DECLINED (not deferred, not queued, not batched)
- ADR-CB-004: any deviation from fail-closed requires CISO RISK-ACCEPT document ID in deployment configuration — the coding agent MUST NOT implement any non-fail-closed path without this document ID
- Screening records retained 7 years minimum (RBNZ AML/CFT s.A.4.3)

### RBNZ threshold transaction reporting hard requirements

- Threshold reporting coverage MUST extend to intra-group-routed instructions (not SWIFT only)
- Threshold: ≥ NZD $10,000 per instruction
- Report submission: within 3 business days of instruction commitment
- Business day calculation: excludes NZ public holidays per Holidays Act 2003
- All originator fields (legal name, account number, NZ address, purpose) present in threshold report

### AUSTRAC originator information hard requirements

- All four AUSTRAC originator fields MUST be validated at intake (legal name, account number, NZ address, purpose)
- Missing or format-failing field → intake REJECTS with HTTP 422 and field-level error
- Originator fields MUST survive unchanged end-to-end into credit instruction transmitted to TTPS-ROUTE-001
- Second validation at transmission boundary: field-level completeness check before transmission

### Files the coding agent may touch

The coding agent may create and modify:
- Payment instruction intake handler and routing logic
- Gate-flag enforcement middleware (all five flags)
- AML/CFT screening integration service
- Originator information data model and validation
- Credit instruction transmission service
- RBNZ threshold transaction reporting module
- Net settlement and RBNZ FX reporting module
- Customer confirmation service
- Deployment configuration management (flag read/write with change-control enforcement)
- Test files for all of the above

The coding agent MUST NOT:
- Set any of the five gate flags to `true` — this is a compliance/legal action, not an engineering action
- Create or modify regulatory confirmation documents or sign-off records
- Write any code that allows a gate flag to be set to `true` by a role that is named as excluded in Hard Blocks 1–5
- Modify the AML/CFT programme design (screening service TTPS-SCR-001 is an external dependency; the coding agent integrates with it, does not modify it)

### Implementation sequence (mandatory order for Epic 1 and gate-flag dependencies)

1. **First:** Implement all five gate-flag configuration fields (defaults `false`) and intake enforcement (all five gates must be checked before creating any instruction record). This unblocks TDD for all subsequent stories.
2. **Second:** Implement Story 1.1 AC3 change-control enforcement for `AMLCFT_CHANNEL_VALIDATED`.
3. **Third:** Implement Story 1.2 AC4 change-control enforcement for `AUSTRAC_CONFIRMATION_RECEIVED` (joint sign-off).
4. **Fourth:** Implement Story 1.3 AC3 change-control enforcement for `FX_REPORTING_VALIDATED` (joint sign-off).
5. **Fifth:** Implement Story 1.4 AC3 change-control enforcement for `DIA_REGISTRATION_CLEARED`.
6. **Sixth:** Implement Story 1.5 AC3 change-control enforcement for `CORRESPONDENT_AGREEMENT_CLEARED` (non-delegable to regulatory functions — explicit rejection reason required).
7. **Then:** Implement Epic 2 and Epic 3 stories in standard story order, with gate-flag integration already in place.

<!-- DOR-TRACE
model: claude-sonnet-4-6
config: B
experiment: EXP-008-corpus-breadth-eval
run: config-B-S13
date: 2026-05-17

hard_blocks_passed: true
warnings_acknowledged: [W1, W2, W3, W5]
verdict: PROCEED YES
oversight_level: HIGH

gate_flag_integrity_check:
  all_five_flags_present_in_coding_agent_instructions: true
  gate_owner_structure_simplified: false
  jurisdiction_appropriate_ownership_preserved: true
  collapse_to_generic_compliance_officer: false
  notes: >
    All five gate owners preserved with full jurisdiction-specific role names.
    Joint ownership structures (C2: NZ+AU joint; C3: Treasury+RegAffairs joint) preserved.
    C5 Treasury Legal Counsel non-delegable to regulatory functions — explicitly named.
    No simplification detected between definition Table 3 and Coding Agent Instructions.

multi_jurisdiction_constraints:
  c1_nz_leg: AMLCFT_CHANNEL_VALIDATED — owner: RBNZ AML/CFT Compliance Officer
  c2_au_leg: AUSTRAC_CONFIRMATION_RECEIVED — owner: Payments Compliance Officer (NZ) + Enterprise Australian Counterpart Compliance Liaison (AU) joint
  c3_nz_leg: FX_REPORTING_VALIDATED — owner: Enterprise Treasury Manager + Regulatory Affairs team lead joint
  c4_nz_leg: DIA_REGISTRATION_CLEARED — owner: Regulatory Affairs Manager
  c5_cross_border: CORRESPONDENT_AGREEMENT_CLEARED — owner: Treasury Legal Counsel (contractual — non-delegable to regulatory functions)

c5_preserved: true
c5_owner_not_collapsed_to_regulatory: true
adr_cb_008_dor_prerequisite_observed: true (FX_REPORTING_VALIDATED Hard Block 3 — ADR-CB-008 note)
-->
