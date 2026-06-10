# Discovery Report: Online Fund Switching — KiwiSaver Member Portal

---

## Executive Summary

This feature is deliverable and commercially important. The core user journey is well understood, the competitive case is clear, and the March 31 deadline gives the initiative real urgency. However, several assumptions embedded in the brief carry material risk — regulatory, legal, and operational — that need to be surfaced now before they become delivery problems at the worst possible time. This report names them directly.

---

## What We Understand to Be True

**The problem is real and quantifiable.**
Members are leaving. The paper form process — 10–15 business days — is not a minor inconvenience; it is a structural disadvantage against competitors offering same-day processing. The board's concern is legitimate, and "we're working on it" has likely already run its course as an answer.

**The core feature is well scoped at a high level.**
Member selects target fund → confirms switch → receives confirmation with estimated processing date → switch instruction committed to unit registry same business day. This is a standard enough pattern that the UX and portal engineering work is unlikely to be where the hard problems live.

**The March 31 deadline is not arbitrary.**
The 3pm March 31 cut-off for same-period unit price processing is a real regulatory and operational constraint in the KiwiSaver context. Members moving from growth to conservative ahead of anticipated volatility have a genuine, time-sensitive need. Missing this date has consequences that go beyond member satisfaction — account closures affect FUM, which affects fee revenue, which the board will notice immediately.

---

## What Needs to Be Tested or Clarified

### 1. The FMA Notification Is Almost Certainly Not a Standard Documentation Step

This is the highest-priority risk in the brief, and the characterisation as "a standard documentation step" warrants direct challenge.

**The specific concern:** Introducing online fund switching likely constitutes a material change to the scheme's investment statement, product disclosure statement (PDS), or the trust deed's prescribed member processes — or possibly all three. Under the Financial Markets Conduct Act 2013, material changes to a managed investment scheme's governing documents or disclosure documents require FMA consent or notification *before* the change goes live, not concurrent with it.

More specifically:
- If the current trust deed or SIPO (Statement of Investment Policy and Objectives) specifies the fund switching process (including form submission), changing that process may require trustee approval and potentially a member communication period before implementation.
- If the PDS describes the switching process, it must be updated and the updated version lodged before members can be directed to use the new process.
- The FMA's standard timeline for reviewing material change notifications is not guaranteed to fit inside the window between now and March 31.

**The $15 switching fee compounds this.** Introducing a fee that did not previously exist is almost certainly a material change to member terms. Under the KiwiSaver Act 2006 and the FMC Act, fee changes generally require advance member notification — typically 30 days, though the trust deed may specify longer — and may require trustee and FMA sign-off depending on how the scheme's governing documents are structured. Compliance should confirm:

- Whether the fee requires a trust deed amendment
- Whether it requires member notification before the go-live date, and if so, what the minimum notice period is
- Whether charging a fee for switching is consistent with the scheme's current PDS

**The risk is not that FMA will refuse.** It is that the timeline to *properly complete* the regulatory process may be longer than assumed, and that going live before the process is complete exposes the scheme to enforcement action and — worse for March 31 specifically — the possibility that switches processed through the new system before regulatory approval are invalid.

**Recommended action:** Compliance should not be drafting notifications in parallel with build. A legal and regulatory review should be completed, with a clear answer on whether the go-live date is inside the permissible window, *before* the engineering sprint begins. This is a go/no-go dependency, not a parallel workstream.

---

### 2. Unit Registry Integration Is Where the Real Delivery Risk Lives

The brief frames the technical challenge as a portal feature. The hard problem is almost certainly the unit registry integration.

KiwiSaver unit registries (Adminis, MMC, and similar platforms used by NZ schemes) typically expose switching instruction submission via scheduled batch processes, not real-time APIs. "Committing the switch instruction to the unit registry on the same business day" may mean something very different technically depending on:

