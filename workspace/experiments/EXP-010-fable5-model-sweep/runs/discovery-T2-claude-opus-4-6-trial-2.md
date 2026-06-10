# Discovery Pipeline: Improving Onboarding for New Business Customers

## 🔍 Phase 1: Problem Unpacking

The prompt "improve the onboarding experience for new business customers" is broad. Let me unpack what's likely hiding underneath it.

**What "onboarding" could mean across different layers:**
- **Sales-to-success handoff** — the transition after a deal closes
- **Technical setup/implementation** — getting the product configured and running
- **User activation** — getting actual humans to use the thing
- **Time-to-first-value** — how quickly the customer sees the ROI they were promised
- **Administrative/legal** — contracts, billing, access provisioning
- **Education & enablement** — training, documentation, support

**Why this problem likely surfaced now (hypotheses):**
1. Churn data shows early-lifecycle dropoff
2. Customer complaints or low NPS/CSAT in the first 90 days
3. The onboarding process doesn't scale (too much manual/human effort)
4. Sales is closing bigger/different customers than the process was designed for
5. A competitor is winning on "ease of getting started"

---

## 🎯 Phase 2: Critical Questions to Answer

Before solutioning, these are the questions that would change what you build:

| # | Question | Why It Matters |
|---|----------|---------------|
| 1 | **What does "business customer" mean here?** (SMB? Mid-market? Enterprise?) | Onboarding for a 5-person team vs. a 5,000-person org are fundamentally different problems. |
| 2 | **Where are customers getting stuck or dropping off today?** | Without this, you're guessing. The fix for "they can't configure SSO" is very different from "they don't understand the value prop." |
| 3 | **What does a *successful* onboarding look like?** (What's the activation metric?) | You need a definition of "done" — first login? First workflow created? First value delivered? |
| 4 | **How long does onboarding take today vs. customer expectation?** | The gap between these two numbers *is* the problem. |
| 5 | **What's the current cost-to-onboard per customer?** | This tells you whether the problem is customer experience, operational scalability, or both. |
| 6 | **Who owns onboarding today?** (Sales? CS? Product? Nobody?) | Fragmented ownership is often the root cause, not the process itself. |
| 7 | **What do recently-churned customers say about their onboarding?** | The most honest feedback comes from people who've already left. |

---

## 🗺️ Phase 3: Opportunity Mapping

Here are distinct opportunity spaces, ranked by typical impact:

### 🟥 High Impact / Likely Root Causes
**1. Time-to-First-Value is Too Long**
- Customers sign expecting quick wins; instead they get weeks of setup
- *Signal:* Usage data shows a "dead zone" between contract signing and real adoption
- *Explore:* Can you deliver a meaningful "win" in the first 24–48 hours?

**2. The Handoff Between Sales and Post-Sales is Broken**
- Context gets lost. Customers repeat themselves. Expectations set in sales don't match the onboarding reality.
- *Signal:* CS teams say "we didn't know the customer expected X"
- *Explore:* What information needs to transfer, and how?

**3. Onboarding is One-Size-Fits-All**
- A self-serve SMB and a complex enterprise deployment get the same playbook
- *Signal:* Wildly different onboarding durations and satisfaction across segments
- *Explore:* What are the 2–3 distinct onboarding "tracks" you actually need?

### 🟨 Medium Impact / Force Multipliers
**4. Customers Don't Know What "Good" Looks Like**
- They have the tool but not a mental model for how to succeed with it
- *Explore:* Templatized "quick start" paths based on use case or industry

**5. Self-Service Gaps Force Human Intervention**
- Every question becomes a support ticket or a call with a CSM
- *Explore:* Where can documentation, in-app guidance, or automation eliminate 80% of questions?

**6. Internal Tooling/Process Friction**
- The onboarding team is fighting their own tools (manual checklists, spreadsheets, no visibility)
- *Explore:* Is this a customer-facing problem or an internal operations problem wearing a customer-facing mask?

### 🟩 Lower Impact but Easy Wins
**7. Communication Cadence & Transparency**
- Customers feel "in the dark" about where they are in the process
- *Explore:* A simple status page or automated progress updates

---

## ⚡ Phase 4: Recommended Next Steps

**If you have data access:**
→ Pull onboarding cohort analysis: time-to-activation, drop-off points, segment differences
→ Correlate onboarding experience with 6-month retention

**If you need qualitative insight:**
→ Interview 5 recently onboarded customers (2 happy, 2 unhappy, 1 churned)
→ Shadow 2–3 onboarding sessions live

**If you need to act fast:**
→ Map the current onboarding journey end-to-end (as-is), identify the single biggest friction point, and run a 2-week experiment to address it

---

## 🧭 What I'd Push Back On

The framing "improve the onboarding experience" risks becoming a UX polish project. The deeper questions are:
- **Is this a retention problem?** (customers leave because onboarding failed them)
- **Is this a scalability problem?** (onboarding costs too much per customer)
- **Is this a revenue problem?** (slow onboarding delays expansion/upsell)

The answer to *which* of these it is should drive everything.

---

**Want me to go deeper on any of these opportunity spaces, or shift into a framework for prioritizing solutions?**