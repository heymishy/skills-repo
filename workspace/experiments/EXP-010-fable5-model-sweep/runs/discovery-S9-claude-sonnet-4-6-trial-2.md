# Discovery Report: Online Fund Switching — KiwiSaver Member Portal

---

## Executive Summary

This discovery surfaces several issues that require resolution before build begins. The core online switching feature is well-motivated and technically achievable. However, the regulatory pathway is more complex than currently assumed, the March 31 deadline carries material delivery risk, and three scoped edge cases involve legal obligations that cannot be routed to a manual paper fallback without further analysis. These findings do not block the project but they do change the shape of the work.

---

## What We Understand the Problem to Be

Members cannot switch funds without submitting a paper form and waiting up to 15 business days. Competitors offer online switching with same-day or next-business-day processing. The scheme is losing members and cannot adequately explain the attrition to its board.

The goal is an online fund switching feature in the member portal that commits a switch instruction to the unit registry on the day of submission, with visible confirmation to the member.

This is a well-defined problem with a clear competitive rationale. We have high confidence in the problem statement.

---

## Assumptions That Need to Be Tested

### 1. "FMA notification is a standard documentation step"

This is the assumption carrying the most risk in the entire project brief.

Introducing a new transaction channel for a KiwiSaver fund switching instruction is not a cosmetic change to an existing process. Under the Financial Markets Conduct Act 2013 and the KiwiSaver Act 2006, changes to the way members can exercise scheme rights — including the medium through which switching instructions are accepted and the processing timeline — may require updates to the scheme's trust deed, the product disclosure statement, and possibly the statement of investment policy and objectives. These documents are registered instruments. Updating them requires FMA notification under section 100 of the FMCA, and in some cases a formal variation application.

The compliance team should specifically confirm the following before the project proceeds to build:

- Whether the current trust deed and PDS constrain switching instructions to paper form, or whether they are medium-agnostic
- Whether the introduction of a digital channel requires a trust deed variation, and if so, the FMA's typical processing time for such variations (commonly 20–40 business days, though this varies)
- Whether the $15 switching fee (addressed separately below) requires a PDS update and member notification period before it takes effect
- Whether the FMA expects a supervision notification rather than just a documentation update

**The March 31 deadline may already be at risk depending on the answers to these questions.** If a trust deed variation is required and has not yet been initiated, there may not be enough calendar time to obtain it before March 31. This needs to be confirmed within the next five business days, not at the end of the compliance drafting process.

---

### 2. The $15 switching fee is commercially standard and can be introduced with the feature

This assumption requires immediate legal review on two separate grounds.

**First, the fee may require a trust deed variation or PDS amendment.** KiwiSaver scheme fees are a regulated disclosure item. The current PDS will specify the fee structure members agreed to when they joined. Adding a new contingent fee mid-membership is a material change. Under the FMCA, members are entitled to notice of material changes to scheme terms, and in some cases have a right to exit before the change takes effect. The notice period is typically at least 30 days but should be verified against the current trust deed.

**Second, the characterisation of "more than two switches per calendar year" needs to align with what is permitted under the KiwiSaver Act.** The Act preserves member rights to switch funds. Scheme rules can impose reasonable administrative fees, but those fees cannot have the practical effect of preventing switching. Whether $15 is defensible will depend on the scheme's specific member demographics and average account balances. This is worth confirming rather than assuming.

**The fee must not launch simultaneously with the feature unless all notice and variation requirements have been met beforehand.** If the fee cannot be legally introduced by March 31, the feature should launch without it and the fee should follow through a separate, properly noticed amendment process.

---

### 3. The three edge cases can be handled by routing to the existing paper fallback

This assumption has legal exposure in at least two of the three cases.

**Members with active hardship applications.** A member with an active KiwiSaver significant financial hardship or serious illness withdrawal application has a pending legal right to a payment from a specific fund balance. If they are permitted to switch funds while the hardship application is in flight, the fund they are withdrawing from changes, the unit price basis changes, and the scheme administrator may be processing withdrawals against a fund the member has exited. This is not an operational edge case — it is a transactional integrity and legal obligation issue. The system must be able to detect active hardship applications and either block switching until the application is resolved, or escalate to a defined decision process. "Operations handles it manually" is not sufficient if the portal has already accepted a switch instruction before operations can intervene.

