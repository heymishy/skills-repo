# Discovery Artefact — Online Fund Switching (KiwiSaver Member Portal)

**Status:** Draft
**Date:** 2025-07-15
**Feature slug:** `2025-07-15-kiwisaver-fund-switching`
**Artefact path:** `artefacts/2025-07-15-kiwisaver-fund-switching/discovery.md`

---

## Problem Statement

KiwiSaver members who want to switch funds must submit a paper form, which operations processes in 10–15 business days. Competitor schemes (Fisher Funds, Simplicity, Booster) offer online switching with same-day or next-business-day processing. The scheme is losing members to these providers at a rate that cannot be satisfactorily explained to the board.

The problem has a hard temporal dimension: the 31 March unit price cut-off date creates an annual concentration of switching intent among members repositioning ahead of expected market movements. Without online switching, members who want to lock in a switch at year-end unit prices must either submit paper forms well in advance (with no certainty of same-period processing) or switch providers entirely.

**What is not happening that should be:** Members cannot commit a fund switch instruction digitally on the same business day they decide to act. Paper processing introduces a 10–15 business day lag that is commercially untenable against the competitive field.

---

## Personas

### P1 — The Year-End Repositioner
**Role:** Existing KiwiSaver member, growth or aggressive growth fund, typically 45–60 years old, with meaningful accumulated balance.
**When they encounter the problem:** Late March, when they want to move from growth to conservative ahead of the 31 March unit price date to lock in current valuations before expected market volatility. They are time-sensitive: the 3pm 31 March cut-off is a hard deadline with direct financial consequences.
**Cost of current state:** They cannot guarantee same-period processing via paper form. They either submit early (accepting that the switch executes before they intend) or move to a competitor scheme that can process same-day. Loss of this member is a high-value attrition event — these members tend to have above-average balances.

### P2 — The Digitally Active Member
**Role:** Member who monitors their balance online, aged 25–45, comfortable with self-service financial tools.
**When they encounter the problem:** Any time they want to adjust their fund in response to life events (new job, mortgage, change in risk appetite). Currently must request, print, complete, and post a paper form — a process that feels anachronistic relative to competitors.
**Cost of current state:** Friction sufficient to trigger competitor comparison. Even if they do not immediately switch providers, each paper-form experience erodes scheme loyalty.

### P3 — The Operations Team Member
**Role:** Internal staff member responsible for receiving, validating, and processing paper switch forms.
**When they encounter the problem:** Daily. Manual processing is time-consuming, error-prone (incomplete forms, illegible entries), and creates a backlog queue that compresses around year-end.
**Cost of current state:** High manual effort, risk of processing errors, and reputational exposure if a form is processed late relative to a member's intended unit price date.

---

## Why Now

Three converging forces make deferral commercially unacceptable:

1. **Competitive erosion is measurable.** Fisher Funds, Simplicity, and Booster all offer digital switching with same-day or next-business-day processing. The board is asking questions about member attrition that cannot be answered satisfactorily while the paper-only process persists.

2. **The 31 March unit price deadline creates annual urgency.** Members repositioning ahead of year-end have a hard financial reason to be with a scheme that can process their instruction on the day they submit it. Without online switching live before 31 March, the scheme will face concentrated complaints and likely a spike in closures from exactly the members (higher-balance, more financially engaged) who are most valuable to retain.

3. **The board has set a hard delivery date.** 31 March is not a preference — it is the board-mandated delivery deadline. This is the primary constraint against which all scope and sequencing decisions must be evaluated.

---

## MVP Scope

The minimum viable scope to meet the 31 March deadline and address member attrition:

- **Online fund switch submission** via the existing member portal (authenticated session, no new login flow required)
- **Fund selection UI:** member selects target fund from the four available (conservative, balanced, growth, aggressive growth); current fund is displayed for confirmation
- **Same-business-day instruction commitment:** switch instruction is written to the unit registry on the same business day it is submitted (subject to a cut-off time — see Constraints)
- **Confirmation communication:** member receives an email confirmation containing the instruction details and estimated processing date
- **Exclusion handling:** members in scope edge cases (recent joiners, contributions holiday, active hardship) are presented with a message directing them to the paper process; the system does not attempt to process these cases digitally

**Explicit deferrals from MVP:**
- Switching fee enforcement ($15 fee for >2 switches per calendar year — see Out of Scope)
- In-portal switch history or switch status tracking beyond the initial confirmation email
- Switching between partial allocations (i.e., splitting contributions across funds)
- Mobile app delivery (portal only for MVP)

---

## Out of Scope

