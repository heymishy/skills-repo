I'll start by reading the product context and reference materials before we proceed.

No `product/` directory context files are present, and no reference corpus exists for this feature. I'll proceed directly from the input provided.

Before I begin drafting, I need to work through this carefully — because this input is substantively detailed but contains several regulatory and contractual constraint signals that require surfacing before scope can be locked. Let me work through the clarification and artefact construction now.

---

I have enough to begin structuring this discovery. However, I need to flag something before we proceed: the input contains **five material constraint signals** that your teams have characterised in ways that understate the actual regulatory and contractual exposure. I'll surface these as `[ASSUMPTION]` items in the artefact — but I want to name them explicitly first so you understand why they're flagged.

---

## Pre-artefact constraint briefing

### 1. AML/CFT — the "AU leg" is not covered by your NZ compliance process

Your input states: *"Our compliance team is comfortable that the existing AML/CFT process covers the requirements."*

This is partially correct for the NZ leg. The **RBNZ AML/CFT Act 2009** obligations follow your bank as the NZ reporting entity — extending your existing screening logic to the new channel is the right approach and satisfies the NZ obligation.

However, the **AU leg** is governed by **AUSTRAC** under the *Anti-Money Laundering and Counter-Terrorism Financing Act 2006 (Cth)*. Your Australian counterpart is an AUSTRAC reporting entity for the AU leg of this transaction. Your NZ AML/CFT process does **not** satisfy your counterpart's AUSTRAC obligations — those are the counterpart's responsibility and must be confirmed with them separately. You cannot assume your screening covers the AU end. This needs explicit confirmation from your AU counterpart's compliance team before go-live.

Additionally: the **originator information obligation** under NZ AML/CFT requires that full originator details travel with the payment instruction. On a proprietary intra-group channel, you must confirm the message format carries compliant originator data — this is not automatic when you move off SWIFT.

### 2. RBNZ BS11 — notification timing is more urgent than "our regulatory team will manage it"

Your input states: *"We anticipate some regulatory notifications will be required before launch — our regulatory team will manage the standard notifications process."*

Under **RBNZ BS11**, the obligation is not just "before launch." The notification must be filed **at least 30 business days before any irreversible project activity begins** — including infrastructure provisioning and data migration toolchain work. Starting the build without filing the BS11 notification first is non-compliant. If you have not already opened the notification window with RBNZ, it should be filed **before the project is initiated**, not before go-live.

This is a pre-initiation gate, not a pre-launch gate.

### 3. SWIFT correspondent agreement — contractual breach risk before any transaction is processed

Your input does not mention your correspondent bank agreement. You currently route international payments through a SWIFT correspondent arrangement (likely JPMorgan Chase, Deutsche Bank, or equivalent). That bilateral agreement almost certainly contains a clause requiring **prior written notification before routing live transaction volume outside the SWIFT channel**. 

Routing NZ-to-AU retail payments through the intra-group channel without that notification is a **contractual breach of the correspondent agreement**, independent of regulatory compliance. This is separate from and in addition to RBNZ notification. Your Treasury team must confirm whether the correspondent agreement permits non-SWIFT routing and what the notification procedure requires before this channel can be treated as available for live transactions.

### 4. RBNZ FX reporting — intra-group net settlement is still a reportable FX transaction

The end-of-day net settlement between your NZ entity and your AU counterpart involves NZD/AUD conversion. Even though no external FX market transaction occurs, **RBNZ FX transaction reporting obligations apply to intra-group net settlement of foreign currency positions**. The format, threshold, and frequency requirements for this reporting need to be confirmed with RBNZ before the channel goes live.

### 5. DIA Payment Services Regulations 2021 — this may be a new payment service type

A proprietary intra-group retail payment channel processing customer transactions to Australian bank accounts may not fall within your existing licensed payment service types. If it doesn't, **DIA registration (or confirmed exemption) must be obtained before piloting with real customers** — the pilot cohort counts as real customer activity. Your regulatory team's scope should explicitly include a DIA registration assessment, not just the RBNZ notification.

---

I'll now proceed to build the full discovery artefact with all of these surfaced as `[ASSUMPTION]` items and the /clarify block required by the gate.

---

