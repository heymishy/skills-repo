# Test Plan: NZ Real-Time Payments (RTP) — Inbound Payment Integration

**Status:** Approved (eval-mode — EXP-008-corpus-breadth-eval / Config A / S3)
**Feature slug:** rtp-receiving-integration
**Date:** 2026-05-18
**Skill version:** /test-plan
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Source artefacts read from disk before this stage:** `runs/config-A-S3/discovery.md`, `runs/config-A-S3/definition.md`, `runs/config-A-S3/review.md`
**Review HIGH findings addressed:** H1 (T-AML-LOAD), H2 (T-FRAUD-ADR), H3 (T-CERT-GATE)

---

## Part A — Technical test plan (for coding agent and CI)

### NFR test specifications

| Test ID | Constraint | NFR threshold | Test type | Gate condition |
|---------|-----------|---------------|-----------|----------------|
| T-NFR-001 | C3 — 10-second acknowledgement window | End-to-end receipt-to-ACK P99 ≤ 10 seconds at 40,000 tph | Load test (Story 3.2) | Hard gate — production deployment blocked if not met |
| T-NFR-002 | C2/C3 — AML latency budget | AML screening call P99 ≤ 6 seconds isolated at 40,000 tph | Load test (T-AML-LOAD) | Hard gate — Story 2.2 blocked until confirmed; Epic 2 architecture may require redesign if exceeded |
| T-NFR-003 | C3 — Account credit latency budget | Account credit P99 ≤ 2 seconds from pacs.008 receipt | Performance test | Story 2.1 gate |
| T-NFR-004 | C3 — Fraud pre-screen budget | Fraud pre-screen P99 ≤ 1 second at 40,000 tph | Performance test | Story 2.3 gate |
| T-NFR-005 | C3 — Sanctions screening budget | Sanctions call P99 ≤ 1 second | Performance test | Story 2.2 gate |

**Latency budget allocation (sum check):**
| Component | P99 budget |
|-----------|-----------|
| Message validation and routing (Story 1.1) | ≤ 0.5s |
| AML screening (Story 2.2) | ≤ 6.0s |
| Sanctions screening (Story 2.2) | ≤ 1.0s (concurrent with AML if architecture permits) |
| Account credit (Story 2.1) | ≤ 2.0s |
| Fraud pre-screen (Story 2.3) | ≤ 1.0s |
| Acknowledgement send (Story 1.2) | ≤ 0.3s |
| **Total sequential worst case** | **≤ 9.8s** |
| **Concurrent design target** | **≤ 7.5s** |

Note: AML and sanctions can run concurrently; fraud pre-screen can run concurrently with AML if the architecture separates the sanctions check. The budget allocation above assumes full parallelism of AML + sanctions + fraud where possible. The specific concurrency design must be confirmed in the Story 2.2 architecture review before the load test is designed.

---

### Story 1.1 — Inbound RTP payment message processing

**T-RTP-001** (Unit)
Given: A valid ISO 20022 pacs.008 message received from Payments NZ RTP Central Infrastructure
When: The message processing service receives the inbound pacs.008
Then: The message is parsed successfully, the beneficiary account is resolved, and the payment is routed to the real-time processing layer within 500ms of receipt

**T-RTP-002** (Unit)
Given: A pacs.008 message with an invalid ISO 20022 schema (missing required element CdtrAcct)
When: The message validation step processes the message
Then: The message is rejected; a pacs.004 negative response with schema-error reason code is sent; the rejection is logged with receipt timestamp and validation failure details; no account credit is attempted

**T-RTP-003** (Unit)
Given: A valid pacs.008 message referencing an account number not held at the enterprise
When: The account resolution step processes the message
Then: The message is rejected; a pacs.004 negative response with unknown-account reason code is sent; the rejection is logged; no account credit is attempted

**T-RTP-004** (Unit)
Given: A valid pacs.008 message with a payment instruction ID that has already been successfully processed
When: The duplicate detection step processes the message
Then: The message is rejected as a duplicate; no account credit is triggered; the duplicate is logged; a pacs.004 negative response with duplicate-instruction reason code is sent

