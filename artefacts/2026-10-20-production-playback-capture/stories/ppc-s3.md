# Story: Rate-limit the capture-trigger endpoint per tenant user

**Epic reference:** `artefacts/2026-10-20-production-playback-capture/epics/ppc-self-service-capture.md`
**Discovery reference:** `artefacts/2026-10-20-production-playback-capture/discovery.md`
**Benefit-metric reference:** `artefacts/2026-10-20-production-playback-capture/benefit-metric.md`
**Domain:** `[web-ui, security]`

## User Story

As a **Tenant Product Owner**,
I want to **have the capture-trigger action protected from accidental runaway triggering (double-clicks, buggy retries)**,
So that **the self-service capability stays reliably available to me rather than degrading or being disabled under accidental load.**

## Benefit Linkage

**Metric moved:** Self-service DoD validation adoption (Metric 1)
**How:** An unprotected endpoint vulnerable to accidental runaway load would directly suppress sustained adoption — this story is a precondition for the capability staying trustworthy enough for real, repeated use, not a feature preference.

## Architecture Constraints

- Reuse the existing `createRateLimiter` pattern from `src/web-ui/middleware/rate-limiter.js` (already used in `sign-off.js` at 10 req/user/min) — do not introduce a new rate-limiting mechanism when an existing, proven one already covers this shape (consistent with this codebase's own reuse-first precedent, confirmed at `/trace` 2026-10-19 for the `rpca` epic).
- A true system-wide concurrency cap is explicitly fast-follow per `discovery.md`'s Constraints section — do not build it as part of this story.
- Per this repo's own distributed-rate-limiting note (`product/roadmap.md`, "Flagged for reconsideration"): the existing `createRateLimiter` pattern is in-process-only. This story inherits that known limitation unchanged — it is not a regression this story introduces, and is not this story's responsibility to fix.

## Dependencies

- **Upstream:** `ppc-s1` and `ppc-s2` — there is no endpoint to rate-limit otherwise. Sequenced last because this story has no standalone user-visible value by itself.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a tenant's Product Owner has triggered a "Capture all evidence" action within the last 60 seconds, When they attempt to trigger another capture action (same or different feature) before the rate-limit window resets, Then the request is rejected with a clear rate-limit message — not a silent failure and not a queued duplicate run.

**AC2:** Given the rate limit is scoped per-user, When two different Product Owners within the same tenant each trigger a capture action independently, Then neither is blocked by the other's usage.

**AC3:** Given a Product Owner's rate-limit window has expired, When they trigger a new capture action, Then it proceeds normally — the limiter produces no false-positive lockout beyond its own configured window.

## Out of Scope

- A system-wide/global concurrency cap across all tenants — explicitly fast-follow per `discovery.md`.
- Per-tenant (as opposed to per-user) limiting — this story limits per-user only, per AC2.

## NFRs

- **Performance:** the rate-limiter check itself adds negligible latency, consistent with its existing `sign-off.js` usage.
- **Security:** mitigates a basic resource-exhaustion vector on the capture endpoint; does not claim to prevent sophisticated/distributed abuse — explicitly out of scope per `discovery.md`'s own Constraints section.
- **Accessibility:** the rate-limit error message must be exposed to assistive technology (not a visual-only toast).
- **Audit:** none identified.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
