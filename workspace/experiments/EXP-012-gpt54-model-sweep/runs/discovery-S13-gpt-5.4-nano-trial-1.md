## Discovery Pipeline Skill — Trans‑Tasman NZ→AU payments (Enterprise retail)

### 1) Summary of the proposed feature
- **Goal:** Enable enterprise retail customers (NZ) to send money to **any Australian bank account** quickly and cheaply.
- **Core mechanism:** Use a **proprietary internal routing channel** between:
  1) your NZ processing side, and  
  2) your Australian counterpart.
- **Settlement model (customer view):** Instruction processed in NZ and the **AU recipient is credited within ~2 hours**.
- **Back office settlement:** End-of-day net settlement between NZ and AU using the enterprise group treasury books.
- **Pricing:** **< $5** for payments **≤ $10,000**; **> $10,000** uses existing **SWIFT** flow (priced at current rates).
- **AML/CFT:** Extend existing SWIFT sanctions screening + RBNZ AML/CFT threshold reporting logic to the new channel.
- **Timeline:** ~6 months build, pilot small cohort, then full rollout.
- **Scope:** **NZ→AU only** initially.

---

### 2) Problem & customer need (what to validate)
- Current state: SWIFT takes **1–2 business days**, costs **NZD $18–25**.
- Customer pain: customers use Wise/others for family/business connections.
- Key discovery questions:
  - What is the **expected payment speed** customers truly value (2 hours vs same day)?
  - What fee level will drive switching vs “still not worth it”?
  - What are the **expectations around confirmation** (e.g., “sent”, “processing”, “credited”)?

---

### 3) Target users & eligibility (enterprise retail)
- Who qualifies as “enterprise retail” for pilot and rollout?
- Discovery questions:
  - Are there **account-level** criteria (e.g., existing treasury relationship, supported beneficiaries, supported currencies)?
  - How will you restrict to **payments up to $10k** (and what are the edge cases: FX rates, rounding, fees)?
  - Will eligibility depend on **beneficiary bank type** (e.g., AU NPP/clearing participation) or **recipient account verification**?

---

### 4) Functional requirements (minimum viable flow)
#### 4.1 Customer journey (NZ sender → AU recipient)
Likely steps:
1) Customer submits payment (amount, currency, beneficiary details).
2) System performs **sanctions screening** and AML/CFT checks.
3) Payment is accepted/rejected with appropriate messaging.
4) Routing over internal channel to AU counterpart.
5) AU counterpart credits recipient account.
6) Customer receives confirmation (timed to the “~2 hours” expectation).

Discovery questions:
- What **status milestones** are required to support “within 2 hours” reliably?
- What happens when the internal channel fails after acceptance (retry policy, fallback path)?
- Do you need **guaranteed credit** within 2 hours, or “best effort” with SLA language?

#### 4.2 Message/format & reconciliation
Discovery questions:
- What message schema will the internal channel use (and how it maps to:
  - SWIFT MT/MX equivalents,
  - internal booking,
  - settlement confirmations)?
- How will you reconcile:
  - accepted vs settled,
  - rejected vs returned,
  - timeouts/duplicate messages?
- What idempotency keys exist?

#### 4.3 Cutoffs and timelines
To hit a 2-hour experience, you must define:
- Payment acceptance window (24/7? business hours?)
- When processing begins relative to submission time
- Whether “2 hours” is measured from:
  - customer submit time,
  - bank receipt,
  - after compliance approval,
  - after beneficiary verification.

---

### 5) Payment routing & treasury settlement (operating model)
#### 5.1 Net settlement at end of day
Discovery questions:
- What are the **operational limits** for intra-group settlement?
- How are **net positions** calculated (per currency? per participant? per cut-off)?
- What controls ensure settlement completeness?

#### 5.2 Risk controls for the internal channel
Even with group treasury, you’ll want to discover:
- Does the AU counterpart provide:
  - settlement confirmation,
  - timelines for crediting accounts,
  - exposure limits.
- What happens if AU side can’t credit (account closed, invalid beneficiary, system outage)?
- Are there any “pre-funded vs post-funded” constraints on AU crediting?

---

### 6) AML/CFT, sanctions, and compliance scope (validation needed)
You stated: extend existing SWIFT screening + RBNZ AML/CFT threshold reporting logic.

Discovery questions:
- Ensure coverage across **all stages**:
  - beneficiary screening,
  - sender screening (where applicable),
  - payment purpose (if captured),
  - transaction monitoring / escalation.
