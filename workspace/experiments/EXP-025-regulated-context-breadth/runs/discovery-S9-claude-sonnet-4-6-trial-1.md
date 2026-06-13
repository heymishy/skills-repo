I'll read the product context and reference materials before we begin.

No `product/` directory or `artefacts/` reference folder appears to exist for this initiative, so I'll work from what you've provided directly.

Before I draft the artefact, I need to flag something that affects both your timeline and your compliance framing — because the regulatory picture here is materially more complex than your brief suggests, and locking scope without surfacing it would produce a discovery artefact that fails at the Definition of Ready gate.

---

## Regulatory flags — requires your confirmation before scope is locked

You've described the FMA notification as "a standard documentation step." Based on the regulatory context applicable to your jurisdiction, I need to challenge that characterisation across three areas:

---

**Flag 1 — FMA notification: this is not a documentation step**

The Financial Markets Conduct Act 2013 (FMC Act) governs KiwiSaver scheme administration. Introducing a new member-facing transaction channel — particularly one that changes the processing timeline for fund switches — is a material change to how the scheme operates. The FMA expects to be notified of material operational changes, and the scheme's trust deed and Product Disclosure Statement (PDS) likely specify the current process (paper-based, 10–15 business days). If they do, the new process requires a PDS amendment or a Scheme Amendment, which requires FMA notification and a member communication period *before* the new process goes live.

This is not a documentation step that runs in parallel with build. It is a regulatory prerequisite that must complete before members can use the feature. The notification period itself — not just the drafting — needs to fit within your 31 March timeline.

**I cannot confirm the notification lead time from what you've provided.** This is a hard assumption that must be resolved with your compliance team *and* legal counsel before scope is locked.

---

**Flag 2 — The $15 switching fee: this is a scheme amendment, not a commercial decision**

KiwiSaver fees are governed by the FMC Act and must be disclosed in the PDS. Introducing a new fee — even one described as commercially reasonable — requires:

1. A formal scheme amendment approved by the trustee
2. Updated PDS disclosure
3. Member notification *before* the fee takes effect (typically 30 days advance notice is the minimum, but your trust deed may specify more)

Competitors charging similar fees does not make this fee immediately available to you. The member notification period alone may conflict with your 31 March delivery date if the fee is intended to be live at launch.

**This needs to be scoped as a separate regulated change, not bundled into the online switching feature without its own compliance pathway.**

---

**Flag 3 — Unit registry integration: same-day commitment has settlement implications**

You have described wanting to "commit the switch instruction to the unit registry on the same business day." Unit registry operations for KiwiSaver funds involve:

- End-of-day unit pricing (NAV calculation)
- Settlement cut-off times that vary by fund type (the aggressive growth fund will have different settlement characteristics than the conservative fund)
- The 3pm 31 March cut-off you've referenced is real, but it is a unit pricing date — not just a portal submission timestamp

"Same-day commitment" in your portal does not automatically mean same-day registry processing. The instruction must reach the unit registry *and* be accepted before the relevant cut-off. If your unit registry is operated by a third party (FundRock, MMC, or equivalent), their cut-off times and API availability will govern what "instant" actually means. This is a technical integration dependency that is currently unscoped.

---

With those flags on the table: I have enough to write the discovery artefact in a single pass. I'll surface these as `[ASSUMPTION]` items requiring `/clarify` before scope is locked.

Let me confirm two things before I write the artefact:

**Q1 — Attribution:** Who contributed to this discovery? I need name(s) and role(s) for the Attribution section.

**Q2 — Feature slug:** Shall I use `2025-[today]-kiwisaver-online-fund-switching` as the folder name, or would you prefer a different slug?

---

*While you answer, I'll proceed to draft the full artefact given the 31 March urgency — I'll mark it as pending attribution confirmation.*

---

# Discovery Artefact — KiwiSaver Online Fund Switching

**Status:** Draft — pending attribution and /clarify resolution
**Feature slug:** `YYYY-MM-DD-kiwisaver-online-fund-switching` *(confirm slug)*
**Artefact path:** `artefacts/[slug]/discovery.md`

---

## Problem Statement