1. **$15 switching fee implementation:** The proposed fee for members making more than two switches per calendar year is deferred entirely from this release. Introducing a new fee requires member notification in advance of implementation (see FMA/disclosure obligations in Constraints), terms and conditions amendment, and billing/collection logic in the unit registry or member portal. Building this into the 31 March release increases delivery risk without contributing to the core objective. Recommend a separate post-MVP release with its own discovery and regulatory notification lead time.

2. **Partial fund allocation / contribution splitting:** Members directing contributions across multiple funds (e.g. 60% growth / 40% conservative) is a meaningfully different product and data model from whole-fund switching. Defer to a later phase.

3. **Automated edge-case handling (contributions holiday, hardship, recent joiners):** These members will be routed to the existing paper process. The system will identify and message them; it will not attempt digital processing for these cases in MVP.

4. **Mobile application delivery:** Portal-only for MVP. Mobile app parity is a subsequent release.

5. **Real-time unit price display at point of switch:** Members see their current fund and target fund, but live intraday unit price data is not surfaced in the switch flow for MVP.

6. **Self-service switch reversal / cancellation:** Once submitted, a switch instruction cannot be recalled by the member via the portal. Members who change their mind contact operations.

---

## Assumptions and Risks

### Regulatory and Compliance Assumptions

> [ASSUMPTION] The FMA notification process is a standard documentation step that can be completed within the time available before 31 March. — **This assumption carries the highest risk in the artefact and must be resolved immediately.** FMA notification for a material change to scheme processes under the Financial Markets Conduct Act 2013 (FMCA) and the KiwiSaver Act 2006 is not administratively trivial. The scheme's trust deed and the member disclosure document (Product Disclosure Statement, PDS) describe the current switching process. Introducing a digital switching channel with a different processing timeline almost certainly requires a PDS update, which has its own FMA lodgement and member communication lead times. If the compliance team has not already confirmed the FMA notification timeline is compatible with a 31 March go-live, this assumption is the single largest project-level risk. **Requires /clarify before scope is locked.**

> [ASSUMPTION] The $15 switching fee can be introduced post-MVP without legal obstacle. — The scheme's current terms (trust deed and PDS) govern whether a new fee can be introduced by amendment or whether member consent is required. This is not confirmed. If member consent or a FMA-approved PDS amendment is required, post-MVP timing will be constrained. **Requires /clarify before scope is locked.**

> [ASSUMPTION] Advance member notice of the new digital process (before go-live) is a communications task, not a regulatory gate. — Under the KiwiSaver Act and FMCA, material changes to scheme processes may require member notification periods. If the required notice period is, say, 20 business days, and that clock cannot start until FMA lodgement is acknowledged, the effective go-live date is determined by when the notification process starts — not by when development is complete. **Requires /clarify before scope is locked.**

> [ASSUMPTION] The existing unit registry system can accept same-business-day electronic switch instructions via an API or file interface that development can integrate before 31 March. — If the unit registry only accepts batch instructions via an end-of-day file, "same-business-day commitment" is achievable but the integration design must be confirmed. If the unit registry requires a manual step to activate digital instruction intake, this needs to be scoped as a dependency. **Requires /clarify before scope is locked.**

> [ASSUMPTION] The cut-off time for same-period unit price processing is 3pm on 31 March and this cut-off time applies to digitally submitted instructions in the same way it applies to instructions received by the unit registry from other sources. — If the unit registry applies a different cut-off to electronically submitted instructions, the member-facing cut-off communication must reflect that. **Requires /clarify before scope is locked.**

### Commercial and Scope Assumptions

> [ASSUMPTION] The four-fund structure (conservative, balanced, growth, aggressive growth) is stable and no fund creation, closure, or merger is planned within the 31 March delivery window. — A fund change during the build period would require mid-stream UI and integration changes. **Requires /clarify before scope is locked.**

> [ASSUMPTION] The edge-case populations (recent joiners, contributions holiday, active hardship) are small enough that directing them to the paper process does not create a material service gap or regulatory complaint risk. — If hardship applicants, for example, are disproportionately impacted by a year-end switch deadline, routing them to a 10–15 business day paper process could generate FMA complaints. The size and characteristics of these populations should be quantified. **Requires /clarify before scope is locked.**

### Delivery Risks

- **Hard deadline risk is high.** 31 March is fixed. The regulatory notification lead times, unit registry integration complexity, and PDS amendment process each have their own lead times that may not be fully within the project team's control. If any one of these dependencies slips, the delivery date cannot be recovered by accelerating development.

- **The compliance team's characterisation of FMA notification as "standard documentation" is a red flag.** In the context of a scheme operating under the KiwiSaver Act, changing member-facing processes with financial consequences (unit price date, processing timing) is material. This characterisation should be stress-tested against the compliance team's own legal advice, not accepted at face value in the discovery artefact.

