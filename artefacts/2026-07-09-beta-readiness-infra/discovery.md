# Discovery: Beta-Readiness Infrastructure — Feature Flags, Staging Environment, and E2E Test Coverage

**Status:** Approved
**Created:** 2026-07-09
**Approved by:** Hamish King — Founder / Operator — 2026-07-09
**Author:** Copilot

---

## Problem Statement

wuce is pre-launch with no staging environment, no feature-flag mechanism, and no deterministic test coverage for its riskiest flows. Every merge to `main` deploys straight to production (`skills-framework` on Fly.io) with only unit tests as a gate — a broken build, an incomplete feature, or a regression in tenant isolation (the guard ADR-025 depends on being correctly applied to every new route) can reach real users with no rehearsal step and no kill switch. Before inviting real beta customers, three gaps need closing, in sequence: (1) no way to ship incomplete work behind a flag and toggle it without a redeploy, (2) no environment to rehearse a deploy or run a full regression/E2E suite against before it reaches production, (3) no deterministic, tagged test suite covering the journeys that would actually embarrass the business if broken in front of a beta customer (signup, cross-tenant isolation, billing, auth).

## Who It Affects

- **Hamish (solo operator/founder), today** — deploys directly to production on every merge with no staging rehearsal and no way to gate incomplete work. Currently the only line of defense against a bad deploy reaching real users is manual care and unit tests.
- **First real beta customers (not yet onboarded)** — the actual reason this work exists. They'll experience wuce for the first time; a broken build, a cross-tenant leak, or a billing failure in their first session could be the only impression they get before deciding whether to trust the product.
- **Future engineers joining the team** (ties to the `2026-07-09-team-identity-roles` work just scoped) — need a safe way to merge incomplete work behind a flag without blocking trunk or risking a half-built feature reaching prod before it's ready.

## Why Now

The platform is about to move from solo-operator use to real beta customers — the last moment before external trust is on the line. This session alone surfaced several production bugs that shipped straight to `main` with no staging rehearsal (the GitHub OAuth first-login bug, two billing body-parsing bugs, the plan-limit gate bug) — direct evidence that the current "merge → prod" pattern already produces near-misses on a solo-operator's own account. Before a real beta customer hits the same class of bug on their first session, the safety net (flags, staging, deterministic test coverage) needs to exist.

## MVP Scope

Three sequenced sub-features, each a prerequisite for the next — not built in parallel:

