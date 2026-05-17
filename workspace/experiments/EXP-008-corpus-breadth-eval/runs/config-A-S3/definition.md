# Definition: NZ Real-Time Payments (RTP) — Inbound Payment Integration

**Status:** Approved (eval-mode — EXP-008-corpus-breadth-eval / Config A / S3)
**Feature slug:** rtp-receiving-integration
**Date:** 2026-05-18
**Skill version:** /definition
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Source artefact read from disk before this stage:** `runs/config-A-S3/discovery.md`

---

## Step 1 — Slicing strategy

**Selected strategy: Sequential dependency chain with certification gate**

Rationale: The discovery artefact identifies a hard sequencing constraint (C5 [PRECONDITION]) — scheme admission and production access require completed Payments NZ Technical Compliance Certification. Additionally, Epic 2 work depends on confirmed AML latency characteristics (AML spike — Story 2.2) and a confirmed fraud architecture ADR (Story 2.3). These dependencies create a natural forced sequencing:

- Epic 3 (certification and performance validation) must run in parallel from day one, not be deferred to after Epic 1 and 2.
- Story 2.2 has a gate condition: AML spike results must be available before the AML screening integration is scoped to final AC targets.
- Story 3.1 must begin with item-by-item gap assessment to discover any hidden architectural requirements before Epic 1 and Epic 2 scope is committed.
- Story 3.2 (end-to-end performance validation) is the final integration gate before production deployment.

The story slicing follows component-boundary decomposition within epics, with explicit gate dependencies between stories documented in each story's entry conditions.

---

## Step 2 — Epic and story decomposition

### Epic 1 — RTP Receiving Platform Integration

The platform connectivity layer: receiving inbound payment messages from Payments NZ RTP Central Infrastructure and sending acknowledgements within the scheme timeout window.

| Story | Title | Complexity | Scope stability | Depends on |
|-------|-------|-----------|----------------|------------|
| 1.1 | Inbound RTP payment message processing (ISO 20022 pacs.008) | 2 | Stable (with caveat: Story 3.1 gap assessment may add recall message handling) | Story 3.1 item-by-item assessment must be started; any architectural impacts from hidden items must be incorporated before 1.1 is locked |
| 1.2 | Scheme acknowledgement — synchronous pacs.004 response within 10-second timeout | 1 | Stable | Story 1.1 complete |

---

**Story 1.1 — Inbound RTP payment message processing (ISO 20022 pacs.008)**

*As a payment operations platform*
*I want to receive, parse, and validate inbound ISO 20022 pacs.008 credit transfer instructions from Payments NZ RTP Central Infrastructure*
*So that valid inbound payments are routed to the real-time processing layer for crediting and all invalid messages are rejected with the appropriate scheme response*

**Acceptance criteria:**
- AC1: The platform receives inbound pacs.008 messages from Payments NZ RTP Central Infrastructure via the scheme messaging interface
- AC2: Each inbound pacs.008 is parsed and validated against the ISO 20022 pacs.008 message schema; messages that fail schema validation are rejected
- AC3: The beneficiary account is resolved from the pacs.008 CdtrAcct element; messages referencing accounts not held at the enterprise are rejected with a pacs.004 negative response indicating unknown account
- AC4: Duplicate pacs.008 detection — messages with a payment instruction ID that has already been processed are rejected without crediting the account
- AC5: Valid, non-duplicate pacs.008 messages for known accounts are routed to the real-time processing layer within the processing budget available before the 10-second acknowledgement timeout
- AC6: All inbound pacs.008 messages (valid, invalid, duplicate) are logged to the payment audit trail with receipt timestamp, validation outcome, and routing decision
- AC7: Malformed messages (not parseable as ISO 20022 XML) are discarded with an error log entry and a scheme error response if the message source is identifiable

**NFRs:**
- Message receipt to processing-layer handoff P99 ≤ 500 ms at 40,000 tph
- Audit log write must complete before processing-layer handoff (synchronous)

---

**Story 1.2 — Scheme acknowledgement — synchronous pacs.004 response within 10-second timeout**

*As a Payments NZ scheme participant*
*I want to send a pacs.004 positive acknowledgement to the RTP scheme within 10 seconds of receiving each valid inbound pacs.008*
*So that the enterprise complies with the scheme participation rules for receiving participants and customers receive confirmed credit in real time*

