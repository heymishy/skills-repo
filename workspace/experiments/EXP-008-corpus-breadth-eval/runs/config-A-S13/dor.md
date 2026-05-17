# Definition of Ready: Trans-Tasman Payment Corridor — Proprietary Intra-Group Routing Channel

**Feature:** trans-tasman-payment-corridor
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Date:** 2026-05-17
**Run:** EXP-008 Config A S13
**Stage:** /definition-of-ready
**Input artefacts read from disk:** `discovery.md`, `definition.md`, `review.md`, `test-plan.md`

---

## Hard block checklist

| Block | Check | Status | Notes |
|-------|-------|--------|-------|
| H1 | Story artefacts present: 13 stories across 3 epics | ✅ PASS | definition.md committed `6800f60` |
| H2 | Test plan present | ✅ PASS | test-plan.md committed `2f3a731`; 47 test cases across T1–T10 |
| H3 | Review passed: no HIGH findings | ✅ PASS | review.md committed `ed4670e`; highest severity MEDIUM (D1 idempotency) |
| H4 | All five deployment flags explicitly defined with default values and authorised setters | ✅ PASS | All five flags defined below in Coding Agent Instructions block |
| H5 | CORRESPONDENT_AGREEMENT_CLEARED is a hard block for any Epic 2/3 story touching routing or channel activation | ✅ PASS | Story 2.4 AC1 explicitly gates transmission; Story 2.1 AC1 gates intake; test cases T1.5, T1.8, T10 confirm |
| H6 | Epic 1 completion prerequisite: no Epic 2/3 story may be activated in production before all five flags are `true` | ✅ PASS | Story 2.1 AC1 enforces all five flags as pre-flight gate before any processing; confirmed in test T1.6 |
| H7 | MEDIUM finding D1 (idempotency) addressed in test plan | ✅ PASS | T6.4 explicitly tests idempotency contract; implementation plan must address idempotency at Story 2.4 |
| H8 | Constraint propagation verified: all 5 constraints carry through definition, review, and test plan | ✅ PASS | CPF-TRACE present in all four artefacts; c5_surfaced: true in all |
| H9 | Architecture guardrails cross-checked: ADR-CB-002 through ADR-CB-007 all referenced in stories | ✅ PASS | ADR-CB-002 (Story 1.5), ADR-CB-003/004 (Story 2.2), ADR-CB-005 (Story 2.2 + 2.3), ADR-CB-006 (Story 2.3 + 2.4), ADR-CB-007 (Story 1.4) |

**Hard block result: ALL PASS. Proceed to implementation.**

---

## Warnings

| Warning | Status | Acknowledgement required |
|---------|--------|-------------------------|
| W1 — DIA registration path may be longest-lead-time item (review finding A1): no DIA timeline assumption in Story 1.4 | ACK REQUIRED | Operator: Acknowledge that DIA registration timeline is an open risk. Recommend adding timeline assumption to Story 1.4 or decisions.md before starting Epic 1 delivery. |
| W2 — Story 3.1 NZST/NZDT settlement cut-off timezone not specified (review finding C3) | ACK REQUIRED | Operator: Acknowledge that settlement cut-off timezone handling (NZ local time vs UTC) must be resolved at implementation-plan stage for Story 3.1. |
| W3 — Flag revocation mechanism not specified for post-activation compliance changes (review finding E1) | ACK REQUIRED | Operator: Acknowledge that flag revocation authority and channel behaviour on flag revocation must be specified in implementation plan. T10.4 tests revocation behaviour for CORRESPONDENT_AGREEMENT_CLEARED; equivalent tests for other flags are optional but recommended. |

---

## Oversight level

**EPIC 1 (Regulatory and Contractual Pre-conditions Gate): HIGH**
External sign-offs required from: RBNZ AML/CFT Compliance Officer (Story 1.1), enterprise's Australian counterpart Compliance team (Story 1.2), Regulatory Affairs team lead (Story 1.3), Regulatory Affairs Manager + DIA (Story 1.4), Treasury Legal Counsel + potentially JPMorgan Chase (Story 1.5).

**EPIC 2 (Intra-Group Payment Channel Core): HIGH**
Payments Compliance Officer and engineering sign-off required. All Epic 2 stories may be built and tested in dev/UAT before Epic 1 completes; production activation requires all five flags=true.

**EPIC 3 (Net Settlement, FX Reporting, Customer Confirmation): MEDIUM**
Enterprise Treasury Manager sign-off for Story 3.1 FX reporting. Story 3.2 standard engineering oversight.

---

## Coding Agent Instructions

### Context

You are implementing the trans-tasman payment corridor — a proprietary intra-group routing channel that routes NZ-to-AU retail payments ≤NZD $10,000 through the enterprise's intra-group channel, bypassing SWIFT. This is a regulated financial system. The implementation spans 13 stories across 3 epics. Epic 1 stories (1.1–1.5) are compliance/governance delivery items — they do not produce code artefacts; their "done" condition is a deployment configuration flag set to `true` by the authorised owner, with required written evidence filed. Epic 2 and 3 stories produce engineering code and tests.

