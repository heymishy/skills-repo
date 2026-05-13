# S1 — Pipeline Eval Corpus Story

**File type:** Controlled input brief — NOT a produced artefact
**Experiment:** EXP-003-pipeline-eval
**Purpose:** This is the brief that gets sent to `/discovery` for each Config A/B/C run. It is a synthetic story specifically designed for unambiguous constraint propagation fidelity (CPF) measurement. All constraints are explicit and numbered so propagation can be tracked precisely.

---

## Operator input — paste verbatim to start each Config run

```
/discovery — Our payment operations team runs a real-time card payment authorisation service. We process approximately 180,000 transactions per day for retail and business customers. The service is hosted on-premises in a single data centre in Auckland. We have no automated failover to a secondary site — if the primary data centre has an outage, payments stop.

Over the past 12 months we have had three outages totalling 4.2 hours of downtime. Each hour of downtime costs approximately $340,000 in failed transactions and $80,000 in call centre volume. Our disaster recovery policy (approved by the Board Risk Committee) requires that critical payment systems achieve Recovery Time Objective (RTO) of 2 hours and Recovery Point Objective (RPO) of 15 minutes.

We are not currently meeting our own Board-approved RTO/RPO targets.

The payment card data we process is in scope for PCI DSS (Payment Card Industry Data Security Standard). Our annual QSA (Qualified Security Assessor) audit is in Q3. Any architectural changes to the payment authorisation service must be assessed by our QSA before go-live.

We also have an obligation under the Anti-Money Laundering and Countering Financing of Terrorism Act to retain transaction records for 5 years. Our current disaster recovery plan does not explicitly address whether transaction records in the secondary site replicate within the statutory 5-year retention window — this has been noted as a gap in our last internal audit.

The operations team has asked for a secondary site failover capability so that when the primary Auckland data centre is unavailable, payments can continue processing from a secondary site within our 2-hour RTO.
```

---

## Constraint inventory (for CPF measurement)

The following constraints are embedded in the brief. This list is used by the evaluator to check propagation — it is NOT shown to the model.

| ID | Constraint | Type | Section expected to appear in |
|----|-----------|------|------------------------------|
| C1 | RTO ≤ 2 hours, RPO ≤ 15 minutes (Board-approved disaster recovery policy) | Technical / regulatory (internal policy) | Constraints + DoR contract + test plan NFR |
| C2 | PCI DSS compliance — any architectural change requires QSA assessment before go-live | Regulatory (payment card standard) | Constraints + DoR contract + test plan NFR |
| C3 | AML/CFT Act transaction record retention — 5 years, must replicate to secondary site | Regulatory (anti-money laundering) | Constraints + DoR contract + test plan NFR |
| C4 | Single data centre (Auckland) — no existing secondary site infrastructure | Technical constraint | Constraints or Assumptions |
| C5 | [Hidden] — current AML gap: replication to secondary site within statutory retention window is unverified | Hidden constraint (noted as internal audit gap in brief — easy to miss) | Should surface as Assumption or Constraint |

**C2 and C3 are regulated constraints** — CPF threshold for these is 0.80 (failure), not 0.60.

**C5 is the hidden constraint element** (analogous to T5 in the discovery corpus). A model that produces the discovery artefact without surfacing C5 as an explicit assumption or constraint has missed the hidden element. This is not a categorical fail — but it is a D5 finding.

---

## Expected artefact characteristics (for judge scoring)

A high-quality discovery artefact from this input should:

1. **Problem statement** — frame the problem as a resilience and compliance gap, NOT as "we need to build a secondary site". The problem is the RTO/RPO breach and the unaddressed AML audit gap, not the solution.
2. **Personas** — payment operations engineers (own the RTO/RPO), security/compliance team (QSA relationship, AML obligation), and the Board Risk Committee (approved the DR policy and is currently receiving evidence of non-compliance).
3. **MVP scope** — bounded to: automated failover trigger + secondary site active-passive replication + QSA assessment scope. NOT: active-active multi-region, fraud screening changes, merchant notification changes.
4. **Constraints** — C1 through C4 all named. C5 surfaced as an assumption (the model cannot verify the AML replication gap from the brief — it should flag it as requiring investigation).
5. **Assumptions** — at minimum: C5 (AML replication gap status), "secondary site infrastructure can be provisioned within the project timeline", "QSA engagement can be scheduled before Q3 audit".
6. **Success indicators** — baseline + target anchored to RTO/RPO: "current RTO: unknown (last incident: 4.2 hours total across 3 events) → target: demonstrated recovery in ≤ 2 hours on 2 of 2 failover tests before Q3 QSA audit".

---

## Follow-up context (if model asks clarifying questions)

If the model asks clarifying questions before writing the artefact, provide these answers:

> **Secondary site availability:** We have a co-location facility in Hamilton that we use for backup storage. It has available rack space and a direct fibre connection to Auckland. It is not currently configured for active workload processing.
> 
> **QSA relationship:** We have an ongoing relationship with our QSA firm — they assessed us 10 months ago. Preliminary scoping conversations can happen within 2 weeks.
>
> **AML gap status:** The internal audit gap has been logged but not remediated. We don't know whether the current batch replication process to the Hamilton site captures all transaction records within the 5-year retention window — it has not been verified.
>
> **Transaction volume at secondary:** In a failover scenario, we expect to process 100% of transaction volume at the secondary site. We cannot partially route.

---

## CPF measurement notes for evaluator

When measuring CPF across Config A/B/C runs:

- C1 (RTO/RPO) is the most visible constraint — expect all configs to propagate it
- C2 (PCI DSS QSA) is explicit in the brief — any model should capture it; the propagation test is whether it appears in the DoR contract
- C3 (AML 5-year retention) is partially buried under the "noted as a gap" framing — lower-tier models may mention the 5-year retention but miss the secondary-site replication requirement
- C4 (single data centre) may be captured as a technical constraint OR as background context — only count as propagated if it appears explicitly as a constraint or scoping item
- C5 (AML replication gap unverified) — this is the hidden element. Count as propagated ONLY if it appears as an explicit assumption or investigation item in the DoR contract or test plan. Mentioning it in the problem narrative does not count.
