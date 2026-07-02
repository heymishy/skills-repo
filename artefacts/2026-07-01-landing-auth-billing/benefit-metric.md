# Benefit Metric: Landing Site, Multi-Provider Auth, and Billing

**Discovery reference:** artefacts/2026-07-01-landing-auth-billing/discovery.md
**Date defined:** 2026-07-01
**Metric owner:** Hamish King — Platform operator and product owner
**Reviewers:** Hamish King — Platform operator

---

## Tier Classification

**META-BENEFIT FLAG:** No — standard product feature delivering user value and platform sustainability. No process or tooling hypothesis under test.

**Roadmap alignment:** Phase 3 enabler. The roadmap targets 50 teams consuming the platform; this feature removes the two blockers to that outcome: manual onboarding bottleneck and zero billing recovery. Not a named Phase 5 workstream but a prerequisite for Phase 3 reach.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Self-serve signup conversion

| Field | Value |
|-------|-------|
| **What we measure** | % of `/` visitors who complete the full funnel (landing → CTA click → auth callback → plan selected → `/dashboard` reached) within a single session, without any operator action |
| **Baseline** | Not yet established — no public landing page exists, no traffic data. Baseline measured from first week landing page is live. |
| **Target** | 25% visitor-to-dashboard conversion within 60 days of launch |
| **Minimum validation signal** | 5 self-serve signups completed within 30 days of launch with no operator action logged |
| **Measurement method** | PostHog funnel: `landing_page_viewed` → `cta_clicked` → `auth_completed` → `plan_selected` → `dashboard_reached`. Reviewed weekly by Hamish. |
| **Feedback loop** | If minimum signal not met at 30 days, review landing page copy and CTA placement before investing in additional auth providers. If conversion below 15% at 60 days, review onboarding friction (plan selection step, auth flow). |

---

### Metric 2: Credits enforcement

| Field | Value |
|-------|-------|
| **What we measure** | % of turn attempts correctly blocked with 402 when tenant credit balance ≤ 0. Corollary: count of turns processed with zero or negative balance (target: 0). |
| **Baseline** | 0% enforcement — no credits system exists. Every turn passes through regardless of cost. |
| **Target** | 100% enforcement. Zero turns processed when balance ≤ 0. No grace period in MVP. |
| **Minimum validation signal** | Automated test suite asserts 402 returned on every turn attempt with balance = 0, and no Anthropic API call is made (verified via adapter stub). Green before shipping. |
| **Measurement method** | Structural guarantee via automated tests at build time. In production: weekly Postgres query for tenants with balance ≤ 0 who have turns logged after balance reached zero — expected: zero rows. Reviewed by Hamish weekly post-launch. |
| **Feedback loop** | Any row returned by the production query is a P1 defect — investigate and patch immediately. |

---

### Metric 3: Monthly cost recovery rate

| Field | Value |
|-------|-------|
| **What we measure** | (Stripe revenue received in month) ÷ (Anthropic API costs in same month) × 100 |
| **Baseline** | 0% — operator bears 100% of Anthropic API costs with zero recovery today |
| **Target** | 80% cost recovery within 3 months of billing go-live. 100%+ within 6 months. |
| **Minimum validation signal** | First Stripe payment received (subscription or credit top-up) within 30 days of billing go-live — confirms checkout flow works end to end |
| **Measurement method** | Monthly manual calculation: Stripe dashboard revenue report vs Anthropic API usage bill. No automated dashboard needed in MVP. Reviewed monthly by Hamish. |
| **Feedback loop** | If below 50% at 3 months, review pricing model and plan tier structure before further feature investment. If minimum signal (first payment) not hit at 30 days, treat as a funnel or onboarding failure — investigate plan selection step. |

---

### Metric 4: Time to first paid plan

| Field | Value |
|-------|-------|
| **What we measure** | Calendar days from billing system go-live to first completed Stripe checkout by a non-operator user |
| **Baseline** | N/A — no billing system exists |
| **Target** | First paid plan within 30 days of billing go-live |
| **Minimum validation signal** | First `checkout.session.completed` Stripe webhook received for a non-operator account within 60 days |
| **Measurement method** | Stripe dashboard event log. One-time observation — metric retires once achieved. Date recorded here as a delivery milestone. |
| **Feedback loop** | If not achieved within 60 days, treat as a signal to review pricing model and onboarding funnel before continuing to invest in additional auth providers or billing features. |

---

### Metric 5: Pricing configurability (structural)

| Field | Value |
|-------|-------|
| **What we measure** | Binary: does a Stripe dashboard-only config change (price, tier, or credit rate) propagate to new checkout sessions without a code deploy? |
| **Baseline** | N/A — no billing system exists |
| **Target** | Pass — any plan or credit rate change in Stripe is live in new checkout sessions within 5 minutes, zero code changes required |
| **Minimum validation signal** | Operator changes a plan price in Stripe test mode and a new checkout session reflects the updated price — verified once as a pre-launch smoke test (part of the pre-launch checklist story) |
| **Measurement method** | Manual smoke test by Hamish at each significant Stripe config change. Automated assertion in the pre-launch checklist story. Structural property — does not require ongoing instrumentation. |
| **Feedback loop** | Failure means pricing is hardcoded somewhere in the implementation — treat as a defect and fix before launch. |

---

### Metric 6: Session continuity post-migration (one-time)

| Field | Value |
|-------|-------|
| **What we measure** | N/A — no existing beta users exist at migration time. This metric is retired before it applies. |
| **Baseline** | N/A |
| **Target** | N/A |
| **Minimum validation signal** | N/A |
| **Measurement method** | Not required. The auth changeover is a clean cutover with no backward-compatibility constraint on existing sessions. Metric dropped from active tracking. |
| **Feedback loop** | N/A — retained in artefact for audit trail of the decision to drop it. |

---

## Metric Coverage Matrix

*Populated by /definition — 2026-07-01*

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1: Self-serve signup conversion | lab-s1.1 (unblocks auth), lab-s1.2 (landing page + PostHog `landing_page_viewed`), lab-s1.3 (auth_completed event), lab-s2.1 (Google OAuth), lab-s2.2 (email/password), lab-s2.3 (/welcome `plan_selected` event) | Covered |
| M2: Credits enforcement | lab-s3.1 (credits table), lab-s3.3 (402 guard — primary delivery vehicle for M2) | Covered |
| M3: Monthly cost recovery rate | lab-s3.2 (Stripe Checkout — revenue entry), lab-s3.4 (webhook — credit provisioning), lab-s3.5 (billing portal — subscription self-serve) | Covered |
| M4: Time to first paid plan | lab-s3.2 (checkout flow), lab-s3.4 (first `checkout.session.completed`), lab-s3.5 (pre-launch go/no-go gate) | Covered |
| M5: Pricing configurability | lab-s3.2 (env-var-sourced price IDs), lab-s3.5 (M5 smoke test — AC3 and AC5) | Covered |
| M6: Session continuity | Dropped — no existing users | N/A |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Exact plan tier names, prices, or credit rates — these are a product decision deferred to pre-launch configuration in Stripe
- Implementation approach — that is the definition and spike skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