1. **Feature flags** (PostHog, staging + prod projects separated, tenant-level targeting per ADR-025's tenancy model) — lets incomplete work merge to `main` safely, gated off, before staging/CI depend on a clean feature set.
2. **Staging environment** (separate Fly app, Neon branch, Upstash instance, CI promote gate) — cannot be meaningfully smoke-tested or trusted as a rehearsal step until flags exist to gate anything incomplete that's already merged.
3. **Deterministic E2E test coverage** (mock LLM gateway, tagged `@mocked`/`@live`/`@billing`/`@multi-tenant` journeys) — these specs are written *against* the staging environment, so staging must pass its own smoke test first.

The MVP is complete when: a broken build cannot reach prod, an admin can gate an incomplete feature without a redeploy, and the tagged E2E suite covers signup, cross-tenant isolation, billing, and auth as a real pre-beta gate. Implementation specifics (exact CI YAML, Fly/Neon/Upstash wiring details, PostHog SDK integration points) are deliberately left to `/definition` and the per-sub-feature implementation plans — this discovery bounds *what* must exist, not the full technical design.

## Out of Scope

- **Kubernetes, microservices split, event-driven service mesh.** Explicitly rejected — Fly.io + Neon + Upstash already cover both prod and staging data/compute layers at near-zero cost; this infrastructure shift has no problem it would solve here.
- **Fly-managed Postgres/Redis.** Neon (Postgres, copy-on-write branching) and Upstash (Redis, free-tier) are used instead — explicitly named as the data-layer choice, not Fly-managed alternatives.
- **Full production monitoring/alerting overhaul.** This feature is about pre-prod rehearsal (staging + flags + tests), not observability once already in production — that's a separate concern.
- **Multi-region or HA staging / canary/blue-green deploys.** Staging is a single environment with a single promote gate — not a progressive-delivery or multi-region rehearsal setup.
- **Self-serve team invites and per-seat billing.** Already deferred in the `2026-07-09-team-identity-roles` discovery; not re-opened here.

## Assumptions and Risks

**Resolved via /clarify (2026-07-09), verified against live PostHog docs:** group-based feature flag targeting is a real, documented PostHog capability — flags evaluate against a group key (e.g. `tenant`) so everyone in the same group sees the same flag value. It requires explicitly enabling "Group Analytics" from the PostHog billing dashboard (an opt-in toggle, not automatic). Pricing is usage-based, starting at $0.000071/event beyond the free tier, with $0 cost within the standard 1M-events/month free allowance — effectively free at beta-stage volume, but a real (if currently zero) cost input, not truly free forever. Limit: 5 group types per project (only 1 needed — `tenant`). See Constraints for the cost caveat.
**Resolved via /clarify (2026-07-09), verified against live docs:** both Neon (100 CU-hours/month, 0.5GB storage/project, 10 branches/project, autosuspend after 5 min idle) and Upstash (500K commands/month, 256MB storage, 10GB bandwidth) free tiers are sufficient for MVP staging load — CI-driven Playwright runs plus occasional manual smoke tests, not sustained high-volume traffic. The known risk is Neon's autosuspend cold-start latency (already named above), not capacity — no paid-tier fallback needs to be scoped for MVP.
**Resolved via /clarify (2026-07-09):** most of the 7 `gate-map.js` stages invoke the LLM gateway (outer-loop skills — discovery, benefit-metric, definition, test-plan, definition-of-ready — run through the model-first architecture per `tech-stack.md`). However, the inner-loop transition points (`branch-setup`, `branch-complete`) may be more mechanical (git/PR actions) than model-driven sessions and are not confirmed either way. `/definition` must verify each of the 7 stages individually against actual code (does this skill's session flow call `skill-turn-executor`?) before finalizing the mock gateway's fixture matrix — do not assume all 7 uniformly need fixtures.

**Resolved via /clarify (2026-07-09):** the `@mocked` suite's target runtime on every PR is **under 10 minutes**, revisable once real runtime data exists (not locked in permanently — a reasonable starting default, not a measured baseline).

**Risk:** Neon free-tier autosuspend/cold-start latency could make Playwright CI timing flaky in a way that looks like a real regression — this needs a concrete timeout budget decided at `/definition`, not left as "account for it."

## Directional Success Indicators

1. **A broken build cannot reach prod.** Baseline: 0% — every merge to `main` deploys straight to prod today, no staging gate exists. Target: 100% of merges pass through staging deploy + smoke test + manual promote gate before reaching prod. Measured via: GitHub Actions pipeline configuration + deploy logs.
2. **Feature flags toggle without a redeploy.** Baseline: 0 — no flag-evaluation mechanism exists today (`posthog-server.js` is capture-only). Target: toggling any of the 3 named flags (`wizard-ui`, `model-routing-glm52`, `billing-v2`) in PostHog changes app behavior without a deploy event. Measured via: automated test toggling a flag via the PostHog API and asserting the behavior change.
3. **Zero staging/prod PostHog cross-contamination.** Baseline: `[UNKNOWN BASELINE]` — no staging project exists yet, so no current contamination rate to measure against. Target: 0 staging-triggered events or flag toggles ever appear in the prod PostHog project. Measured via: automated test asserting staging always uses the staging API key; manual audit in the first week of dual-project use.
4. **Risk-critical journeys have deterministic E2E coverage.** Baseline: 0 of 5 (signup, multi-user/permissions, cross-tenant isolation, billing, auth) have dedicated Playwright specs today. Target: 5/5 covered, correctly tagged (`@mocked`/`@live`/`@billing`/`@multi-tenant`). Measured via: spec file and tag audit in `tests/e2e/`.
5. **Cross-tenant isolation suite has zero tolerance for flake or skip.** Baseline: `[UNKNOWN BASELINE]` — suite doesn't exist yet. Target: 0% skip rate, 0% flake rate over an agreed number of consecutive CI runs. Measured via: CI history for the `@multi-tenant`-tagged suite.
6. **`@mocked` suite runtime on every PR.** Baseline: `[UNKNOWN BASELINE]` — suite doesn't exist yet. Target: under 10 minutes (revisable once real runtime data exists). Measured via: CI job duration for the `@mocked`-tagged run.

## Constraints

- **Zero-new-npm-dependencies remains relaxed for web-ui work** (carried over from the `2026-07-09-team-identity-roles` discovery) — `posthog-js`/`posthog-node` and Playwright (already governed by ADR-018) are permitted additions.
- **No Kubernetes, microservices, service mesh, or Fly-managed Postgres/Redis** — Neon + Upstash cover both prod and staging data layers, per explicit non-goals.
- **Staging costs must stay near-zero** — Fly compute only; Neon and Upstash free tiers, no paid infrastructure tier for staging.
- **PostHog Group Analytics must be explicitly enabled** (billing-dashboard toggle) to support tenant-level flag targeting. Usage-based, $0 within the 1M-events/month free tier, $0.000071/event beyond it — effectively free at beta-stage volume but not a hard-zero-forever cost; revisit if event volume grows materially.
- **Playwright is the sole E2E framework (ADR-018)** — the mock-LLM-gateway and tagged specs must be built within this existing governed choice, not a new framework.
- **Sequencing is a hard constraint, not a preference** — sub-feature 2 must pass its own smoke test before sub-feature 3's specs are written against it; sub-feature 1 ships first since it gates incomplete work in the other two.
- **Injectable adapter pattern (D37) required** for the mock LLM gateway and any new external dependency (PostHog client, Neon/Upstash connections).
- **Not a regulated context** — `context.yml` confirms `meta.regulated: false`.
- **W4 solo-operator posture** — no second reviewer required.
- No time/budget constraint identified.

## Contributors

- Hamish King — Founder / Operator

## Reviewers

- None (solo pass)

## Approved By

Hamish King — Founder / Operator — 2026-07-09

---

## Clarification log

[2026-07-09] Clarified via /clarify:
- Q: What's the target runtime for the `@mocked` suite on every PR?
  A: Under 10 minutes, revisable once real runtime data exists.
- Q: Does PostHog's plan actually support tenant/group-level flag targeting?
  A: Confirmed via live PostHog docs — group-based flag targeting is a real capability, requires enabling Group Analytics (billing-dashboard toggle), usage-based pricing, $0 at beta-stage volume within the 1M-events/month free tier.
- Q: Do all 7 gate-map.js stages actually invoke the LLM gateway?
  A: Mostly yes for outer-loop skills (model-first architecture); `branch-setup`/`branch-complete` (inner-loop) are unconfirmed and must be individually verified at /definition rather than assumed.
- Q: Are Neon's and Upstash's free tiers sufficient for staging load?
  A: Confirmed via live docs — both are sufficient for MVP staging load (CI-driven, not sustained high-volume traffic). Known risk is Neon's autosuspend cold-start latency, not capacity.

---

**Next step:** Human review and approval → /benefit-metric
