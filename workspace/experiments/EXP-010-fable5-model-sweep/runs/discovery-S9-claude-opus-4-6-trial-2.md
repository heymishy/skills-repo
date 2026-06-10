

# Discovery Analysis

## What I Understand

You want to replace a paper-based KiwiSaver fund switching process with an online feature in your member portal, driven by competitive pressure and a hard 31 March deadline tied to end-of-financial-year unit pricing.

The core user journey is straightforward: member logs in, selects target fund, confirms, receives confirmation with estimated processing date. The backend must commit the switch instruction to the unit registry same-business-day.

I want to walk through what I think is well-positioned for success, what carries real risk, and where I have open questions that would change how I'd recommend structuring this work.

---

## What Looks Sound

**The core feature scope is appropriately narrow.** Select fund, confirm, receive confirmation. This is the right instinct — resist the temptation to build a full portfolio management tool. A single, well-executed switching flow is shippable and valuable.

**The competitive analysis is clear and the business case is obvious.** Same-day processing is table stakes in this market. Every month without this capability is measurable in member attrition.

**The paper fallback for edge cases is pragmatic.** For a first release, routing recently-joined members, contribution holiday members, and hardship cases through existing manual processes is a defensible choice — provided you're transparent with those members about what's happening and why.

---

## What I'm Concerned About

I'm going to be direct about several things because they carry consequences that go beyond missed deadlines.

### 1. The Regulatory Notification Is Not a "Standard Documentation Step"

This is the thing I'd most want to pressure-test before committing to the 31 March date.

Under the Financial Markets Conduct Act, changes to how members interact with a managed fund — particularly changes to transaction processing, fee structures, and switching mechanisms — are not simply notified to the FMA. Depending on how your scheme's governing document and SIPO (Statement of Investment Policy and Objectives) are structured, introducing online switching with same-day processing may require:

- **Amendment to the SIPO** if it references processing timeframes or switching procedures
- **An update to your Product Disclosure Statement (PDS)** — a new fee and a new switching channel are material changes that trigger PDS update obligations
- **Prescribed notice periods to members** before the change takes effect (typically 30 days for material changes, though this depends on your trust deed)
- **FMA notification with sufficient lead time** for them to raise concerns

**The risk I want to name plainly:** if your compliance team is treating this as a box-ticking exercise and hasn't yet confirmed the specific regulatory pathway, your 31 March date may already be at risk — not because of engineering, but because of mandated notice periods you cannot compress.

**My question:** Has your compliance team confirmed the specific FMC Act provisions that apply, identified whether a PDS update is required, and mapped out the minimum statutory notice period? If not, this needs to happen this week, because it determines whether 31 March is achievable at all.

### 2. The $15 Switching Fee Needs More Scrutiny Than You've Given It

You've described this as "commercially reasonable and within standard terms most competitors charge." I'd want to verify two things:

**First, the factual claim.** Simplicity charges no switching fee. Fisher Funds does not charge a per-switch fee for standard online switches. If your positioning is "we're catching up to competitors," introducing a fee they don't charge undermines that message on launch day. What specific competitors are you benchmarking this against, and are those fees current?

**Second, the legal basis.** You can only charge this fee if your trust deed and current PDS permit it, or if you amend them — which loops back to the regulatory timeline above. Introducing a new fee also has specific disclosure requirements under the FMC Act.

**More fundamentally, I'd question the timing.** You are launching a feature specifically to stop losing members to competitors. The first experience members will have is discovering a fee their competitors may not charge. Consider whether this fee should be a separate, later decision — launched after you've demonstrated the value of the new capability and have data on actual switching frequency.

### 3. The 31 March Deadline Needs to Be Decomposed

Right now "31 March" is carrying a lot of weight as a single milestone. In reality, there are several distinct deadlines embedded in it:

- **Regulatory notice period start date** — working backwards from 31 March, when must member notifications go out?
- **Feature complete and tested date** — the portal must be stable before you send members to it
- **Unit registry integration tested date** — same-day processing means your integration with the registry must be proven reliable, not just functional
- **Operational readiness date** — your operations team needs to be trained on the new flow, the paper fallback routing, exception handling

**My question:** Have you mapped these intermediate milestones? Because the engineering work to build a fund switching UI might be 4–6 weeks, but the end-to-end timeline including regulatory, testing, and operational readiness is almost certainly longer. I need to understand today's date relative to 31 March to tell you whether this is tight or already in trouble.

### 4. The Edge Cases Are More Significant Than They Appear

You've listed three categories for manual fallback: recent joiners, contribution holidays, and hardship applications. The risk isn't that these cases exist — it's what happens when a member in one of these categories tries to switch online and discovers they can't.

- **What does the UI show them?** A generic error? A message explaining why? A redirect to a phone number?
- **Will they know in advance they're ineligible for online switching, or only discover it after attempting?**
- **What's the definition of "recently joined"?** Is there a specific lock-in period in your trust deed, or is this an operational choice?

A member with an active hardship application who tries to switch from growth to conservative on March 30th because they're worried about market losses is going to be distressed if they hit a wall with no explanation. This needs a designed experience, not just a backend routing rule.

### 5. Same-Day Processing Carries Operational Risk You Should Quantify

"Committing the switch instruction to the unit registry on the same business day" is the correct target, but I want to understand the failure modes:

- **What happens if the unit registry is unavailable?** Do you queue and retry? Do you guarantee the original submission timestamp is honoured?
- **What's your SLA with the registry provider?**
- **What happens if a member submits at 2:58pm on March 31 and the registry processes at 3:02pm?** Where does liability sit?
- **Is the 3pm cut-off your cut-off or the registry's?** If you need to batch and transmit, your effective member-facing cut-off might need to be earlier.

These aren't edge cases — the 3pm March 31 scenario is literally the use case you've described as most critical.

---

## What I'd Want to Explore Next

Before moving to solution design, I'd want answers to these questions, roughly in priority order:

1. **Regulatory timeline confirmation** — exact obligations, exact notice periods, exact dates. This is the schedule constraint that dominates everything else.

2. **Unit registry integration specifics** — what system, what API (if any), what are current processing windows, what's the failure/retry contract?

3. **Current member portal architecture** — what's the technology stack, authentication model, and how mature is it? Is this adding a feature to a solid platform or bolting onto something fragile?

4. **Switching fee decision** — is this commercially committed or still under discussion? I'd recommend decoupling it from the launch.

5. **Actual calendar date today** — how many working weeks exist between now and 31 March, because that determines whether we're planning a delivery or negotiating a scope reduction.

6. **Volume expectations** — how many switches per day do you anticipate, especially in the week before March 31? This drives infrastructure and support capacity planning.

---

## Summary of My Position

The core feature is well-scoped and clearly needed. The biggest risks to this project are not engineering risks — they are **regulatory timeline risk** (which could make 31 March impossible regardless of build speed), **the switching fee decision** (which could undermine the competitive purpose of the feature), and **under-specified failure modes around the exact scenario you've described as most critical** (the 3pm March 31 cut-off).

I'd want to spend the next conversation confirming the regulatory pathway and the unit registry integration constraints, because those two things together will tell us whether 31 March is a plan or a hope.