- Are the **exact same logic engines** reused, or reimplemented for the new channel?
- What is the “point of truth” for:
  - whether screening has been performed,
  - audit trails and logs retention,
  - evidence needed for RBNZ / audits?
- Are there additional requirements due to:
  - recipient verification differences,
  - channel-specific fraud patterns,
  - velocity checks (many small payments).

Deliverables to request from Compliance:
- Screening policy mapping: SWIFT flow → internal routing flow.
- Audit log requirements and evidence pack.
- Threshold reporting trigger correctness for this channel.

---

### 7) Regulatory & notification workstream (plan + dependencies)
Discovery questions:
- What regulator(s) and what notification types are expected?
- Is this considered:
  - a new payment service,
  - a change in outsourcing/routing,
  - a change in settlement mechanism (netting arrangements)?
- Are there any constraints around:
  - holding out a “2-hour” service,
  - customer disclosure of availability and cut-offs,
  - dispute handling timeframe.

You said regulatory team will handle standard notifications; discovery should still ensure:
- you have a list of notification deliverables and dates
- dependencies: compliance, legal, operations, and outsourcing/third party terms.

---

### 8) Non-functional requirements (critical to “2 hours”)
- **Availability & performance:** Can you reliably process during peak times?
- **Monitoring:** End-to-end observability needed (message IDs, timestamps).
- **Latency sources:** compliance approval time, beneficiary verification, routing latency, AU crediting latency.
- **SLAs and error rates:** define acceptable reject/fail rates.

Discovery questions:
- What is your target:
  - p95 end-to-end time,
  - straight-through processing rate?
- What’s the operational fallback if internal channel is degraded?

---

### 9) Pricing & cost-to-serve model
To support **< $5 up to $10k**, you’ll want to validate:
- direct costs per payment:
  - internal channel costs (fees charged by AU counterpart if any),
  - operational labor,
  - infra + compliance compute,
  - customer support/disputes.
- pricing boundary behavior:
  - what currency is “$10,000” measured in?
  - what about FX conversions—does the cap apply before or after FX?
  - are fees included in the cap or charged on top?

Discovery questions:
- Are you charging **flat fee** or “base + markup”?
- What happens if the internal channel fails and you re-route to SWIFT:
  - do you still charge the under-$5 fee?
  - do you refund/credit?

---

### 10) Pilot design (small cohort) — key decisions
Discovery questions:
- Pick pilot success metrics:
  - speed (p95 time to credit),
  - cost (actual vs target),
  - straight-through processing rate,
  - reject/return rate,
  - customer satisfaction.
- Define pilot cohort:
  - which enterprise customers,
  - which beneficiary banks (or general “any AU bank account” subject to eligibility).
- Define pilot period and evaluation checkpoints.

---

### 11) Test strategy & operational readiness
Discovery questions:
- Integration testing with AU counterpart:
  - happy path, partial failures, duplicates, late confirmations
- Compliance testing:
  - sanctions edge cases, false positives, threshold reports, audit trails
- Operational playbooks:
  - incident management,
  - chargeback/dispute handling (if applicable),
  - customer communications templates.

---

### 12) Open items to resolve during discovery (priority list)
Here are the main “unknowns” to drive the next steps quickly:

1) **Channel specification** with AU counterpart  
   - message types, settlement confirmation, credit SLA, failure modes.
2) **Definition of “2 hours”** and measurable SLA (timestamps + cutoff assumptions).
3) **Cap logic** at $10k with FX and fee inclusion/exclusion rules.
4) **Fallback behavior** to SWIFT when internal channel fails post-acceptance.
5) **Idempotency/reconciliation** approach end-to-end.
6) **Compliance evidence mapping** (exact extension of screening + reporting to the new channel).
7) **Dispute/return workflow** alignment with how AU credits can be reversed or rejected.
8) **Regulatory notification checklist** and target dates.
9) **Cost model** to prove pricing feasibility under < $5.

---

### 13) Recommended discovery outputs (what you should produce next)
If you run the discovery pipeline, the most useful artifacts to generate are:

- **Process map**: customer journey + internal routing + treasury settlement + reconciliation
- **SLA definition**: “within 2 hours” with p95 and measurement points
- **Functional requirements list**: v1 (NZ→AU only)
- **Compliance control mapping**: SWIFT flow controls → internal channel controls
- **Operational playbooks**: happy path + failure/rollback path
- **Pilot plan**: cohort selection + success metrics + timeline gates

---

If you want, I can turn this into a structured discovery backlog (epics → user stories → acceptance criteria) and a RACI-style ownership map for NZ engineering, AU counterpart, compliance, ops, and regulatory.