**Acceptance criteria:**
- AC1: For each successfully processed payment (AML cleared, fraud pre-screened, account credited), a pacs.004 positive acknowledgement is sent to Payments NZ RTP within 10 seconds of receipt of the inbound pacs.008
- AC2: If any processing step (AML screening, fraud pre-screen, account credit) does not complete within the internal processing budget, a pacs.004 negative response (reason: processing timeout) is sent before the 10-second scheme deadline, and the payment is escalated for manual review
- AC3: If the beneficiary account is unknown or closed (as determined in Story 1.1 validation), a pacs.004 negative response with the appropriate scheme reason code is sent within the scheme timeout
- AC4: If AML/CFT screening holds the payment (MATCH or REFER outcome), a pacs.004 with the appropriate reason code is sent within the scheme timeout indicating the hold
- AC5: Acknowledgement send time is logged against receipt timestamp for every pacs.008; any acknowledgement sent within 9.5–10 seconds triggers an alert to payment operations
- AC6: No pacs.008 may receive both a positive and a negative acknowledgement; duplicate acknowledgement logic is enforced

**NFRs:**
- Scheme acknowledgement P99 ≤ 10 seconds from pacs.008 receipt timestamp (measured end-to-end at 40,000 tph under load test — Story 3.2)

---

### Epic 2 — Real-Time Processing Layer

The real-time execution engine: crediting accounts, screening payments, and fraud pre-filtering — all within the 10-second window.

| Story | Title | Complexity | Scope stability | Depends on |
|-------|-------|-----------|----------------|------------|
| 2.1 | Real-time account crediting layer — in-memory ledger and end-of-day batch reconciliation | 3 | Stable (architecture pattern is an enterprise first) | Operations team reconciliation design review (gate condition in ACs) |
| 2.2 | AML/CFT and sanctions screening integration at RTP scale | 3 | Stable (subject to AML spike outcome) | AML spike confirming P99 performance at 40,000 tph; AML-RISK-001 must be resolved before final latency ACs are committed |
| 2.3 | Real-time fraud pre-screening integration (rule-based approach) | 2 | Stable (subject to ADR confirmation) | Fraud architecture ADR approved and recorded before implementation starts |

---

**Story 2.1 — Real-time account crediting layer**

*As a payment operations platform*
*I want to immediately credit the beneficiary account when a valid, screened inbound RTP payment is received*
*So that enterprise customers receive real-time access to funds and the payment is recorded for end-of-day reconciliation with core banking*

**Acceptance criteria:**
- AC1: A validated, AML-cleared, fraud pre-screened inbound RTP payment triggers an immediate account credit to the beneficiary account via the in-memory ledger; the credit is visible to the customer within 2 seconds of receipt of the pacs.008
- AC2: Every account credit is written to the end-of-day reconciliation journal with the pacs.008 payment instruction ID, beneficiary account, credit amount, currency, and timestamp; this journal is the authoritative settlement record
- AC3: At end-of-day, the reconciliation process posts all in-memory credits to the core banking batch system; any discrepancy between the in-memory ledger and the core banking outcome is flagged as a reconciliation exception and escalated to payment operations
- AC4: If the in-memory ledger becomes unavailable (service failure), inbound payments are queued and held; no payments are credited or acknowledged during the unavailability window; payment operations are alerted immediately
- AC5: A reconciliation design review has been completed with the payment operations team before this story is marked complete; the review artefact is attached to the story completion record
- AC6: Duplicate credit prevention — a payment instruction ID that has already been credited to the in-memory ledger must not be credited a second time; idempotency is enforced at the ledger write step

**NFRs:**
- Account credit P99 ≤ 2 seconds from pacs.008 receipt
- Reconciliation journal write is synchronous with account credit (write must complete before acknowledgement is sent)

---

**Story 2.2 — AML/CFT and sanctions screening integration at RTP scale**

*As a Financial Crime Compliance team*
*I want AML/CFT watchlist screening and financial sanctions checks to run synchronously on every inbound RTP payment above the applicable threshold*
*So that the enterprise satisfies its obligations under the AML/CFT Act 2009 and the applicable sanctions regulations before crediting customer accounts*

**Acceptance criteria:**
- AC1: Every inbound RTP payment above the applicable AML/CFT threshold (confirmed by Financial Crime Compliance — see open question on domestic RTP threshold) is submitted to the AML Screening Service synchronously before account credit
- AC2: Financial sanctions screening is applied to all inbound RTP payments regardless of amount; sanctions screening must complete before account credit
- AC3: AML CLEAR and sanctions CLEAR outcomes allow the payment to proceed to account credit
- AC4: AML MATCH outcomes result in the payment being held; a pacs.004 with the appropriate scheme reason code is sent; a case is created in the AML workflow system for Financial Crime Compliance review
- AC5: AML REFER outcomes result in the payment being held pending Financial Crime Compliance review; processing proceeds with REFER status; case created in AML workflow system
- AC6: The AML Screening Service integration has been load-tested at 40,000 tph; the P99 end-to-end AML call latency at peak load is confirmed before this story's ACs are finalised; if P99 > 6 seconds at 40,000 tph, the story scope is escalated to the architecture board for integration design reassessment
- AC7: Financial Crime Compliance has confirmed the applicable AML/CFT Act 2009 screening threshold for domestic RTP inbound payments before this story goes to test; confirmation is documented and attached to the story

