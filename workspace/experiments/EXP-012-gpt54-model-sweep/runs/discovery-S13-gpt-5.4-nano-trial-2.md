Got it. Below is how I’d approach the **/discovery** for this trans-Tasman payments feature, capturing the key decisions, open questions, dependencies, risks, and what we need to validate before design/build.

---

## 1) Problem & opportunity framing (what we must prove)
**Customer pain**
- Current SWIFT: **1–2 business days**, **$18–25** fee.
- Competitors (Wise/others) offer **faster + cheaper** transfers.

**Business impact to confirm**
- Claimed leakage: **NZD 4.2M annual revenue**.
- Need validation: current volumes + conversion rates you can realistically win with pricing.

**Core value proposition (target)**
- Settlement visibility: **within ~2 hours** for NZ → AU, up to **$10k**
- Pricing: **< $5** per transaction up to $10k
- > $10k uses **existing SWIFT** pricing/logic

**/discovery output to define**
- Target customer segments (enterprise retail customers = which legal entities / cohorts?)
- Expected adoption rate, take-up in pilot, and revenue impact.

---

## 2) Proposed mechanism (current-state vs future-state)
### Target state (high-level)
1. Customer submits payment (NZ → AU bank account).
2. NZ end processes instruction.
3. Settlement via proprietary internal routing channel (enterprise ��� Australian counterpart):
   - Australian counterpart credits recipient on AU end.
   - Group treasury books: net positions between counterparts settled **EOD**.
4. Customer sees funds arrival in **~2 hours**.

### Key build assumptions to validate
- How exactly does “credit recipient account” happen:
  - Is it via the AU entity’s normal clearing paths (e.g., direct credit/BPAY/clearing participant settlement) or an internal crediting mechanism mapped to actual bank settlement?
- What guarantees the “within 2 hours” SLA:
  - Instruction cut-off times
  - Availability of rails and failure handling
  - Hours of operation (including weekends/holidays)

---

## 3) Scope boundaries (what’s included/excluded)
### In scope (Phase 1)
- **NZ → AU only**
- Payments **up to $10,000**
- Uses internal proprietary routing channel
- AML/CFT screening and RBNZ threshold reporting extended from SWIFT flow
- Pilot with small customer cohort, then rollout after ~6 months

### Out of scope (initially)
- **AU → NZ** (future phase)
- **> $10,000** (SWIFT fallback)
- Changes to customer support/operations beyond what’s required for pilot

---

## 4) Functional requirements to elicit
### Customer journey
- Payment entry and validation (recipient bank account format, BSB/account validation, name/beneficiary formatting)
- FX handling:
  - Is payment priced/converted in NZD or AUD?
  - Does the customer see exchange rate upfront?
- Fee and disclosure:
  - Show “< $5” fee under $10k
  - SWIFT fee schedule for > $10k
- Status & exceptions:
  - “Processing”, “Completed/Settled”, and failure reasons
  - Reconciliation/receipt of payment proof

### Business rules
- Enforcement of **$10k threshold**:
  - If customer enters >$10k: route to SWIFT seamlessly
  - If partial amounts: clarify whether split payments are allowed or disallowed
- Cut-off times and SLA expectations:
  - Define “within 2 hours” precisely: after submission? after approval? business hours only?

### Operational requirements
- Monitoring dashboards:
  - queue depth, time-to-credit, reject rates, settlement failure rates
- Reconciliation:
  - Customer ledger vs routing messages vs treasury net settlements
- Chargebacks/returns:
  - If recipient account rejects or can’t be credited: what is the policy and how quickly?

---

## 5) AML/CFT, sanctions & screening (must align with the rail)
You state existing SWIFT flow includes:
- sanctions screening
- RBNZ AML/CFT threshold reporting
- you plan to extend same logic to the new channel

**/discovery validation checklist**
- Does screening need to occur:
  - at payment initiation (NZ) or at instruction acceptance?
  - on payer, beneficiary, and any intermediaries (even if “proprietary channel” reduces intermediary involvement)?
- Are beneficiary details sufficient for effective sanctions screening for AU counterparts?
- Threshold reporting:
  - confirm if reporting triggers are based on payment amount, transaction frequency, or relationship risk
- Audit trail requirements:
  - store evidence that screening was performed (timestamps, result, rule id/version)

**Risk to address**
- “Same logic” assumption often fails because:
  - different payment message types/fields lead to poorer screening coverage
  - different parties get involved (or not) on the proprietary path

---

## 6) Regulatory & licensing notifications (what we should not assume)
You expect standard regulatory notifications.

**/discovery should capture**
- Whether this internal routing changes:
  - payment service scope
  - settlement agent/authorised entity status
  - cross-border money transfer obligations
