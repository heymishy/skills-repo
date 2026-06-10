

# Discovery Analysis: Online Fund Switching Feature for KiwiSaver Scheme

## Understanding the Core Problem

You have a clear competitive problem with a clear solution direction. Members are leaving because your fund switching experience is materially worse than competitors — paper forms and 10–15 business days versus online and same-day. Building an online switching feature is the right response. The 31 March deadline is real and commercially significant because it's tied to unit pricing dates that directly affect member outcomes.

I want to make sure this project succeeds, which means I need to flag several areas where the current plan carries more risk than the brief suggests. Some of these are "we need to think harder about this" items. A few are "this could stop the project or create serious regulatory exposure" items. I'll be direct about which is which.

---

## What Is Well-Defined

**The core user journey is simple and well-understood.** Member logs in, selects target fund, confirms, receives confirmation with estimated processing date. Your competitors have proven this UX pattern works. There is no product-market fit risk here — members demonstrably want this capability.

**The deadline is tied to a real business event.** This is not an arbitrary date. The 31 March unit pricing cut-off creates genuine member harm if you miss it. This gives the team a legitimate fixed deadline with a clear definition of what "live" means: members can submit a switch instruction through the portal before the 3pm cut-off on 31 March and have it committed to the unit registry for same-period processing.

**The competitive benchmark is clear.** Fisher Funds, Simplicity, and Booster all offer online switching. You are not inventing a new product category. You are reaching parity. This reduces design risk significantly.

---

## Items That Need Deeper Investigation

### 1. The FMA Notification Is Not a "Standard Documentation Step"

This is the highest-risk item in the brief and it is currently understated.

**What the brief assumes:** Notifying the FMA and giving members advance notice is a routine compliance step that runs in parallel with build.

**What is actually involved:** Under the Financial Markets Conduct Act 2013 and the KiwiSaver Act 2006, changes to how members interact with their scheme — particularly changes that affect how and when fund switching is executed — are likely to require updates to your SIPO (Statement of Investment Policy and Objectives) and potentially your governing document. The FMA does not simply receive a notification and file it. They may review the changes and ask questions. They may require specific disclosure language. The timeline for this is not entirely in your control.

Additionally, the introduction of a new fee (the $15 switching fee) is a material change to member terms that almost certainly requires advance disclosure and may require a formal variation process depending on how your governing document is structured.

**What you need to do now:**

- Get a definitive answer from your compliance team and external legal counsel on exactly what FMA engagement is required, what the minimum lead time is, and whether the fee introduction changes the regulatory pathway.
- Map the regulatory timeline against the 31 March deadline. If FMA review could take 6–8 weeks, you may already be on a critical path that has nothing to do with software development.
- Determine whether you can decouple the feature launch (online switching, no new fee) from the fee introduction, since the fee adds regulatory complexity that could delay the entire project.

**This is not a suggestion to investigate when convenient. If the regulatory timeline does not fit, the 31 March date is at risk regardless of how fast you build the software.**

### 2. The $15 Switching Fee Needs Careful Scrutiny

**Commercial reasonableness is not the only test.** KiwiSaver is a regulated retirement savings scheme. The FMA has published guidance on fees and has historically taken the position that fees should not discourage members from managing their retirement savings appropriately. A fee that penalises members for switching funds more than twice per year could be characterised as a barrier to members responding to changing market conditions or life circumstances.

**Competitor comparison may not support this.** The brief states this is "within the standard terms most competitors charge." This needs to be verified precisely. If your named competitors — Fisher Funds, Simplicity, Booster — do not charge a per-switch fee, introducing one while simultaneously launching the feature that enables switching could create a negative public narrative: "Scheme finally lets members switch online, but charges them for doing it."

**Questions to resolve:**

- Do Fisher Funds, Simplicity, and Booster actually charge a switching fee? At what threshold? Verify this concretely.
- Has your compliance team assessed the fee against current FMA guidance on KiwiSaver fees?
- What is the expected revenue from this fee versus the reputational and regulatory risk? If only a small percentage of members switch more than twice per year, the revenue may be trivial relative to the risk.
- Can the fee be deferred to a later phase so it does not complicate or delay the initial launch?

**My strong recommendation is to launch without the fee and revisit it post-launch based on actual switching volume data.** This simplifies regulatory engagement, simplifies the build, and removes a potential PR problem from your launch.

### 3. The Edge Cases Are Not Edge Cases

**Members on contributions holidays, recent joiners, and members with active hardship applications are not rare exceptions.** In a scheme of 52,000 members you likely have:

- Hundreds to low thousands on contributions holidays at any given time
- A continuous flow of new joiners who may be within minimum membership periods or cooling-off periods
- An ongoing number of hardship applications in various states

The plan to handle these via "paper fallback" is pragmatic for launch, but the implementation details matter significantly.

**What needs to be defined:**

- **Detection:** How does the portal know a member is in one of these categories? Does your member database reliably flag contributions holiday status, join date, and hardship application status? If the portal cannot detect these conditions, you either block switching for members who should be eligible or allow switching for members who should be blocked.
- **User experience:** What does the member see? If a member on a contributions holiday tries to switch and is told "you cannot do this online, please submit a paper form," that is a poor experience but a safe one. If the system silently accepts the switch and it later fails during registry processing, that is a much worse outcome.
- **Regulatory implications:** Are there any categories of member who are legally prohibited from switching funds at certain times? If so, the portal must prevent those switches — not just handle them manually after the fact.