KiwiSaver members who wish to switch funds are required to submit a paper form, which the operations team processes within 10–15 business days. This processing time is materially slower than the same-day or next-business-day switching offered by competitor schemes (Fisher Funds, Simplicity, Booster). The scheme is experiencing member attrition that is increasingly difficult to justify to the board. The problem is acute at unit price dates: members who wish to lock in a fund switch at the 31 March end-of-financial-year unit price cannot do so through a channel that is reliably fast enough to guarantee same-period processing. The current paper process creates reputational, competitive, and member retention risk that is compounding.

---

## Personas

**1. Active fund switcher — self-directed member**
- Role: KiwiSaver member who monitors market conditions and makes deliberate asset allocation decisions
- When they encounter the problem: When they decide to switch funds ahead of a market event or unit price date and discover the 10–15 business day paper process cannot guarantee the switch lands in the intended pricing period
- Cost when unresolved: Misses intended unit price date; potential financial loss if switching from growth to conservative before a downturn; member considers closing account or transferring to a competitor

**2. Passive member approaching retirement**
- Role: Member in the 50–65 age cohort who has been advised to de-risk their portfolio by moving to conservative or balanced
- When they encounter the problem: When following financial adviser or Sorted guidance to reduce risk exposure and finding the switch process is opaque and slow
- Cost when unresolved: Risk exposure longer than intended; loss of confidence in scheme administration; accelerated transfer to competitor

**3. Operations staff member**
- Role: Internal staff who manually process paper switch forms
- When they encounter the problem: Every day — processing volume is manual, error-prone, and creates a backlog that worsens at peak periods (e.g. market volatility events near 31 March)
- Cost when unresolved: Continued manual processing overhead; member complaints escalated to operations team; reputational damage during market events

*Note: Three member edge-case groups have been identified but are explicitly deferred to out-of-scope: recently joined members, members on contributions holiday, members with active hardship applications. These personas are excluded from MVP scope.*

---

## Why Now

Three compounding pressures make this urgent:

1. **Competitive parity gap:** Fisher Funds, Simplicity, and Booster all offer online fund switching with same-day or next-business-day processing. The scheme's paper-only process is no longer a market-standard offering — it is a material disadvantage.

2. **31 March unit price date:** Members wishing to lock in a fund switch at the end-of-financial-year unit price — particularly those moving from growth to conservative ahead of anticipated market volatility — require same-day commitment before the 3pm March 31 cut-off. Without an online channel live before this date, the scheme expects significant member complaints and an elevated account closure rate. The board has set 31 March as a hard delivery date.

3. **Board accountability:** Member attrition attributed to the switching friction has reached the threshold where it requires board-level explanation. The inability to offer a comparable member experience to competitors is a governance concern, not only a product one.

---

## MVP Scope

The minimum viable feature is an online fund switch flow accessible through the existing member portal, covering the following:

- **Member authentication:** Uses existing portal login (no new auth mechanism in MVP)
- **Fund selection:** Member can view their current fund and select a target fund from the four available (conservative, balanced, growth, aggressive growth)
- **Confirmation flow:** Member reviews the switch, confirms intent, and receives an on-screen confirmation with an estimated processing date
- **Same-business-day registry commitment:** The switch instruction is committed to the unit registry on the same business day as submission, subject to cut-off times established with the unit registry operator
- **Email confirmation:** Member receives an automated email confirming the instruction was received and the estimated processing date
- **In-scope member cohort:** Standard members only — no contributions holiday, no recent-joiner edge cases, no active hardship applications in MVP

**Explicit MVP deferrals:**
- $15 switching fee (deferred — requires separate scheme amendment and PDS disclosure process; see Flag 2 above)
- Edge-case member cohorts (recent joiners, contributions holiday, hardship applications) — deferred to post-MVP, handled via existing paper fallback
- Mobile app version — deferred; MVP is portal web only
- Switch scheduling (future-dated switches) — deferred
- Partial fund switching (splitting balance across multiple funds in a single transaction) — deferred

---

## Out of Scope

1. **$15 switching fee:** Introducing a new fee requires a scheme amendment, trustee approval, PDS update, and advance member notification. This cannot be bundled into the 31 March delivery without its own compliance pathway. It is out of scope for this initiative and must be treated as a separate regulated change.