- Any AU-side regulatory implications (even for NZ→AU only)
- Whether the channel impacts disclosure obligations to customers
- Data reporting requirements (e.g., suspicious activity reporting timing)

**Deliverable**
- A regulatory workplan with lead owners and dependency dates.

---

## 7) Settlement, treasury, and controls (core system design risks)
### Treasury settlement logic
- Net positions between NZ entity and AU counterpart settled at EOD in treasury books.

**Key controls to define**
- What happens if one side fails mid-day:
  - AU credited vs not credited
  - reversal process and timelines
- Ensuring irrevocability:
  - Is customer “Completed” tied to actual credit confirmation, or just accepted into routing queue?
- Exposure limits:
  - caps on end-of-day net settlement amount (and intraday if relevant)
- Liquidity/settlement funding:
  - does the AU entity pre-fund? or does it rely on crediting then settlement netting?

### Accounting integration
- GL impacts:
  - customer funds movement
  - treasury net settlement postings
- Reconciliation timing:
  - hourly vs end-of-day reconciliation for pilot

---

## 8) Non-functional requirements
- Performance: target time-to-credit ≤ 2 hours (define measurable clock)
- Availability: rail uptime targets during pilot
- Scalability: peak volumes, batch sizes
- Security: auth, message signing/encryption, key management
- Resilience:
  - retries, idempotency
  - dead-letter queues
  - circuit breaker behavior switching to SWIFT (or pausing)

---

## 9) System & integration inventory (what we must list)
We need to map:
- Customer payments front-end/service
- Orchestration/routing layer
- Sanctions/AML screening service (existing SWIFT)
- Message/format adapter for internal routing
- Treasury booking system / ledger integration
- AU counterpart integration points
- Reconciliation, reporting, and audit logging

**/discovery deliverable**
- An integration map with owners and data contracts.

---

## 10) Dependencies and likely “unknown unknowns”
Top dependencies to confirm early:
- **AU counterpart operational readiness**: credit posting, reject handling, cut-offs
- **Data requirements** for routing:
  - beneficiary bank identifiers (BSB, account number rules)
  - beneficiary name handling
- **Customer comms**: how status maps to actual settlement
- **Exception policy**:
  - if AU credit fails, who bears the cost and how quickly customer is refunded

---

## 11) Pilot design (how to reduce risk in 6 months)
### Pilot cohort definition
- Select enterprises retail customers:
  - by volume or by geography/relationship
  - low-risk segments initially (but still representative)

### Pilot success metrics (examples)
- % payments credited within 2 hours
- Mean/median time-to-settlement
- Reject rate / failure rate
- AML false positives rate and operational resolution time
- Revenue uplift vs baseline SWIFT leakage (even if directional early)

### Kill switches / fallback
- If the rail degrades, do we:
  - switch to SWIFT immediately?
  - pause the feature for new instructions?
  - allow manual intervention?

---

## 12) Pricing & commercial model (must be fully specified)
- Confirm how “under $5” is implemented:
  - does it include FX spread, processing cost, and any other fees?
- How to handle:
  - failed payments (fee refunded or not?)
  - partial credit and reversals
- Confirm whether pricing differs by recipient bank type or risk tier.

---

## 13) Open questions (I recommend we answer before solution design)
1. What is the exact **technical settlement path** to credit the AU recipient account?
2. Does “within 2 hours” mean:
   - within 2 hours of customer submission, and is that **7 days/24 hours** or business hours?
3. What are **cut-off times** for the internal routing and for treasury EOD netting?
4. What are the defined failure modes and **reversal/refund SLAs**?
5. Do we need to introduce any additional beneficiary verification beyond existing SWIFT KYC/validation?
6. What fields will be available for sanctions screening on this channel (match against existing SWIFT data coverage)?
7. Are there any **intraday settlement exposures** or only EOD netting?
8. What operational runbooks exist (pilot + steady state)?
9. What exactly must regulatory notifications cover—does the internal channel change licensing status?

---

## 14) Recommended /discovery work products (deliverables)
By end of discovery we should have:
- Feature scope + boundary statement (Phase 1)
- Process flow diagram NZ→AU with states & exceptions
- Integration/data contract inventory (including AML screening fields)
- Treasury settlement & reconciliation design outline
- AML/CFT alignment checklist + audit trail requirements
- Regulatory notification checklist + timeline
- Pilot plan: cohort, success metrics, cut-offs, rollback plan
- Pricing/fee policy document incl. failure/refund handling
- Target architecture overview and build estimate basis

---

If you want, I can convert this into a structured **/discovery checklist template** (sections, owners, due dates) and a **draft risk register**. Also: who is the “AU counterpart” technically (their entity/rail provider) and do we know their expected message formats for credit confirmation?