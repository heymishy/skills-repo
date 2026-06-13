# Discovery Artefact — Online Fund Switching (KiwiSaver Member Portal)

**Status:** Draft
**Created:** [current date]
**Feature slug:** `YYYY-MM-DD-kiwisaver-fund-switch-online`

---

## Pre-flight: Regulatory context read

Before proceeding to the artefact, I need to flag that several aspects of this brief trigger material regulatory obligations that your input treats as either standard documentation or out-of-scope edge cases. I am surfacing these now because they affect scope, the delivery timeline, and potentially the viability of the 31 March deadline as stated.

The regulated context file identifies the following frameworks as active. I will surface each where relevant in the artefact below.

---

## Problem Statement

KiwiSaver members wishing to switch funds between the scheme's four investment options (conservative, balanced, growth, aggressive growth) must currently submit a paper form processed by the operations team within 10–15 business days. All three named competitors (Fisher Funds, Simplicity, Booster) offer online fund switching with same-day or next-business-day instruction commitment. The scheme is experiencing member attrition attributable in part to this processing gap. The competitive disadvantage is material enough that the board has been briefed. A hard delivery constraint exists: the feature must be live before the 31 March unit price cut-off date to allow members to lock in switches at end-of-financial-year prices.

---

## Personas

**P1 — Growth-to-conservative switcher (market-sensitive member)**
- Role: KiwiSaver member currently in the growth fund, monitoring market conditions
- When they encounter the problem: Ahead of anticipated market volatility, typically near end-of-financial-year, when they want to lock in current unit prices before a decline
- Impact when unresolved: Member submits paper form; 10–15 business day lag means the switch does not commit at the intended unit price date; member bears unintended market exposure; member considers transferring scheme to a competitor

**P2 — Engaged accumulator (regular fund optimiser)**
- Role: Active KiwiSaver member who reviews fund allocation periodically and switches based on life stage or risk appetite changes
- When they encounter the problem: Any time they decide to adjust their fund allocation; paper form friction deters action or causes delays
- Impact when unresolved: Member either tolerates the lag (degraded experience) or switches provider to access real-time control

**P3 — Operations processor**
- Role: Internal operations team member who receives, validates, and submits paper switch forms to the unit registry
- When they encounter the problem: Daily, processing 10–15 business day queue
- Impact when unresolved: High-volume manual workload; error exposure from manual data re-entry; compliance risk from processing delays around regulatory cut-off dates

**P4 — Compliance officer**
- Role: Responsible for FMA notification, member disclosure, and fee change compliance
- When they encounter the problem: At feature launch, and ongoing whenever switching fee rules apply or edge case handling deviates from standard process
- Impact when unresolved: Undisclosed process changes or fee structures create regulatory exposure

---

## Why Now

Three converging pressures:

1. **Competitive parity:** All three named direct competitors have offered online same-day/next-business-day switching for some time. The gap is now a documented factor in member attrition the board cannot adequately explain.
2. **31 March unit price deadline:** The annual end-of-financial-year unit price date creates a concentrated member demand event. Members in growth funds seeking to lock in prices ahead of market volatility need instruction commitment before the 3pm 31 March cut-off. Missing this date is projected to cause member complaints and a spike in account closures.
3. **Board mandate:** The board has explicitly named 31 March as the delivery date. This is not an aspirational target — it is a governance-level commitment.

---

## MVP Scope

**Bounded scope for 31 March delivery:**

A logged-in member using the existing member portal can:

1. Select a target fund from the four available options
2. Review the switch instruction (current fund → target fund, applicable fee if third switch or later in calendar year)
3. Confirm the instruction
4. Receive an on-screen confirmation and email with the switch reference number and estimated processing date
5. The switch instruction is committed to the unit registry on the same business day (before 3pm cut-off), or flagged for next-business-day processing if submitted after cut-off

**Explicit deferrals from MVP:**
- Partial fund splits (e.g. 50% growth / 50% balanced) — deferred post-launch
- Switch history or audit trail visible to the member in the portal — deferred post-launch
- Automated switching rules or scheduled future switches — deferred post-launch
- Edge case members (contributions holiday, active hardship application, very recent joiners) — handled via existing paper fallback; operations team notified by the system when a member is ineligible for online switching

---

## Out of Scope

1. **Partial or split fund allocations** — Members switching to more than one fund simultaneously (e.g. 60/40 split). This requires unit registry configuration work beyond the MVP window and is a separate product decision. Deferred to a post-launch phase.

2. **Automated or rules-based switching** — Lifecycle or date-triggered switching rules (e.g. "move to conservative at age 60"). This is a distinct product capability requiring different regulatory disclosure treatment. Deferred.

3. **Scheme transfers (inter-scheme)** — Moving a member's balance to a different KiwiSaver provider entirely. Entirely separate regulatory and operational process. Out of scope indefinitely for this initiative.

