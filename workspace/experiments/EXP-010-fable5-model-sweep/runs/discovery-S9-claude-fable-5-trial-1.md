# Discovery Output: Online Fund Switching — KiwiSaver Member Portal

---

## 1. Problem Statement (Validated Framing)

**Stated problem:** Paper-based fund switching (10–15 business days) is uncompetitive against Fisher Funds, Simplicity, and Booster, and is cited as a driver of member attrition.

**Discovery note — validate the causal link before committing scope.** "Members are leaving and our switching is slow" is a correlation, not yet a confirmed cause. Before the board treats this feature as the attrition fix, you need:

- Exit data: how many departing members actually cited switching speed (exit surveys, transfer-out reasons, complaints log)?
- Switch volume baseline: how many switches per month today, and what's the seasonal profile around 31 March?
- Whether attrition correlates more strongly with fees, returns, brand, or adviser channels.

If switching friction explains only a fraction of attrition, the board needs that framing *now* — otherwise this project will be judged against a retention outcome it cannot deliver alone.

---

## 2. Critical Findings — Items That Threaten the 31 March Date

These are raised first because the brief contains three assumptions that, in my assessment, are materially wrong or untested.

### 2.1 The regulatory step is not "standard documentation" 🔴

The brief treats FMA notification and member notice as a paperwork formality. It very likely is not, for two distinct reasons:

**(a) The new $15 fee is a change to the offer, not a process change.** Introducing a switching fee almost certainly requires:

- An update to the **Product Disclosure Statement** and fee disclosures on the Disclose Register;
- Review against the **KiwiSaver Act 2006 "not unreasonable fees"** requirement (the FMA and supervisor actively scrutinise new fees);
- **Supervisor consent or consultation** under your trust deed/governing document — check whether fee changes require supervisor sign-off and what their review SLA is;
- A **minimum member notice period** for adverse changes — this may be set by your trust deed or by fair-dealing expectations, and is commonly 30+ days.

If the fee requires a PDS amendment plus supervisor review plus a member notice window, **the fee alone could consume more calendar time than remains before 31 March.**

**(b) Fair dealing exposure around volatility-driven switching.** Your own brief says the launch use case is members rushing growth → conservative ahead of expected volatility. The FMA publicly criticised KiwiSaver providers after the March 2020 COVID switching wave, where members crystallised losses by panic-switching. Launching a frictionless switching tool *timed to a volatility event* without risk warnings, cooling-off messaging, or guidance signposting is a foreseeable conduct issue. This needs compliance and supervisor input as a design requirement, not a post-launch fix.

**Recommendation:** Split the fee from the launch. Ship switching with no fee at go-live; introduce the fee later via the proper disclosure cycle. This removes the largest regulatory dependency from the critical path. (See §6, Phasing.)

### 2.2 "Instant" needs definition — members care about the pricing date, not the registry timestamp 🔴

The brief conflates two things:

- **Instruction commitment**: getting the switch instruction into the unit registry same-day. An operational/integration question.
- **Unit pricing date**: which day's unit prices the sell and buy legs are struck at. This is what members locking in "this year's unit prices" actually care about.

Open questions that determine whether the headline promise is even possible:

1. Who operates your unit registry (in-house or outsourced — e.g., a third-party administrator)? What is their instruction cut-off, file format, batch schedule, and same-day capability? **If the registry is outsourced, the administrator's roadmap is your roadmap.**
2. Are switches priced same-day, T+1, or forward-priced? Are the sell and buy legs priced on the same date?
3. What exactly does "submitted before 3pm 31 March" guarantee the member? This must be precisely worded in the confirmation screen — an inaccurate "your switch is locked at 31 March prices" statement is a fair-dealing breach if pricing actually lands T+1.

**The confirmation message and estimated processing date logic are compliance artefacts, not UX copy.** They need sign-off from compliance and the registry operator.

### 2.3 The launch date is also the peak-load date 🔴

You are proposing to go live with a brand-new feature *immediately before* the single highest-demand, highest-stakes moment of the year, with a hard 3pm cut-off. This is the worst possible go-live profile: no soak period, no volume ramp, and failure happens in front of the exact members you're trying to retain.

Specific scenarios to scope now:

- Instruction submitted at 2:59pm but registry commit fails — what's the member's recourse and your legal position?
- Portal outage between 1pm–3pm on 31 March — what's the fallback (phone? email instruction? extended cut-off?) and has compliance approved it?
- Load: what's your projected peak concurrent switching volume, and has the portal/registry integration been load-tested against it?
- Queue semantics after 3pm: does the instruction reject, or queue for next-period pricing with explicit member acknowledgement?

**Recommendation:** Go live no later than **early-to-mid March** with a soft launch (staged member cohorts), so 31 March is a peak-load day on a proven system — not launch day. If the build can't make early March, the honest conversation with the board is contingency planning, not date compression.

---

## 3. Edge Cases: "Paper Fallback" Is a Design Requirement, Not an Exclusion

The brief defers recent joiners, savings suspensions ("contributions holiday" is the legacy term), and hardship applicants to manual handling. That's a reasonable *processing* decision, but it creates **portal-side scope**: the system must *detect* these states and route the member appropriately. That means eligibility rules, data availability, and member messaging — all in scope for the build.

Additional excluded/special states discovery surfaced that the brief missed:

| Member state | Question to resolve |
|---|---|
| Recent joiners | Why excluded? Pending first contribution? Default-fund cohort rules? Define the threshold precisely. |
| Savings suspension | Why does suspension block a switch? Validate this is a real constraint, not an assumed one — suspended members can usually still switch. |
| Active hardship application | Pending withdrawal makes unit balance unstable — confirm with registry. |
| Pending first-home withdrawal | Same instability issue — likely needs blocking. |
| Pending transfer-out / scheme transfer | In-flight balance — block. |
| Deceased member / estate in progress | Block. |
| Court orders / relationship property splits | Block or route to ops. |
| Minors / under-18 accounts | Who has authority to instruct? |
| Members with in-flight paper switch | Prevent duplicate/conflicting instructions across channels. |
| Split allocations | Does your scheme allow members to hold multiple funds simultaneously, or full-balance switches only? This is a fundamental scope decision the brief doesn't address. |

**Key risk:** if the eligibility check silently fails and an excluded member completes an online switch (e.g., mid-hardship-withdrawal), you get a reconciliation break and a complaint. Eligibility rules need the same rigour as the happy path.

---

## 4. The $15 Fee — Open Questions (If Retained)

Beyond the regulatory issues in §2.1:

1. **Counting rules**: calendar year is stated — confirm vs financial year, and confirm whether paper switches count toward the two free switches. (If not, you've created an arbitrage that re-incentivises the paper channel you're trying to retire.)
2. **Collection mechanism**: deducted from account (a unit redemption — registry and tax treatment implications) or invoiced?
3. **Discl