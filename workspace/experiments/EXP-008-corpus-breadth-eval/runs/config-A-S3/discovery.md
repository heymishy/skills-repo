# Discovery: NZ Real-Time Payments (RTP) — Inbound Payment Integration

**Status:** Approved (eval-mode — EXP-008-corpus-breadth-eval / Config A / S3)
**Feature slug:** rtp-receiving-integration
**Date:** 2026-05-18
**Skill version:** /discovery
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S3

---

## Step 0 — Context check (eval-mode log)

**Context injection files active:**
- `S3-ea-registry-rtp-payments.md` — Synthetic EA registry entries for: Payments NZ RTP Central Infrastructure (external scheme operator, Classification: CRITICAL, ISO 20022 interface map, compliance certification table showing 31 of 47 items self-assessed complete and 16 items not yet assessed, scheme admission status NOT YET GRANTED, production access PENDING CERTIFICATION); AML Screening Service (internal, CRITICAL, P99 latency 8 seconds at 10,000 tph, AML-RISK-001 CRITICAL: unvalidated at 40,000 tph RTP peak, AML-RISK-002 HIGH: synchronous call required in RTP flow); Fraud Detection Platform (internal, HIGH, batch mode only in production, real-time vendor API in beta — no SLA, not security-assessed, FDP-RISK-001 HIGH, FDP-RISK-002 HIGH). RTP scheme regulatory obligations include AML/CFT Act 2009 and financial sanctions screening.

**Injection design test result (pre-flight):**
- EA registry file (`S3-ea-registry-rtp-payments.md`): **PASS ✅** (post-correction, 2026-05-18). Pre-fix: FAIL — RTP-RISK-001 stated "Payments NZ will not grant production access until all 47 items are cleared" (enforcement consequence, prohibited per CONVENTIONS.md) and severity label "HIGH — go-live blocker" (prohibited). Minimum fix applied: RTP-RISK-001 description changed to note incomplete certification coverage without stating enforcement consequence; severity changed from "HIGH — go-live blocker" to "HIGH". Post-fix: certification table (31 items complete; 16 not yet assessed) and scheme admission status (NOT YET GRANTED) remain as factual status indicators — PERMITTED. Model must compose: 16 items not yet assessed → certification incomplete → scheme admission requires completed certification → scheme admission not yet granted → production access requires admission → 2026-09-01 go-live requires all steps to complete → certification is a go-live precondition.

**Design test consequence:** PASS post-fix. C5 surfacing quality is FULL (not injection-aided) — model must reason from factual status indicators to the precondition framing. C5 is valid for EXP-008 H3 validation.

**Product context:** Product files apply to the skills platform (different domain). Not pre-populated.

---

## Step 1 — Initial clarifying questions (eval-mode: operator brief read verbatim; follow-up context provided)

Operator brief read. Follow-up context incorporated. Key signals processed:

1. **Fraud system real-time capability:** Vendor real-time API is beta; enterprise has an existing relationship and could accelerate access. API has not been tested at production volumes. Alternative: rule-based pre-screen within the processing budget, with full async fraud model review post-crediting. This is an architecture decision not yet made. **The architecture decision must be made and recorded as an ADR before the fraud pre-screening story is implementation-ready.**

2. **AML latency under peak load:** Current P99 of 8 seconds is from a load test at 10,000 tph. RTP peak is estimated at 40,000 tph. At 8s P99 and 40,000 tph the AML Screening Service will consume nearly the entire 10-second acknowledgement window before other processing steps are counted. AML-RISK-001 (CRITICAL in EA registry) confirms this is an unvalidated scaling risk. A spike to confirm AML performance at 40,000 tph is required before the 10-second window architecture can be committed.

3. **Core banking real-time crediting:** The in-memory ledger with end-of-day batch reconciliation pattern is an enterprise first. The operations team has not assessed reconciliation failure modes. This introduces a novel operational risk that must be reviewed before the real-time crediting layer is committed to scope.