**T-RTP-005** (Unit)
Given: A malformed XML message that cannot be parsed as ISO 20022
When: The message ingestion step receives the message
Then: The message is discarded without routing; an error log entry is created with the raw message source and timestamp; if the sender is identifiable, a scheme error response is sent

**T-RTP-006** (Integration)
Given: A valid pacs.008 is received and routed to the processing layer
When: The audit log is inspected
Then: The audit log entry contains: receipt timestamp, payment instruction ID, beneficiary account (masked), validation outcome, routing decision, and message hash; the entry is written before the processing-layer handoff is acknowledged

---

### Story 1.2 — Scheme acknowledgement

**T-ACK-001** (Integration)
Given: A valid pacs.008 payment has been fully processed (AML cleared, fraud pre-screened, account credited)
When: The acknowledgement service prepares the response
Then: A pacs.004 positive acknowledgement is sent to Payments NZ RTP; the send timestamp is within 10 seconds of the pacs.008 receipt timestamp; the acknowledgement is logged against the original payment instruction ID

**T-ACK-002** (Integration)
Given: A valid pacs.008 is received but an internal processing timeout occurs (processing not complete at 9.5 seconds)
When: The timeout guard triggers
Then: A pacs.004 negative response with processing-timeout reason code is sent before the 10-second deadline; the payment is added to the manual review queue; a payment operations alert is raised

**T-ACK-003** (Unit)
Given: An AML MATCH hold is placed on a payment
When: The acknowledgement service responds
Then: A pacs.004 with AML-hold reason code is sent within the scheme timeout; the scheme receives a valid response; the hold is logged; the case is created in the AML workflow system

**T-ACK-004** (Unit)
Given: A fraud pre-screen BLOCK hold is placed on a payment
When: The acknowledgement service responds
Then: A pacs.004 with fraud-hold reason code is sent within the scheme timeout; the case is escalated to fraud investigations; the hold is logged

**T-ACK-005** (Unit)
Given: A payment has already received a positive acknowledgement
When: A second acknowledgement attempt is triggered for the same payment instruction ID
Then: The second acknowledgement is suppressed; the duplicate acknowledgement attempt is logged; the scheme does not receive two responses for the same payment

---

### Story 2.1 — Real-time account crediting

**T-CRED-001** (Integration)
Given: A valid, AML-cleared, fraud pre-screened pacs.008 payment
When: The real-time crediting step executes
Then: The beneficiary account balance is increased by the payment amount within 2 seconds of pacs.008 receipt; the credit is visible to the customer immediately; the reconciliation journal entry is written synchronously with the credit

**T-CRED-002** (Unit)
Given: An inbound payment with a payment instruction ID that has already been credited in the in-memory ledger
When: The crediting step processes the payment
Then: No duplicate credit is applied; the idempotency guard blocks the second credit; the duplicate attempt is logged; the processing continues to the acknowledgement step without re-crediting

**T-CRED-003** (Integration)
Given: The end-of-day reconciliation job runs after a day of real-time credits
When: The reconciliation posts credits to core banking
Then: All in-memory credits from the day are posted to core banking; the reconciliation journal record and the core banking post match for every payment instruction ID; any discrepancy is flagged as a reconciliation exception and a payment operations alert is raised

**T-CRED-004** (Integration)
Given: A core banking batch post fails for one payment in the end-of-day reconciliation
When: The reconciliation detects the failure
Then: The failed item is recorded in the exceptions register; a payment operations alert is raised; the exception is not silently discarded; the successful posts are not rolled back

**T-CRED-005** (Integration)
Given: The in-memory ledger service becomes unavailable during payment processing
When: An inbound pacs.008 is received
Then: The payment is queued (not credited, not acknowledged); a payment operations alert is raised immediately; the 10-second timeout triggers a pacs.004 negative response with service-unavailable reason code; the queued payment is held pending service restoration

**T-RECON-FAIL** (Integration — addresses review M1)
Given: The reconciliation journal contains credits for 1,000 payments and the core banking batch run confirms 999 of them
When: The reconciliation exception detection step runs
Then: The single unmatched credit is flagged as a reconciliation exception; the exception contains the payment instruction ID, amount, and beneficiary account; the operations team is notified via the defined escalation channel within 1 minute of reconciliation completion

