# Corpus Case T2 — AML Transaction Monitoring (C2 + C3 competing)

**Case ID:** T2-competing-regulated
**Experiment:** EXP-005-definition-rubric
**C2 present:** Yes — AML Compliance Officer sign-off under FMA Model Risk Policy (process gate)
**C3 present:** Yes — AML/CFT Act 5-year retention obligation (technical/retention rule)
**Expected D1:** 1.0 (both constraints identified; neither eclipses the other)
**Expected D2:** 1.0 (C2 and C3 each propagated to distinct ACs in separate triggering stories)
**Expected CPF C2:** 1.0
**Pass condition:** C2 (compliance sign-off gate) and C3 (retention rule) appear in separate story ACs without either being merged into the other or dropped; C2 AC names FMA Model Risk Policy, AML Compliance Officer / FMA-registered assessor, and validation-completed-before-activation as the gate condition
**Fail condition:** C3 (retention) propagated to an AC but C2 (sign-off gate) absent or paraphrased into a vague "regulatory approval required" note without naming the FMA obligation or approval authority — the classic failure mode this case is designed to expose

---

## Bundle — paste this into the /definition session

```
Discovery artefact: AML Transaction Monitoring Module
Status: Approved
Approved By: Sarah Chen (Chief Compliance Officer), Raj Patel (CTO)
Date: 2026-04-05

PROBLEM
The bank's current transaction monitoring process is manual: compliance analysts review daily batch reports from a third-party screening vendor. A 2025 internal audit found that 340 suspicious transactions went unscreened for 18+ hours due to batch timing. The FMA has indicated in writing that real-time screening is now an expectation for institutions of this tier. The current process exposes the bank to enforcement risk under the AML/CFT Act 2009 s.30 (reporting obligation) and to reputational risk from delayed detection.

PERSONAS
- AML Compliance Analyst: Reviews screening alerts; currently processes 18-hour-old data; cannot file SARs within required windows during busy periods.
- Chief Compliance Officer: Accountable to FMA for monitoring adequacy; cannot currently evidence real-time screening capability to regulators.
- Payments Operations Engineer: Feeds transaction data to screening vendor; has no visibility into screening results or alert queue status.

MVP SCOPE
1. Real-time transaction event stream into screening engine (< 60 seconds from transaction to screening decision)
2. Configurable rule set for AML/CFT pattern detection (velocity, structuring, counterparty watchlist matching)
3. Alert queue for compliance analyst review with SAR-filing workflow linkage
4. Full audit trail for every screening decision (rule version applied, inputs, output, timestamp, analyst action)

OUT OF SCOPE
- SAR filing automation — compliance team owns the filing process; automated filing is a separate workstream requiring its own regulatory engagement
- Upstream payment origination changes — read-only view of transaction events; no origination path modification in this phase
- Watchlist management UI — initial deployment uses static watchlist loaded via admin process; UI is post-MVP
- Historical re-screening of past transactions — post-MVP; separate data project

ASSUMPTIONS
- Transaction event volume at sustained peak: 2,000 TPS — screening engine must handle this without alert backlog accumulation; not yet load tested
- FMA model risk validation timeline: vendor engagement for independent validation not yet scheduled; estimated 3–5 months from contract to sign-off
- Screening rule library from third-party vendor can be exported and imported into the new engine — vendor contract allows extraction; not yet tested against full rule set

CONSTRAINTS
1. AML Compliance Officer sign-off required under FMA Model Risk Policy before activation of automated screening rules — the model must pass independent validation by an FMA-registered assessor before any live transaction screening occurs.
2. All transaction records and all screening decisions must be retained at a geographically separate location for a minimum of 5 years per AML/CFT Act s.24(1).
3. Screening engine must process each transaction within 60 seconds of event receipt at sustained peak load (2,000 TPS).

SUCCESS INDICATORS
- Screening latency p99 < 60 seconds from event receipt (from 18+ hours baseline) within 30 days of go-live
- Zero transactions missed by screening engine in any 24-hour production window
- FMA model risk sign-off obtained within 6 months of build completion

---

Benefit metric artefact: AML Transaction Monitoring — Regulatory Compliance Readiness
Status: Active

Metric M1: Screening latency
Target: p99 < 60 seconds from event receipt (from 18+ hours baseline)
Measurement: Monitoring dashboard; sampled weekly in first 60 days post-go-live

Metric M2: Regulatory sign-off
Target: FMA model risk sign-off obtained (binary milestone)
Measurement: Receipt of sign-off document from FMA-registered assessor
```

---

## What to look for in the output

**Pass signals (both constraints must be present):**
- Step 4a triggered: model lists both "AML Compliance Officer sign-off (FMA Model Risk Policy)" and "5-year retention at geographically separate location (AML/CFT Act s.24)" as regulated constraints
- C2 propagated: At least one story contains an AC such as:
  - Given the screening engine rule set has been deployed to staging, When activation is requested, Then the AML Compliance Officer and an FMA-registered assessor must confirm independent model validation is complete before automated screening rules are activated in production
  - AC names: FMA Model Risk Policy (obligation), AML Compliance Officer / FMA-registered assessor (approving body), validation-completed-before-activation (gate condition)
- C3 propagated: A separate story (likely a data persistence or replication story) contains an AC such as:
  - Given a transaction screening decision is recorded, When the record is written, Then it must be replicated to a geographically separate location and retained for a minimum of 5 years per AML/CFT Act s.24(1)
- C2 and C3 are in different stories — they address different concerns and must not be merged

**Fail signals:**
- C3 (retention) appears in a story AC but C2 (sign-off gate) is absent from all story ACs
- C2 present only as an Architecture Constraint note without an enumerated AC (D2 = 0.7 at best)
- C2 and C3 merged into a single vague AC ("must satisfy all AML/CFT obligations before go-live") — specificity failure (D3 = 0.4)
- Model produces only technical ACs (streaming, rule engine, alert queue) with no compliance gate or retention ACs
