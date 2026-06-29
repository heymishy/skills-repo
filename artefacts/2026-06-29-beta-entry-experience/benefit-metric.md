# Benefit Metric: Beta Entry Experience

**Feature slug:** 2026-06-29-beta-entry-experience
**Status:** Active
**Date:** 2026-06-29
**Discovery artefact:** artefacts/2026-06-29-beta-entry-experience/discovery.md
**Metric owner:** Hamish King — Platform operator / product owner

---

## Product context alignment

**Mission alignment:** The beta entry experience directly enables the platform's primary success outcome — "a platform consumer who has completed onboarding can run the full outer loop unassisted." Without an entry experience, no external consumer can reach the platform. This feature is the prerequisite for all empirical platform signal.

**Roadmap alignment:** Phase 5 active. This feature is beta programme enablement — not a named Phase 5 workstream, but the direct prerequisite for the empirical signal that informs Group 2 (instrumentation, profile, journey list filter) and Group 3 (billing, self-serve) roadmap decisions. Horizon 1 — blocking now.

---

## Meta-benefit check

Not applicable. This feature delivers user-facing product capability (landing page, first-run experience, PostHog instrumentation). It is not a pilot to test a new delivery approach or tooling hypothesis. Standard product metrics apply.

---

## Metrics

### M1 — Beta activation rate

