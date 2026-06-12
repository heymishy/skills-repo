Got it. Here’s a structured discovery output you can take to board/compliance/engineering as a baseline—focused on getting you **live before 31 March (3pm cut-off)** and making switching **as close to same-business-day as possible**, while handling the specified edge cases safely.

---

## 1) Problem & outcomes (what “good” looks like)
**Current state**
- Paper switch forms; ops processing in **10–15 business days**.
- Competitors offer **same-day / next-business-day** switching online.

**Key business risk**
- Missing the **31 March 3pm unit-price cut-off** leads to:
  - high member complaints
  - likely spike in closures
  - reputational damage
  - potential compliance scrutiny around process disclosure/timing

**Target outcomes**
1. Members can submit an online switch instruction via portal.
2. The system commits the instruction to the **unit registry on the same business day** wherever possible.
3. Clear member-facing confirmation showing:
   - estimated processing date
   - whether the instruction is likely to be within the **current unit-price window** (esp. around 31 March)
4. Members who exceed **2 switches/year** are charged **$15** (with correct accounting).
5. Edge cases are routed to manual handling (paper fallback / ops workflow).

---

## 2) Key requirements derived from your constraints
### A. Cut-off accuracy for 31 March
**Hard requirement:** to be competitive and protect board expectations, you must be able to:
- accept portal submissions up to **3pm March 31**
- ensure the instruction is posted to the unit registry **the same business day**
- define what happens when:
  - submission occurs after cut-off
  - system is unavailable or degraded
  - data latency affects “commit” time

**Discovery items to resolve**
- What exact timestamp defines “submitted” (portal client time vs server time)?
- Define a canonical timezone for cut-off enforcement (likely NZST/NZDT handling).
- Confirm registry interface behavior:
  - is there an “in-flight” buffer for same-day unit registry posting?
  - what’s the minimum processing SLA you can guarantee operationally?

### B. Regulatory/compliance notices (FMA + member advance notice)
Assume:
- you need to notify FMA about the change in process timing
- you need member advance notice before go-live
- you need to reflect accurate timing expectations around cut-off

**Discovery items**
- Are there any “service standard” or “unit pricing” disclosure statements required?
- Does FMA require specific documentation about cut-off handling, exceptions, and fee implementation?
- Are you changing “when instructions are effective” or “when units are applied” (wording matters)?

### C. Fee policy enforcement
**Rule:** $15 switching fee for members who make **more than two** fund switches per calendar year.

**Discovery items**
- “Switch” definition:
  - Does switching back count as a new switch?
  - Do switches between other fund combinations count equally?
- When the fee is assessed:
  - at submission time, or at registry posting time?
- Fee timing/visibility:
  - show fee upfront in the portal?
  - include on confirmation?
  - refund logic if a switch is later rejected/rolled back?
- Data source of “switch count”:
  - do you have reliable historical switch transaction logs?

---

## 3) Member journey (proposed)
1. Member logs into portal.
2. System displays eligible funds (Conservative / Balanced / Growth / Aggressive Growth).
3. Member selects target fund and reviews:
   - current fund
   - effective processing expectations
   - the **fee rule** (if applicable / likely)
   - cut-off disclaimer for this year (especially near 31 March)
4. Member confirms switch.
5. System returns confirmation including:
   - “Instruction received” timestamp
   - **estimated processing date**
   - whether it’s expected to be captured within the current unit-price period (if submitted before the cut-off)
   - next steps / manual handling notice if ineligible
6. Ops receives workflow items for edge cases and exceptions.

---

## 4) Eligibility & edge cases (routing logic)
You indicated manual handling via paper fallback for:
- very recent joiners
- contributions holiday
- active hardship applications

**Discovery items to make explicit**
For each edge case, decide:
- Are they fully blocked from online switching, or allowed but routed to manual confirmation?
- Who determines eligibility—the portal using flags, or ops later?
- How do you detect status reliably at submission time?
- What response do members see?

**Suggested approach**
- Portal checks “eligibility flags” at submission:
  - if ineligible → display “Online switching unavailable—please use paper; ops will handle”
  - if eligible → allow submit and commit instruction
- Ops workflow only for ambiguous cases or system exceptions.

---