**NFRs:**
- AML screening call P99 ≤ 6 seconds (isolated, 40,000 tph load test — gate condition for AC6)
- Sanctions screening call P99 ≤ 1 second

---

**Story 2.3 — Real-time fraud pre-screening integration (rule-based approach)**

*As a payment risk team*
*I want a real-time rule-based fraud pre-screening step to run on every inbound RTP payment within the 10-second processing window*
*So that high-confidence fraud signals trigger a hold and investigation before account credit, while a full async fraud model review occurs post-crediting for all payments*

**Acceptance criteria:**
- AC1: A fraud architecture ADR has been approved and recorded before this story begins implementation; the ADR confirms the rule-based pre-screen approach (not the vendor beta API) for production use in the initial release
- AC2: Every inbound RTP payment is submitted to the rule-based fraud pre-screening engine synchronously before account credit; the rule-based pre-screen runs within the allocated 1-second processing budget
- AC3: Rule-based pre-screen BLOCK outcome results in the payment being held; a pacs.004 with the appropriate scheme reason code is sent; the case is escalated to the fraud investigations team
- AC4: Rule-based pre-screen PASS outcome allows the payment to proceed to account credit; the payment is simultaneously queued for the full async fraud model review post-crediting
- AC5: If the fraud pre-screening service is unavailable, the payment proceeds through the processing pipeline and is flagged as unscreened in the audit trail; a payment operations alert is raised; no payment is silently skipped without audit trail record
- AC6: The vendor real-time beta API is not used in the production implementation of this story; the ADR must explicitly record this constraint

**NFRs:**
- Fraud pre-screen P99 ≤ 1 second at 40,000 tph

---

### Epic 3 — Scheme Compliance and Certification

The certification and validation track: these stories run from the start of the project in parallel with Epic 1 and Epic 2, and must complete before any production deployment is authorised.

| Story | Title | Complexity | Scope stability | Depends on |
|-------|-------|-----------|----------------|------------|
| 3.1 | Payments NZ Technical Compliance Certification — 16-item gap assessment and remediation | 3 | Unstable until items are assessed (unknown scope) | Must begin immediately; item-by-item review is an entry condition for Epic 1/2 scope commitment |
| 3.2 | End-to-end performance validation and pre-production scheme testing | 2 | Stable (load test design can begin; specific thresholds confirmed by 2.2 AML spike) | Stories 1.1, 1.2, 2.1, 2.2, 2.3 complete; AML P99 confirmed; fraud ADR approved |

---

**Story 3.1 — Payments NZ Technical Compliance Certification — 16-item gap assessment and remediation**

*As a Payments NZ scheme participant*
*I want to complete all 47 Technical Compliance Certification items and obtain Payments NZ scheme admission before the 2026-09-01 go-live date*
*So that the enterprise is authorised for production access and can process live RTP payments without regulatory penalty*

**Acceptance criteria:**
- AC1: A complete item-by-item assessment of all 16 outstanding compliance checklist items has been produced within the first two weeks of the project; each item is categorised as: (a) completable through documentation evidence, (b) requires technical implementation, or (c) requires third-party testing or witness
- AC2: Any items categorised as (b) that reveal architectural requirements not currently in Epic 1 or Epic 2 scope are escalated to the product owner and architecture lead within 3 days of identification; Epic 1/2 scope may be adjusted based on this assessment before implementation begins
- AC3: All 47 compliance checklist items are submitted to Payments NZ with supporting evidence; the submission is tracked in a dedicated certification tracker shared with Payments NZ
- AC4: All 47 items are confirmed as complete by Payments NZ; any items returned as not-met are re-worked and resubmitted within the agreed timeline
- AC5: Payments NZ grants scheme admission and issues a scheme admission reference; the reference is recorded as a deployment gate field
- AC6: The scheme admission reference is available no later than 10 business days before the 2026-09-01 go-live date; if the reference has not been issued by this date, a go-live delay is confirmed by the programme director
- AC7: The scheme admission reference is a required field in the production deployment manifest; no production deployment authorisation is issued without this reference

---

**Story 3.2 — End-to-end performance validation and pre-production scheme testing**

*As a Payments NZ scheme participant and payment operations team*
*I want to run the full end-to-end inbound payment processing flow under peak load and complete Payments NZ pre-production scheme test scenarios*
*So that the enterprise can confirm the 10-second window is met at production volumes and all Payments NZ go-live readiness criteria are satisfied*