---

### Story 2.2 — AML/CFT and sanctions screening

**T-AML-001** (Unit)
Given: An inbound RTP payment above the applicable AML/CFT threshold (confirmed threshold)
When: The AML screening step runs
Then: The AML Screening Service is called synchronously with the payment details; a CLEAR outcome proceeds to account credit; the AML call and outcome are logged with the payment instruction ID

**T-AML-002** (Unit)
Given: An inbound RTP payment below the applicable AML/CFT threshold
When: The AML threshold check runs
Then: The AML Screening Service is not called for the payment amount; the payment proceeds to the next step; the threshold bypass is logged

**T-AML-003** (Unit)
Given: The AML Screening Service returns a MATCH outcome for an inbound payment
When: The AML result is processed
Then: The payment is held; no account credit is applied; a pacs.004 with AML-hold reason code is sent; a case is created in the AML workflow system with the payment details and match reference; a Financial Crime Compliance alert is raised

**T-AML-004** (Unit)
Given: The AML Screening Service returns a REFER outcome
When: The AML result is processed
Then: The payment is held pending Financial Crime Compliance review; no account credit is applied; a case is created in the AML workflow system with REFER status; Financial Crime Compliance is notified

**T-AML-005** (Unit)
Given: An inbound payment where the paying party name appears on the financial sanctions list
When: Sanctions screening runs
Then: The payment is blocked regardless of amount; no account credit is applied; a pacs.004 with sanctions-hold reason code is sent; the event is logged and escalated per the sanctions escalation procedure

**T-AML-LOAD** (Load test gate — resolves review H1)
Given: The AML Screening Service integration is deployed with scaling configuration for RTP volumes
When: A load test at 40,000 tph is executed against the AML integration endpoint
Then: The AML Screening Service P99 call latency is ≤ 6 seconds at 40,000 tph; the load test report is produced and reviewed by Financial Crime Compliance and architecture; if P99 > 6 seconds, the test is immediately escalated to the architecture board for integration redesign before any further Story 2.2 implementation proceeds
Note: This is a BLOCKING gate. Story 2.2 implementation is not authorised until T-AML-LOAD has passed. Epic 2 architecture commitments must not be made before the load test result is known.

**T-AML-THRESHOLD** (Documentation gate)
Given: Financial Crime Compliance has reviewed the applicable AML/CFT Act 2009 obligations for domestic RTP inbound payments
When: Story 2.2 is ready to enter test
Then: A written confirmation from the Financial Crime Compliance team lead confirming the applicable threshold for domestic RTP inbound payments is attached to the story completion record; Story 2.2 AC1 references this confirmation; no Story 2.2 test can be marked as passing without this document present

---

### Story 2.3 — Fraud pre-screening

**T-FRAUD-ADR** (Documentation gate — resolves review H2)
Given: Story 2.3 is ready to begin implementation
When: The entry condition check runs
Then: A fraud architecture ADR exists, has been reviewed and approved by the payment architecture lead and fraud risk team, and explicitly confirms: (a) the rule-based pre-screen approach for the initial release; (b) that the vendor beta API will not be used in production until a completed enterprise security assessment and SLA process; the ADR reference is attached to the Story 2.3 entry record
Note: This is a BLOCKING gate. Story 2.3 implementation must not begin without the ADR. The DoR for Story 2.3 must explicitly list the ADR approval as a hard entry condition.

**T-FRAUD-001** (Unit)
Given: An inbound RTP payment that does not match any rule-based fraud indicator
When: The fraud pre-screening engine processes the payment
Then: The pre-screen returns PASS; the payment proceeds to account credit; the pre-screen outcome is logged; the payment is added to the post-credit async fraud review queue

**T-FRAUD-002** (Unit)
Given: An inbound RTP payment that matches a rule-based fraud indicator (e.g., payee known-fraud-network pattern)
When: The fraud pre-screening engine processes the payment
Then: The pre-screen returns BLOCK; the payment is held; a pacs.004 with fraud-hold reason code is sent; a case is created in the fraud investigations queue; no account credit is applied

