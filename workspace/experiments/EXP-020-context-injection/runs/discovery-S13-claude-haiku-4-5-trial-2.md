# Discovery Session: Trans-Tasman Enterprise Payment Feature

## Entry assessment

I've read your brief thoroughly. This is a well-framed opportunity with clear revenue drivers, identified customer problem, and a concrete mechanism. However, the input contains several material regulatory and contractual assumptions that must be surfaced and clarified **before scope is locked** — not after. 

I'm going to work through the discovery sections, but I need to flag upfront: the phrase "our compliance team is comfortable that the existing AML/CFT process covers the requirements" and "our regulatory team will manage the standard notifications process" are assumptions, not confirmations. Given the organisational context I've been provided (NZ financial services regulator obligations), I need to challenge these explicitly and name what requires confirmation.

Let me also check for reference materials and product context first.

---

## Step 0 — Product context and reference materials

**Checking for product context files (`product/mission.md`, `product/constraints.md`, `product/tech-stack.md`)...**

If these exist in your repo, I'll read them now and extract target users, known constraints, and technical limits to pre-populate sections. 

**Do you have product context files in the repo?** (Reply: yes or no)

**Also: Do you have reference materials** (business case, compliance pre-work, treasury agreement, existing payment flow docs) **already in `artefacts/trans-tasman-payment/reference/`?** 

