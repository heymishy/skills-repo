# Benefit Metric: Beta-Readiness Infrastructure — Feature Flags, Staging Environment, and E2E Test Coverage

**Discovery reference:** artefacts/2026-07-09-beta-readiness-infra/discovery.md
**Date defined:** 2026-07-09
**Metric owner:** Hamish King — Founder / Operator
**Reviewers:** Hamish King — Founder / Operator (W4 solo-operator posture, per `.github/architecture-guardrails.md`)

---

## Tier Classification

**META-BENEFIT FLAG:** No — standard infrastructure feature enabling safe production operation. No process or tooling hypothesis under test.

**Roadmap alignment:** `product/roadmap.md` § Commercialisation track — wuce SaaS beta path, "Near-term" item. Not a named Phase 1–6 platform-maturity workstream; this is a prerequisite step on the parallel go-to-market track toward wuce's first real beta customers.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: A broken build cannot reach prod

| Field | Value |
|-------|-------|
| **What we measure** | The existence and enforcement of a staging → smoke-test → manual-approval gate between merge and production deploy — not just that a staging environment exists, but that it is the only path to prod |
| **Baseline** | 0% — every merge to `main` deploys straight to prod via `.github/workflows/fly-deploy.yml` today, no staging gate exists |
| **Target** | 100% of merges to `main` deploy to `wuce-staging` first; promotion to `wuce-prod` only happens after a green regression + Playwright suite and an explicit manual approval step |
| **Minimum validation signal** | The staging deploy + smoke test exists and blocks at least one bad deploy from reaching prod during build-out — evidence the gate works at all |
| **Measurement method** | Hamish reviews the GitHub Actions workflow configuration and deploy logs; verified structurally (the workflow YAML is the enforcement mechanism), every deploy |
| **Feedback loop** | If a broken build reaches prod despite the gate, treat as a P0 defect in the gate itself — pause further feature work on this track until the gate is fixed |

### Metric 2: Feature flags toggle without a redeploy

| Field | Value |
|-------|-------|
| **What we measure** | Whether toggling one of the 3 named flags (`wizard-ui`, `model-routing-glm52`, `billing-v2`) in PostHog changes app behavior on the next request, with no code deploy or process restart |
| **Baseline** | 0 — no flag-evaluation mechanism exists today (`posthog-server.js` is capture-only) |
| **Target** | 100% of the 3 named flags respond to a PostHog-side toggle within one request cycle, no deploy required |
| **Minimum validation signal** | At least 1 of the 3 flags demonstrably toggles live via an automated test, before all 3 are fully wired |
| **Measurement method** | Automated test toggles the flag via the PostHog API and asserts the behavior change; run at each flag's rollout and as part of the ongoing CI suite |
| **Feedback loop** | If a flag requires a redeploy to take effect, the flag-evaluation implementation is defective — fix before marking the flag "live" |

### Metric 3: Zero staging/prod PostHog cross-contamination

| Field | Value |
|-------|-------|
| **What we measure** | Whether any event or flag-toggle triggered in the staging environment ever appears in the prod PostHog project (or vice versa) |
| **Baseline** | Not yet established — no staging PostHog project exists yet; nothing to measure cross-contamination against today |
| **Target** | 0 staging-triggered events or flag toggles ever appear in the prod project, for the life of the staging environment |
| **Minimum validation signal** | An automated test confirms staging config structurally always uses the staging API key, before real staging traffic starts flowing |
| **Measurement method** | Automated test asserts staging always uses the staging key; Hamish manually audits the prod PostHog project's event source in week one of dual-project use as a one-time confirmation |
| **Feedback loop** | Any confirmed contamination event is treated as a P0 security/data-hygiene defect — rotate keys and audit all staging config immediately |

### Metric 4: Risk-critical journeys have deterministic E2E coverage