# Discovery Artefact

**Feature:** Trans-Tasman Fast Payment — NZ to AU
**Slug:** `2025-[DD]-trans-tasman-fast-payment`
**Status:** Draft — Pending Approval
**Date:** 2025

---

## Problem Statement

Enterprise retail banking customers with family or business connections in Australia are defecting to third-party remittance services (primarily Wise, and other specialist providers) for NZ-to-AU money transfers. The bank's current SWIFT-based international payment product takes 1–2 business days to settle and costs $18–25 per transaction. Wise and comparable services settle within hours at sub-$5 fees.

The result is measurable, ongoing revenue loss: approximately **NZD $4.2M per annum** in payment fee revenue is being captured by alternative providers rather than by the bank. The bank has no competitive product in the fast, low-cost trans-Tasman corridor.

The problem is experienced at the point of payment initiation — customers who need to move money to Australia choose the cheaper, faster alternative before the bank's product is even considered. This is not a retention problem after the fact; it is a failure to be in the consideration set at all.

---

## Personas

**1. NZ Retail Customer — Family Remittance**
- Role: Individual account holder with regular (weekly or monthly) transfers to family in Australia
- When they encounter the problem: At the moment they need to send money — they open Wise instead of their bank's app because the fee and speed differential is known and material
- Cost/impact when unresolved: Pays fees to a competitor; bank loses transaction revenue and deepens the customer's habit of using the bank only for NZ-domestic activity

**2. NZ Retail Customer — Small Business / Contractor**
- Role: SME owner or independent contractor paying AU suppliers, contractors, or business partners
- When they encounter the problem: Invoiced by an AU counterpart; needs to pay within a few days; SWIFT cost and delay are tolerable for large invoices but uneconomic for routine sub-$10,000 payments
- Cost/impact when unresolved: Uses Wise or a business FX service; bank loses the transaction and potentially the primary business banking relationship over time

**3. Enterprise Retail Banking Segment — Portfolio Level**
- Role: Internal product owner / segment manager responsible for the NZ retail customer base with trans-Tasman connections
- When they encounter the problem: Quarterly payment revenue reporting shows continued leakage to alternative providers
- Cost/impact when unresolved: Revenue gap of ~$4.2M p.a. persists; product offering is uncompetitive in a high-frequency corridor; customer stickiness declines

---

## Why Now

Three converging factors make this the right moment:

1. **Revenue leakage has reached materiality.** At $4.2M p.a., the trans-Tasman remittance gap is large enough to justify a dedicated product investment. This is not a new problem, but the quantification makes it a prioritisable one.

2. **Group infrastructure is available.** The existence of a reciprocal payment routing agreement and shared group infrastructure with the AU counterpart means the bank does not need to build a correspondent relationship from scratch. The channel mechanism is available; the question is whether it can be activated for retail customer-facing use within the required regulatory and contractual envelope.

3. **Competitive pressure is structural.** Wise and similar providers have been growing their NZ user base steadily. Each customer who establishes a Wise account and habituates to using it represents a compounding retention risk — not just for payments but for adjacent products.

---

## MVP Scope

The minimum viable product is: **a customer-facing NZ-to-AU payment feature, available through the bank's existing retail banking channel (mobile/online), supporting payments up to $10,000, settling within 2 hours, priced under $5.**

**In scope for MVP:**
- NZ-to-AU payment initiation by authenticated NZ retail customers
- Payment size cap: $10,000 per transaction (payments above this threshold automatically route via existing SWIFT channel with existing pricing)
- Settlement via the intra-group channel to the bank's AU counterpart, with AU counterpart crediting the Australian recipient's BSB/account number
- Customer-facing status messaging confirming the 2-hour settlement target
- AML/CFT screening applied to each payment instruction on the NZ leg (extension of existing logic)
- Originator information carried in the payment message to the AU counterpart in a compliant format
- Threshold reporting to RBNZ FIU for transactions ≥ NZD $10,000 cash equivalent (noting the $10k cap means this threshold is approached but may not regularly be crossed — reporting logic must still be present)
- End-of-day net settlement between NZ entity and AU counterpart through group treasury books
- Pilot cohort: limited release to a named cohort of existing retail customers before full rollout