The following artefacts are in `workspace/experiments/EXP-008-corpus-breadth-eval/runs/config-A-S13/`:
- `discovery.md` — feature scope, constraints, C5 surfaced
- `definition.md` — 13 stories with full ACs and architecture constraints
- `review.md` — review findings (1 MEDIUM: D1 idempotency; 6 LOW findings)
- `test-plan.md` — 47 test cases across T1–T10, jurisdiction-labelled

Read all four artefacts before writing any code.

---

### Five deployment flags — HARD BLOCKS

The following five deployment flags are the go-live gate mechanism for this feature. **All five must be `true` before any live customer transaction is processed through the intra-group channel.** This is not configurable and cannot be bypassed. Each flag defaults to `false` and may only be set to `true` by the named authorised owner after the required written evidence is filed.

```
AMLCFT_CHANNEL_VALIDATED
  Default: false
  Authorised setter: RBNZ AML/CFT Compliance Officer
  Set to true when: Story 1.1 ACs 1 and 2 complete; written confirmation and BS11 notification filed; SharePoint document ID recorded in deployment configuration
  Flag purpose: confirms intra-group channel is covered by enterprise AML/CFT Programme and BS11 notification has been submitted to RBNZ

AUSTRAC_CONFIRMATION_RECEIVED
  Default: false
  Authorised setter: Payments Compliance Officer (after enterprise's Australian counterpart compliance team written confirmations received and filed)
  Set to true when: Story 1.2 ACs 1 and 2 complete; AUSTRAC originator information field confirmation and AML/CTF Programme documentation confirmation both filed with SharePoint document IDs recorded
  Flag purpose: confirms enterprise's Australian counterpart has documented the arrangement in their AUSTRAC AML/CTF Programme and confirmed minimum originator information field requirements

FX_REPORTING_VALIDATED
  Default: false
  Authorised setter: Regulatory Affairs team lead or Enterprise Treasury Manager
  Set to true when: Story 1.3 AC2 determination confirmed; written confirmation filed with SharePoint document ID recorded; if determination requires FX reporting infrastructure extension, Story 3.1 scope is updated before flag is set
  Flag purpose: confirms RBNZ FX Transaction Reporting obligations for the net settlement model have been determined and the reporting infrastructure is confirmed as adequate (or the extension scope is included in Story 3.1)

DIA_REGISTRATION_CLEARED
  Default: false
  Authorised setter: Regulatory Affairs Manager
  Set to true when: Story 1.4 AC2 complete; either (a) DIA written determination confirming existing licence coverage filed with DIA_ASSESSMENT_ID recorded, or (b) DIA registration approval received with DIA_REGISTRATION_ID recorded
  Flag purpose: confirms DIA payment service type registration status is resolved; prevents retail customer access to the channel before regulatory licence status is confirmed

CORRESPONDENT_AGREEMENT_CLEARED
  Default: false
  Authorised setter: Treasury Legal Counsel
  Set to true when: Story 1.5 AC2 complete; either (a) Treasury Legal clearance memorandum filed with CORRESPONDENT_AGREEMENT_CLEARANCE_ID recorded, or (b) JPMorgan Chase written acknowledgement or consent filed with CORRESPONDENT_NOTIFICATION_ACK_ID recorded
  Flag purpose: confirms JPMorgan Chase correspondent agreement review has been completed and any notification obligation has been satisfied; prevents routing changes that bypass SWIFT without legal clearance
```

**Enforcement points in the engineering code:**
1. `Story 2.1 AC1` — intake pre-flight gate: all five flags checked before any processing; any flag=false → "service not yet available" structured error
2. `Story 2.4 AC1` — credit instruction transmission: CORRESPONDENT_AGREEMENT_CLEARED + AUSTRAC_CONFIRMATION_RECEIVED + AMLCFT_CHANNEL_VALIDATED all checked before any transmission to enterprise's Australian counterpart; any flag=false → "channel not authorised" error
3. `Story 3.1 AC2` — net settlement transmission: FX_REPORTING_VALIDATED checked before transmitting net position to TTPS-SET-001; flag=false → blocked + alert

**Tests that must pass for each flag:**
- T1.1–T1.6 (intake flag gates, Story 2.1)
- T1.7 (flag check precedes originator info validation)
- T1.8–T1.10 (transmission flag gates, Story 2.4)
- T1.11 (net settlement transmission gate, Story 3.1)
- T10.1–T10.4 (CORRESPONDENT_AGREEMENT_CLEARED full lifecycle including revocation)

---

### Implementation ordering

1. **Epic 1 stories (1.1–1.5):** Governance delivery items. Work in parallel with Epic 2/3 engineering build. Each story produces: a filed document (not a code artefact) + deployment configuration flag set. Engineering builds and tests the flag-gating logic against these flags, but the flags themselves are set by the authorised humans outside the build process.

