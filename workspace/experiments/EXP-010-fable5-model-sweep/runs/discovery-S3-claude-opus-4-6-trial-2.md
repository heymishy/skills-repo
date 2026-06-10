

# Discovery Report: Real-Time Payments (RTP) Inbound Processing

## 1. Problem Statement

Payments NZ is launching a real-time payments scheme requiring 60-second end-to-end payment processing, 24/7/365. The enterprise must build the capability to receive inbound RTP payments, credit customer accounts in real time, and return scheme-mandated acknowledgements within a 10-second window. The current architecture is batch-oriented and cannot support these requirements without significant changes.

The go-live deadline is **2026-09-01**, with a penalty of **$50,000/day** for non-compliance and potential scheme suspension.

---

## 2. Current State

| Capability | Current State | RTP Requirement |
|---|---|---|
| **Payment rails** | Batch processing, same-day settlement | Real-time, 24/7/365, immediate fund availability |
| **Core banking** | Batch transaction processing windows | Real-time account crediting |
| **Fraud screening** | Batch job, no real-time API | Real-time screening on all inbound payments |
| **AML screening** | Real-time API exists, P99 latency 8s under load | Real-time screening on payments > $1,000 |
| **Message format** | Not stated (likely domestic legacy) | ISO 20022 |
| **Acknowledgement SLA** | N/A | 10 seconds from receipt |

---

## 3. Scope — What This Initiative Covers

### In Scope
- Integration with Payments NZ central infrastructure for **inbound** RTP message receipt
- ISO 20022 inbound payment message parsing and validation
- Scheme-mandated acknowledgement message generation and transmission within the 10-second window
- Real-time account crediting via a new thin processing layer
- End-of-day reconciliation between the real-time layer and the batch core banking system
- Real-time fraud screening for all inbound payments
- Real-time AML screening for inbound payments above $1,000
- 24/7/365 operational availability
- Scheme compliance for the receiving (inbound) participant role

### Out of Scope (Explicitly)
- Outbound (sending) RTP capability — to be delivered in a subsequent phase
- Replacement or re-architecture of the core banking batch system
- Other Payments NZ scheme roles beyond inbound receiving
- Customer-facing channels or UI changes (unless a dependency surfaces)

### Scope Boundary Requiring Confirmation
- Whether the "thin real-time processing layer" is a net-new build, a vendor product, or an extension of an existing component — this is architecturally significant and not yet decided
- Whether scheme rules require any real-time notification to the receiving customer (e.g., push notification) as a condition of participation, or whether that is a commercial decision

---

## 4. Key Risks and Unknowns

### RISK-1: Acknowledgement Timeout Budget Is Likely Unachievable Under Current Assumptions

**This is the most critical risk in this initiative.**

The scheme requires acknowledgement within **10 seconds** of message receipt. The known processing steps and their estimated durations:

| Step | Estimated Duration | Confidence |
|---|---|---|
| Message receipt and parsing | Unknown — not estimated | Low |
| Fraud screening (real-time, new) | 2–4 seconds (estimate) | Medium |
| AML screening (payments > $1,000) | Up to 8 seconds (P99 under load) | Medium — but not tested at RTP volumes |
| Account crediting (new real-time layer) | Unknown — not estimated | Low |
| Acknowledgement generation and transmission | Unknown — not estimated | Low |

**Analysis:** For payments over $1,000, fraud screening (2–4s) plus AML screening (up to 8s at P99) alone totals **10–12 seconds** — already at or exceeding the full 10-second window before accounting for any other processing. This is not a marginal risk; the arithmetic does not work under current system performance characteristics.

For payments under $1,000 (no AML), the budget is tighter but still unvalidated given that fraud screening estimates are unproven and remaining step durations are unknown.

**What needs to happen:** This must be resolved in architecture and design, not deferred. Options likely include parallelising fraud and AML checks, negotiating the timeout window with Payments NZ, accepting a degraded P99 target with scheme exception handling, or replacing/upgrading the AML system. Each of these has materially different cost and complexity implications.

---

### RISK-2: AML System Not Validated at RTP Volumes

The AML system's P99 latency of 8 seconds was measured under unspecified load conditions. RTP peak volume is estimated at **40,000 transactions per hour** (~11 TPS). The AML system has not been load-tested at this volume. The P99 could be significantly worse under sustained RTP peak load, or the system could fail entirely.

**What needs to happen:** Load testing of the AML system at RTP-representative volumes is a prerequisite for architecture decisions. If performance degrades under load, the timeout budget problem (RISK-1) becomes worse, and a different AML integration approach or system may be required.

---

### RISK-3: Fraud System Has No Real-Time Capability

The current fraud system is batch-only. The 2–4 second estimate for a real-time fraud check implies either a new real-time fraud system/service or a significant modification to the existing one. Neither option has been scoped, selected, or validated.

**What needs to happen:** A decision is needed on whether to extend the existing fraud system with a real-time API, procure a new real-time fraud engine, or adopt an alternative pattern (e.g., asynchronous fraud screening with post-credit clawback, if scheme rules permit). The scheme rules need to be examined to determine whether fraud screening must complete **before** the acknowledgement is sent, or whether a different sequencing is permissible.

---

### RISK-4: Core Banking Batch Architecture Creates Reconciliation Complexity

The real-time crediting layer will hold account state that diverges from the core banking system until end-of-day reconciliation. This creates risks around:
- **Double crediting or missed credits** if reconciliation fails
- **Balance accuracy** — which system is the source of truth for available balance during the day?
- **Failure recovery** — what happens if the real-time layer credits an account but the batch reconciliation rejects the transaction?

These are not just technical risks; they have regulatory and customer-impact dimensions.