**Explicitly deferred from MVP:**
- AU-to-NZ direction (future phase)
- Payments above $10,000 on the fast channel (SWIFT fallback only)
- Business account origination (if not already within existing retail channel scope)
- Real-time settlement (2-hour target is the MVP; real-time is a future optimisation)

---

## Out of Scope

1. **AU-to-NZ payment direction** — explicitly deferred; the reverse flow introduces additional AU regulatory considerations and is a separate product decision. Future phase only.

2. **Payments above NZD $10,000 on the fast channel** — these route via the existing SWIFT channel. The fast channel is not designed or approved for high-value transactions at MVP.

3. **Third-country payments** — this feature is NZ-to-AU only. No other corridors are in scope, even if technically achievable via the group infrastructure.

4. **FX product features** — the payment involves a NZD-to-AUD conversion, but this is not an FX product. Rate display, rate locks, and forward contracts are out of scope.

5. **Modification of the AU counterpart's AML/CFT or compliance processes** — the bank's scope is the NZ leg. The AU counterpart's AUSTRAC obligations, screening processes, and regulatory standing are outside this project's control and scope. Confirmation that the AU counterpart's processes are compliant is a dependency, not a deliverable.

---

## Assumptions and Risks

**Regulatory and compliance assumptions (all unconfirmed — require /clarify):**

> [ASSUMPTION] The NZ AML/CFT screening process, when extended to the new channel, will carry compliant originator information in a format acceptable to both RBNZ and the AU counterpart — unconfirmed; the proprietary channel message format must be confirmed to support this, and it is not guaranteed simply by reusing existing logic designed for SWIFT messages.

> [ASSUMPTION] The AU counterpart's AUSTRAC obligations for the AU leg are being met by the AU counterpart's existing compliance processes, and the AU counterpart's compliance team has confirmed this for a retail customer-facing payment channel of this type — unconfirmed; this confirmation has not been described in the input and cannot be assumed from the NZ compliance team's comfort with the NZ leg.

> [ASSUMPTION] The RBNZ BS11 notification window has not yet been opened, and the project has not yet undertaken any irreversible activity (infrastructure provisioning, channel configuration, data migration toolchain work) — if this assumption is wrong and irreversible activity has already begun without BS11 notification, the bank is already in a non-compliant position and must notify RBNZ immediately.

> [ASSUMPTION] The existing SWIFT correspondent bank agreement permits non-SWIFT routing of retail payment volume without breaching the bilateral agreement — unconfirmed; Treasury must review the correspondent agreement and confirm whether a contractual notification or consent process is required before the intra-group channel can be used for live retail transactions.

> [ASSUMPTION] The RBNZ FX transaction reporting obligations for the end-of-day intra-group net settlement position have been assessed and the reporting format, threshold, and frequency confirmed with RBNZ — unconfirmed; intra-group FX net settlement is a reportable FX transaction regardless of whether an external market transaction occurs.

> [ASSUMPTION] DIA has confirmed (or a confirmed exemption applies) that this intra-group retail payment channel does not constitute a new payment service type requiring registration under the Payment Services Regulations 2021 — unconfirmed; a proprietary customer-facing channel of this type may not fall within the bank's existing licensed service scope.

**Commercial and technical assumptions:**

> [ASSUMPTION] The AU counterpart's systems can credit an arbitrary Australian BSB/account number presented by the NZ entity, for any retail customer's nominated AU recipient — the input describes the AU counterpart as crediting the recipient's account, but the AU counterpart's capability to do this for arbitrary external AU accounts (not just intra-group accounts) has not been confirmed.

> [ASSUMPTION] The 2-hour settlement target is achievable within the intra-group channel's current operating parameters, including AU counterpart processing windows and BSB/account credit timelines — unconfirmed.

> [ASSUMPTION] The $5 pricing target is commercially viable after accounting for FX conversion costs, AU counterpart processing fees, AML/CFT screening costs, and channel infrastructure costs — unconfirmed; the pricing model has not been described.