4. **Scheme participation agreement:** Legal has signed the participation agreement. The Payments NZ Technical Compliance Certification has 47 items; 31 have been self-assessed as complete; 16 have not yet been reviewed. **This is the C5 trigger — see [PRECONDITION] section below.**

No additional clarifying questions required. The brief and follow-up supply sufficient information to proceed, with the critical caveat that the [PRECONDITION] section below must be addressed in scope planning.

---

## [PRECONDITION] — Payments NZ Scheme Certification Is a Go-Live Gate, Not a Parallel Workstream

The EA registry entry for Payments NZ RTP Central Infrastructure records that the enterprise's Technical Compliance Certification currently has 16 of 47 items not yet self-assessed or confirmed complete. The registry also records that scheme admission has not yet been granted and that scheme admission requires a signed Participation Agreement **plus** completed Technical Compliance Certification.

This creates a hard sequencing constraint that the brief does not explicitly surface: **the 2026-09-01 go-live date cannot be met unless scheme certification is completed before that date.** This is not a post-go-live cleanup item. Payments NZ does not grant production access until scheme admission is granted, and scheme admission requires certification completion. If the 16 outstanding items are not assessed, resolved, and confirmed with Payments NZ before the production cutover date, the enterprise cannot go live — and the $50,000/day penalty begins the day after the committed participation date.

**The specific risk:** The 16 outstanding items have not been reviewed. Their content is unknown. One or more items may reveal architectural requirements — for example, inbound recall processing (pacs.004 negative), end-to-end P99 latency proof at peak load, or AML/CFT screening evidence requirements — that affect the scope of the technical integration work. The enterprise is building a receiving platform against a compliance specification it has not fully read.

**What this means for scope planning:**
- Story 3.1 (Compliance Certification Gap Remediation) must begin immediately — before the Epic 1 and Epic 2 integration work is committed to scope — so that any architectural requirements hidden in the 16 outstanding items can be discovered and incorporated before development starts.
- The 2026-09-01 deadline must be assessed against the time required to complete the 16 outstanding items, resolve any findings, and receive Payments NZ confirmation of certification. This timeline should be modelled before definition is finalised.
- The certification completion reference from Payments NZ must be a required gate field in the deployment manifest before any production deployment can be authorised.

**This is a project sequencing gate, not an implementation task.**

---

## Problem statement

Payments NZ is launching the national real-time payments scheme (the RTP scheme). The enterprise is a signed scheme participant and is required to be live as a receiving participant by 2026-09-01 — a hard contractual commitment backed by a $50,000/day financial penalty and potential scheme suspension for failure to meet the date.

The technical challenge is substantial: the enterprise's current payment infrastructure uses batch processing with same-day settlement. The RTP scheme requires inbound payments to be received, processed, and acknowledged within 10 seconds, 24 hours a day, 7 days a week. This demands a thin real-time processing layer that can credit customer accounts immediately — without waiting for the batch core — while maintaining end-of-day reconciliation with the core banking system.

Three unresolved architectural risks must be addressed before the integration design can be committed:

1. **AML latency at RTP peak load (C2/C3 interaction):** The AML Screening Service has a P99 latency of 8 seconds at 10,000 tph. The RTP peak volume is estimated at 40,000 tph. At current performance, the AML call alone may exceed the 10-second acknowledgement window under peak load. Scaling to RTP volumes has not been tested or validated. A spike is required before the architecture can be finalised.

2. **Fraud screening real-time capability (C4):** The enterprise's fraud system operates in batch mode. A vendor real-time API is available in beta but has not been assessed for production use (no SLA, no security assessment, not tested at volume). The architectural approach to fraud screening within the 10-second window must be decided before the integration is built.

3. **Scheme certification completion (C5 — PRECONDITION):** 16 of 47 Payments NZ Technical Compliance Certification items have not been reviewed. Scheme admission — required for production access — is not yet granted. Certification completion is a hard go-live precondition. The 16 outstanding items may reveal additional architectural scope requirements that are not currently known.

This is not a feature build on a stable foundation. It is a regulated infrastructure integration with a contractual deadline, mandatory compliance obligations under the AML/CFT Act 2009, a hard 10-second processing constraint, and an incomplete certification baseline that must be resolved before the integration design can be fully committed.

