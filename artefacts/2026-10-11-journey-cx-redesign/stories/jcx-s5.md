## Story: Authorization and tenant-scoping verification across the placeholder-trigger and mapping-conversion surface

**Epic reference:** artefacts/2026-10-11-journey-cx-redesign/epics/journey-map-and-placeholder-trigger.md
**Discovery reference:** artefacts/2026-10-11-journey-cx-redesign/discovery.md
**Benefit-metric reference:** artefacts/2026-10-11-journey-cx-redesign/benefit-metric.md
**Domain:** [web-ui, security]

## User Story

As an **outer loop practitioner (PO / SME / discovery lead)**,
I want **the placeholder-feature trigger and mapping-conversion routes to be explicitly, independently verified against cross-tenant access and viewer-role mutation**,
So that **this genuinely new trigger surface (a UI action kicking off a backend pipeline run) doesn't become the one route in this app that's accidentally under-protected, the way `ic-s2`'s own position route briefly was until an independent check caught it**.

## Benefit Linkage

**Metric moved:** M2 — Placeholder-feature trigger actually used
**How:** A trigger surface that's unsafe to use (cross-tenant leakage, viewer-role mutation) is a trigger surface operators and the platform owner can't trust — this story is what makes M2's own growth safe to actually encourage, not just functionally possible.

## Architecture Constraints

- **ADR-025** — multi-tenancy enforced at the application layer; this story is the explicit verification pass for that constraint across `jcx-s1`/`jcx-s2`'s own new routes, not a new mechanism.
- **D13 (decisions.md convention, `ic-s2`/`ep1`-era)** — 404, not 403, for a cross-tenant resource id; zero mutation on a denied request.
- **Confirmed via `/clarify` (2026-10-11):** the trigger uses the same authorization as any other mutating route — non-viewer tenant member. This story verifies that confirmed decision holds in the real, merged code, the same way `check-vrne-s4-edge-case-gate.js`'s own real-server-dispatch harness (`src/web-ui/server.js` router, seeded multi-user-role sessions) already verifies it for every other mutating route in this app.

## Dependencies

- **Upstream:** `jcx-s1` and `jcx-s2` must both be DoD-complete — this story verifies their own shipped routes, it does not build new functional behaviour.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a cross-tenant journey stage id, When the placeholder-feature creation route (`jcx-s1`) is called against it, Then the response is 404 (not 403), and zero rows are written to `feature_customer_journey_stage_mappings` — verified via a real `pool`/mock assertion on write-call count, matching `handlePostFeatureMapping`'s own existing cross-tenant test pattern.

**AC2:** Given a cross-tenant journey stage id, When the trigger route is called against it, Then the response is 404, and no new `artefacts/[feature-slug]/` folder or `pipeline-state.json` entry is created.

**AC3:** Given a viewer-role session (not owner/non-viewer), When the placeholder-feature creation or trigger route is called, Then the response is 403 — verified via a real `server.js` router dispatch with a seeded viewer-role session, reusing `check-vrne-s4-edge-case-gate.js`'s own established real-dispatch harness pattern (not a handler-level unit test alone, since `requireNonViewer` lives in `server.js`'s own route chain, not inside the handler — the exact gap `ic-s2`'s own DoD found and fixed for its position route).

**AC4:** Given the mapping-conversion route (`jcx-s2`), When called for a journey stage belonging to a different tenant than the requesting session, Then the response is 404 and the mapping's `mapping_state` remains unchanged (no partial conversion).

**AC5:** Given all of AC1–AC4 pass, When the full test suite runs, Then no existing route's own authorization test regresses — this story adds verification, it does not change any other route's behaviour.

## Out of Scope

- Building a new, finer-grained permission tier — explicitly ruled out at `/clarify` (2026-10-11); this story verifies the existing uniform model, it does not change it.
- Rate-limiting or abuse-prevention on the trigger route — not named as a risk in discovery.md; a follow-up if M2's own usage data later shows a problem.

## NFRs

- **Performance:** None beyond existing route bounds — this story adds test coverage, not new runtime code paths.
- **Security:** This story's entire purpose — see ACs above.
- **Accessibility:** Not applicable — no new UI surface, verification-only.
- **Audit:** Denied cross-tenant/viewer-role attempts should be observable in the same logging convention every other denied mutating route already uses in this app.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