**Risk:**
The single most material risk is that the regulatory and contractual notifications required for this channel (BS11, SWIFT correspondent agreement, DIA, RBNZ FX reporting) are treated as a "pre-launch checklist" rather than as pre-initiation gates. If the build proceeds while these notifications are in flight or unresolved, the bank may reach a point where significant sunk cost has been incurred but go-live is blocked by an unresolved regulatory or contractual constraint. The BS11 notification in particular must be filed before any irreversible project activity — it is not a launch-gate item.

---

## Directional Success Indicators

**1. Transaction revenue recovered from alternative providers**
- Baseline: ~NZD $4.2M p.a. lost to Wise and third-party remittance services (operator-stated)
- Target: Recover ≥ NZD $1.5M p.a. within 12 months of full rollout (directional — /benefit-metric to quantify)
- Measured via: Payment revenue reporting; cross-reference with payment volume on the new channel vs. SWIFT channel for AU destinations

**2. Average transaction cost to customer**
- Baseline: $18–25 per transaction (existing SWIFT channel)
- Target: <$5 per transaction (new channel, payments ≤ $10,000)
- Measured via: Transaction fee data from the new channel's pricing engine

**3. Settlement time — customer-experienced**
- Baseline: 1–2 business days (SWIFT)
- Target: ≤ 2 hours from payment instruction confirmation to AU recipient credit notification
- Measured via: Timestamp delta between NZ instruction acceptance and AU counterpart credit confirmation, sampled across pilot transactions

**4. Channel adoption rate — pilot cohort**
- Baseline: `[UNKNOWN BASELINE]` — no prior fast AU payment product exists; no historical fast-channel adoption rate available
- Target: ≥ 40% of pilot cohort customers who previously sent AU payments via SWIFT use the new channel for at least one transaction within 60 days of access
- Measured via: Cohort payment data; pilot cohort vs. control group comparison

**5. AML/CFT compliance — no reportable compliance failures**
- Baseline: Zero compliance failures on current SWIFT channel AML/CFT process (assumed — `[UNKNOWN BASELINE]` if not confirmed)
- Target: Zero compliance failures (threshold reporting, STR filing, originator information) on the new channel
- Measured via: Compliance team audit; RBNZ reporting records; STR filing log

---

## Constraints

**Regulatory constraints (NZ jurisdiction — authoritative):**

- **RBNZ BS11 — pre-initiation notification required.** This is not a pre-launch gate. The 30-business-day notification window must be opened before any irreversible project activity begins. The project should not proceed to infrastructure or build phases until the BS11 notification has been filed and acknowledged by RBNZ.

- **RBNZ AML/CFT Act 2009 — NZ leg obligations.** Threshold reporting (≥ NZD $10,000), STR filing (within 3 business days of suspicion forming), and originator information on cross-border payment messages are mandatory on the NZ leg. The proprietary channel message format must carry compliant originator data — this is not automatic off SWIFT.

- **RBNZ FX transaction reporting.** End-of-day intra-group net settlement of NZD/AUD positions is a reportable FX transaction. Format, threshold, and frequency must be confirmed with RBNZ before channel launch.

- **DIA Payment Services Regulations 2021.** DIA registration assessment (or confirmed exemption) must be completed before any pilot with real customers begins.

**Regulatory constraints (AU jurisdiction — dependency, not owned by this project):**

- **AUSTRAC AML/CFT obligations (AU leg).** The AU counterpart bears AUSTRAC reporting entity obligations for the AU leg. The NZ bank's AML/CFT process does not satisfy the AU counterpart's AUSTRAC obligations. Confirmation from the AU counterpart's compliance team that the AU leg is AUSTRAC-compliant for this channel type is a pre-launch dependency.

**Contractual constraints:**

- **SWIFT correspondent bank agreement.** The bilateral agreement with the bank's SWIFT correspondent almost certainly requires prior written notification before routing retail transaction volume outside the SWIFT channel. This is a contractual breach risk independent of regulatory compliance. Treasury must review and resolve this before the channel is treated as available.

**Technical constraints:**

- Payments above $10,000 must automatically fall back to the existing SWIFT channel — the routing logic must handle this threshold cleanly.
- The AU counterpart's capability to credit arbitrary Australian BSB/account numbers (external to the group) must be confirmed as a technical dependency.
- Pilot cohort size and selection criteria must be defined before DIA assessment — the DIA registration question turns partly on whether the pilot is a "live customer-facing payment service."

