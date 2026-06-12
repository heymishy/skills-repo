I'll start by reading the product context and reference materials before diving into questions.

**Checking:** `product/mission.md`, `product/constraints.md`, `product/tech-stack.md` — not found in this session context.

**Checking:** `artefacts/trans-tasman-payments/reference/` — not found.

**Checking:** `.github/context.yml` — reading EA registry flag... `architecture.ea_registry_authoritative` not set; Path B applies, no blast-radius query.

**Checking:** `artefacts/[system-slug]/reference/discovery-seed.md` and `constraint-index.md` — system slug not yet confirmed; will check once slug is established.

---

Before I proceed to the artefact, I need to raise something important. The input contains several statements about regulatory compliance posture that I cannot treat as settled — they carry material risk and I am obligated to surface them explicitly before writing the Constraints and Assumptions sections. This is not a process step I can skip.

Let me work through the discovery sections, and I will flag these inline as I reach them.

---

## Reading the input against the regulatory context

The operator's input makes three claims about regulatory coverage that I need to test against the authoritative context injected before this session:

1. *"Our compliance team is comfortable that the existing AML/CFT process covers the requirements."*
2. *"Our regulatory team will manage the standard notifications process."*
3. The implicit assumption that using the intra-group treasury channel is a drop-in routing substitute for the SWIFT channel without additional regulatory or contractual obligations beyond those already being managed.

I will not contradict the operator's teams — but I am required to surface the specific gaps between those comfort statements and the frameworks that apply, so they can be confirmed or refuted before scope is locked. These surface as `[ASSUMPTION]` lines.

---

I have enough in the input to proceed through all sections in a single pass. Here is the full draft discovery artefact.

---

# Discovery Artefact — Trans-Tasman Fast Payment Channel