- **Operational fallback must be robust at year-end.** If digital switching goes live but experiences outage or degraded performance on 31 March, the paper fallback must be adequately staffed and the cut-off time for paper submissions must be clearly communicated in advance. There is no margin for ambiguity on that date.

---

## Directional Success Indicators

### SI-1 — Fund switch processing time
**Baseline:** 10–15 business days (paper process)
**Target:** Same business day instruction commitment for digitally submitted switches within cut-off time
**Measured via:** Unit registry instruction timestamp vs. member submission timestamp; sampled from first production batch

### SI-2 — Member attrition rate
**Baseline:** [UNKNOWN BASELINE — the operator states attrition is measurable and board-visible but the discovery input does not provide a current attrition rate or a number attributable to switching friction specifically]
**Target:** Reduction in month-on-month member account closures, with particular focus on the post-31-March cohort
**Measured via:** Member account closure data from unit registry, segmented by stated departure reason where available

### SI-3 — Year-end switch instruction volume
**Baseline:** [UNKNOWN BASELINE — paper switch volumes for the March period in prior years are not provided; this data exists in operations records]
**Target:** ≥ 80% of members who intend to switch ahead of the 31 March cut-off submit via digital channel (rather than paper or phone)
**Measured via:** Portal submission logs vs. operations paper processing queue for the March period

### SI-4 — Operations manual processing volume
**Baseline:** [UNKNOWN BASELINE — current number of paper switch forms processed per month not provided]
**Target:** ≥ 70% reduction in paper switch form volume within 90 days of go-live
**Measured via:** Operations processing queue count, month-on-month

### SI-5 — Member confirmation receipt
**Baseline:** Currently, members receive no automated confirmation — they must contact operations to confirm receipt of their paper form
**Target:** 100% of digital switch submissions receive an email confirmation within 5 minutes of submission
**Measured via:** Email delivery logs from member communications platform

---

## Constraints

**C1 — Hard delivery deadline: 31 March**
Board-mandated. All scope and sequencing decisions must be evaluated against this date. This is not negotiable and does not move.

**C2 — FMA notification and PDS amendment lead time**
The Financial Markets Conduct Act 2013 and KiwiSaver Act 2006 govern scheme disclosure obligations. The PDS describes the current switching process. Introducing a digital channel with materially different processing timelines almost certainly requires a PDS update lodged with the FMA and a member notice period before go-live. The compliance team's notification drafting must be confirmed as on a timeline compatible with 31 March. *This is the constraint most likely to determine the effective project timeline — not development.*

**C3 — Unit registry integration**
The scheme's unit registry must accept same-business-day electronic fund switch instructions. The interface type (API, SFTP batch file, portal), instruction format, cut-off time, and any testing/certification requirements imposed by the registry operator are constraints that must be confirmed with the registry provider as a first-order dependency.

> [ASSUMPTION] The unit registry integration is feasible within the time available and does not require a formal change request or extended testing period from the registry operator. — **Requires /clarify before scope is locked.**

**C4 — Trust deed switching provisions**
The scheme's trust deed governs the legal basis on which fund switches are processed. If the trust deed specifies paper form as the required instruction method, a deed amendment (which requires trustee and potentially FMA involvement) is a prerequisite to launching the digital channel. This must be confirmed with the scheme's legal counsel before development begins.

> [ASSUMPTION] The trust deed does not restrict switching instructions to paper form and does not require amendment to permit digital submission. — **Requires /clarify before scope is locked.**

**C5 — Member portal authentication and security**
The digital switch feature handles a financial instruction with unit price consequences. Authentication standards for the existing portal must be confirmed as appropriate for this instruction type. If the portal currently uses username/password without multi-factor authentication, there is a risk that the scheme's obligations under the Financial Markets (Conduct of Institutions) Amendment Act 2022 (CoFI) and its own security policies require MFA before financial instructions can be submitted digitally.

> [ASSUMPTION] The existing member portal authentication meets the security standard required for financial instruction submission without additional uplift. — **Requires /clarify before scope is locked.**

**C6 — $15 switching fee — deferred but legally constrained**
The proposed fee cannot be introduced without confirming the trust deed basis, PDS amendment, and required member notice period. This is explicitly out of scope for MVP but carries its own constraint timeline if post-MVP delivery is planned.

**C7 — Supervised entity status under CoFI**
From 31 March 2025, KiwiSaver scheme managers are licensed financial advice providers or supervised by FMA under the CoFI regime. Any material change to a member-facing service must be assessed for CoFI fair conduct programme obligations. This is in addition to the FMCA/KiwiSaver Act disclosure obligations.