4. **Fee structure redesign** — The $15 third-switch fee is a proposed commercial change. This discovery does not scope the fee product design, legal documentation, member disclosure obligations for the fee change, or the unit registry fee-collection mechanism beyond noting it as a constraint (see below).

5. **Member portal rebuild** — This feature is additive to the existing member portal. Portal UX, authentication, or account management changes are out of scope except where strictly required to surface the switching UI.

6. **Paper form process retirement** — The paper form fallback remains active post-launch. Decommission of the paper process is out of scope for this initiative.

---

## Assumptions and Risks

### Regulatory assumptions — these require immediate /clarify resolution

> [ASSUMPTION] The FMA notification your compliance team describes as "a standard documentation step" may not be standard. KiwiSaver scheme operators are required under the Financial Markets Conduct Act 2013 (FMCA) and associated regulations to notify members of material changes to scheme processes, and in some cases to obtain FMA approval or provide a prescribed period of advance notice before a material change takes effect. **The nature and duration of any required notice period is unconfirmed.** If the notice period is 20 or more business days, and if notification cannot be filed until technical build is sufficiently advanced to describe the new process accurately, the 31 March deadline may not be achievable — not for technical reasons, but for regulatory sequencing reasons. This must be confirmed with your compliance team and, if necessary, with the FMA directly before the project timeline is locked. — **[ASSUMPTION] unconfirmed, requires /clarify before scope is locked.**

> [ASSUMPTION] The proposed $15 switching fee for members making more than two fund switches per calendar year is a change to the scheme's fees and charges structure. Under the FMCA and KiwiSaver Act 2006, fee changes typically require a scheme amendment, updated product disclosure statement (PDS), and member notification with a prescribed notice period (commonly 30 days for fee increases). **Whether the fee change can be introduced simultaneously with the online switching feature, or whether it must precede it, is unconfirmed.** Launching the online feature without the fee change, then adding the fee later, is likely the lower-risk sequencing — but this is a compliance decision, not a product one. — **[ASSUMPTION] unconfirmed, requires /clarify before scope is locked.**

> [ASSUMPTION] The unit registry integration required to commit switch instructions on the same business day assumes the unit registry platform has an API or batch interface that the member portal can call with sufficient reliability and latency for same-day commitment. **The unit registry platform's integration capability, existing API contracts, and same-day cut-off processing behaviour are unconfirmed from the input provided.** — **[ASSUMPTION] unconfirmed, requires /clarify before scope is locked.**

> [ASSUMPTION] The edge case members you propose to route to the paper fallback (contributions holiday, active hardship application, very recent joiners) may have regulatory implications for same-day or real-time switching that affect how they are excluded from the online flow. Specifically: members with an **active hardship application** are subject to a supervisor-administered withdrawal process under the KiwiSaver Act; routing these members to a paper switching form without first confirming with the scheme supervisor that this does not interfere with the hardship process creates compliance risk. — **[ASSUMPTION] unconfirmed, requires /clarify before scope is locked.**

### Commercial and delivery risks

> [ASSUMPTION] The 31 March deadline is presented as fixed. If any of the regulatory sequencing risks above (FMA notification period, fee change notice period) cannot be resolved in time, the project faces a binary outcome: launch without the fee change and with incomplete member notification, or miss the deadline. The board-level commitment to 31 March does not eliminate these constraints — it increases the urgency of resolving them. — **[ASSUMPTION] risk profile requires /clarify before scope is locked.**

> [ASSUMPTION] Member attrition is attributed in part to the lack of online switching. The actual attrition rate, and what proportion is attributable specifically to the switching process gap versus other factors (fund performance, fees, digital experience broadly), is not quantified in the input. This affects the benefit case for /benefit-metric. — **[ASSUMPTION] baseline not confirmed.**

**Other noted risks:**
- 3pm same-day cut-off processing requires both the member portal and the unit registry integration to be operationally reliable within business hours. Any outage on or before 31 March during the peak submission window carries significant reputational and complaints risk.
- The KiwiSaver Act's supervisor oversight obligations (the supervisor is typically a licensed independent trustee, e.g. Public Trust) may require the supervisor to be notified of or to approve the process change. This is not mentioned in the input and is not addressed by the compliance team's FMA notification drafting.

---

## Directional Success Indicators

**S1 — Switch instruction processing time**
- Baseline: 10–15 business days (paper form, current state)
- Target: Same business day commitment to unit registry for online submissions before 3pm cut-off
- Measured via: Unit registry transaction log — timestamp of member submission vs. timestamp of registry commitment

**S2 — Online switching adoption rate**
- Baseline: 0% (no online channel exists)
- Target: ≥ 70% of all switch instructions submitted via online channel within 90 days of launch
- Measured via: Portal submission logs vs. operations paper form intake volume

**S3 — Member attrition rate (switching-related)**
- Baseline: [UNKNOWN BASELINE — current attrition rate attributable to switching process gap is not quantified in the input. Operations and member services data required to establish this.]
- Target: Measurable reduction in transfer-out requests citing switching process as reason, within two annual reporting cycles
- Measured via: Transfer-out exit survey data, scheme transfer records