2. **Edge-case member cohorts:** Members who joined within the last [X] days, members on contributions holiday, and members with active hardship applications are out of scope for MVP. Operations will continue to process these via the existing paper fallback.

3. **Unit registry replacement or re-platforming:** This feature assumes the existing unit registry remains unchanged. No changes to the registry operator, registry platform, or settlement arrangements are in scope.

4. **Automated eligibility adjudication for deferred cohorts:** The portal will not attempt to detect, route, or adjudicate edge-case member eligibility. If a member falls into a deferred cohort and submits a switch request, the handling logic for this scenario is out of scope and must be defined before MVP launch.

5. **Adviser-initiated switches:** Fund switches initiated by a financial adviser on behalf of a member are out of scope. MVP covers member-initiated switches only.

6. **Retrospective application to paper switches in flight:** Any paper switches already submitted and in the processing queue at the time of launch will continue through the paper process. No retrospective migration.

---

## Assumptions and Risks

**[ASSUMPTION]** The FMA notification required before launching the new channel is a "standard documentation step" that can be completed in parallel with build without affecting the 31 March delivery date — **unconfirmed; requires /clarify before scope is locked.** If the notification triggers a mandatory member communication period or a PDS amendment process, the effective launch date may be constrained by regulatory lead time, not build completion.

**[ASSUMPTION]** The current Product Disclosure Statement and trust deed do not specify a processing timeframe for fund switches in terms that would require a formal scheme amendment to change — **unconfirmed; requires /clarify before scope is locked.** If the PDS references "10–15 business days" or equivalent, a PDS amendment is required before the new channel can go live.

**[ASSUMPTION]** The $15 switching fee can be introduced as a separate initiative without affecting the 31 March scope or timeline — **unconfirmed; requires /clarify before scope is locked.** If the fee was intended to be live at launch, the compliance pathway (scheme amendment, trustee approval, member notification period) makes this incompatible with the 31 March deadline.

**[ASSUMPTION]** The unit registry operator (identity not confirmed in the brief) has a supported API or integration mechanism that can accept switch instructions on a same-business-day basis and confirm commitment before the 3pm 31 March cut-off — **unconfirmed; requires /clarify before scope is locked.** If the unit registry requires batch file submission or has a different cut-off, "same-day commitment" may not be achievable at MVP.

**[ASSUMPTION]** The existing member portal has sufficient authentication, session management, and capacity to support online transactional fund switching without architectural changes — **unconfirmed; requires /clarify before scope is locked.**

**[ASSUMPTION]** The eligibility logic for determining which members are *not* eligible for online switching (contributions holiday, hardship, recent joiners) can be determined from data available in the portal's existing member data layer without requiring new integrations — **unconfirmed; requires /clarify before scope is locked.** If this data is not available to the portal, the feature may inadvertently accept switch requests from ineligible members.

**Key risk:** The 31 March deadline is a hard business constraint, but it is not within the delivery team's control to guarantee. Two external dependencies — FMA notification lead time and unit registry integration readiness — could independently prevent go-live before the cut-off date. The board should be aware that the 31 March date is contingent on these external factors being resolved promptly.

---

## Success Indicators

**1. Switch instruction submission-to-registry commitment time**
- Baseline: 10–15 business days (current paper process)
- Target: Same business day for submissions received before unit registry cut-off time
- Measured by: Registry transaction log timestamps vs. portal submission timestamps; reported weekly post-launch

**2. Member attrition rate — fund switching as stated reason**
- Baseline: `[UNKNOWN BASELINE]` — operator has not provided a numeric attrition rate; the brief states it is "increasingly difficult to explain to the board" but no figure is given
- Target: Measurable reduction in transfer-out requests citing switching friction within 2 full calendar months post-launch
- Measured by: Exit survey data; transfer-out reason codes in member management system

**3. Paper switch form volume**
- Baseline: `[UNKNOWN BASELINE]` — current weekly/monthly paper switch volume not provided
- Target: ≥ 70% of eligible switch requests submitted via online channel within 90 days of launch
- Measured by: Portal switch submission count vs. operations team paper form processing count

**4. 31 March cut-off compliance**
- Baseline: N/A (new capability)
- Target: 100% of switch instructions submitted via portal before 3pm 31 March are committed to the unit registry on 31 March and eligible for that date's unit price
- Measured by: Registry audit log for 31 March; compared against portal submission timestamps