> [ASSUMPTION] The scheme's CoFI fair conduct programme has been assessed for compatibility with the digital switching feature and does not impose additional go-live gates. — **Requires /clarify before scope is locked.**

---

## /clarify recommendation

This discovery contains **10** unconfirmed assumptions that affect scope, timeline, and regulatory compliance. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

1. The FMA notification process is a standard documentation step completable within the time available before 31 March — **this is the highest-priority item**.
2. The $15 switching fee can be introduced post-MVP without legal obstacle (trust deed and PDS basis).
3. Advance member notice of the new digital process is a communications task, not a regulatory gate with a fixed notice period.
4. The unit registry can accept same-business-day electronic switch instructions via an integrable interface before 31 March.
5. The 3pm 31 March cut-off applies to electronically submitted instructions in the same way as other instruction types.
6. The four-fund structure is stable through the delivery window.
7. Edge-case populations (recent joiners, contributions holiday, active hardship) are small enough that paper routing does not create a material service or regulatory complaint gap.
8. The unit registry integration does not require a formal change request or extended testing period from the registry operator.
9. The trust deed does not restrict switching instructions to paper form and does not require amendment to permit digital submission.
10. The existing member portal authentication meets the security standard required for financial instruction submission without MFA uplift.
11. The scheme's CoFI fair conduct programme has been assessed and does not impose additional go-live gates.

**These assumptions must be confirmed or refuted before scope is locked and before development resourcing is committed.** Several of these — particularly trust deed basis, PDS amendment lead time, and unit registry integration timeline — have dependencies outside the project team's direct control. Running `/benefit-metric` or beginning `/definition` with these unresolved produces planning artefacts that will require revision.

---

## Architecture / Technical Context

**Known integration points (to be confirmed):**
- Member portal (existing authenticated web application) — switch UI to be built within this surface
- Unit registry — primary integration dependency; instruction submission interface to be confirmed
- Member communications platform — email confirmation delivery

**Blast-radius note:** The `architecture.ea_registry_authoritative` flag is not confirmed for this session. No EA registry query has been executed. The unit registry integration in particular should be assessed for downstream consumer dependencies — any system that reads fund allocation data from the registry will be affected by same-day switch commitments (e.g. reporting systems, contribution allocation engines).

---

## Attribution

**Contributors:**
- [Operator] — Problem owner / product sponsor — 2025-07-15

**Reviewers:**
- Pending

**Approved By:**
- Pending — *Note: Approved By must be populated before the Definition of Ready gate. A non-engineering approver is expected for governance attribution requirements. Leaving this field empty will result in a hard block at DoR.*

---

## A note on the compliance team's framing

The discovery input characterises FMA notification and member advance notice as "a standard documentation step." This framing should be explicitly tested with the compliance team and, if necessary, with external KiwiSaver legal counsel before the project timeline is locked.

The specific risks that make this characterisation potentially hazardous:

1. **PDS amendment timeline.** If the scheme's PDS describes the switching process (including processing timeframes), replacing a 10–15 business day paper process with a same-business-day digital process is a material change to disclosed terms. A PDS amendment requires FMA lodgement. The FMA does not have a statutory obligation to process amendments within a particular timeframe, though in practice straightforward amendments are processed promptly. The compliance team should confirm whether the PDS requires amendment and what the realistic lodgement-to-clearance timeline is.

2. **Member notice period.** The KiwiSaver Act and the scheme's own governing documents may require that members receive advance notice of material changes to scheme processes. If a 20-business-day notice period applies and that clock cannot start until after PDS clearance, the effective earliest go-live date is a function of regulatory timeline, not development completion.

3. **The $15 switching fee.** Even deferred, this fee requires its own PDS amendment and member notice period. If the intent is to introduce it within the first year post-MVP, the notification clock should start as early as possible. Treating it as a simple post-MVP task understates its compliance lead time.

The 31 March deadline is fixed. The regulatory preparation timeline must be assessed with the same urgency as the development timeline — possibly more, because it is less within the project team's control.

---

> **Discovery draft complete ✓**
>
> Before approving and moving to `/benefit-metric`, this artefact contains 10–11 unresolved regulatory and technical assumptions. Running `/clarify` is strongly recommended — several of the open items (trust deed basis, PDS amendment lead time, unit registry integration scope) have the potential to alter the delivery timeline or constrain MVP scope in ways that affect every downstream artefact.
>
> How do you want to proceed?
> 1. Run `/clarify` now (strongly recommended given regulatory complexity)
> 2. Review and approve without `/clarify` — proceed to sign-off
>
> Reply: 1 or 2

<!-- eval-mode: true -->