**S4 — Operations manual processing volume**
- Baseline: 100% of switch instructions processed manually by operations team
- Target: ≤ 15% of switch instructions requiring manual operations handling (edge cases only) within 90 days of launch
- Measured via: Operations case management system — switch instruction intake by channel

**S5 — 31 March cut-off compliance**
- Baseline: Paper process cannot reliably guarantee same-day registry commitment for end-of-year switches
- Target: 100% of online switch instructions submitted before 3pm on 31 March committed to unit registry same day
- Measured via: Unit registry audit log for 31 March processing window

---

## Constraints

**Hard delivery constraint:**
- Feature must be live and accepting member submissions before 3pm on 31 March (current year)

**Regulatory constraints — confirmed or highly probable:**
- **FMA notification requirement (FMCA):** A material change to the scheme's switching process requires FMA notification and member advance notice. The compliance team is drafting notifications; the duration of any required notice period must be confirmed urgently given the 31 March timeline.
- **KiwiSaver Act 2006 — supervisor notification:** The scheme's independent supervisor (licensed trustee) may need to be notified of or approve the process change before go-live. Not currently referenced in the input.
- **Fee change — PDS amendment and member notice:** The $15 third-switch fee requires a scheme amendment and updated PDS. Member notice period (likely 30 days minimum) must be confirmed before the fee is bundled into the MVP scope.
- **CCCFA (if applicable):** KiwiSaver is not a consumer credit product; CCCFA is not directly triggered. However, if any members have related credit facilities, no intersection is expected from the switching feature itself.
- **AML/CFT Act 2009:** Fund switching within a KiwiSaver scheme between the same member's funds does not constitute a reportable transaction under AML/CFT threshold reporting (no cash movement). However, the unit registry integration must preserve the audit trail required for the scheme's AML/CFT obligations as a reporting entity. This should be confirmed with the scheme's AML/CFT compliance officer.

**Technical constraints (unconfirmed):**
- Unit registry platform must support same-day API or batch instruction commitment
- Member portal must support authenticated session management sufficient for a financial transaction instruction (confirm whether current authentication meets FMA guidance on digital financial services)

**Commercial constraint:**
- $15 switching fee (third switch and beyond per calendar year) — commercial decision already made at board level, but implementation is dependent on regulatory sequencing resolution (see Assumptions)

---

## /clarify recommendation

This discovery contains **5 unconfirmed assumptions** that materially affect scope, timeline viability, and regulatory compliance. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

1. **[ASSUMPTION]** The FMA notification requirement is treated as a standard documentation step — the duration of any required member notice period is unconfirmed and may make the 31 March deadline unachievable for regulatory sequencing reasons.

2. **[ASSUMPTION]** The $15 switching fee constitutes a fee change requiring scheme amendment, updated PDS, and a member notice period (likely 30 days) — whether this can be launched simultaneously with the online feature or must be sequenced separately is unconfirmed.

3. **[ASSUMPTION]** The unit registry integration capability (API availability, same-day cut-off processing, reliability under peak load on 31 March) is unconfirmed.

4. **[ASSUMPTION]** The edge case exclusion logic for hardship application members may interfere with supervisor-administered withdrawal processes under the KiwiSaver Act — this has not been reviewed with the scheme supervisor.

5. **[ASSUMPTION]** The board-level 31 March deadline does not account for regulatory sequencing risks — if the FMA notice period or fee change notice period cannot be satisfied by 31 March, the project faces a binary outcome that must be escalated before build begins.

**These assumptions must be confirmed or refuted before scope is locked. Running `/benefit-metric` with unresolved assumptions — particularly the FMA notification timeline — risks producing a delivery plan that cannot be executed without regulatory breach.**

---

## Attribution

**Contributors:**
- [Operator name — Role — Date]

**Reviewers:**
- Pending

**Approved By:**
- Pending

---

## Next steps

Before approving this discovery, I recommend the following actions run in parallel:

1. **Run `/clarify`** to resolve the five assumptions above — in particular the FMA notification sequencing question, which has the potential to invalidate the 31 March delivery commitment at the governance level.
2. **Engage the scheme supervisor** (independent trustee) — their notification and approval obligations are not currently tracked in this discovery and must be confirmed.
3. **Confirm unit registry integration readiness** — a technical spike to confirm the registry can accept same-day online submissions is a critical path item regardless of regulatory sequencing.

---

> **Discovery draft complete — but do not approve until /clarify is run.**
>
> The five unresolved assumptions above include one (FMA notification period) that could invalidate the 31 March commitment entirely. This is not a documentation risk — it is a go-no-go risk for the delivery timeline.
>
> How do you want to proceed?
> 1. Run /clarify now (strongly recommended before timeline is communicated further to the board)
> 2. Review and approve without /clarify — skip to sign-off
>
> Reply: 1 or 2

<!-- eval-mode: true -->