**Acceptance criteria:**
- AC1: A load test covering the full end-to-end path (pacs.008 receipt → AML screen → fraud pre-screen → real-time credit → pacs.004 acknowledgement) at 40,000 tph is executed; P99 end-to-end latency is confirmed ≤ 10 seconds
- AC2: The AML Screening Service P99 at 40,000 tph is confirmed ≤ 6 seconds under the load test; if the P99 exceeds 6 seconds, the test is paused and escalated to the architecture board
- AC3: All Payments NZ pre-production scheme test scenarios are completed; the enterprise passes all scenario tests required for go-live authorisation
- AC4: A load test report is produced and reviewed by the payment operations team and Financial Crime Compliance; the report is attached as a deployment gate field reference
- AC5: The pre-production test results are submitted to Payments NZ as part of the certification evidence pack

**NFRs:**
- End-to-end P99 ≤ 10 seconds at 40,000 tph (hard gate — production deployment is not authorised without this confirmation)

---

## Step 3 — Out-of-scope register

The following items were explicitly considered and excluded from scope. They are listed here to prevent scope creep and to provide context for any future change control request.

1. **Outbound (sending) side RTP integration** — The enterprise is initially participating as a receiving participant only. Outbound payments are a separate project with a different go-live schedule.
2. **Core banking batch processing architecture changes** — The in-memory ledger + end-of-day reconciliation approach is designed to avoid core banking changes; any requirement that would alter the batch architecture is out of scope.
3. **AML Screening Service infrastructure scaling** — If the AML spike (referenced in Story 2.2 AC6) reveals that the current AML infrastructure cannot scale to 40,000 tph, the infrastructure scaling is a separate project. This feature delivers the integration design; capacity upgrade is separate delivery.
4. **Full real-time fraud model deployment via vendor beta API** — The vendor beta API is not production-ready (no SLA, no enterprise security assessment). Full real-time fraud model deployment is a separate project gated on the vendor security assessment process completing.
5. **Inbound payment recall processing (pacs.004 negative / camt.056)** — Recall initiation and recall handling are Phase 2 scope. The scheme certification assessment (Story 3.1 AC1-AC2) must confirm whether recall handling is a certification requirement; if it is, it will be escalated for scope inclusion.
6. **Customer notification channel changes** — Real-time credit notification to customers is a separate consumer-facing project not covered by scheme participation requirements.

---

## Step 4 — Scope accumulator check

**Scope versus discovery MVP:**

The definition has stayed tightly within the discovery MVP scope. The 7 stories cover the 6 MVP components defined in discovery (message processing, real-time crediting, AML/CFT screening, fraud pre-screening, scheme acknowledgement, certification gap remediation — plus the addition of performance validation as Story 3.2, which is a natural extension of the certification requirement).

One scope observation: Story 3.1 has complexity 3 with unstable scope (because the 16 outstanding items are unknown). The scope accumulator signals this as the largest risk item in the feature. If the item-by-item assessment (AC1) reveals a category (b) item that requires implementation — for example, inbound recall processing — the scope of Epics 1 or 2 will need to increase. This risk is documented but not pre-scoped.

**Story count:** 7 (within normal range for a feature of this complexity and regulatory breadth)
**Epic count:** 3
**Stories with complexity 3:** 2 (2.1 in-memory crediting as first use; 2.2 AML at RTP scale; 3.1 unknown gap scope)
**Stories with unstable scope:** 1 (3.1 pending gap assessment)
**Scope drift vs. discovery MVP:** 0 scope drift — Stories 3.2 was implicit in the certification requirement and is explicitly included here

---

# CPF-TRACE
```yaml
story: S3
stage: /definition
model: claude-sonnet-4-6
injection_files_active:
  - S3-ea-registry-rtp-payments.md (post-fix)
injection_design_test:
  ea_registry: "PASS (post-fix — see /discovery trace)"
constraints_surfaced_at_this_stage: [C1, C2, C3, C4, C5]
c5_surfaced: true
c5_surface_stage: /discovery
c5_surface_mechanism: >
  Propagated from /discovery. C5 expressed in definition as a hard scope gate: Story 3.1 must
  begin immediately; Epic 1/2 scope commitment gated on Story 3.1 AC1 item-by-item assessment;
  Story 3.1 AC7 makes scheme admission reference a mandatory deployment gate field;
  Story 3.2 sequence dependency enforces no production deployment before certification confirmed.
c5_surfacing_quality: full
c5_surfacing_notes: >
  C5 correctly propagated from discovery as a sequencing constraint — not a feature, not an
  afterthought. Story 3.1 is positioned as a parallel workstream starting day one, and the
  scheme admission reference is embedded as a mandatory deployment gate. The definition
  correctly identified the unstable scope risk in Story 3.1 and logged it in the scope
  accumulator. No regression from the discovery C5 framing.
blocker_in_discovery: true
blocker_type: scheme_certification_precondition
```