**Status:** Draft — Pending Approval
**Feature slug:** `2025-01-31-trans-tasman-fast-payments`
*(Confirm or adjust the slug and date before saving)*
**Skill:** `/discovery`
**Created:** *(today's date — confirm before saving)*

---

## Problem Statement

Enterprise retail bank customers with family or business connections in Australia are bypassing the bank's international payment product in favour of third-party remittance services (primarily Wise, and other specialist remittance providers). The bank's current SWIFT-based trans-Tasman payment product takes 1–2 business days to settle and costs $18–25 per transaction. Competing services settle within hours at under $5 per transaction.

The bank is losing approximately **NZD $4.2M in annual payment revenue** to these alternatives. The competitive gap is both a revenue problem and a customer retention risk: customers who route routine NZ-to-AU payments through Wise develop a habit relationship with that provider that may expand beyond payments over time.

The problem is not product quality in the traditional sense — the SWIFT channel is reliable and compliant. The problem is that the economics and speed of the SWIFT channel are structurally uncompetitive for the sub-$10,000 retail and SME trans-Tasman corridor, and no bank-native alternative currently exists.

---

## Personas

**1. Retail customer with family in Australia**
- Role: NZ-resident bank customer, individual
- When they encounter the problem: Monthly or irregular transfers to family members (e.g. supporting adult children studying in AU, remittances to parents)
- Current behaviour: Uses Wise or similar because the bank's $18–25 fee is disproportionate relative to transfer amounts of $200–$2,000; 1–2 day settlement is inconvenient for time-sensitive family support
- Cost of current workaround: Customer maintains a Wise account relationship; bank loses transaction revenue and weakens its position as the customer's primary financial relationship

**2. SME owner with Australian suppliers or contractors**
- Role: NZ-resident business banking customer, enterprise retail segment
- When they encounter the problem: Regular supplier payments, contractor invoices, or AU-entity payroll; frequency may be weekly or fortnightly
- Current behaviour: Uses Wise or bank transfer via AU business account held separately; the $18–25 per-transaction cost is material at volume (e.g. 10 transactions/month = $200–$250/month in fees)
- Cost of current workaround: Direct fee cost plus the operational friction of managing a parallel remittance provider relationship; risk of the bank losing the full business banking relationship to a provider that offers end-to-end AU-NZ capability

**3. Compliance / AML officer (internal)**
- Role: Internal operator of the bank's AML/CFT screening and threshold reporting processes
- When they encounter the problem: At channel design time (now) and at every material change to payment routing
- What they need: Confirmed legal basis that the new channel's screening and reporting processes satisfy both NZ AML/CFT obligations *and* AU-leg counterpart obligations — not an assumption that the NZ process is sufficient for both legs
- Risk if unresolved: Regulatory enforcement action, reputational damage, potential licence conditions

---

## Why Now

Three converging pressures make this the right time:

1. **Competitive position is actively deteriorating.** Wise and Airwallex have materially improved their NZ-AU product in the past 18 months — lower fees, faster settlement, better app experience. The bank's $4.2M revenue loss figure is a trailing indicator; the gap will widen if unaddressed.

2. **The infrastructure precondition already exists.** The group has a reciprocal treasury routing arrangement with its Australian counterpart and shared group infrastructure. This removes the largest build risk that would otherwise make a sub-$5 fast payment economically unviable. The commercial and technical groundwork reduces time-to-market substantially compared with building a new correspondent arrangement from scratch.

3. **Regulatory landscape is stable enough to act.** No imminent NZ or AU regulatory change is known to make this window worse than a future one. However (see Constraints), several regulatory notification and confirmation obligations must be initiated promptly — some have lead times measured in business days, not days.

---

## MVP Scope

**In scope for MVP (pilot cohort):**

- NZ-to-AU direction only
- Payments up to NZD $10,000 per transaction
- Customer-facing: send to any Australian bank account (BSB + account number)
- Settlement target: within 2 hours of payment instruction
- Target pricing: under $5 per transaction
- AML/CFT screening applied at NZ leg (sanctions, threshold reporting)
- Routing via intra-group treasury channel; net settlement between NZ and AU entities end-of-day
- Pilot cohort: small, defined segment of enterprise retail customers (exact cohort size TBD with regulatory team — see Constraints)
- Payments above $10,000 automatically routed to existing SWIFT channel at existing pricing

**Explicitly deferred from MVP:**

- AU-to-NZ direction (future phase, contingent on pilot performance)
- Real-time gross settlement (net end-of-day settlement is the MVP mechanism)
- Integration with open banking or third-party payment initiation
- NZ-to-AU business-to-business bulk payment batching
- Currency conversion for payments denominated in AUD at instruction time (NZD instruction, AUD credit — FX handling TBD, see Constraints)

---

## Out of Scope

1. **AU-to-NZ payment direction** — explicitly deferred. This discovery covers NZ-to-AU only. The reverse direction introduces additional regulatory complexity on the AU leg (AUSTRAC obligations as originating jurisdiction) and is a separate scope decision.

2. **Payments above NZD $10,000** — these route to SWIFT and are not part of this feature. The existing SWIFT product is not being modified.

3. **Replacement or modification of the existing SWIFT correspondent banking arrangement** — this feature sits alongside the existing SWIFT channel; it does not replace it. SWIFT is not being decommissioned.

4. **Consumer credit, loan, or mortgage products** — this feature is a payment channel, not a credit product. CCCFA obligations are not in scope unless the payment feature is later bundled with a credit product (which would require a separate discovery).

5. **Third-party access to the intra-group channel** — the routing is internal to the group only. No third-party payment provider accesses the channel.

6. **AU-leg customer onboarding or AU account opening** — the AU counterpart credits the recipient's existing AU account. No new account opening, KYC, or AU-side customer relationship is created by this feature.

---

## Assumptions and Risks

### Assumptions

**[ASSUMPTION]** The existing AML/CFT screening process applied at the NZ leg satisfies the NZ reporting entity obligation in full for this channel — **unconfirmed, requires /clarify before scope is locked.**

> **Why this cannot be assumed closed:** The regulatory context governing this session is explicit: *"AML/CFT liability follows the reporting entity, not the payment channel. Using a proprietary intra-group routing channel does not transfer or reduce the bank's AML/CFT obligations — the bank remains the reporting entity on the NZ leg."* The compliance team's comfort statement addresses the NZ-leg obligation. It does not address whether the *AU-leg* processing (the AU counterpart crediting the recipient's account) creates a separate AUSTRAC reporting obligation for the AU entity — and whether the AU entity's AML/CFT screening is equivalent. The input states: *"Dual-jurisdiction payments: NZ AML/CFT obligations cover the NZ leg only. Counterpart jurisdiction obligations (e.g. AUSTRAC for the AU leg) must be confirmed separately with the counterpart entity — the bank cannot assume its own AML/CFT screening satisfies the counterpart's regulatory requirements."* This confirmation must be obtained from the AU counterpart before pilot launch, not assumed.