**Members on a contributions holiday.** A contributions holiday affects the flow of new contributions but does not, in itself, restrict fund switching rights under the KiwiSaver Act. Routing these members to a paper process creates an inconsistency in member experience that may be difficult to justify and could attract complaints. More importantly, if the reason for routing them to paper is that the system cannot verify their status, that is a data integration gap that should be scoped, not deferred.

**Members who joined very recently.** "Very recently" needs a definition. New members may have a pending initial contribution that has not yet been invested into units. If a switch instruction is committed to the unit registry before the initial investment settles, the unit registry may receive a switch instruction for a member with no units in any fund. The unit registry provider should confirm how they handle this state and whether the portal needs to enforce a minimum account age or settled-contribution check before a switch instruction is accepted.

In all three cases, the correct approach is to define explicit system behaviour — block, warn, or queue — rather than assuming the paper fallback provides adequate protection. The paper fallback is only safe if the portal never accepts an instruction for a member in these states. If the portal accepts the instruction and then operations intercepts it, there is a window of time during which the member has received a confirmation that cannot be honoured.

---

## The March 31 Deadline

The deadline is commercially well-motivated. Members switching ahead of an expected market move have a legitimate interest in locking in the current unit price. The 3pm cut-off for same-period processing is a real and meaningful service commitment.

However, the delivery risk is higher than the brief implies.

**What needs to be true for March 31 to be achievable:**

- Compliance confirms within the next five business days that no trust deed variation or FMA variation application is required, or that any required variation has already been lodged and the FMA's response timeline is compatible with a March 31 launch
- The unit registry provider confirms that their API or integration pathway supports same-day instruction commitment and can be connected to the portal within the available build window
- The three edge cases are scoped and the portal enforces defined handling for each, so that the launch set excludes genuinely unsupported member states rather than relying on operations to catch them post-submission
- The $15 fee either launches with full legal compliance or is explicitly deferred to a later release

**What happens if these conditions are not met:**

If the compliance questions are not resolved early and they turn out to require a trust deed variation, the realistic launch date shifts to late April or May depending on FMA processing. In that scenario, launching without the online feature on March 31 is not a product failure — it is the legally correct outcome. The board should be made aware of this risk now, not after build has started.

A fallback worth considering: if the full portal feature cannot be guaranteed by March 31, a significantly simplified path — such as a web form that submits a digitally signed instruction to operations for same-day manual processing, without automated unit registry integration — could serve the deadline at lower technical risk. This would not be the target state, but it would address the member-facing urgency around the March 31 cut-off while the full integration is completed safely.

---

## What We Recommend Before Build Begins

| Action | Owner | Urgency |
|---|---|---|
| Confirm whether trust deed and PDS permit digital switching instructions without variation | Compliance + Legal | Within 5 business days |
| Confirm FMA notification type required and whether any variation application must be lodged | Compliance | Within 5 business days |
| Confirm whether $15 fee requires PDS amendment and member notice period | Legal | Within 5 business days |
| Define system behaviour for hardship application members (block, queue, or escalate) | Product + Operations + Legal | Before build scope is finalised |
| Define minimum account state required before switch instruction is accepted (new members, unsettled contributions) | Product + Unit Registry Provider | Before build scope is finalised |
| Confirm contributions holiday handling — is paper routing legally required or just operationally convenient? | Legal + Operations | Before build scope is finalised |
| Confirm unit registry API capability for same-day instruction commitment | Technology + Unit Registry Provider | Within 5 business days |
| Present compliance risk and deadline risk to board with updated delivery confidence | Delivery Lead + Compliance | Before end of current sprint |

---

## What We Are Confident About

The feature is worth building. The competitive gap is real, the member experience problem is clearly documented, and the core mechanics of online fund switching are well-understood. None of the issues raised in this report are reasons to stop — they are reasons to resolve specific questions before committing to a build plan, so that the team is not redesigning under deadline pressure after discovering a regulatory constraint mid-sprint.

The questions are answerable. The sooner they are answered, the more options remain available.