**5. Operations processing overhead**
- Baseline: `[UNKNOWN BASELINE]` — current operations FTE hours spent on manual switch processing not provided
- Target: Measurable reduction in operations team time spent on standard switch processing post-launch
- Measured by: Operations team time-tracking (or estimate if formal tracking is not in place)

---

## Constraints

1. **Hard delivery deadline: 31 March** — Board-mandated. Feature must be live and accessible to members before the 3pm cut-off on 31 March for the end-of-financial-year unit price date.

2. **FMA notification obligation** — Launching a new member-facing transaction channel for a KiwiSaver scheme requires FMA notification and potentially member advance notice before go-live. The notification and any required member communication period must complete before launch. Timeline is currently unconfirmed. *(See Flag 1 above.)*

3. **PDS and trust deed compliance** — If the current PDS or trust deed specifies the paper-based process or processing timeframe, a formal scheme amendment with trustee approval is required before the new process is valid. This is a regulated change with its own lead time. *(See Flag 1 above.)*

4. **Unit registry integration dependency** — Same-business-day commitment requires a confirmed integration pathway with the unit registry operator, including their cut-off times. This is an external dependency not currently scoped. *(See Flag 3 above.)*

5. **$15 switching fee excluded from scope** — The fee requires a separate scheme amendment, PDS update, and advance member notification. It cannot be delivered within the 31 March scope without risk of regulatory non-compliance. *(See Flag 2 above.)*

6. **Existing member portal as delivery vehicle** — MVP must be delivered within or alongside the existing member portal. No new member-facing platform is in scope.

7. **FMC Act 2013 — KiwiSaver scheme administration obligations** — The scheme operates under the Financial Markets Conduct Act 2013. All member-facing changes to scheme administration must comply with FMC Act disclosure, notification, and member communication requirements.

---

## /clarify recommendation

This discovery contains **6 unconfirmed assumptions** that affect scope, timeline, and regulatory compliance. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- [ASSUMPTION] The FMA notification is a "standard documentation step" completable in parallel with build without affecting the 31 March delivery date — unconfirmed; requires /clarify before scope is locked.
- [ASSUMPTION] The current PDS and trust deed do not specify a processing timeframe requiring a formal scheme amendment to change — unconfirmed; requires /clarify before scope is locked.
- [ASSUMPTION] The $15 switching fee can be introduced as a separate initiative without affecting the 31 March scope — unconfirmed; requires /clarify before scope is locked.
- [ASSUMPTION] The unit registry operator has a supported API enabling same-business-day commitment before the 3pm 31 March cut-off — unconfirmed; requires /clarify before scope is locked.
- [ASSUMPTION] The existing member portal has sufficient architecture to support transactional fund switching without structural changes — unconfirmed; requires /clarify before scope is locked.
- [ASSUMPTION] Eligibility logic for ineligible member cohorts can be determined from data already available in the portal's member data layer — unconfirmed; requires /clarify before scope is locked.

**These assumptions must be confirmed or refuted before scope is locked.** The two most time-critical are the FMA notification lead time and the unit registry integration pathway — both have external parties who must be engaged immediately if the 31 March deadline is to remain achievable. Running `/benefit-metric` before these are resolved will produce metrics that require revision after clarification.

---

## Attribution

**Contributors:**
- [Pending — please provide name(s) and role(s)]

**Reviewers:**
- Pending

**Approved By:**
- Pending

---

> **Discovery draft complete ⬡**
>
> Before approving and moving to `/benefit-metric`, I strongly recommend running **/clarify** — particularly on the FMA notification lead time and unit registry integration pathway. These are not documentation risks; they are go/no-go dependencies for the 31 March deadline.
>
> **The $15 switching fee requires immediate attention:** if the board is expecting this to launch alongside the online switching feature, your compliance team needs to be briefed now that it requires a separate scheme amendment process.
>
> How do you want to proceed?
> 1. Run /clarify now (strongly recommended given the regulatory flags)
> 2. Review and approve without /clarify — skip to sign-off
>
> Also: please confirm contributor name(s) and role(s), and confirm or adjust the feature slug.

<!-- eval-mode: true -->