**T-FRAUD-003** (Integration)
Given: The fraud pre-screening service is unavailable (service down / timeout)
When: An inbound pacs.008 is processed
Then: The payment proceeds through the pipeline as unscreened; the audit trail entry contains a "fraud-screen-unavailable" flag; a payment operations alert is raised; no payment is silently unscreened without an audit trail record and alert

---

### Story 3.1 — Compliance certification gap remediation

**T-CERT-001** (Documentation gate)
Given: Story 3.1 is started
When: The item-by-item gap assessment completes within the first 2 weeks
Then: A gap assessment document exists covering all 16 outstanding items; each item is categorised as (a) documentation-completable, (b) requires implementation, or (c) requires third-party testing; any category (b) items with architectural impact are listed with a description of the impact; the document is reviewed by the product owner and architecture lead within 3 days of completion

**T-CERT-002** (Documentation gate)
Given: All 47 certification items have been assessed and evidence has been prepared
When: The submission to Payments NZ is made
Then: A certification submission record exists that lists all 47 items, their evidence reference, and the submission date; the submission record is attached to the Story 3.1 completion record

**T-CERT-GATE** (Technical gate — resolves review H3)
Given: A production deployment is being prepared
When: The deployment readiness checklist runs
Then: The `scheme_admission_reference` field in the production deployment manifest is present and non-empty; if the field is absent or empty, the deployment tooling returns an error and the deployment is blocked; the scheme admission reference format matches the Payments NZ reference format (to be confirmed in Story 3.1 AC5); this check is enforced by the deployment tooling, not by a manual review step
Note: This is a TECHNICAL GATE enforced in the deployment pipeline. The scheme admission reference field must be a required configuration field validated at deployment time. A documentation-only check or manual confirmation is not sufficient.

**T-CERT-003** (Integration gate)
Given: Payments NZ has granted scheme admission and issued a scheme admission reference
When: The scheme admission reference is entered into the deployment manifest
Then: The reference passes the format validation check in the deployment tooling; the reference is stored in the deployment audit log; the T-CERT-GATE check passes for this deployment

---

### Story 3.2 — End-to-end performance validation

**T-E2E-001** (End-to-end load test — primary delivery gate)
Given: Stories 1.1, 1.2, 2.1, 2.2, 2.3, and 3.1 are all complete and integrated
When: A load test covering the full end-to-end path (pacs.008 receipt → message validation → AML screen → fraud pre-screen → real-time credit → pacs.004 acknowledgement) is executed at 40,000 tph
Then: P99 end-to-end latency is ≤ 10 seconds; the load test report confirms the 10-second constraint is met for all payment flows including AML CLEAR, sanctions CLEAR, and fraud PASS paths; the load test report is reviewed by the payment operations team, Financial Crime Compliance, and architecture lead

**T-E2E-002** (Integration)
Given: The full integration is under load test conditions
When: A simulated AML MATCH payment is introduced at peak load
Then: The AML hold is applied correctly; the pacs.004 with AML-hold reason code is sent within the 10-second window; the hold workflow operates correctly under load

**T-E2E-003** (Scheme test)
Given: The Payments NZ pre-production scheme test environment is connected
When: All required Payments NZ scheme test scenarios are executed
Then: The enterprise passes all mandatory pre-production test scenarios; Payments NZ confirms test completion; the test completion record is attached as a certification evidence item in Story 3.1

**T-DEPLOY-001** (Deployment gate — all gates)
Given: A production deployment is being authorised
When: The full deployment gate checklist runs
Then: All of the following fields are present and non-empty in the deployment manifest:
  1. `scheme_admission_reference` (Payments NZ scheme admission) — enforced by T-CERT-GATE
  2. `aml_peak_load_test_reference` (T-AML-LOAD report reference)
  3. `fraud_architecture_adr_reference` (ADR reference from T-FRAUD-ADR)
  4. `e2e_load_test_reference` (T-E2E-001 report reference)
  5. `aml_domestic_threshold_confirmation` (Financial Crime Compliance written confirmation from T-AML-THRESHOLD)
  If any field is absent or empty, the deployment is blocked with a descriptive error identifying the missing gate.

