# Decision Log: 2026-07-09-beta-readiness-infra

**Feature:** Beta-Readiness Infrastructure — Feature Flags, Staging Environment, and E2E Test Coverage
**Discovery reference:** artefacts/2026-07-09-beta-readiness-infra/discovery.md
**Last updated:** 2026-07-09

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-07-09 | SCOPE | discovery/clarify**
**Decision:** The `@mocked` E2E suite's target runtime on every PR is under 10 minutes.
**Alternatives considered:** Under 5 minutes (more aggressive, forces heavier mocking/parallelization discipline from day one). No fixed number yet — measure real runtime first, set target retroactively at /benefit-metric.
**Rationale:** 10 minutes is a reasonable default for a small suite (5 key journeys) that's fast enough not to block iteration without over-constraining the initial build. Explicitly revisable once real runtime data exists — not treated as a permanent ceiling.
**Made by:** Hamish King (Founder/Operator), via /clarify, 2026-07-09
**Revisit trigger:** Once the suite exists and real runtime data is available, or if actual runtime is consistently far from 10 minutes.
---
**2026-07-09 | ASSUMPTION | discovery/clarify (validated, research-backed)**
**Decision:** Use PostHog's native group-based feature flag targeting (via the Group Analytics add-on) for tenant-level flag targeting, rather than building a custom tenant-override layer.
**Alternatives considered:** Build a custom server-side tenant-override layer in front of vanilla per-user PostHog flags. Treat as unconfirmed and spike the technical check as an early implementation task instead of resolving now.
**Rationale:** Verified live against PostHog docs — group-based flag targeting is a real, documented capability, gated only by an opt-in "Group Analytics" toggle in the billing dashboard. Pricing is usage-based, $0 within the 1M-events/month free tier — no real cost or plan blocker at beta-stage volume. Building a custom layer would duplicate functionality PostHog already provides natively.
**Made by:** Hamish King (Founder/Operator), via /clarify, 2026-07-09 (PostHog docs verified live: posthog.com/docs/feature-flags/targeting-groups, posthog.com/docs/product-analytics/group-analytics, posthog.com/pricing)
**Revisit trigger:** If event volume grows enough to incur real Group Analytics cost, or if PostHog changes group-targeting availability/pricing.
---
**2026-07-09 | ASSUMPTION | discovery/clarify (partially validated, partially deferred)**
**Decision:** The mock LLM gateway's fixture matrix covers the outer-loop skill stages (discovery, benefit-metric, definition, test-plan, definition-of-ready) as confirmed LLM-invoking. `branch-setup`/`branch-complete` (inner-loop transitions) are deferred to `/definition` for individual verification against actual code, not assumed to need fixtures.
**Alternatives considered:** Build fixtures for all 7 gate-map.js stages regardless of confirmation. Treat the entire question as fully deferred to /definition with no interim scoping.
**Rationale:** The web UI's model-first architecture (per `product/tech-stack.md`) confirms outer-loop skills invoke the LLM gateway via the same GitHub Copilot Chat Completions call. Inner-loop transition points are architecturally more likely to be mechanical git/PR actions, but this hasn't been verified against actual code — committing to build fixtures for them now risks wasted work if they turn out not to call the gateway at all.
**Made by:** Hamish King (Founder/Operator), via /clarify, 2026-07-09
**Revisit trigger:** When /definition inspects `branch-setup`/`branch-complete`'s actual session flow and determines whether they invoke `skill-turn-executor`.
**Resolved 2026-07-09 (at /review, post-/definition):** confirmed via `routes/journey.js`'s `SLASH_CAPABILITY_MAP` — `branch-setup` and `branch-complete` are both listed alongside every other skill in the same structure, driven by the same model-first skill-session architecture. `limitedOnWebUI: true` reflects missing `git-worktree`/`bash-scripts`/`pr-creation` capabilities in a browser context, not a bypass of the LLM gateway. All 7 `gate-map.js` stages invoke the gateway — bri-s3.1's fixture matrix updated from 5 to 7 stages (minimum 14 fixtures) accordingly.
---
**2026-07-09 | RISK-ACCEPT | review**
**Decision:** `bri-s3.3` (multi-user-within-one-tenant journey spec) is written and committed now, but formally cannot pass until `2026-07-09-team-identity-roles` reaches at least definition-of-ready — this is logged as a structural PROCEED-BLOCKED condition, not left as informal prose in the story's Dependencies field.
**Alternatives considered:** Defer writing bri-s3.3 entirely until team-identity-roles reaches DoR (rejected — the story's shape is already clear enough to write now, and doing so surfaces the dependency early rather than leaving a silent gap in Epic 3's story count). Write it without any formal gate (rejected — this was the /review finding: undocumented cross-feature blocking dependencies are a real DoR risk since the story template's own pre-check "no dependency on an incomplete upstream story" would otherwise silently fail).
**Rationale:** The dependency is real and already accurately described in the story text; what was missing was a structural decision-log entry recording it as a gate, not just informal prose. This entry is that gate.
**Made by:** Hamish King (Founder/Operator), via /review, 2026-07-09
**Revisit trigger:** When `2026-07-09-team-identity-roles` reaches definition-of-ready, re-verify bri-s3.3's ACs against the feature's final role list/schema before this story proceeds past implementation.
---
**2026-07-09 | ASSUMPTION | discovery/clarify (validated, research-backed)**
**Decision:** No paid-tier fallback for Neon or Upstash is scoped into MVP — both free tiers are sufficient for staging's CI-driven load.
**Alternatives considered:** Scope a paid-tier upgrade path into MVP as a contingency. Assume the free tiers are insufficient and design a fallback mechanism from the start.
**Rationale:** Verified live against docs — Neon (100 CU-hours/month, autosuspend after 5 min idle) and Upstash (500K commands/month, 256MB storage) are both comfortably within range for CI-driven, non-sustained traffic at this MVP's scale. The known risk is Neon's autosuspend cold-start latency (already named in discovery.md), not capacity — no need to over-engineer a paid-tier contingency for a risk that doesn't exist yet.
**Made by:** Hamish King (Founder/Operator), via /clarify, 2026-07-09 (Neon/Upstash docs verified live: neon.com/docs/introduction/plans, neon.com/pricing, upstash.com/docs/redis/overall/pricing)
**Revisit trigger:** If staging traffic grows materially beyond CI-driven usage (e.g. beta customers get direct staging access).
---
**2026-07-10 | RISK-ACCEPT | definition-of-ready**
**Decision:** Accept bri-s1.1's finding 1-M1 (AC3 mixes an implementation-detail parenthetical into an observable-behaviour AC) without a story rewrite.
**Alternatives considered:** Rewrite AC3 to drop the parenthetical before DoR sign-off.
**Rationale:** Cosmetic wording issue only — the AC is still testable and correct as written; not worth blocking DoR sign-off for a phrasing nitpick.
**Made by:** Hamish King (Founder/Operator), via /decisions, 2026-07-10
**Revisit trigger:** None — low priority, fix opportunistically if the story is touched again.
---
**2026-07-10 | RISK-ACCEPT | definition-of-ready**
**Decision:** Accept bri-s1.3's findings 1-M1 (AC2 hedge phrasing "not expected to apply") and 1-M2 (Benefit Linkage's mechanism is indirect — connects to Metric 2 via UX-quality adjacency, not the direct redeploy-free-toggle mechanism) without a story rewrite.
**Alternatives considered:** Reword AC2 to an assertive statement; tighten the Benefit Linkage sentence to name the direct mechanism.
**Rationale:** Both are low-severity wording issues that don't affect testability or the story's validity — the AC is still verifiable, and the metric connection, while indirect, is plausible and already explained.
**Made by:** Hamish King (Founder/Operator), via /decisions, 2026-07-10
**Revisit trigger:** None — low priority.
---
**2026-07-10 | RISK-ACCEPT | definition-of-ready**
**Decision:** Accept bri-s1.4's finding 1-M1 (Benefit Linkage misattributes its source — the "consistent across all users in a tenant" phrase traces to the epic's Goal statement, not discovery, as the story claims) without a story rewrite.
**Alternatives considered:** Correct the citation to reference the epic instead of discovery.
**Rationale:** Minor citation-hygiene issue — the underlying metric connection is still valid and correctly reasoned, just misattributed to the wrong artefact.
**Made by:** Hamish King (Founder/Operator), via /decisions, 2026-07-10
**Revisit trigger:** None — low priority.
---
**2026-07-10 | RISK-ACCEPT | definition-of-ready**
**Decision:** Accept bri-s3.1's finding 1-M1 (AC4 describes an investigative/documentation activity — "a concrete determination is recorded" — rather than a directly observable product behaviour) without a story rewrite.
**Alternatives considered:** Split AC4 into a pre-story spike task; reword as a direct fixture-existence assertion.
**Rationale:** The underlying question AC4 refers to is already resolved (branch-setup/branch-complete confirmed to invoke the gateway, per this same decisions.md's earlier entry) — AC4's phrasing is now more historical record than open investigation, and reworking it adds no verification value.
**Made by:** Hamish King (Founder/Operator), via /decisions, 2026-07-10
**Revisit trigger:** None — low priority.
---
**2026-07-10 | RISK-ACCEPT | definition-of-ready**
**Decision:** Accept bri-s3.3's finding 1-M2 (ADR-025 is cited for within-tenant RBAC, but ADR-025 specifically governs cross-tenant (tenant_id) scoping, not intra-tenant role differentiation — a defensible stretch, not a wrong citation) without a story rewrite.
**Alternatives considered:** Remove the ADR-025 citation entirely; add a note distinguishing it from the real governing spec (the not-yet-written team-identity-roles feature).
**Rationale:** The citation is informative context (role-gated routes still pass through ADR-025's tenant-scoped guards) even though it isn't the primary governing spec for role semantics — not worth removing, and this story is already blocked on a separate, more substantive gate (RISK-ACCEPT above) pending team-identity-roles.
**Made by:** Hamish King (Founder/Operator), via /decisions, 2026-07-10
**Revisit trigger:** Revisit citation accuracy once team-identity-roles's own ADR/decisions exist to reference instead.
---

---

## Architecture Decision Records

<!-- Add further ADRs as ADR-001, ADR-002 etc. -->