2. **Epic 2 stories (2.1–2.5):** Build in this order to minimise forward dependency blockers:
   - Story 2.3 (data model) — defines the AUSTRAC originator information fields used everywhere else; build first
   - Story 2.1 (intake + routing) — depends on Story 2.3 field definitions and all 5 flag names
   - Story 2.2 (AML/CFT screening) — depends on Story 2.1 intake record; plugs into screening service TTPS-SCR-001
   - Story 2.4 (credit instruction transmission) — depends on Stories 2.1, 2.2, 2.3; this is the CORRESPONDENT_AGREEMENT_CLEARED architectural enforcement point
   - Story 2.5 (threshold reporting) — can be built alongside 2.4; depends on Stories 2.1 and 2.2

3. **Epic 3 stories (3.1–3.2):** Build after Epic 2:
   - Story 3.1 (net settlement + FX reporting) — depends on Story 2.4 acknowledgement status and Story 2.5 pending-threshold-report status; gated by FX_REPORTING_VALIDATED
   - Story 3.2 (customer confirmation) — depends on Story 2.4 acknowledgement status; can be built in parallel with Story 3.1

---

### Story 2.4 idempotency requirement (MEDIUM finding D1 from review)

The credit instruction transmitted to the enterprise's Australian counterpart via TTPS-ROUTE-001 MUST be sent with an idempotency key. Use the system-generated instruction ID from Story 2.1 AC4 as the idempotency key. The implementation must handle the case where the transmission succeeds at the enterprise's Australian counterpart but the acknowledgement is lost in transit — in this case, retry attempts must not cause a duplicate AU-leg crediting event. Specify the idempotency contract with TTPS-ROUTE-001 in the implementation plan. Test case T6.4 must pass.

---

### Constraint-to-story enforcement mapping

| Constraint | Enforcement story | Enforcement mechanism |
|------------|------------------|-----------------------|
| C1 (RBNZ AML/CFT) | Story 1.1 (flag), Story 2.2 (screening), Story 2.5 (threshold reporting) | AMLCFT_CHANNEL_VALIDATED flag; synchronous screening; threshold reporting ≥$10,000 |
| C2 (AUSTRAC) | Story 1.2 (flag), Story 2.3 (data model), Story 2.4 (credit instruction) | AUSTRAC_CONFIRMATION_RECEIVED flag; originator fields in credit instruction |
| C3 (RBNZ FX reporting) | Story 1.3 (flag), Story 3.1 (FX report) | FX_REPORTING_VALIDATED flag; FX report before net settlement transmission |
| C4 (DIA registration) | Story 1.4 (flag), Story 2.1 AC1 (intake gate) | DIA_REGISTRATION_CLEARED flag; "service not yet available" at intake |
| C5 (JPMorgan Chase) | Story 1.5 (flag), Story 2.4 AC1 (transmission gate) | CORRESPONDENT_AGREEMENT_CLEARED flag; "channel not authorised" at transmission |

---

### Acceptance Criteria scope contract

Stories in scope for engineering build: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2 (7 engineering stories).
Stories in scope for governance delivery: 1.1, 1.2, 1.3, 1.4, 1.5 (5 compliance stories).
Test IDs that must pass before any Epic 2/3 story is marked done: all tests in its test group (T1–T10) plus any cross-group tests that reference its ACs (see CPF-TRACE in test-plan.md).

**No Epic 2 or Epic 3 story may be activated for live customer transactions in production before ALL FIVE DEPLOYMENT FLAGS ARE `true`.**

<!-- CPF-TRACE
stage: /definition-of-ready
model: claude-sonnet-4-6
config: A

hard_blocks_status: all_pass
hard_block_count: 9
warnings_count: 3 (W1 DIA timeline, W2 DST cut-off, W3 flag revocation)
oversight_level_ceiling: HIGH (Epic 1 and Epic 2)
five_deployment_flags_in_coding_agent_instructions: true
flags:
  - AMLCFT_CHANNEL_VALIDATED: default=false, setter=RBNZ AML/CFT Compliance Officer
  - AUSTRAC_CONFIRMATION_RECEIVED: default=false, setter=Payments Compliance Officer
  - FX_REPORTING_VALIDATED: default=false, setter=Regulatory Affairs team lead or Enterprise Treasury Manager
  - DIA_REGISTRATION_CLEARED: default=false, setter=Regulatory Affairs Manager
  - CORRESPONDENT_AGREEMENT_CLEARED: default=false, setter=Treasury Legal Counsel
go_live_gate: all_five_flags_true_required
c5_in_coding_agent_instructions: true — CORRESPONDENT_AGREEMENT_CLEARED explicitly specified as hard block for Story 2.4 transmission
c5_surfaced: true (confirmed through all four artefacts: discovery → definition → review → test-plan → dor)
dor_status: signed-off
-->