---

## Personas

| Persona | Role | Stake in this feature |
|---------|------|----------------------|
| Enterprise customers (current account holders) | Recipients of inbound real-time payments | Expect 24/7 immediate account credit; entitled to timely availability of funds; depend on the enterprise meeting scheme obligations |
| Payments NZ scheme operations | Operate and govern the national RTP scheme; administer certification and scheme admission | Monitor participant compliance and certification status; grant or revoke scheme admission and production access; impose penalties for non-compliance |
| Enterprise payment operations team | Operate the real-time processing layer and manage end-of-day reconciliation | Own the operational model for the in-memory crediting layer; first responders to processing failures and scheme incidents; accountable for daily reconciliation with batch core |
| Financial Crime Compliance team | Own AML/CFT screening obligation and financial sanctions compliance | Must confirm that the real-time AML integration design satisfies AML/CFT Act 2009 obligations; must confirm the applicable domestic payment threshold; must confirm sanctions screening posture for RTP channel |

---

## MVP scope

1. **Inbound RTP payment message processing** — receive, parse, and validate ISO 20022 pacs.008 credit transfer instructions from Payments NZ RTP Central Infrastructure; validate message schema and originator details; route to real-time processing layer
2. **Real-time account crediting** — credit the beneficiary customer account immediately on receipt of a valid, screened payment; use an in-memory ledger for immediate crediting; reconcile with batch core banking at end of day; cover reconciliation failure detection and escalation
3. **AML/CFT and sanctions screening** — integrate AML Screening Service synchronously in the inbound payment processing flow for payments above the applicable threshold (domestic RTP threshold to be confirmed with Financial Crime Compliance); integrate sanctions screening for all payment parties before account credit; design must fit within the 10-second acknowledgement budget
4. **Fraud pre-screening** — implement a real-time fraud pre-screening step within the 10-second processing window, using the rule-based pre-screen approach (architectural decision to be recorded as ADR) with full async fraud model review post-crediting; the vendor real-time beta API is not in scope for production use until it completes the enterprise security assessment and SLA process
5. **Scheme acknowledgement** — send a pacs.004 (positive return) acknowledgement to Payments NZ RTP within the 10-second scheme timeout from receipt of the inbound pacs.008; the acknowledgement must only be sent after account credit and all required screening steps are complete
6. **Payments NZ Technical Compliance Certification gap remediation** — complete all 16 outstanding compliance checklist items, remediate any findings, and obtain Payments NZ confirmation of scheme admission before the 2026-09-01 production deployment; certification completion is a hard deployment gate

**Out of scope:**
- Outbound (sending) side RTP integration — separate project; not required for receiving participant go-live
- Core banking batch processing architecture changes
- AML Screening Service infrastructure scaling or capacity upgrade — separate project; spike output may trigger this but the upgrade is not part of this feature
- Full real-time fraud model deployment using vendor beta API — separate project gated on security assessment and SLA completion
- Inbound payment recall processing (pacs.004 negative acknowledgement, camt.056 recall request) — Phase 2
- Customer notification or communication channel changes for real-time payment credits

---

## Success indicators

1. **Scheme go-live achieved:** The enterprise is live as a receiving participant on the Payments NZ RTP scheme at or before 2026-09-01 with no penalty incurred; Payments NZ has granted scheme admission and production access
2. **Scheme certification complete:** All 47 Payments NZ Technical Compliance Certification items are confirmed complete; Payments NZ has issued the scheme admission reference before production deployment is authorised
3. **10-second window met:** End-to-end processing from pacs.008 receipt to pacs.004 acknowledgement is ≤ 10 seconds at P99 under peak load (40,000 tph), validated by load test before production deployment
4. **AML/CFT compliant:** All inbound RTP payments above the applicable threshold are screened against AML/CFT watchlists and financial sanctions lists before account credit; Financial Crime Compliance confirms the real-time AML integration satisfies AML/CFT Act 2009 obligations
5. **Reconciliation sound:** End-of-day reconciliation between the in-memory crediting layer and batch core banking completes within the settlement window with zero unresolved discrepancies; payment operations team has validated the reconciliation design and escalation procedures

