# Benefit Metric: Landing Page Hero Features

**Discovery reference:** artefacts/2026-08-08-landing-page-hero-features/discovery.md
**Date defined:** 2026-08-08
**Metric owner:** Hamish King — Founder/Operator
**Reviewers:** (none — solo-operator context; no separate non-engineering reviewer exists outside the metric owner)

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No — this is a standard commercial/conversion feature on the "Commercialisation track — wuce SaaS beta path" (`product/roadmap.md`), not a tooling or process pilot. Standard product metrics only.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Landing page → signup conversion rate

| Field | Value |
|-------|-------|
| **What we measure** | Completed signups ÷ `landing_page_viewed` events, over a rolling window — not `cta_clicked` alone, since a click is not a completed signup |
| **Baseline** | Not yet pulled. `landing_page_viewed`/`cta_clicked` have been live in PostHog since `lab-s1.2` shipped (2026-07-05), so real historical data already exists — pull the actual conversion rate over the most recent full 30-day period **before `/definition` starts**, rather than treating this as an unknown to be measured only after launch |
| **Target** | Conversion rate increases by at least **+20% relative** to the pre-redesign baseline, measured over an equivalent rolling window post-launch |
| **Minimum validation signal** | At least **+5% relative** improvement |
| **Measurement method** | Existing PostHog funnel (`landing_page_viewed` → `cta_clicked` → signup completion), reviewed weekly for the first 4 weeks post-launch, by Hamish King |
| **Feedback loop** | If the +5% minimum signal isn't hit after 4 weeks: the hero-feature redesign didn't move conversion — deprioritize further landing-page content investment and look elsewhere in the funnel (e.g. the signup flow itself, or traffic quality) rather than iterating further on hero copy/layout. Decision owner: Hamish King. |

### Metric 2: Time-on-page for unauthenticated visitors

| Field | Value |
|-------|-------|
| **What we measure** | Median (not average, to avoid outlier/bounce skew) time-on-page for unauthenticated visitors, from page load to either navigating away or clicking the CTA |
| **Baseline** | Not yet established — no time-on-page instrumentation exists today. **Dependency:** this metric cannot be measured until the follow-on PostHog scroll-depth/time-on-page instrumentation story ships (explicitly out of scope for this feature's own MVP per discovery) — baseline is then established over its first 2 weeks of data |
| **Target** | Median time-on-page increases by at least **+30% relative** to baseline, once established |
| **Minimum validation signal** | At least **+10% relative** increase |
| **Measurement method** | New PostHog scroll-depth/time-on-page event (a separate follow-on story, not this feature's build scope), reviewed alongside Metric 1, by Hamish King |
| **Feedback loop** | This metric is informational, not a go/no-go gate for the hero-feature redesign itself — it validates whether visitors are actually engaging with the new content (as opposed to Metric 1, which validates whether it converts). If instrumentation is never built, this metric stays permanently unmeasured; that is an accepted, explicit tradeoff, not a silent gap — flag at `/definition-of-done` if the follow-on story still hasn't shipped. |

---

## Tier 3: Compliance and Risk-Reduction Metrics

Not applicable. Discovery's Constraints and NFR sections identify no regulatory, compliance, or named-risk obligations for this feature.

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Metric 1 — Signup conversion rate | *(populated at /definition)* | Gap — pending story creation |
| Metric 2 — Time-on-page | *(populated at /definition)* | Gap — pending story creation |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