- Whether the registry has a real-time or near-real-time API for instruction submission
- What the cut-off times are for same-day processing (the 3pm March 31 cut-off the brief mentions is the unit pricing cut-off, but the registry's own instruction submission cut-off may be earlier — sometimes significantly earlier, such as 11am or noon)
- Whether the registry is the same platform the operations team uses for the paper form process, and if so, whether the same workflow can be triggered programmatically

Questions that need answers before sprint planning:

- Who is the scheme's unit registry provider, and what integration capability do they expose?
- Has anyone spoken to the registry provider about this project and its deadline?
- What is the registry's own cut-off for same-day processing, and is it earlier than 3pm?
- Does the registry have a test or staging environment for integration testing?
- What is the registry provider's own change management or implementation lead time?

If the registry integration requires a custom build or a new API agreement with the registry provider, the March 31 deadline may already be compromised regardless of how fast the portal work moves.

---

### 3. The Edge Cases Are Larger Than Described

The brief acknowledges three categories of edge cases — very recent joiners, contributions holiday members, and members with active hardship applications — and proposes routing them to the paper fallback process. This is operationally reasonable as a short-term position, but the scoping gap is worth naming precisely.

**Very recent joiners:** There is a 90-day period after joining a KiwiSaver scheme during which certain restrictions apply. Members who joined via automatic enrolment may have specific constraints on fund switching timing. The portal needs to either enforce this restriction automatically (by checking join date against the switching eligibility window) or display clear, accurate messaging explaining why the switch cannot be completed online. If the system silently accepts the instruction and operations then manually rejects it, the member experience is worse than the paper form.

**Contributions holiday members:** Contributions holidays do not affect fund switching eligibility under the KiwiSaver Act, but they may affect how the switch processes through the registry depending on scheme rules. Worth confirming this is genuinely a "route to paper" case rather than a "same process, different account state" case.

**Hardship application members:** This is the most sensitive category. A member with an active hardship withdrawal application who also submits a fund switch instruction creates a sequencing problem in the registry — the fund being switched from may be partially or fully redeemed as part of the hardship withdrawal, and the switch instruction may conflict with that. The operations team needs a defined protocol for this scenario *before* go-live, not after the first conflict appears in production.

**Additional edge cases not mentioned in the brief that should be scoped:**

- Members with multiple accounts (some members have accounts with more than one scheme or have transferred mid-year)
- Members in the process of a scheme transfer in or out
- Deceased member accounts where a surviving spouse or estate is managing the account
- Members who have a court-ordered relationship property split in progress
- Members who submitted a paper switch form that is currently in the 10–15 day processing queue — what happens if they also submit via the portal?

The last one is operationally immediate. On go-live day, some members who already have a paper switch in progress will log in to the portal, see no pending switch, and submit a duplicate instruction. The operations team needs a deduplication protocol.

---

### 4. The Switching Fee Requires More Scrutiny

The brief states the $15 fee is "commercially reasonable and within the standard terms most competitors charge." That may be true, but it is worth interrogating the specifics before committing to it.

**Competitive positioning:** Simplicity does not charge a switching fee. Fisher Funds and Booster have varying structures. If the scheme's competitive problem is that members are leaving *because of friction*, introducing a fee — even a modest one — on top of a new feature creates a mixed message. Members who return to the scheme because of the new online switching may immediately encounter a fee they did not expect.

**Threshold mechanics:** "More than two switches per calendar year" means the third switch and beyond incurs the fee. The portal needs to track switch count per member per calendar year, display the member's remaining fee-free switches, and apply the fee correctly at the point of submission. This is non-trivial UX work and requires the portal to be connected to a source of truth for historical switch count. Questions:

- Does the unit registry track switch count per member, or does this need to be tracked in a separate system?
- How are paper switches counted toward the annual limit for members who used the paper process earlier in the calendar year?
- If a switch is submitted but fails or is cancelled, does it count toward the limit?
- What payment method is used to collect the fee? Is it deducted from the member's account balance, charged to a credit card, or invoiced separately? Each option has different UX, legal, and operational implications.

**The fee at March 31:** If the system goes live in late March and a member has already used both of their fee-free switches via the paper process this calendar year, they will encounter the $15 fee at exactly the moment they are most motivated to switch — ahead of the March 31 unit price deadline. That is a high-friction, high-emotion moment to introduce a payment step for the first time. Worth considering whether the fee structure should have a transitional period or whether the calendar year resets in a way that is clearly communicated.

---

### 5. The March 31 Deadline Needs a Realistic Build Assessment

The brief treats March 31 as fixed and does not name a current date or how much runway exists. Without knowing the current date, it is not possible to say definitively whether the deadline is achievable — but it is possible to identify what the critical path looks like.

**Hard dependencies that must be resolved before development can be considered complete:**

1. Regulatory and legal clearance (FMA notification, PDS update, trust deed review, fee change approval)
2. Unit registry integration confirmed and tested (including cut-off times and test environment access)
3. Member notification sent with sufficient lead time under applicable rules
4. UAT completed with real switch scenarios including edge cases
5. Operations team trained on the new process and the fallback protocols
6. Portal infrastructure scaled and load tested for the likely spike in usage around March 31

If any of these is not complete before go-live, the feature either cannot launch or launches with unacceptable risk.

**A question worth asking the board:** Is the goal to be live before March 31, or to be live before March 31 *correctly*? These are not the same thing. A launch that processes invalid switches due to incomplete regulatory approval, or that breaks under load on March 31, is worse than not launching. If the regulatory review reveals that the timeline is not achievable for a fully compliant launch, the board needs to know that now — with a clear explanation of why — rather than discovering it in enforcement correspondence from the FMA in April.

---

## What We Recommend Next

These are sequenced by dependency order, not priority weight alone.

**1. Legal and regulatory review — initiate immediately**
Brief a KiwiSaver specialist and either internal or external regulatory counsel. Specific questions: Does online switching require a PDS update? Does it require FMA notification before go-live? What is the minimum member notification period for the switching fee? Does the trust deed permit the fee, or does it require amendment? What is the realistic timeline for each of these, and does that timeline fit inside the March 31 window?

This review gates everything else. Do not begin sprint planning until there is a clear answer on whether March 31 is a legally viable go-live date.

**2. Unit registry integration scoping — initiate immediately, in parallel with legal review**
Engage the registry provider directly. Get answers on API availability, cut-off times, testing environment, and their own implementation lead time. This is the other gate item. If the registry cannot support same-day instruction submission via API, the core feature promise cannot be delivered as described.

**3. Edge case protocol definition — before development begins**
Operations, compliance, and the product team should produce a written protocol for each edge case category before development begins. This is not about solving every case in code; some will remain manual. But the protocol needs to exist so that the portal can display correct messaging, operations know what to expect, and no member falls through a gap.

**4. Switching fee design decision**
Before the fee is built, confirm: the payment collection mechanism, the switch-count tracking source of truth, how paper switches count toward the limit, and whether a transitional period is appropriate. If this decision is made after development starts, it will require rework.

**5. Revised project plan with realistic dates**
Once legal review and registry scoping are complete, produce a revised project plan with the critical path made explicit. If that plan cannot hit March 31 with all compliance steps completed, escalate to the board immediately with a clear explanation. A 30-day extension with full compliance is a recoverable position. A March 31 launch followed by FMA enforcement action is not.

---

## Summary of Open Questions

| Question | Owner | Urgency |
|---|---|---|
| Does online switching require PDS update or FMA notification before go-live? | Legal / Compliance | Immediate |
| What is the minimum notice period for introducing the $15 fee? | Legal / Compliance | Immediate |
| Does the trust deed permit the fee, or require amendment? | Legal / Trustee | Immediate |
| Who is the unit registry provider, and do they have a real-time instruction API? | Operations / Technology | Immediate |
| What is the registry's instruction cut-off time for same-day processing? | Operations / Registry provider | Immediate |
| What is the registry provider's own implementation lead time? | Technology | Immediate |
| How will paper switches already in the queue be handled at go-live? | Operations | Before go-live |
| How will switch count be tracked for the fee, and does it include paper switches? | Technology / Operations | Before build |
| What is the payment mechanism for the $15 fee? | Product / Finance | Before build |
| What is the defined protocol for hardship application + switch conflicts? | Operations / Legal | Before go-live |

---

*This report reflects a first-pass discovery based on the information provided. It is not a delivery plan. The intent is to identify the questions that must be answered before a delivery plan can be responsibly constructed.*