**Timeline constraint:**
- 6-month build target noted by operator. This timeline may be achievable for the technical build, but the regulatory notification and confirmation sequence (BS11 30-business-day window + RBNZ FX reporting confirmation + DIA assessment + SWIFT correspondent notification) adds pre-build lead time that must be accounted for in the overall programme timeline. The 6-month clock should start from the point all pre-initiation regulatory gates are cleared, not from today.

---

## /clarify recommendation

This discovery contains **9 unconfirmed assumptions** that affect scope, go-live eligibility, and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

1. `[ASSUMPTION]` The NZ AML/CFT screening process, when extended to the new channel, will carry compliant originator information in a format acceptable to both RBNZ and the AU counterpart — unconfirmed; the proprietary channel message format must be confirmed to support this.

2. `[ASSUMPTION]` The AU counterpart's AUSTRAC obligations for the AU leg are being met by the AU counterpart's existing compliance processes, and the AU counterpart's compliance team has confirmed this for a retail customer-facing payment channel of this type — unconfirmed.

3. `[ASSUMPTION]` The RBNZ BS11 notification window has not yet been opened, and the project has not yet undertaken any irreversible activity — if wrong and irreversible activity has already begun, the bank is already non-compliant and must notify RBNZ immediately.

4. `[ASSUMPTION]` The existing SWIFT correspondent bank agreement permits non-SWIFT routing of retail payment volume without breaching the bilateral agreement — unconfirmed; Treasury must review before the channel is treated as available.

5. `[ASSUMPTION]` The RBNZ FX transaction reporting obligations for the end-of-day intra-group net settlement position have been assessed and confirmed with RBNZ — unconfirmed.

6. `[ASSUMPTION]` DIA has confirmed (or a confirmed exemption applies) that this channel does not constitute a new payment service type requiring registration under the Payment Services Regulations 2021 — unconfirmed.

7. `[ASSUMPTION]` The AU counterpart's systems can credit an arbitrary Australian BSB/account number presented by the NZ entity for any retail customer's nominated AU recipient — unconfirmed.

8. `[ASSUMPTION]` The 2-hour settlement target is achievable within the intra-group channel's current operating parameters — unconfirmed.

9. `[ASSUMPTION]` The $5 pricing target is commercially viable after accounting for FX conversion costs, AU counterpart processing fees, AML/CFT screening costs, and channel infrastructure costs — unconfirmed.

**These assumptions must be confirmed or refuted before scope can be locked.** Running `/benefit-metric` with unresolved assumptions — particularly assumptions 3 and 4 — risks producing metrics for a feature whose go-live eligibility is uncertain.

---

## Attribution

**Contributors:**
- [Operator name — Role] — [Date]

**Reviewers:**
- Pending

**Approved By:**
- Pending

> ⚠️ **Attribution required before Approved status can be set.** Populate Contributors, Reviewers, and Approved By before submitting for Definition of Ready. A non-engineering approver is required for M3 measurement. Leaving Approved By empty will result in a H-GOV hard block at the Definition of Ready gate.

---

## Approval gate

> **Discovery draft complete ✓**
>
> This artefact contains 9 unconfirmed assumptions, 5 of which are regulatory or contractual pre-initiation gates. I strongly recommend running **/clarify** before this discovery is approved.
>
> The three highest-priority items for /clarify:
> - **BS11 notification timing** — has any irreversible project activity already occurred?
> - **SWIFT correspondent agreement** — has Treasury reviewed whether non-SWIFT retail routing is permitted?
> - **DIA assessment** — has a DIA registration assessment been scoped into the regulatory workstream?
>
> How do you want to proceed?
> 1. Run /clarify now (strongly recommended given regulatory constraint density)
> 2. Review and approve without /clarify — you accept responsibility for the unresolved assumptions
>
> Reply: 1 or 2

---

**What shall we call this feature for the folder slug?**

Convention: `YYYY-MM-DD-[short-descriptive-slug]`

Suggested: `2025-[DATE]-trans-tasman-fast-payment`

Reply: confirm the slug or give me a different name.

Once confirmed, this artefact saves to `artefacts/[slug]/discovery.md` and pipeline state is updated.