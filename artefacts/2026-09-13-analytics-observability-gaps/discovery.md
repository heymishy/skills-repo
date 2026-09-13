# Discovery: Close the remaining PostHog observability gaps

<!--
  USAGE: Produced by the /discovery skill. The structured outcome of early exploration —
  what problem we're solving, for whom, and what success looks like at the edges.

  Status must be "Approved" before /benefit-metric can proceed.
  MVP scope and out-of-scope fields are the primary review targets.

  To evolve: update this template, open a PR, tag BA lead + product lead.
-->

**Status:** Draft — awaiting approval
**Created:** 2026-09-13
**Approved by:** Pending
**Author:** Claude (agent)

---

## Problem Statement

Real production incidents in this app are currently invisible until someone reports them.
`captureException()` — the PostHog-facing error-capture function already built and shipped in `posthog-server.js` — is wired into exactly one call site (`product-rollup.js`'s Contents-API failure path).
Every other unhandled error or exception across the rest of the application produces no PostHog signal at all, so the operator's only way to learn about a real production bug is a user reporting it, or noticing it themselves while using the app.
Separately, three smaller observability gaps compound this: `checkout_completed` carries a `planName` but no dollar amount, so PostHog cannot compute revenue/LTV from its own event stream; there is no session replay configured, so a broken session can't be watched after the fact, only reconstructed from discrete events; and person records carry no email or company-size property, so cohort segmentation beyond "which GitHub tenant" isn't possible.
This discovery was directly triggered by this session's own PostHog audit work (2026-09-13), which built the first real dashboards for this project (Production Overview, AI Cost & Usage, a pipeline-stage funnel) and, in doing so, surfaced how thin the underlying signal actually is outside of the pipeline-usage events already tracked.

## Who It Affects

**heymishy — solo operator/developer**, currently the only person running this product in production. When something breaks for the (currently small number of) real users, they have no visibility into it beyond what a user chooses to report, or what they happen to notice themselves while dogfooding the app. As real usage grows past what one person can manually watch, this gap gets worse, not better — exactly when it starts to matter most.

## Why Now

This session's own live-verification work (closing `tgid-s1`, `wusl-s2`, `rpiw-s1`, `paes-s1`, `paes-s2`) repeatedly found that claims about real external effects (a PostHog group-identify call, a session surviving a restart, analytics events firing correctly) could not be trusted without a live check — several were wrong when finally checked. That same session then built this project's first real PostHog dashboards and, in reviewing what data actually exists to dashboard, found that error visibility — arguably the single most operationally important signal for a solo operator — has almost no coverage at all. This is the natural next step in the same thread of work, not a new initiative.

## MVP Scope

The smallest thing that would meaningfully change what the operator can see:

1. **A global/centralized error-capture path** that catches unhandled exceptions and routes them through the existing `captureException()` function — the goal is one wiring point (e.g. a top-level handler in `server.js`, or a small number of route-boundary try/catch additions) rather than manually adding capture calls to every individual route handler.
2. **A dollar amount on `checkout_completed`** — add the actual charge/plan price as an event property, so PostHog's own event stream can answer "how much revenue have we captured" without cross-referencing Stripe.

Everything else identified in this discovery (session replay, surveys, person-property enrichment, retention/cohort views) is named explicitly as future scope below — real, worth doing, but not part of what "smallest thing that validates this is worth building" requires.

## Out of Scope

- **Session replay configuration** — genuinely useful (watching a real broken session beats reconstructing it from events), but it's a PostHog product-configuration change with its own privacy/consent considerations (session replay can capture on-screen content), not a code change to this repo. Deferred to a follow-on story once the MVP's error-capture path proves valuable.
- **PostHog Surveys (in-app NPS/feedback)** — a genuinely separate initiative (in-app UI, prompt timing/targeting decisions, response-review workflow) rather than a natural extension of "make errors visible." Deferred.
- **Person-property enrichment (email, company size)** — would improve cohort segmentation, but requires deciding where that data would come from (GitHub profile? a settings-page field?) and whether collecting it needs its own privacy/consent treatment. Deferred as a separate, smaller follow-on once the operator decides what's actually worth collecting.
- **Retention/cohort analysis** — requires no new code at all; it's a PostHog *view* over data already being captured, buildable directly in PostHog once usage volume is high enough to be meaningful (see `[ASSUMPTION]` below). Not part of this discovery's build scope.

## Assumptions and Risks

[ASSUMPTION] A single centralized error-capture wiring point (rather than per-route-handler additions) is technically feasible in this codebase's existing `server.js` request-handling structure — unconfirmed, requires /clarify before scope is locked at /definition.
[ASSUMPTION] Adding a dollar amount to `checkout_completed` does not require any new Stripe-side plumbing (i.e. the amount is already available at the point that event is currently fired in `billing.js`) — unconfirmed, requires /clarify before scope is locked.
[ASSUMPTION] The operator's PostHog plan tier supports whatever volume of new `$exception` events a global error handler might generate — unconfirmed; if error volume is unexpectedly high (e.g. a recurring bug fires exceptions repeatedly), this could have real cost/quota implications the operator should be aware of before this ships.

**Risk if not built:** the operator continues to learn about real production bugs only when a user reports them or they happen to notice — for a solo operator, this is a real, current gap, not a hypothetical one.
**Risk if built carelessly:** a global error handler that captures too aggressively (e.g. every expected/handled error, not just genuine unhandled exceptions) would itself become analytics noise, undermining the same "keep the signal clean" goal this session's `paes-s1`/`paes-s2` work just achieved for E2E traffic.

## Directional Success Indicators

**Unhandled-error visibility:** Baseline: `[UNKNOWN BASELINE]` — zero real unhandled errors have ever been observed in PostHog to date, so there's no current rate to compare against; the real baseline this measures is "0 of N call sites wired" (only 1 of many possible error paths currently reports). Target: a real production error, once it occurs, is visible in PostHog's Activity/Error views within the same session it happens, without the operator needing to notice it first. Measured via: a live check the next time (or the first time we can deliberately trigger) a real unhandled error occurs post-ship — mirroring this session's own live-verification pattern for `paes-s1`/`rpiw-s1`.
**Revenue visibility:** Baseline: `checkout_completed` events exist but carry no dollar figure — PostHog cannot answer "how much revenue this month" today without leaving PostHog. Target: PostHog's own event data can answer that question directly. Measured via: a real checkout event's properties, inspected in PostHog's Activity view.

## Constraints

- Solo operator, no dedicated engineering team — implementation should favour the smallest correct wiring point over an elaborate error-taxonomy system.
- PostHog's own event-volume/cost implications for a new class of `$exception` events are not yet understood (see Assumptions above) — worth a quick check of the current plan's limits before shipping a global handler.
- No other technical, regulatory, or budget constraints identified.

## Contributors

- heymishy — Operator
- Claude (agent) — drafted this discovery from this session's own audit findings

## Reviewers

- [Name — Role]

## Approved By

Pending

---

## /clarify recommendation

This discovery contains 3 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- A single centralized error-capture wiring point (rather than per-route-handler additions) is technically feasible in this codebase's existing `server.js` request-handling structure — unconfirmed, requires /clarify before scope is locked at /definition.
- Adding a dollar amount to `checkout_completed` does not require any new Stripe-side plumbing (i.e. the amount is already available at the point that event is currently fired in `billing.js`) — unconfirmed, requires /clarify before scope is locked.
- The operator's PostHog plan tier supports whatever volume of new `$exception` events a global error handler might generate — unconfirmed; if error volume is unexpectedly high (e.g. a recurring bug fires exceptions repeatedly), this could have real cost/quota implications the operator should be aware of before this ships.

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions produces metrics that will require revision after clarification.

---

**Next step:** Human review and approval → /benefit-metric
