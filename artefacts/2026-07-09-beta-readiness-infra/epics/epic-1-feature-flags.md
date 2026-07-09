## Epic: Incomplete work can ship to main safely, gated off, without a redeploy to toggle it

**Discovery reference:** artefacts/2026-07-09-beta-readiness-infra/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-beta-readiness-infra/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

Hamish can merge an incomplete or risky feature to `main` behind a flag, and toggle that flag's state — consistently for every member of a tenant — from the PostHog dashboard, with no redeploy and no flicker on page load. Staging and production flag activity are fully isolated from each other.

## Out of Scope

- Building a custom in-house flag-evaluation engine — PostHog's native group-based targeting is used as-is (see `decisions.md`, ASSUMPTION entry validated 2026-07-09).
- Self-serve flag management UI for non-operator roles — flags are managed directly in the PostHog dashboard by Hamish, not via an in-app admin screen. That's a separate, unscoped feature.
- A/B testing, experimentation, or percentage-rollout logic — this epic covers on/off tenant-targeted gating only, not statistical experimentation.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| Metric 2 — Feature flags toggle without a redeploy | 0 (no flag mechanism exists) | 100% of 3 named flags respond to a PostHog toggle within one request cycle | Delivers the `isEnabled()` helper, tenant-level targeting, and the 3 wired flags |
| Metric 3 — Zero staging/prod PostHog cross-contamination | Not yet established (no staging project exists) | 0 staging events/toggles ever appear in prod | Delivers the separate staging/prod PostHog projects and env-based key selection |

## Stories in This Epic

- [ ] S1.1 — Build the isEnabled() flag helper shared by API and UI
- [ ] S1.2 — Separate staging and prod PostHog projects with isolated API keys
- [ ] S1.3 — Bootstrap flags server-side on session start to avoid UI flicker
- [ ] S1.4 — Wire tenant-level flag targeting via PostHog group analytics
- [ ] S1.5 — Create and wire the 3 initial flags across both projects

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Touches session-start latency and PostHog billing (Group Analytics opt-in has real, if near-zero, cost implications) — worth a human PR review, but no regulated data or customer-facing surface is at risk.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Stable