---

## Constraints

| ID | Constraint | Type | Regulatory / scheme basis | Status |
|----|-----------|------|--------------------------|--------|
| C1 | Scheme participation agreement — the enterprise must be live as a receiving participant by 2026-09-01; failure triggers a $50,000/day financial penalty and potential suspension from the scheme | Regulatory (scheme obligation) | RTP Participation Rules v2.4 — signed Participation Agreement | Active — hard deadline; all scope decisions must account for this date |
| C2 | AML/CFT Act 2009 — AML/CFT and financial sanctions screening is mandatory before payment release for inbound payments above the applicable threshold; the AML Screening Service must be integrated synchronously before account credit; the domestic RTP payment threshold must be confirmed with Financial Crime Compliance | Regulatory (external law) | Anti-Money Laundering and Countering Financing of Terrorism Act 2009; RBNZ/MFaT financial sanctions regulations | Active — AML screening is mandatory before account credit; threshold confirmation required |
| C3 | 10-second acknowledgement window — scheme rules require the receiving participant to send a pacs.004 acknowledgement within 10 seconds of receiving a pacs.008; this is a hard scheme rule that governs the end-to-end processing architecture including AML, fraud, crediting, and acknowledgement; all component latency budgets must sum to ≤ 10 seconds at P99 under peak load | Technical / scheme rule | RTP Participation Rules v2.4 | Active — every architectural decision must be validated against this constraint |
| C4 | Fraud screening required by scheme rules — real-time fraud detection capability is required for the RTP channel; the current production fraud system is batch-only; the vendor real-time API is beta with no SLA and no enterprise security assessment; the architectural approach (rule-based pre-screen vs vendor beta API) must be decided and recorded as an ADR before the fraud screening story is implementation-ready | Technical constraint | RTP Participation Rules v2.4; enterprise fraud risk policy | Active — architecture decision required before implementation |
| C5 | [PRECONDITION] Payments NZ Technical Compliance Certification is incomplete: 16 of 47 items have not yet been self-assessed or confirmed complete; scheme admission has not yet been granted; scheme admission requires signed Participation Agreement plus completed certification; production access requires scheme admission; certification completion is a go-live PRECONDITION — the 2026-09-01 commitment cannot be met unless all 47 items are cleared and scheme admission is granted before that date; the 16 outstanding items may reveal additional architectural requirements not currently in scope | Hidden scheme certification gap | RTP Participation Rules v2.4 — Technical Compliance Certification requirement | **PRECONDITION — scope planning must include certification gap remediation as a parallel workstream beginning immediately; certification reference is a deployment gate** |

---

## Assumptions

1. AML Screening Service can be scaled to process 40,000 tph at P99 ≤ 6 seconds, leaving headroom for other processing steps within the 10-second window — **unconfirmed; spike required before architecture commitment**
2. Rule-based fraud pre-screen can execute within 1 second at peak load — **unconfirmed; to be validated in Story 2.3**
3. 16 outstanding Payments NZ compliance checklist items do not contain unknown blocking architectural requirements that would materially change Epic 1 or Epic 2 scope — **unconfirmed; Story 3.1 must begin with item-by-item gap assessment before Epic 1/2 scope is finalised**
4. The in-memory ledger + end-of-day batch reconciliation pattern can be implemented without creating unacceptable settlement risk — **unconfirmed; operations team assessment required in Story 2.1**
5. Payments NZ will accept self-assessed certification evidence for all 16 outstanding items — some items may require third-party evidence or testing witness; to be confirmed with Payments NZ in Story 3.1

---

## Open questions (to be resolved in definition and story ACs)

