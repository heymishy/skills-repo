**Key Discovery Findings and Questions**

**1. Business Requirements Summary**
- **Scheme:** Payments NZ is introducing a mandatory real-time payments (RTP) infrastructure.
- **Obligation:** All scheme members must be able to receive (and later send) payments within 60 seconds, 24/7/365, with funds immediately available to the recipient.
- **Acknowledge SLA:** Required to send acknowledgment of receipt/processing within 10 seconds to the central infrastructure (after receipt of payment message).

---

**2. Current State**
- **Processing:** Core banking currently processes payments in batches (same day, not real time).
- **Fraud Detection:** Batch only, no real-time API. Real-time development would take 2–4 seconds per transaction.
- **AML:** Has a real-time API, P99 latency is 8 seconds; not yet load-tested for RTP volumes (~40,000 per hour at peak).

---

**3. Technical Gaps**
1. **Real-Time Payment Credit:** No existing infrastructure to credit customer accounts instantly—the core is batch-oriented.
2. **Fraud Screening:** Needs to be real time. Current batch system can't support, and estimated build would add significant latency.
3. **AML Screening:** Real-time API exists, but is slow (P99 = 8s); not validated at scale.
4. **ISO 20022 Message Processing:** No mention of current ISO 20022 compatibility (assumed to be new work).
5. **Immediate Acknowledgement:** Must respond to each payment in under 10 seconds, including all internal processing (fraud/AML/credit).
6. **Reconciliation:** Need a new EOD reconciliation process between the “real-time layer” and the batch core.

---

**4. Immediate Key Risks**
- **End-to-End Latency** (Fraud + AML + Other): Maximum combined processing time could approach or exceed the 10s window.
- **Fraud System:** No existing real-time capability. Even after build, 2–4s is a heavy budget out of the 10s SLA.
- **AML System:** High variability (up to 8s at P99) and not yet load-tested. Combined with fraud and other steps, risk of timeout is high especially at peak volume.
- **Volume:** System must support ~11 transactions/sec at peak; scalable, non-blocking architecture needed for all components.
- **Timeline/Non-compliance Penalty:** Go-live by 2026-09-01, with $50K/day penalty and possible scheme suspension if late.

---

**5. Open Questions and Actions**
- **Is real-time ISO 20022 message ingestion and parsing already in progress?** (Or does this need ground-up development?)
- **Fraud Screening:** Is there a vendor solution with real-time API that can be quickly piloted, or must this be developed internally? Could we deploy risk thresholds to auto-release lower-value payments while flagging only exceptions?
- **AML API scaling:** Can vendor/IT provide throughput/latency statistics at forecasted RTP load? Are there options for parallelization?
- **Account Crediting:** Does the “thin” real-time layer have internal design proposed (e.g., event-driven workflow, streaming architecture)? How will it interact with account records to ensure transactional integrity and reconciliation?
- **Acknowledge Strategy:** Will business/Security/Compliance accept a basic (“technical”) ACK prior to full fraud/AML checks, with reversal/investigation if needed, or must all controls execute before ACK?
- **Fallbacks:** What exception handling is allowed if (say) AML is offline but the 10s window elapses? Scheme rules for partial/fallback acknowledgments?
- **Customer Experience:** If a payment is delayed or reversed due to controls, what are the notification requirements? Any penalties or negative impact?

---

**6. Near-Term Recommended Actions**
- **End-to-End Latency Testing:** Simulate real-life transaction flows; measure real total time for “inbound payment receipt to acknowledgment” with both fraud and AML APIs in the path.
- **Scalability Assessment:** Conduct volume/load testing on AML service (>11 TPS sustained), and prototype fraud API to validate 2–4s claim.
- **Prioritise Real-Time Fraud System Build:** Decide buy vs. build; seek vendor solutions to shortcut development if possible.
- **Design Real-Time “Thin Layer”:** Define architecture for real-time account crediting, with robust reconciliation with main core.
- **Review Scheme Rules:** Confirm if “technical” vs. “business” ACK is acceptable, and if partial/conditional processing is allowed.
- **Stakeholder Discussion:** Regular project steering meetings; involve Compliance, IT Ops, Customer Impact.

---

**Discovery Summary Table**

| Requirement                      | Current State    | Gap/Action Needed                                          |
|-----------------------------------|-----------------|------------------------------------------------------------|
| Real-time inbound ISO 20022       | Not in place    | Develop ingestion and parsing                              |
| Real-time account credit          | Batch only      | Design/implement thin real-time layer                      |
| Real-time fraud screening         | Batch only      | Build or buy new API/system (2-4s latency)                 |
| Real-time AML screening >$1,000   | API exists      | Load and latency testing; possibly optimize API            |
| <10s end-to-end response          | Not guaranteed  | Validate with combined E2E latency, optimize all steps     |
| Scheme-compliant ACK              | To be defined   | Confirm minimum requirements / acceptability with rules    |
| High-volume scaling               | Untested        | Volume/load test entire pipeline                           |
| Reconciliation with core          | EOD batch       | Design new reconciliation process                          |
| Deadline: 2026-09-01              | -               | Build detailed project plan and track critical path        |

---

**Next Steps:**
1. **Document and validate all technical and compliance requirements with Payments NZ scheme authority.**
2. **Prepare initial technical architecture for real-time layer, factoring in fraud/AML integration.**
3. **Plan and launch parallel tracks: a) Real-time fraud API, b) AML API hardening, c) Thin layer POC d) End-to-end pipeline test harness.**
4. **Create detailed risk log with mitigation actions for latency/throughput, deadlines, and compliance.**

Would you like example solution architectures, a project timeline, or a breakdown of vendor options for fraud/AML APIs as your next deliverable?