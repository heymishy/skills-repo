

# Discovery Report: Real-Time AML Threshold Breach Alerting

## Problem Statement

Transaction threshold breaches (£10,000+ cash equivalents) are currently detected via a manual morning report, creating an 18+ hour detection gap. Two near-misses in 90 days have exposed the organisation to regulatory risk, with an FCA review in Q4 demanding demonstrable near-real-time monitoring.

---

## Context & Stakeholders

| Stakeholder | Role in this problem | Pain |
|---|---|---|
| Compliance Officers | Manually check morning report, triage breaches | Blind for 18+ hours; reactive not proactive |
| MLRO | Responsible for filing SARs to NCA | Exposure to personal regulatory liability when breaches sit undetected |
| Risk Team | Owns organisational risk posture | Cannot quantify or mitigate AML exposure in real time |
| Engineering / Platform | Owns transaction processing pipeline | No event-driven hooks exist today for compliance consumption |
| FCA (external) | Regulator | Expects near-real-time detection; reviewing in Q4 |

---

## Discovery Questions & Analysis

### 1. What exactly triggers a breach today?

**What I understood:** A single transaction ≥ £10,000 in "cash equivalents" hits a threshold.

**What needs clarification before build:**

- **Is this a single-transaction threshold only, or do we also need structuring detection?** Structuring (also called "smurfing") is where someone splits a £15,000 transfer into three £4,900 transactions to stay below the threshold. The FCA explicitly looks for this. If we build only single-transaction alerting, we may pass the letter of the Q4 review but fail the spirit of it, and we'll need to retrofit structuring detection later. **Recommendation:** Scope the MVP to single-transaction threshold breaches, but design the event architecture so that a sliding-window aggregation (per customer, per day) can be added in a fast follow. Flag this explicitly in the FCA review preparation as "Phase 2 — in progress."

- **What counts as "cash equivalents"?** This likely means cash deposits, cash withdrawals, money orders, prepaid instruments, and possibly crypto on/off-ramps depending on your product scope. The definition matters because it determines which transaction types the filter must match. **Action needed:** Get the MLRO to sign off on the exact list of qualifying instrument types before development starts.

- **Is £10,000 the only threshold?** Some internal policies or correspondent banking agreements have lower thresholds for high-risk jurisdictions or customer risk ratings. **Action needed:** Confirm whether the alert threshold is static (£10,000 for everyone) or dynamic (varies by customer risk tier). This significantly changes the data model.

### 2. Where do transactions live and how do they flow?

**What I need to understand:**

- **Is the transaction pipeline batch or streaming?** If transactions are written to a database and the morning report is a SQL query against that database, we're in a batch world and need to introduce a streaming tap. If there's already a message broker (Kafka, RabbitMQ, SQS, etc.) in the transaction processing pipeline, we can subscribe to it.

- **What's the latency profile of the current pipeline?** If a transaction is committed to the database within seconds of initiation, we can use Change Data Capture (CDC) as a pragmatic path to near-real-time without re-architecting the transaction pipeline. If there's already significant batch lag upstream (e.g., transactions land in a staging table via nightly ETL from a core banking system), then no amount of downstream alerting will solve the latency problem — the constraint is upstream.

**This is the single biggest architectural question.** The detection latency target (15 minutes) is generous enough that we likely don't need true streaming if we can poll or use CDC on a short interval, but we need to know what's possible given the source system.

**Action needed:** Engineering to map the transaction data flow from initiation to persistence, with latency at each stage.

### 3. Alert delivery: Slack + Email

**Reasonable for MVP, but several design considerations:**

- **Alert fatigue.** How many transactions per day currently breach £10,000? If it's 5, Slack + email is fine. If it's 500, the compliance team will mute the channel within a week and we're back to square one — except now we have "real-time alerting" on paper that nobody looks at. **Action needed:** Run a count of threshold breaches per day for the last 90 days. This determines whether we need batching, prioritisation, or a dedicated triage UI rather than just notifications.

- **Acknowledgement and audit trail.** The FCA doesn't just want detection — they want evidence that detected breaches were reviewed and dispositioned. Slack messages and emails don't inherently provide this. **Recommendation for MVP:** At minimum, require the compliance officer to react to the Slack message (e.g., ✅ reviewed, 🔴 escalated) and log that reaction with a timestamp to a persistent store. Better: a lightweight triage interface (even a simple form) that captures the disposition with the officer's identity and timestamp. This is likely the difference between "passing" and "impressing" at the FCA review.

- **Escalation path.** What happens if an alert isn't acknowledged within X minutes? The MLRO needs a backstop. **Recommendation:** Build a simple escalation rule — if no acknowledgement within 30 minutes, escalate to the MLRO directly.

### 4. What does "clears or escalates" mean operationally?

**This is where compliance process meets system design:**

- **Clears** = compliance officer reviews the transaction, determines it's legitimate, records rationale. What's "legitimate"? A known corporate customer making a routine large payment is different from a new retail customer depositing £10,500 in cash. The system should surface enough context (customer risk rating, transaction history, account age, source of funds if available) for the officer to make this call without having to open three other systems.