## 5) System & integration (what must happen for “same business day”)
### A. Core technical requirement
When a member submits before the cut-off:
- record instruction in a persistent system of record
- trigger posting to the **unit registry** on that same business day
- retain an audit trail: who/when/what/decision and registry posting result

### B. Integration discovery questions
- How does the portal communicate with the unit registry system?
  - API? batch job? message queue?
- What constitutes “committed”?
  - successful write to registry table?
  - acknowledgement from registry service?
  - inclusion in end-of-day batch?
- What’s your operational capacity for the lead-up to 31 March?
- Do you need a “fast path” batch earlier in the day to guarantee inclusion?

### C. Failure modes
You should define:
- If registry posting fails, do you:
  - retry automatically?
  - fall back to manual submission?
  - notify compliance and members if it jeopardizes cut-off inclusion?

---

## 6) Data, audit, and confirmation content
**Audit trail must include**
- Member ID, account reference
- source channel (portal)
- submission timestamp (server time)
- target fund
- switch count at time of submission
- fee assessment outcome
- eligibility decision
- registry posting timestamp and result
- any overrides/manual interventions

**Member confirmation should include**
- “Received at HH:MM on DD MMM”
- “Estimated processing date”
- If before cut-off: “Expected to be applied using 31 March unit prices” (wording to be approved by compliance)
- Fee disclosure if >2 switches/year

---

## 7) Operational model (ops + automation)
### A. What automation should do
- Eligibility checks
- Switch instruction capture
- Fee calculation
- Sending to registry for posting
- Generating confirmations
- Creating exception tickets for manual handling

### B. What operations should do
- Handle ineligible/edge cases using existing paper fallback
- Resolve ambiguous eligibility flags
- Handle registry posting failures and member disputes
- Provide compliance reporting and evidence

**Discovery items**
- Current ops workflow around paper:
  - what internal systems are updated?
  - how long does validation take?
- How can you parallelize “paper fallback” and “online submissions” during March?

---

## 8) Go-live plan for the end-of-financial-year (non-negotiable)
You likely need a “no-late-releases” plan:
- feature freeze date for March
- load testing with peak portal submission volumes
- a cut-off rehearsal (internal dry-run) at least once before go-live
- a runbook for:
  - after-hours March 31 handling
  - incidents preventing registry commit
  - rollback/retry strategy

**Discovery items**
- Target go-live date that allows:
  - UAT sign-off
  - compliance sign-off on disclosures and timing language
  - staging to production parity
  - rehearsals

---

## 9) Compliance documentation artifacts (to coordinate early)
Likely deliverables your compliance team is producing, but flagging what to request/verify:
- change notification to FMA (process/timing changes)
- member notice (advance notice of new online switching process)
- updated T&Cs / fee terms for $15 rule
- cut-off disclosure wording and operational exceptions disclosure
- incident communication and “what happens if system unavailable near cut-off” language (if required)

---

## 10) Open questions (to unblock design & delivery)
If you answer these, we can convert this into concrete user stories + technical plan + cut-off acceptance criteria:

1. **Cut-off timestamp & timezone:** What is the exact definition (server time, NZST/NZDT)?
2. **Registry “commit” semantics:** How do we detect success in a way that guarantees same-day unit inclusion?
3. **End-of-day batching:** Is same-day registry posting via batch? If so, what’s the earliest reliable batch cut time?
4. **Switch count source:** Do we have a ledger of historical switches by calendar year at the member account level?
5. **Fee application:** at submission vs successful registry posting vs cancellation?
6. **Eligibility flags:** What authoritative data exists to identify:
   - recent joiners
   - contributions holiday
   - active hardship
7. **Rejection rules:** What happens if a member is eligible at submission but becomes ineligible before posting?
8. **After-hours 31 March:** Do you intend the portal to accept submissions up to exactly 3pm only, or also earlier evenings?
9. **Member messaging wording:** Who approves compliance-approved phrasing for “expected unit-price application”?
10. **Operational capacity March 31:** Are we staffing ops/IT for an accelerated registry posting path?

---

If you want, I can turn this into:
- a **discovery workshop agenda** (1–2 sessions) for engineering/ops/compliance, and/or
- an initial **PRD-lite** with user stories + acceptance criteria specifically around the **31 March 3pm** cut-off and the **$15 fee rule**.