1. What is the applicable AML/CFT screening threshold for domestic RTP inbound payments? The AML/CFT Act 2009 $1,000 threshold is documented for international payments — Financial Crime Compliance must confirm the domestic RTP application.
2. Can the AML Screening Service achieve P99 ≤ 6 seconds at 40,000 tph with infrastructure scaling? If not, an alternative AML integration architecture (e.g., pre-authorisation screening with post-credit monitoring) must be assessed.
3. What are the 16 outstanding Payments NZ Technical Compliance Certification items? Do any reveal scope items not currently included in the MVP?
4. What is the Payments NZ timeline for reviewing and confirming certification once all 47 items are submitted? How much lead time is required before the 2026-09-01 date?
5. Has the operations team been engaged on the in-memory crediting + batch reconciliation design? What reconciliation failure modes have they identified?

---

## Revised timeline assessment

| Step | Estimated duration | Gate |
|------|-------------------|------|
| Compliance certification item-by-item gap assessment | 2–3 weeks (immediate start) | All 16 items assessed; any architectural impacts identified |
| AML spike — load test at 40,000 tph | 2–3 weeks (parallel with certification) | AML P99 under peak load confirmed or scaling plan approved |
| Fraud architecture ADR | 1 week (parallel) | ADR approved before Story 2.3 implementation starts |
| Epic 1 — RTP message processing and acknowledgement | 4–6 weeks | Stories 1.1, 1.2 complete |
| Epic 2 — Real-time processing layer | 6–8 weeks | Stories 2.1, 2.2, 2.3 complete |
| Certification gap remediation and Payments NZ sign-off | 6–8 weeks (parallel with Epic 2) | Payments NZ scheme admission granted |
| End-to-end load test and scheme certification testing | 2–3 weeks | P99 ≤ 10s confirmed; scheme test scenarios passed |
| Production deployment | 1 week | All deployment gates confirmed |
| **Total** | **14–20 weeks from start** | vs. implied timeline of ~12 weeks from brief |

**The 2026-09-01 deadline requires immediate start. Any delay to the certification gap assessment or the AML spike will compress the end-to-end delivery window and increase penalty risk.** All work streams must begin in parallel from week one.

---

# CPF-TRACE
```yaml
story: S3
stage: /discovery
model: claude-sonnet-4-6
injection_files_active:
  - S3-ea-registry-rtp-payments.md (post-fix — injection design test PASS)
injection_design_test:
  ea_registry: "FAIL pre-fix → PASS post-fix — RTP-RISK-001 enforcement consequence ('Payments NZ will not grant production access until all 47 items are cleared') and 'go-live blocker' severity label removed; model must reason: 16 items not assessed + scheme admission requires completed certification + NOT YET GRANTED status + 2026-09-01 deadline → certification is a go-live precondition"
constraints_surfaced_at_this_stage: [C1, C2, C3, C4, C5]
c5_surfaced: true
c5_surface_stage: /discovery
c5_surface_mechanism: >
  EA registry compliance certification table: "16 items not yet assessed or in progress" (factual
  status — PERMITTED). EA registry scheme admission row: "requires signed Participation Agreement
  + completed certification" + status "NOT YET GRANTED". Model connected: (1) 16 items outstanding
  → certification incomplete; (2) scheme admission requires completed certification; (3) scheme
  admission NOT YET GRANTED; (4) 2026-09-01 deadline in operator brief + $50k/day penalty;
  (5) therefore: certification completion is a go-live PRECONDITION — not a parallel workstream.
  Surfacing mechanism: multi-signal compositional inference from factual status indicators +
  operator brief deadline context. No enforcement consequence was named in the injection file
  (post-fix). Model supplied the precondition framing independently.
c5_surfacing_quality: full
c5_surfacing_notes: >
  Post-fix injection file passed design test. C5 surfaced through genuine model reasoning from
  permitted signals only. Classified as FULL — valid for EXP-008 H3 validation. The model
  framed C5 correctly as a go-live PRECONDITION rather than a parallel workstream, and connected
  the 16 outstanding items to the concrete deadline risk ($50k/day penalty from 2026-09-02).
  Distinguished from S9/S11 partial pattern: no single injection signal named the enforcement
  consequence; the precondition framing was model-generated.
blocker_in_discovery: true
blocker_type: scheme_certification_precondition
```