- **Escalates** = compliance officer flags for SAR consideration, which goes to the MLRO. Does escalation currently happen via email? A case management system? If there's an existing case management system, the alert should create a pre-populated case. If not, that's a gap that the FCA will likely probe.

**Action needed:** Map the current escalation workflow from detection → SAR filing. Identify whether a case management system exists and whether it has an API.

---

## Proposed MVP Scope

### In Scope

| Component | Detail |
|---|---|
| **Transaction event tap** | Subscribe to transaction events (via CDC, message broker, or short-interval polling — TBD based on architecture discovery) |
| **Threshold evaluation** | Filter for qualifying instrument types where amount ≥ £10,000. Single transactions only for MVP. |
| **Alert dispatch** | Send structured alert to dedicated Slack channel + email to on-duty compliance officer. Alert includes: transaction ID, amount, instrument type, customer ID, customer risk rating, timestamp. |
| **Acknowledgement capture** | Compliance officer acknowledges via Slack reaction or lightweight web form. Disposition (clear with rationale / escalate) logged with officer ID and timestamp. |
| **Escalation timeout** | If unacknowledged after 30 minutes, escalate to MLRO via Slack DM + email. |
| **Audit log** | All alerts, acknowledgements, escalations, and dispositions persisted to a queryable store for FCA evidence. |

### Out of Scope (Phase 2 candidates)

| Item | Why deferred | Risk of deferral |
|---|---|---|
| Structuring detection (sliding-window aggregation) | Adds significant complexity; requires customer-level aggregation across a time window | Medium — FCA may ask about it; mitigate by showing architecture supports it |
| Dynamic thresholds by customer risk tier | Requires clean customer risk data; adds config complexity | Low for Q4 if £10,000 is the regulatory bright line |
| Full case management integration | Depends on whether a system exists and has API access | Medium — manual bridge acceptable for MVP but not long-term |
| Sanctions / PEP screening integration | Different AML control; separate workstream | Low — orthogonal to threshold monitoring |

---

## Key Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Upstream transaction data has batch latency** (e.g., nightly ETL from core banking) | Medium | Critical — makes 15-minute target impossible regardless of what we build | Architecture discovery sprint first; if confirmed, escalate immediately as this requires upstream change |
| **High alert volume causes fatigue** | Medium | High — system exists on paper but is ignored in practice | Run historical volume analysis before build; design for filtering/prioritisation if volume > ~50/day |
| **No audit trail satisfies FCA** | Low (if we build ack/disposition logging) | High — FCA expects documented review of every alert | Build audit logging into MVP, not as afterthought |
| **Compliance team doesn't adopt** | Medium | High | Involve compliance officers in design; make triage faster than current morning report, not just faster-arriving |
| **Threshold logic is wrong** (missed instrument types, currency conversion edge cases) | Medium | High — false negatives mean undetected breaches | MLRO sign-off on instrument types; handle multi-currency with conservative conversion (alert if in doubt) |
| **Q4 timeline is tight** | Depends on architecture findings | High | Timebox architecture discovery to 1 week; make go/no-go decision on approach immediately after |

---

## Immediate Next Steps

| # | Action | Owner | Timebox |
|---|---|---|---|
| 1 | **Map transaction data flow** from initiation to persistence, with latency at each hop. Determine whether CDC, broker subscription, or polling is viable. | Engineering | 1 week |
| 2 | **Run historical volume analysis**: how many transactions/day breach £10,000? Break down by instrument type. | Data / Compliance | 3 days |
| 3 | **MLRO to define qualifying instrument types** and confirm whether £10,000 is the sole threshold or if risk-tier-based thresholds exist. | MLRO | 3 days |
| 4 | **Map current escalation workflow** from detection to SAR filing. Identify case management system and API availability. | Compliance + Engineering | 1 week |
| 5 | **Architecture decision** based on findings from #1: CDC vs. broker vs. polling. Document trade-offs and choose. | Engineering | End of week 2 |
| 6 | **Build MVP** per scope above. | Engineering | Weeks 3–6 (estimate; refine after #1 and #5) |
| 7 | **UAT with compliance officers** — not just functional testing, but workflow testing. Does this actually make their life better? | Compliance + Engineering | Week 7 |
| 8 | **FCA readiness pack**: document the monitoring capability, alert SLAs, audit trail, and Phase 2 roadmap. | MLRO + Risk | Week 8 |

---

## Open Questions for Next Conversation

1. **Does the transaction processing system already publish events to a broker?** This is the fork in the road for the entire technical approach.
2. **What's the daily volume of £10,000+ transactions?** This determines whether Slack alerts are viable or whether we need a triage dashboard.
3. **Is there an existing case management system for SAR workflows?** If yes, integration is MVP-adjacent. If no, we need to discuss whether a lightweight one is needed for FCA readiness.
4. **Multi-currency handling**: are thresholds evaluated in original currency or GBP equivalent? If GBP equivalent, what FX rate source and at what point in time?
5. **Who is the executive sponsor?** This needs visible senior backing given the regulatory deadline. If the project stalls in week 3 over an infrastructure dependency, who breaks the logjam?

---

**Bottom line:** The goal is achievable for Q4, but the entire approach hinges on what the transaction data architecture looks like. Step 1 — mapping the data flow — is the critical path. Everything else follows from that answer. I'd start there tomorrow.