**Minimum requirement for launch:** The portal must correctly identify members who cannot switch online and present them with a clear, specific message explaining why and what to do instead. This means the member data flags must be reliable, which is an integration question that needs to be validated early.

### 4. Unit Registry Integration Is the Technical Crux

The brief mentions "committing the switch instruction to the unit registry on the same business day." This is the core technical challenge and it is not elaborated.

**Questions that determine architecture and feasibility:**

- What unit registry system do you use? Is it a third-party platform (e.g., MMC, FNZ, Apex) or proprietary?
- Does the registry expose an API that accepts switch instructions programmatically, or does it require batch file submission, manual entry, or some other mechanism?
- What is the registry's processing cut-off time? If the registry has a 2pm cut-off for same-day processing and you are promising members a 3pm portal cut-off, you have a one-hour window that may not be viable.
- What happens when the registry is unavailable? What is your fallback? How do you communicate this to the member?
- Does the registry return a synchronous confirmation, or is confirmation asynchronous? This determines whether you can show the member a definitive confirmation or only an acknowledgement.

**If the registry does not have a real-time API, the "same-day processing" commitment may require building a queue-and-batch mechanism with a cut-off time earlier than 3pm, which changes the member proposition.**

This needs to be investigated and confirmed within the first week of the project. The integration model with the registry determines the architecture of everything behind the confirmation screen.

### 5. The 31 March Deadline Needs a Scoped "Minimum Viable Launch"

Given the hard deadline, you need to define explicitly what "live before 31 March" means at its most minimal, so that if scope pressure builds, the team knows what to protect and what to cut.

**Proposed minimum viable launch scope:**

- Authenticated members can log into the existing portal
- Members can select a target fund from the four available funds
- The system validates that the member is eligible for online switching (not in an excluded category)
- The member confirms the switch with a clear disclosure of what will happen and when
- The switch instruction is committed to the unit registry (or queued for same-day batch submission before the registry cut-off)
- The member receives an on-screen confirmation and an email confirmation with an estimated processing date
- Members in excluded categories see a clear message directing them to the paper process
- An operations dashboard or notification allows the ops team to monitor online switches

**Explicitly out of scope for initial launch (can follow in subsequent releases):**

- The $15 switching fee
- Ability to do partial switches (e.g., move 50% of balance to a different fund)
- Switching history visible in the portal
- Automated notifications of switch completion (manual email from ops is acceptable at launch)
- Mobile-optimised experience (if the portal is currently desktop-oriented, do not redesign for mobile under this deadline)

**Does this minimum scope align with your expectations? Are there items I have placed out of scope that you consider essential for the 31 March launch?**

---

## Risks Summary

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| FMA notification/approval timeline exceeds available time before 31 March | **Critical** | Medium-High | Engage external counsel immediately; get definitive timeline within one week; consider decoupling fee from launch |
| $15 switching fee triggers FMA scrutiny or member backlash | High | Medium | Defer fee to post-launch phase |
| Unit registry does not support real-time or same-day API integration | **Critical** | Unknown | Investigate registry capabilities in first week; this is a go/no-go dependency |
| Edge case member categories not reliably detectable in member data | High | Medium | Audit data quality for contributions holidays, join dates, and hardship flags immediately |
| Registry cut-off time is earlier than the 3pm member-facing cut-off | Medium | Unknown | Confirm registry processing windows; set portal cut-off to match |
| Team focuses on building software while regulatory path remains unresolved | **Critical** | High | Run regulatory and technical workstreams in parallel from day one; regulatory blockers must be surfaced within first two weeks |

---

## Recommended Immediate Next Steps

1. **This week:** Get a definitive legal opinion on the FMA notification pathway and timeline, specifically addressing whether the feature launch and the fee introduction can be decoupled, and what the minimum lead time is for each.

2. **This week:** Confirm the unit registry integration model — API availability, cut-off times, confirmation mechanism, and downtime/fallback procedures.

3. **Within two weeks:** Validate member data quality for the excluded categories (contributions holidays, recent joiners, hardship applications). Determine whether the portal can reliably detect these conditions.

4. **Within two weeks:** Align on the minimum viable launch scope. Get explicit sign-off from the product owner and the board sponsor that the scoped minimum is sufficient to meet the 31 March commitment.

5. **Decide on the fee:** My recommendation is to remove the $15 fee from the launch scope entirely. If you proceed with it, accept that it adds regulatory complexity and timeline risk to a project with a hard deadline.

---

## What I Need From You to Proceed

- Confirmation or correction of the minimum viable scope I have outlined
- Access to your compliance team's current understanding of the FMA notification requirements and timeline
- The name and integration documentation for your unit registry provider
- Clarity on whether the $15 fee is a firm requirement for launch or can be deferred
- Identification of the edge case member categories and how they are currently tracked in your systems

This project is feasible for the 31 March deadline, but only if the regulatory and registry integration questions are answered quickly and favourably. The software build is not the hard part. The hard parts are the things that are not fully in your control — and those need to be de-risked first.