**[ASSUMPTION]** The intra-group treasury channel constitutes a payment service type already covered by the bank's existing DIA registration (Payment Services Regulations 2021) — **unconfirmed, requires /clarify before scope is locked.**

> **Why this cannot be assumed closed:** The existing DIA registration covers the bank's current licensed payment service types. Routing retail customer payment instructions through an intra-group treasury channel may constitute a new customer-facing payment service type not covered by the existing licence scope. *"DIA registration must be assessed and confirmed (or exemption confirmed) before piloting with real customers."* The regulatory team's "standard notifications" framing may not include a DIA registration assessment if the team is thinking primarily of RBNZ BS11. This must be explicitly confirmed.

**[ASSUMPTION]** The SWIFT correspondent bank agreement (with the bank's existing correspondent — assumed JPMorgan, Deutsche Bank, or equivalent) permits live retail transaction volume to be routed outside the SWIFT channel without prior written notification or consent — **unconfirmed, requires /clarify before scope is locked.**

> **Why this cannot be assumed closed:** The bank's correspondent bank agreement is a bilateral contract with notification obligations that are independent of regulatory obligations. *"Non-SWIFT routing without prior notification is a contractual breach of the correspondent agreement, regardless of whether the routing is technically functional and regulatory-compliant."* The input does not mention the Treasury team's confirmation that the correspondent agreement permits this routing. This is a pre-pilot contractual gate, not a post-launch documentation item.

**[ASSUMPTION]** Intra-group net settlement of NZD/AUD positions at end of day does not require separate RBNZ FX transaction reporting beyond existing FX reporting obligations — **unconfirmed, requires /clarify before scope is locked.**

> **Why this cannot be assumed closed:** *"Intra-group net settlement of foreign currency positions is an FX transaction reportable to RBNZ, even if no external FX market transaction occurs. Using a group treasury netting arrangement for retail payment settlement does not exempt the underlying FX transactions from reporting requirements."* The input is silent on whether the volume of NZD/AUD net settlement positions created by this channel falls within existing FX reporting arrangements or creates new reporting obligations.

**[ASSUMPTION]** The RBNZ BS11 notification period (30 business days minimum before irreversible project activity) can be satisfied within the 6-month build timeline — **requires immediate confirmation.**

> **Why this is time-critical, not just unconfirmed:** BS11 notification must be filed before *any* irreversible project activity — *"Starting infrastructure provisioning or data migration toolchain work counts as a material step."* If the RBNZ relationship team has not already been briefed, the notification window must be opened now, and the 30-business-day clock begins from RBNZ acknowledgement — not from when the build starts. A 6-month timeline that assumes regulatory notification is a back-end task will be non-compliant. The discovery output should trigger an immediate check: has the RBNZ notification been filed or scheduled?

**[ASSUMPTION]** The AU counterpart's end-of-day crediting process is operationally reliable and contractually committed to a 2-hour settlement SLA for the customer-facing experience — unconfirmed, requires contractual confirmation with the AU counterpart before pilot scope is finalised.

**[ASSUMPTION]** The NZD-to-AUD FX rate applied to the customer's transaction (at what point in the instruction-to-settlement chain the conversion occurs, and who bears the intraday FX risk between instruction and net settlement) has been determined — **unconfirmed; the input is silent on FX rate mechanics.**

**[ASSUMPTION]** The $10,000 threshold (above which payments route to SWIFT) is denominated in NZD at instruction time, and there is no AML/CFT threshold reporting implication of a customer sending multiple sub-$10,000 payments that in aggregate exceed NZD $10,000 — **unconfirmed; structuring risk should be assessed by the AML/CFT team.**

---

### Risks

**R1 — Regulatory notification sequencing risk (HIGH)**
The 6-month timeline is plausible only if RBNZ BS11 notification is filed immediately. If the project initiates infrastructure or toolchain work before the 30-business-day window closes (from RBNZ acknowledgement), the project will be in breach of BS11. This is not a documentation risk — it is a compliance risk that could require the project to pause.

**R2 — AU-leg AML/CFT gap (HIGH)**
If the AU counterpart's AML/CFT screening does not meet AUSTRAC requirements for the AU leg, the AU counterpart is exposed to regulatory action — and the bank, as the originating entity, may face reputational and relationship risk. This is a go/no-go gate for the pilot, not a design detail.

**R3 — Correspondent bank agreement breach (MEDIUM-HIGH)**
Routing live transaction volume through the intra-group channel without notifying the SWIFT correspondent bank is a contractual breach. Discovery of this breach post-launch could result in the correspondent relationship being placed under review, which would affect the bank's existing SWIFT-based international payment product.

**R4 — DIA registration gap (MEDIUM)**
If the new channel constitutes a new payment service type not covered by existing DIA registration, the pilot with real customers cannot proceed until registration is confirmed or an exemption is documented.

**R5 — FX rate and intraday risk (MEDIUM)**
The mechanism is silent on who bears intraday NZD/AUD FX risk between a customer's instruction and end-of-day net settlement. If the bank bears this risk, it needs to be quantified and hedged. If the customer bears it (rate fixed at instruction), the disclosure obligations under CCCFA-adjacent consumer protection rules need to be confirmed.

**R6 — Structuring / smurfing exposure (MEDIUM)**
The $10,000 per-transaction cap, combined with sub-threshold fast settlement, creates a structuring risk if the AML/CFT screening does not include cross-transaction pattern detection. The compliance team's "extending the same AML/CFT logic" statement should be confirmed to include aggregation monitoring, not just per-transaction threshold reporting.

---

## Directional Success Indicators

| Indicator | Baseline | Target | Measurement method |
|---|---|---|---|
| Annual payment revenue lost to competing services | NZD $4.2M/year (operator-stated) | Reduce by ≥ NZD $1M in Year 1 post-full-rollout | Revenue reporting: compare trans-Tasman payment fee revenue 12 months pre- vs. 12 months post-launch |
| Trans-Tasman payment settlement time (customer-perceived) | 1–2 business days (SWIFT) | ≤ 2 hours, measured end-to-end from instruction to AU account credit | Transaction log timestamps (NZ instruction time vs. AU credit confirmation time) |
| Cost per trans-Tasman payment (customer-facing) | $18–25 per transaction (SWIFT channel) | < $5 per transaction for payments ≤ NZD $10,000 | Product pricing configuration; transaction fee reporting |
| Customer adoption rate — enterprise retail segment | `[UNKNOWN BASELINE]` — no existing fast-pay product to benchmark against | ≥ 30% of customers currently using third-party remittance services switch at least one payment to the bank's channel within 6 months of full rollout | CRM tracking of trans-Tasman payment activity; customer survey at 6-month post-launch |
| AML/CFT reporting accuracy on new channel | 100% on SWIFT channel (assumed — no known exceptions) | 100% on new channel from day one of pilot | AML/CFT compliance audit of first 90 days of pilot transactions; zero missed threshold reports or STR filing delays |

---

## Constraints

*Source: operator input and authoritative regulatory context (context-regulated.yml, injected at session start)*

**C1 — RBNZ BS11 notification (HARD — time-critical)**
This feature involves a new payment routing channel and treasury settlement mechanism. Under BS11, this is a material change. RBNZ must be notified at least 30 business days before any irreversible project activity. The notification must be filed before infrastructure provisioning, toolchain build, or data integration work begins. **This is the highest-priority pre-project action item.**

**C2 — AML/CFT Act 2009 (NZ) — NZ-leg obligations confirmed; AU-leg obligations unconfirmed**
The bank's NZ-leg AML/CFT obligations (threshold reporting to FIU, STR filing, originator information on cross-border messages) apply to this channel and must be extended from the SWIFT channel implementation. The AU-leg obligation (AUSTRAC, Anti-Money Laundering and Counter-Terrorism Financing Act 2006) applies to the AU counterpart and must be separately confirmed with the AU counterpart. The bank cannot assume its own AML/CFT screening satisfies the AU counterpart's regulatory requirements.

**C3 — RBNZ FX transaction reporting**
End-of-day intragroup NZD/AUD net settlement positions created by this channel are FX transactions reportable to RBNZ. The bank must confirm with Treasury whether these fall within existing FX reporting arrangements or require new reporting configuration.

**C4 — SWIFT correspondent bank agreement — contractual notification required**
The bank's bilateral correspondent bank agreement requires prior written notification before routing live transaction volume outside the SWIFT channel. Treasury must confirm: (a) whether the agreement permits non-SWIFT routing for retail transactions; (b) what the notification procedure is; and (c) whether consent is required or notification alone is sufficient. This is independent of and in addition to regulatory notifications.

**C5 — Payment Services Regulations 2021 (DIA) — registration or exemption confirmation required**
The new customer-facing channel may constitute a new payment service type. DIA registration must be assessed and confirmed (or exemption documented) before the pilot cohort receives the service.

**C6 — CPG 220 / model risk — AML/CFT screening extension**
If the AML/CFT screening extension involves any ML or AI-based model (e.g. transaction risk scoring, behavioural pattern detection), CPG 220 model validation requirements apply. The model must complete independent validation before being used in live customer-facing decisions on the new channel.

**C7 — 6-month build timeline**
Operator-stated. This is achievable only if regulatory notifications (C1) are initiated immediately. The timeline should be treated as conditional on RBNZ BS11 notification proceeding this week, not as a fixed anchor that will absorb regulatory lead times.

**C8 — Payments above NZD $10,000 route to SWIFT**
Operator-stated hard boundary. The fast channel is explicitly limited to sub-$10,000 transactions. This is both a product design constraint and a risk management parameter.

---

## /clarify Recommendation

This discovery contains **8 unconfirmed assumptions** that affect scope, regulatory compliance, and go-live eligibility. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

1. **[ASSUMPTION]** The existing AML/CFT screening process applied at the NZ leg satisfies the NZ reporting entity obligation in full for this channel — unconfirmed, requires /clarify before scope is locked.
2. **[ASSUMPTION]** The AU counterpart's AUSTRAC obligations for the AU leg have been separately confirmed with the AU counterpart — unconfirmed, requires /clarify before scope is locked.
3. **[ASSUMPTION]** The intra-group treasury channel is covered by the bank's existing DIA registration — unconfirmed, requires /clarify before scope is locked.
4. **[ASSUMPTION]** The SWIFT correspondent bank agreement permits live retail transaction volume to be routed outside the SWIFT channel without prior written notification or consent — unconfirmed, requires /clarify before scope is locked.
5. **[ASSUMPTION]** Intra-group net settlement of NZD/AUD positions does not create new RBNZ FX transaction reporting obligations — unconfirmed, requires /clarify before scope is locked.
6. **[ASSUMPTION]** The RBNZ BS11 notification period can be satisfied within the 6-month build timeline — requires immediate confirmation that notification has been filed or is being filed this week.
7. **[ASSUMPTION]** The NZD-to-AUD FX rate mechanics and intraday FX risk allocation have been determined — unconfirmed; the input is silent on this.
8. **[ASSUMPTION]** The $10,000 per-transaction cap does not create structuring risk that is unaddressed by the proposed AML/CFT screening extension — unconfirmed; aggregation monitoring must be explicitly confirmed as in scope.

**These assumptions must be confirmed or refuted before scope can be locked.** Running `/benefit-metric` with unresolved assumptions — particularly C1 (BS11), C2 (AU-leg AML/CFT), and C4 (correspondent agreement) — produces metrics and timelines that will require material revision after clarification. More significantly: assumptions 2, 3, 4, and 6 are go/no-go gates for the pilot, not documentation preferences.

---

## Attribution

**Contributors:**
- [Operator name] — [Role] — [Date]

**Reviewers:**
- Pending

**Approved By:**
- Pending

> ⚠️ **Governance note:** The Approved By field must be populated before this artefact proceeds to `/benefit-metric`. A non-engineering approver (e.g. product owner, compliance lead, or business sponsor) is expected for M3 attribution tracking. Leaving this field empty will result in a H-GOV hard block at Definition of Ready.

---

## Feature Slug Confirmation

Before I save this artefact, please confirm:

> **Proposed slug:** `2025-01-31-trans-tasman-fast-payments`
>
> All subsequent artefacts for this feature will live in:
> `artefacts/2025-01-31-trans-tasman-fast-payments/`
>
> **Reply:** confirm the slug — or give me a different name

---

## A direct note on the compliance posture stated in the input

I want to be explicit about one thing before this artefact proceeds through approval.

The input states: *"Our compliance team is comfortable that the existing AML/CFT process covers the requirements"* and *"Our regulatory team will manage the standard notifications process."*

I have no reason to doubt either team's competence or intent. However, the regulatory context governing this session identifies specific obligations that are *not* standard notifications and are *not* resolved by extending the existing SWIFT-channel AML/CFT process:

- The **AU-leg AUSTRAC obligation** belongs to the AU counterpart, not to the NZ bank. The NZ bank's compliance team cannot confirm this — only the AU counterpart's compliance team can.
- The **SWIFT correspondent bank agreement notification** is a contractual obligation, not a regulatory one. It is not managed by the regulatory team — it is managed by Treasury. If it is not on the regulatory team's checklist, it will not get done.
- The **DIA payment services registration** assessment is a separate legal analysis from the RBNZ BS11 notification. "Standard notifications" typically means RBNZ — DIA is a different regulator with a different notification process.
- The **RBNZ FX transaction reporting** obligation on intragroup net settlement is not a standard feature of international payment notifications — it is specific to the net settlement mechanism proposed here.

This artefact flags these as `[ASSUMPTION]` items precisely so the right teams can be directed to confirm or close them. The compliance and regulatory teams should be asked specifically about each item, not asked "are we covered?" in general.

---

## Approval Gate

> **Discovery draft complete ✓**
>
> This artefact contains 8 unconfirmed assumptions, 5 of which are go/no-go gates for the pilot. I strongly recommend running **/clarify** before proceeding to `/benefit-metric`.
>
> How do you want to proceed?
> 1. **Run /clarify now** (strongly recommended — 5 of 8 assumptions are pilot go/no-go gates)
> 2. Review and approve without /clarify — skip to sign-off
>
> **Reply:** 1 or 2

---

## Estimate Prompt (E1)

> **Before we move to /benefit-metric:**
> Run `/estimate` to record a rough focus-time forecast for this feature.
> This gives us a Phase 1 baseline for calibration at /improve.
>
> **Reply:** `/estimate` — or `skip` to continue without an estimate

---

*Pipeline state update pending slug confirmation and approval. State will be written to `.github/pipeline-state.json` with `regulated: true`, `complianceProfile: "regulated"`, `complianceFrameworks: ["RBNZ_BS11", "AML_CFT_ACT_2009", "RBNZ_FX_REPORTING", "SWIFT_CORRESPONDENT", "CPG_220", "DIA_PAYMENT_SERVICES"]` on approval. Config governance bridge will read `mapping.governance.gates` from context.yml on write.*

<!-- eval-mode: true -->