**What we are measuring:** The count of distinct external users (GitHub logins other than Hamish's) who have completed at least one full skill session in production. "Completed" means at least one journey exists in the Postgres store for their `tenant_id`.

**Baseline:** 0. No external user has ever completed a session at `skills-framework.fly.dev` as of 2026-06-29.

**Target:**
- ≥1 external user completes a session within 2 weeks of feature deployment
- ≥3 distinct external users with completed sessions within 4 weeks of deployment

**Minimum validation signal:** 1 external user completes 1 session. Below this threshold, the entry experience has not functioned as intended and should be reviewed before further promotion.

**Feedback loop:**
- Measured by: Hamish King
- Frequency: Weekly — check PostHog `journey_completed` events by distinct person; cross-reference with Fly.io logs for `tenant_id` != Hamish's GitHub login
- If signal not met at 2 weeks: review PostHog funnel to identify where users drop off (landing → login → session → journey) and treat the earliest drop-off point as the next fix

**Contributes to:** wuce-multi-tenancy M2 (second tenant prerequisite); Group 2 and 3 roadmap decisions

---

### M2 — Cross-tenant isolation confirmed in production

**What we are measuring:** Binary signal — has a cross-tenant access attempt between two real production tenants returned HTTP 404? This transitions the wuce-multi-tenancy `M2` metric from `not-yet-measured` to `on-track`.

**Baseline:** not-yet-measured. The platform is in solo mode (one tenant: Hamish). The measurement requires a second tenant.

**Target:** M2 confirmed `on-track` — at least one cross-tenant access attempt between two real (non-test) tenants returns 404 in production. This is a one-time verification, not an ongoing rate.

**Minimum validation signal:** Two distinct `tenant_id` values exist in the Postgres journey store simultaneously. Without this, measurement is structurally impossible.

**Feedback loop:**
- Measured by: Hamish King (manual verification)
- Timing: Performed once — after the first external user has logged in and has at least one journey. Hamish logs in as himself, attempts to access the external user's journey by URL, confirms 404.
- Result recorded in: wuce-multi-tenancy M2 signal in `.github/pipeline-state.json`; brief log entry in `workspace/capture-log.md`

---

### M3 — Landing page conversion rate

**What we are measuring:** The percentage of unique unauthenticated visitors to `/` who proceed to GitHub OAuth within the same PostHog session. Specifically: the `landing_page_view` → `cta_clicked` funnel step conversion rate.

**Baseline:** Not yet established. The root URL currently redirects immediately to GitHub OAuth — there is no landing page to measure against. Baseline will be established from the first 10 unique visitors after deployment.

**Target:** ≥50% of unique landing page visitors click "Sign in with GitHub" within the same session, measured over a rolling 4-week window once ≥20 visits have been recorded.

**Minimum validation signal:** Any measurable CTA click rate after the first 10 unique visitors. A rate below 20% with ≥10 visits is a signal to revisit copy or CTA prominence before broader promotion.

**Feedback loop:**
- Measured by: Hamish King
- Frequency: Weekly review of PostHog funnel (`landing_page_view` → `cta_clicked` → `login_completed`)
- If signal not met at 20% after 10 visits: review PostHog session recordings (if enabled) or heatmaps; assess whether copy, CTA placement, or page layout is the issue
- If signal met (≥50%) at 30 days: treat as stable; deprioritise landing page optimisation in Group 2

---

### M4 — Referral attribution coverage

**What we are measuring:** The percentage of identified PostHog Persons (users who have completed GitHub OAuth and been `posthog.identify()`'d) who have a known `utm_source` property on their Person record.

**Baseline:** 0. No referral attribution data exists today.

**Target:** ≥80% of identified beta users have a known `utm_source` within 4 weeks of deployment. This is largely in Hamish's control — every shared URL must carry UTM parameters.

**Minimum validation signal:** Any `utm_source` data on any person (>0% coverage after first 5 sign-ups). If coverage is 0% after 5 sign-ups, Hamish has not been tagging shared URLs.

**Feedback loop:**
- Measured by: Hamish King
- Frequency: Checked when reviewing PostHog Persons list after each new sign-up batch
- Action on low coverage: ensure all future shared URLs include `?utm_source=<channel>&utm_medium=<type>`. PostHog provides a URL builder. If below 80% after 10 sign-ups, audit which sharing channels lacked UTM tags.
- Secondary use: Persons list with `utm_source` grouped by channel becomes the lead and opportunity management view — Hamish annotates with `status: contacted`, `status: qualified` etc. as manual properties in PostHog.

---

## Tier 3 — Compliance and risk reduction

Not applicable. The platform is non-regulated (`meta.regulated: false` in context.yml). No named compliance obligation, audit finding, or regulatory framework applies to this feature. The PostHog data residency risk is accepted at beta scale (non-regulated, personal project) — no metric required.

---

## Measurement infrastructure

| Metric | Tool | Instrumentation required |
|--------|------|--------------------------|
| M1 — Activation rate | PostHog + Fly.io logs | PostHog `journey_completed` event; `posthog.identify()` post-auth |
| M2 — Cross-tenant isolation | Manual (Fly.io + Postgres) | No new instrumentation; manual verification step |
| M3 — Conversion rate | PostHog | `landing_page_view` event on `/`; `cta_clicked` event on CTA click |
| M4 — Referral coverage | PostHog | UTM params auto-captured by PostHog snippet; `posthog.identify()` links them to person |

**PostHog pre-deployment action:** Hamish to create PostHog Cloud account and project (EU region). Project API key to be embedded in landing page and dashboard HTML at deploy time. Confirmed action as of 2026-06-29 — account does not yet exist.

---

## Metric interactions

- **M1 is a prerequisite for M2** — cross-tenant isolation cannot be measured until a second external user exists.
- **M3 feeds M1** — low M3 conversion (few users reaching login) will suppress M1. If M1 is not met at 2 weeks, check M3 first.
- **M4 is independent** — referral coverage is about Hamish's behaviour (tagging URLs), not user behaviour. It can be green even if M1 and M3 are low.

---

## Benefit coverage matrix

| Metric | Contributing stories | Gap? |
|--------|---------------------|------|
| M1 — Beta activation rate | bee.1 (entry point), bee.2 (activation guidance), bee.3 (measurement) | None |
| M2 — Cross-tenant isolation confirmed | bee.2 (enables second-tenant onboarding) | None — M2 is a verification step, not a code story; bee.2 enables the second tenant to exist |
| M3 — Landing page conversion rate | bee.1 (the page being measured), bee.3 (the measurement instrumentation) | None |
| M4 — Referral attribution coverage | bee.3 (UTM capture + person identification) | None |

No orphaned metrics. No unlinked stories.

---

## Attribution

**Metric owner:** Hamish King — Platform operator / product owner — 2026-06-29

**Reviewers:**
- Pending

**Approved By:**
- Hamish King — Platform operator / product owner — 2026-06-29