**What needs to happen:** The reconciliation approach, source-of-truth model, and failure handling between the real-time layer and the batch core must be designed explicitly. This is a core architectural decision.

---

### RISK-5: 24/7/365 Operations Requirement vs Current Capability

The current batch processing model implies maintenance windows and operational rhythms that are incompatible with 24/7/365 availability. The real-time layer, its dependencies (fraud, AML, account lookup, scheme connectivity), and operational support all need to be continuously available.

**What needs to happen:** The operational model for 24/7 support, deployment without downtime, monitoring, alerting, and incident response needs to be scoped as part of this initiative — not treated as a follow-on.

---

### RISK-6: Deadline Penalty Creates Pressure to Cut Scope Unsafely

The $50,000/day penalty and suspension risk will create pressure to meet the 2026-09-01 date. If the risks above (particularly RISK-1 and RISK-2) surface late, there will be pressure to go live with known deficiencies in fraud/AML screening or with an unreliable acknowledgement path. This is a compliance and reputational risk.

**What needs to happen:** The project plan must include early go/no-go decision points tied to resolution of RISK-1 and RISK-2. If these are not resolved within a defined timeframe, escalation to executive level is needed to negotiate with Payments NZ or re-plan.

---

## 5. Assumptions to Validate

| ID | Assumption | Why It Matters | Validation Action |
|---|---|---|---|
| A1 | The 10-second acknowledgement window is measured from message receipt at our integration point, not from sender initiation | Changes the effective time budget significantly | Confirm with Payments NZ scheme documentation |
| A2 | Fraud screening must complete before acknowledgement is sent (i.e., cannot screen post-credit) | Determines whether fraud can be taken off the critical path | Review scheme rules; confirm with Payments NZ |
| A3 | AML screening must complete before acknowledgement/crediting for payments > $1,000 | Same as above — determines sequencing options | Review scheme rules and regulatory requirements |
| A4 | The 40,000 TPS peak estimate is based on credible volume modelling | Drives all capacity and performance planning | Confirm source and methodology of estimate |
| A5 | The core banking system can accept a reconciliation feed from an external real-time layer | Fundamental to the thin-layer architecture approach | Confirm with core banking team/vendor |
| A6 | ISO 20022 message schemas for the Payments NZ RTP scheme are finalised and available | Required for integration development | Confirm with Payments NZ |
| A7 | The scheme provides a test environment and certification process | Required for integration testing | Confirm with Payments NZ |

---

## 6. Questions That Need Answers Before Proceeding to Design

1. **What is the exact definition and measurement point of the 10-second acknowledgement window?** (Scheme documentation reference needed.)

2. **Do scheme rules permit any form of asynchronous or post-credit fraud/AML screening**, or must all screening complete before acknowledgement? This single answer changes the architecture fundamentally.

3. **What is the scheme's exception handling model?** If we cannot acknowledge within 10 seconds (e.g., AML timeout), what happens? Is the payment rejected? Queued? Is there a penalty per-transaction?

4. **What are the scheme's availability requirements?** What is the permitted downtime, if any? What are the consequences of an outage?

5. **Has the enterprise committed to a technology approach for the real-time processing layer?** (Build, buy, or extend?) If not, this is a key decision with long lead time.

6. **What is the real-time fraud screening approach?** New product procurement, extension of existing system, or third-party service? What is the lead time?

7. **Who owns the available balance during the day** — the real-time layer or the core banking system? What do other channels (branch, online, ATM) query?

8. **What other scheme participants are building, and is there an industry reference architecture or shared learning?** Other banks will face similar constraints.

---

## 7. Recommended Next Steps

| Priority | Action | Owner (to be assigned) | Purpose |
|---|---|---|---|
| **1 — Immediate** | Map the full processing chain with time estimates for every step and validate the 10-second budget arithmetic end-to-end | Architecture / Engineering | Confirm or refute whether the timeout is achievable; this gates all design |
| **2 — Immediate** | Review scheme rules to answer questions 1–4 above (acknowledgement definition, screening sequencing, exception handling, availability) | Programme Lead / Legal | These answers determine architectural options |
| **3 — Within 2 weeks** | Load-test the AML system at 40,000 txn/hour with realistic message payloads | Engineering / AML team | Validate or invalidate current AML system as viable for RTP |
| **4 — Within 2 weeks** | Assess real-time fraud screening options (build, buy, extend) with indicative timelines and costs | Architecture / Procurement | Longest lead-time dependency; must start early |
| **5 — Within 4 weeks** | Produce a candidate architecture for the real-time processing layer including reconciliation model | Architecture | Foundation for all subsequent design and build |
| **6 — Within 4 weeks** | Develop a project plan with go/no-go milestones tied to RISK-1 and RISK-2 resolution, working back from 2026-09-01 | Programme Lead | Ensure deadline risk is managed proactively |

---

## 8. Summary Assessment

The initiative is well-defined in terms of business objective and external constraint. The receiving-side scope is a sensible first phase. However, **the current information reveals a likely-critical feasibility problem**: the combined latency of fraud and AML screening appears to exceed the scheme's acknowledgement timeout window for transactions over $1,000. This is not a risk to monitor — it is a problem to solve before detailed design begins.

The deadline is hard and the penalty is material. The combination of a likely-infeasible timeout budget, an unvalidated AML system, a non-existent real-time fraud capability, and a batch core banking system means this initiative carries significant delivery risk. Early resolution of the timeout budget question and the screening sequencing rules will determine whether the current approach is viable or whether a fundamentally different architecture is needed.

**This discovery should proceed immediately to the actions in Section 7. The answers to those questions will determine whether the initiative can proceed on its current assumptions or needs to be re-framed.**