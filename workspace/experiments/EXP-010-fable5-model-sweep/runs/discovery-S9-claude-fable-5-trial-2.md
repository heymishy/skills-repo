# Discovery Report: Online Fund Switching — KiwiSaver Member Portal

## 1. Problem Statement (Restated)

Members of a ~52,000-member KiwiSaver scheme currently switch funds via paper forms processed in 10–15 business days. Competitors (Fisher Funds, Simplicity, Booster) offer same-day/next-day online switching, and the scheme is losing members. The proposed solution is online switching via the member portal with same-business-day commitment to the unit registry, live before the **3pm, 31 March cut-off** so members can lock in switches at end-of-financial-year unit prices.

---

## 2. Critical Findings — Assumptions That Need Challenging

These are surfaced first because two of them directly threaten the 31 March date.

### 2.1 "FMA notification is a standard documentation step" — **High risk, likely incorrect**

This assumption needs urgent validation with your legal/compliance team and your **licensed supervisor** (who is conspicuously absent from the brief — supervisor engagement is typically required for material changes to scheme administration, and they have their own review timelines).

- A new member-facing transaction channel may require updates to the **PDS and the Disclose register** describing the switching process.
- Member advance notice periods are not always discretionary in length. If your trust deed or terms specify a minimum notice period (commonly 1–3 months for material changes), the clock may already be the critical path — **not the build**.
- **Action:** Get a written legal opinion this week on (a) whether the change is "material," (b) minimum notice periods, (c) supervisor approval lead time. This determines whether 31 March is achievable before a single line of code is written.

### 2.2 The $15 switching fee is a separate, slower regulatory workstream — **Recommend decoupling**

This is the highest-risk item in the brief and it is bundled into the launch as if incidental:

- KiwiSaver fees are subject to the statutory **"not unreasonable" fees requirement**, and the FMA actively scrutinises fee changes. "Competitors charge it" is not, on its own, sufficient justification — and notably, the three competitors you named for fast switching are known for *low or no* switching fees, so the competitive claim itself needs verification.
- A new fee almost certainly requires **PDS amendment, Disclose register update, supervisor sign-off, possibly trust deed review, and member notification** — each with lead times.
- Launching a member-retention feature *with a new fee attached* undermines the retention objective and creates conduct-risk optics ("we made it easier to switch, then charged you for it").
- **Recommendation:** Remove the fee from the 31 March scope entirely. Run it as a separate initiative with its own regulatory pathway, or drop it. Build the fee-counting logic (switches per calendar year) into the data model now so it can be activated later without rework.

### 2.3 "Instant switching" is not technically possible — **Reframe the promise**

KiwiSaver funds use **forward unit pricing**. A switch instruction received before cut-off is priced at the next valuation point, not at the moment of submission. What you can deliver is:

- Same-day **commitment of the instruction** to the unit registry (achievable, as stated);
- Pricing at the **next unit pricing cycle** (typically T+1 or per your registry's cycle);
- Settlement/completion some days later.

The member-facing language, confirmation screens, and the 31 March messaging must reflect this precisely. A member who believes they switched "instantly" at 2:55pm on 31 March and later sees a different effective price is a complaints case — multiplied by however many members do exactly that.

### 2.4 Conduct risk: you are launching into a member-detriment scenario

The brief explicitly anticipates members moving **growth → conservative ahead of expected volatility**. The FMA's post-March-2020 review found significant member harm from panic-switching that crystallised losses. Launching a frictionless switching tool *timed to that exact behaviour* invites regulatory attention:

- The flow should include a **considered-decision interstitial** (fund risk profiles, time-horizon information, a link to Sorted or your scheme's guidance) — without crossing into regulated financial advice. The boundary between "information" and "advice" in the flow needs legal review.
- If you are a licensed financial institution under the **CoFI regime**, this feature falls within your fair conduct programme and should be assessed against it before go-live.

---

## 3. Scope Gaps Identified

### 3.1 Edge cases — the proposed handling creates a worse experience than today

Routing recent joiners, savings-suspension members, and hardship applicants to "paper fallback" raises questions:

- **How does the member discover they're excluded?** If they reach the portal, attempt a switch, and are bounced to paper, that is a worse experience than never offering the feature. Eligibility must be evaluated **before** the member invests effort, with a clear explanation and the fallback path presented gracefully.
- **Why are savings-suspension members excluded at all?** A suspension affects contributions, not holdings. This exclusion needs justification or removal — it may be an unnecessary scope cut that excludes a sizeable cohort.
- **Missing edge cases the brief doesn't list:** members with in-flight transactions (first-home withdrawal in progress, transfer in/out, PIE tax adjustments, pending death/estate processing), members within their initial **opt-out window**, members with court orders or relationship-property splits on the account, and members who submit **multiple switch instructions** before the first one settles. The last one is near-certain to occur on 31 March.

### 3.2 Functional scope ambiguities requiring decisions

| # | Open question | Why it matters |
|---|---|---|
| 1 | Full-balance switch only, or fund-mix allocation (e.g., 60/40 across two funds)? | Competitors offer mixes; affects build size materially |
| 2 | Switch future contributions, existing balance, or both? | Standard industry distinction; members will expect the choice |
| 3 | Can a member cancel a pending switch before cut-off? | Day-one support question; affects registry integration |
| 4 | What does a 3:01pm submission on 31 March show the member? | The single most contentious moment of launch — must be explicit, timestamped, and unambiguous |
| 5 | Authentication strength for a transaction (vs. read-only portal access)? Step-up auth / 2FA? | Instruction validity, fraud, and dispute defence |
| 6 | Registry integration: real-time API, batch file, or manual re-key by ops? | "Same-day commit" lives or dies here; brief is silent on registry capability |

### 3.3 Non-functional: the launch date is also the peak-load date

You are going live at the **single highest-demand moment of the year**, with a hard cut-off creating a thundering-herd pattern (expect a submission spike between 2:00–3:00pm on 31 March). Required:

- Load modelling against the realistic worst case (what % of 52,000 members switch in the final week? final hour?);
- A **rehearsed operational contingency**: if the system degrades on 31 March, what is the surge paper/phone process and how is the 3