(Reply: yes/no. If yes, I'll read them before proceeding with questions.)

For now, I'll proceed assuming no reference materials exist and work from what you've provided in this brief.

---

## Step 0a — EA Registry blast-radius check

I've noted that you have an existing SWIFT-based international payment platform. 

**What is the system slug for your current SWIFT international payment capability?** (e.g., `swift-international-payments`, `core-payments-outbound`, etc.). I'll check whether it has an EA registry entry so I can surface downstream consumer impact.

(Reply: system slug)

---

## Step 0b — Critical regulatory and contractual context surfacing

Before we proceed through the standard discovery questions, I need to name the regulatory and contractual assumptions embedded in your brief. These are **not confirmations** — they are gaps that must be resolved before this feature can be approved or scoped.

You are a **registered bank operating in New Zealand** under RBNZ supervision. The organisational context I've been provided includes:

### 1. **RBNZ BS11 — Outsourcing/Material Change Notification (CRITICAL)**

**Your brief states:** "We anticipate some regulatory notifications will be required before launch."

**RBNZ BS11 Reality:**
- Using a **proprietary intra-group payment routing channel** for **retail customer payments** is a **material change to a core banking system** (the payment platform).
- Material changes require **written notification to RBNZ at least 30 business days before any irreversible project activity begins**.
- "Starting infrastructure provisioning or data migration toolchain work counts as a material step" — the clock is already running if you've begun any technical work.
- Notification must be filed **before** go-live, before pilot, even before the first data migration or infrastructure provisioning.

**The assumption you've made:** "Our regulatory team will manage the standard notifications process."

**What needs confirmation:** 
- Has RBNZ BS11 notification **already been filed** (with acknowledgement)? If yes, what was the acknowledgement date? The 30-day clock starts from RBNZ acknowledgement, not filing.
- If **not yet filed**, this discovery cannot progress to definition until the notification is submitted. You cannot pilot, cannot provision infrastructure, cannot migrate data — cannot take any irreversible action — until acknowledgement is received.
- RBNZ may request additional information or impose conditions on the material change. The notification is not a formality — it is a gate.

**This is a hard gate, not a nice-to-have notification.** Proceeding without BS11 acknowledgement is a regulatory breach.

---

### 2. **RBNZ AML/CFT Act 2009 — Originator Information, Reporting Entity Liability, and Dual-Jurisdiction Scope (CRITICAL)**

**Your brief states:** "Our compliance team is comfortable that the existing AML/CFT process covers the requirements. We plan to extend the same AML/CFT screening logic to the new channel."

**AML/CFT Reality:**
- You remain the **reporting entity for the NZ leg** of every trans-Tasman payment, regardless of the routing channel.
- **Cross-border payment originator information:** Every cross-border payment message (whether SWIFT, proprietary intra-group, or API) must carry full originator details — name, account identifier, and address for the customer.
- **Your proprietary intra-group channel is not exempt** from originator information requirements. If your channel does not carry originator information, the AML/CFT obligation is not met by "extending screening logic" to it.
- **Dual-jurisdiction scope:** Your AML/CFT obligations cover the **NZ leg only**. The Australian counterpart bank carries AML/CFT obligations for the **AU leg**. You cannot assume your screening satisfies their obligations, and they cannot assume theirs satisfies yours.
- **Threshold reporting:** Transactions ≥ NZD $10,000 cash must be reported to the NZ Police FIU within 3 business days of threshold detection. Your pricing model ($18–25 SWIFT, under $5 proprietary) may increase the volume of high-value trans-Tasman payments, which will increase threshold-reporting frequency.

**The assumptions you've made:**
- "Existing AML/CFT process covers the requirements" — unconfirmed.
- "Same screening logic extended to new channel" — unconfirmed whether the channel architecture supports originator information carriage and FIU reporting timeliness.

**What needs confirmation:**
- Does your proprietary intra-group payment channel **carry originator information (customer name, account, address)** in every message? If no, how will originator information be captured and stored for AML/CFT audit and compliance?
- What is your **threshold-reporting process** for the NZ leg? Is it automated or manual? Will it trigger for every transaction routed through the new channel?
- Have you **confirmed with your Australian counterpart** what AML/CFT obligations they carry for the AU leg, and what originator information they require from you to discharge those obligations?
- Has your **legal/compliance team reviewed the specific message format and data carriage** of the proprietary intra-group channel to confirm it meets AML/CFT originator information requirements?

---

### 3. **RBNZ FX Reporting — Intra-Group Net Settlement (MATERIAL)**

**Your brief states:** "Net positions between the enterprise and the Australian counterpart would be settled at end of day in the treasury books."

**RBNZ FX Reporting Reality:**
- **Intra-group net settlement of foreign currency positions is an FX transaction** reportable to RBNZ.
- Using the group treasury netting arrangement for retail payment settlement does not exempt the underlying FX transactions from reporting.
- **FX reporting format, threshold, and frequency** must be confirmed with RBNZ **before launching any new cross-currency payment channel**.

**The assumption you've made:**
- "Regulatory team will manage standard notifications" — unconfirmed whether FX reporting requirements have been confirmed with RBNZ and integrated into your settlement process.

**What needs confirmation:**
- Has RBNZ **confirmed the FX reporting format, threshold, and frequency** for intra-group NZD/AUD net settlement under BS11 notification?
- Is FX reporting **automated or manual** in your current treasury settlement process?
- Does the treasury settlement system **capture originator details and payment-level traceability** for AML/CFT audit purposes, or only net position data?

---

### 4. **SWIFT Correspondent Bank Agreement — Non-SWIFT Routing Notification (MATERIAL)**

**Your brief states:** "We have a close relationship with our Australian counterpart — shared group infrastructure and a reciprocal payment routing agreement already in place for internal treasury flows."

**Correspondent Agreement Reality:**
- Your **bilateral SWIFT correspondent bank agreement** (e.g., with JPMorgan Chase, Deutsche Bank, or equivalent) **requires written notification before routing any live transaction volume outside the SWIFT channel** covered by the agreement.
- Routing retail customer payments through a proprietary intra-group channel **without prior correspondent notification** is a **contractual breach**, regardless of whether the routing is technically functional and regulatory-compliant.
- This notification obligation is **independent of and in addition to RBNZ BS11 notification** — both are required.
- The correspondent agreement may **prohibit non-SWIFT routing entirely**, or it may require conditions (e.g., net settlement reconciliation, specific message formats, audit rights).

**The assumption you've made:**
- "We have a reciprocal payment routing agreement" — you may have a treasury agreement, but does it **explicitly permit retail customer payment routing**? And has your **Treasury team notified your correspondent bank** of the intent to route retail payments through this channel?

**What needs confirmation:**
- What is the **exact text of the reciprocal payment routing agreement** regarding non-SWIFT channels? Does it permit retail payment routing or only treasury flows?
- Has your **Treasury team formally notified your SWIFT correspondent bank** of the intent to route trans-Tasman retail payments through the proprietary channel? If yes, has the correspondent acknowledged and imposed any conditions?
- If **notification has not been sent**, this is a pre-pilot gate: Treasury must notify the correspondent and receive acknowledgement **before any live payment is routed**.

---

### 5. **DIA Payment Services Regulations 2021 — New Service Type Registration (MATERIAL)**

**Your brief states:** "The feature would initially be available for NZ-to-Australia payments only."

**DIA Registration Reality:**
- A **proprietary intra-group retail payment channel** that is **customer-facing** and **outside the scope of your existing licensed payment service types** may constitute a **new payment service type** requiring DIA registration or exemption confirmation.
- You cannot pilot or go live with a new payment service type until **DIA registration has been obtained or exemption has been confirmed**.

**The assumption you've made:**
- "Our regulatory team will manage standard notifications" — unconfirmed whether DIA scope has been assessed.

**What needs confirmation:**
- Have you **already obtained DIA registration** for a "trans-Tasman payments" or "intra-group payment routing" service type? If yes, what is the registration scope and any conditions?
- If **not yet registered**, has your legal team assessed whether this feature **falls within an existing licensed service type** (e.g., "international payments") or requires **new registration**?
- If **new registration is required**, DIA registration can take **4–8 weeks**. Does this fit your 6-month timeline and pilot plan?

---

### 6. **CCCFA — Consumer Credit Records Retention (IF APPLICABLE)**

**Your brief does not mention consumer credit.** If trans-Tasman payments involve any **personal loan, buy-now-pay-later, or consumer credit settlement**, CCCFA 7-year retention requirements apply and must be confirmed. Assume not applicable unless you clarify otherwise.

---

## Summary of regulatory context bridges

**I need to be direct:** Your brief says "we are aware regulatory notifications will be required" and "we are used to this." But the regulatory landscape for this feature is **not a standard notification process**. It is a **sequence of three interdependent gates**:

1. **RBNZ BS11 material change notification** (pre-pilot gate — must be filed and acknowledged before any infrastructure work)
2. **SWIFT correspondent bank agreement compliance** (pre-pilot gate — Treasury must confirm the agreement permits retail routing and notify the correspondent)
3. **DIA payment services scope confirmation or registration** (pre-pilot gate — if new service type, registration must be obtained)

**Plus**, ongoing reporting obligations (AML/CFT originator information carriage, threshold reporting, FX reporting) must be designed into the channel architecture **before pilot**, not retrofitted afterward.

This is not "your regulatory team will handle it." **This is: your discovery cannot be approved, and your scope cannot be locked, until these three gates are confirmed.**

---

## How we proceed

I'm going to work through the standard discovery sections, but I'll be naming every assumption that maps to these regulatory gates as `[ASSUMPTION]` blocks. At the end, I'll recommend **/clarify** to surface and resolve them one at a time with your regulatory and Treasury teams.

**Are you ready to proceed with this approach?** (Reply: yes or no)

**If yes:** I'll ask the standard discovery questions (problem, personas, MVP scope, out-of-scope, success indicators, constraints) and flag assumptions as they arise.

**If no, or if you want to pause and validate regulatory gates first:** I can pause discovery now and provide a structured regulatory pre-work checklist instead. Which would be more useful?

(Reply: proceed with discovery / pause for regulatory pre-work)