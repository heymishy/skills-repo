## Epic: Risk-critical journeys have deterministic, tagged coverage before beta

**Discovery reference:** artefacts/2026-07-09-beta-readiness-infra/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-beta-readiness-infra/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

A mock LLM gateway and 5 tagged Playwright specs (signup/onboarding, multi-user/permissions, cross-tenant isolation, billing, auth) give deterministic, fast, CI-native coverage of the flows that would cost the business its first beta customers' trust if broken — replacing today's zero E2E coverage of these journeys.

## Out of Scope

- Any journey beyond the 5 named — this epic is bounded to signup/onboarding, multi-user/permissions, cross-tenant isolation, billing, and auth. Additional journeys are a future epic.
- `@live` (nightly/pre-release) test infrastructure beyond the tagging convention itself — this epic establishes the `@mocked`/`@live`/`@billing`/`@multi-tenant` tags and builds out `@mocked` coverage; a full `@live` suite running against real external services is a smaller, separate follow-on.
- Load/performance testing at scale — matches discovery's explicit non-goal; these specs validate correctness, not throughput.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| Metric 4 — Risk-critical journeys have deterministic E2E coverage | 0 of 5 | 5 of 5, correctly tagged | Delivers one Playwright spec per named journey |
| Metric 5 — Cross-tenant isolation suite has zero tolerance for flake or skip | Not yet established | 0% skip/flake over 20 consecutive runs | Delivers the `@multi-tenant`-tagged isolation spec |
| Metric 6 — `@mocked` suite runtime under 10 minutes | Not yet established | Under 10 minutes | Delivers the mock LLM gateway that makes fast, deterministic `@mocked` runs possible at all |

## Stories in This Epic

- [ ] S3.1 — Build the mock LLM gateway and fixture set
- [ ] S3.2 — Signup → onboarding → first feature journey spec
- [ ] S3.3 — Multi-user within one tenant journey spec
- [ ] S3.4 — Cross-tenant isolation journey spec
- [ ] S3.5 — Billing journey spec
- [ ] S3.6 — Auth journey spec

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Test infrastructure, not production code paths — lower risk than Epics 1/2, but the cross-tenant isolation spec (S3.4) in particular protects a security-critical guarantee (ADR-025) and warrants review.

## Complexity Rating

**Rating:** 3
**Rationale for 3 (not 2):** the mock LLM gateway (S3.1) is genuinely new infrastructure covering all 7 gate-map.js stages (resolved 2026-07-09, post-/review — `branch-setup`/`branch-complete` confirmed to invoke the gateway via `SLASH_CAPABILITY_MAP`), and S3.3's cross-feature dependency on the unbuilt `team-identity-roles` feature adds genuine schedule/scope uncertainty beyond a normal epic.

## Scope Stability

**Stability:** Stable