---

## Part B — AC verification script (human review and smoke test)

### Pre-coding review checklist

Before coding begins:
- [ ] Fraud architecture ADR has been approved (T-FRAUD-ADR gate) — check before Story 2.3 sprint
- [ ] AML Screening Service load test at 40,000 tph has been scheduled — check before Story 2.2 sprint
- [ ] Story 3.1 item-by-item gap assessment has been started (day 1) — confirm start date
- [ ] Payments NZ scheme test scenario list has been obtained — check at Epic 3 planning
- [ ] Financial Crime Compliance has confirmed the domestic RTP AML threshold — check before Story 2.2 sprint

### Post-merge smoke tests

After the feature is deployed to production:
1. **Inbound payment credit test** — send a test pacs.008 to the RTP interface; verify the beneficiary account is credited within 2 seconds and a pacs.004 ACK is sent within 10 seconds
2. **AML hold verification** — trigger a simulated AML MATCH on a test payment; verify the hold is applied, the case is created in the AML workflow, and no account credit occurs
3. **Fraud pre-screen block verification** — trigger a simulated rule-based fraud BLOCK; verify the hold is applied, the case is created in fraud investigations, and no account credit occurs
4. **Reconciliation end-of-day verification** — verify the end-of-day reconciliation posts all test credits to core banking; verify no exceptions
5. **Deployment gate verification** — confirm all 5 deployment gate fields are present and non-empty in the production deployment manifest

---

## Test data strategy

| Test area | Test data approach |
|-----------|-------------------|
| pacs.008 messages | Synthetic ISO 20022 XML fixtures using Payments NZ test message templates; separate fixtures for valid, invalid-schema, unknown-account, duplicate, and malformed variants |
| AML scenarios | Synthetic payee names and account numbers NOT from any real watchlist; test cases use synthetic identifiers flagged as test data in the AML Screening Service test environment only |
| Sanctions scenarios | Synthetic party names and identifiers — must not use real sanctions list entries; coordinate with Financial Crime Compliance on test data isolation in the sanctions screening test environment |
| Load test volume | Synthetic payment generator producing 40,000 pacs.008 messages/hour; payments distributed across 10,000 synthetic account numbers held in the test environment |
| Reconciliation | Synthetic in-memory ledger entries; reconciliation exception test cases use injected deliberate mismatches in the test environment; no production account data |

**IMPORTANT:** AML and sanctions test data must be reviewed by Financial Crime Compliance before load testing to confirm no accidental real-name matches against watchlists. All test payment instruction IDs must use a synthetic prefix (e.g. `TEST-`) that is filtered from production reconciliation reports.

---

# CPF-TRACE
```yaml
story: S3
stage: /test-plan
model: claude-sonnet-4-6
injection_files_active:
  - S3-ea-registry-rtp-payments.md (post-fix)
injection_design_test:
  ea_registry: "PASS (post-fix — see /discovery trace)"
constraints_surfaced_at_this_stage: [C1, C2, C3, C4, C5]
c5_surfaced: true
c5_surface_stage: /discovery
c5_surface_mechanism: >
  Propagated from /discovery and /review. At /test-plan stage, C5 is enforced as a
  technical gate: T-CERT-GATE implements scheme_admission_reference as a deployment
  tooling check (not a documentation review); T-DEPLOY-001 enforces all 5 deployment
  gates as a single combined pre-flight check. C5 has progressed from a discovery
  [PRECONDITION] → definition sequencing constraint → review H3 structural finding →
  test plan technical enforcement gate. This is the full propagation chain.
c5_surfacing_quality: full
c5_surfacing_notes: >
  C5 surfaced fully in /discovery, strengthened in /review (H3), and now technically
  enforced at /test-plan stage through T-CERT-GATE and T-DEPLOY-001. The test plan
  correctly frames the scheme admission reference as a deployment tooling gate, not a
  manual confirmation step — directly addressing the review's H3 finding that a process
  gate is insufficient. No C5 regression across the pipeline stages.
blocker_in_discovery: true
blocker_type: scheme_certification_precondition
```