| Field | Value |
|-------|-------|
| **What we measure** | The count of the 5 named risk-critical journeys (signup→onboarding, multi-user/role permissions, cross-tenant isolation, billing, auth) that have a dedicated, correctly-tagged, browser-driven Playwright spec (per ADR-018) |
| **Baseline** | 0 of 5 — confirmed via research, no such specs exist today |
| **Target** | 5 of 5, each with a spec under `tests/e2e/`, tagged appropriately (`@mocked`/`@live`/`@billing`/`@multi-tenant`) |
| **Minimum validation signal** | Cross-tenant isolation and billing specs exist and pass — the two journeys where a failure would cost the most trust — even if signup/auth/multi-user specs lag |
| **Measurement method** | Spec file + tag audit in `tests/e2e/`; checked at each sub-feature-3 story completion, final count confirmed at DoD |
| **Feedback loop** | If a journey lags past its planned story, re-sequence remaining stories rather than ship beta-readiness incomplete on this metric |

### Metric 5: Cross-tenant isolation suite has zero tolerance for flake or skip

| Field | Value |
|-------|-------|
| **What we measure** | The `@multi-tenant`-tagged suite's pass/skip/flake rate — the regression-prevention suite for the ADR-025 tenant-isolation guard that all future routes must respect |
| **Baseline** | Not yet established — suite doesn't exist yet |
| **Target** | 0% skip rate, 0% flake rate, sustained over 20 consecutive CI runs |
| **Minimum validation signal** | The suite exists, runs on every PR, and has never been skipped or marked flaky even once — a single skip or flake-and-retry is a regression to investigate, not noise to tolerate |
| **Measurement method** | CI history for the `@multi-tenant` tag; Hamish reviews on any skip/flake occurrence, not on a schedule |
| **Feedback loop** | Any skip or flake halts merges of unrelated work until root-caused — this is a zero-tolerance gate, not a trend metric |

### Metric 6: `@mocked` suite runtime under 10 minutes on every PR

| Field | Value |
|-------|-------|
| **What we measure** | Wall-clock CI job duration for the `@mocked`-tagged test run, on every PR |
| **Baseline** | Not yet established — suite doesn't exist yet |
| **Target** | Under 10 minutes (explicitly revisable once real runtime data exists — see `decisions.md`) |
| **Minimum validation signal** | Suite completes and passes within a looser 15-minute bound initially, while tuning works toward the 10-minute target |
| **Measurement method** | CI job duration, captured automatically on every PR; Hamish reviews the trend after the first 2 weeks of real data to decide whether the target needs revision |
| **Feedback loop** | If runtime consistently exceeds 15 minutes past week 2, treat as a P1 — invest in parallelization/mocking before adding further E2E coverage |

---

## Tier 2: Meta Metrics (Learning / Validation)

Not applicable — no meta-benefit flag set for this feature.

---

## Tier 3: Compliance and Risk-Reduction Metrics

Not applicable — `context.yml` confirms `meta.regulated: false`, no named compliance framework applies, and the cross-tenant isolation risk-reduction goal is already captured as a Tier 1 product metric (Metric 5), not a distinct regulatory obligation.

---

## Metric Coverage Matrix

<!-- Populated by /definition after stories are created. -->

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Metric 1 — Broken build cannot reach prod | bri-s2.1, bri-s2.2, bri-s2.3, bri-s2.4, bri-s2.5, bri-s2.6 | Covered |
| Metric 2 — Flags toggle without redeploy | bri-s1.1, bri-s1.3, bri-s1.4, bri-s1.5 | Covered |
| Metric 3 — Zero staging/prod PostHog cross-contamination | bri-s1.2, bri-s1.4 | Covered |
| Metric 4 — Risk-critical journeys have E2E coverage | bri-s3.2, bri-s3.3, bri-s3.4, bri-s3.5, bri-s3.6 | Covered |
| Metric 5 — Cross-tenant isolation zero flake/skip | bri-s3.4 | Covered |
| Metric 6 — `@mocked` suite runtime under 10 min | bri-s3.1 (enables it), bri-s3.2–s3.6 (measured against it) | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
