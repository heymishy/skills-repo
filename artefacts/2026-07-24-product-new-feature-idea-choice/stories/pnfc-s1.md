## Story: Offer the formed-idea/rough-idea choice when creating a new feature from a product's page

**Epic reference:** None — short-track (bounded fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the operator's direct observation (2026-07-24, captured in `workspace/capture-log.md`) that creating a new feature from a product's page always goes straight to `/discovery` (the formed-idea track), with no choice offered — even though this exact choice already exists and works correctly on a separate page (`/journey`).
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below.

## User Story

As **Hamish King (Founder/Operator)**,
I want **the "New feature" button on a product's page to ask whether I'm starting from a rough idea or a formed idea, the same way the `/journey` page's own "Start a new feature" form already does**,
So that **I can route a genuinely half-formed idea into `/ideate` directly from the product I'm working in, instead of being forced into `/discovery` and losing the rough-idea exploration step**.

## Benefit Linkage

**Metric moved:** None — pure UX-consistency fix, not tied to a Tier 1 product metric (no benefit-metric artefact exists for this short-track story, per CLAUDE.md's short-track convention). Benefit stated directly: closes a real, confirmed inconsistency between two entry points to the same underlying capability.

## Architecture Constraints

- **The choice mechanism already exists and works — reuse it, don't rebuild it.** Confirmed via direct code read (2026-07-24): `/journey`'s own "Start a new feature" form (`src/web-ui/routes/journey.js`, around line 266-267) already has the exact two-option radio (`startSkill=ideate` "Rough idea — explore the opportunity space first" / `startSkill=discovery` "Formed idea — jump straight to discovery"), posting to `POST /api/journey` (`handlePostJourney`), which correctly branches on `startSkill` to register the session under the right skill and redirect into `/skills/ideate/...` or `/skills/discovery/...` accordingly.
- **The gap is specifically in `handlePostProductFeature`** (`src/web-ui/routes/products.js`, confirmed at line 1488), which hardcodes `'discovery'` at both session-registration time (`registerHtmlSession(sid, sessionPath, 'discovery', ...)`, line ~1534) and journey-stage time (`setActiveSession(journeyId, sid, 'discovery')` / `updateStage(featureSlug, 'discovery', ...)`, lines ~1544-1549), with zero branching logic — this is the exact hardcoding that must be replaced with the same `startSkill`-driven branching `handlePostJourney` already implements correctly.
- **Preserve product-scoping.** `handlePostProductFeature`'s current behaviour correctly sets `productId` on the created journey (`_journeyStore.setJourneyFields(journeyId, { ..., productId })`) — this story must not lose that; the fix is to add the missing choice, not to route through `handlePostJourney` wholesale (which does not accept/set a `productId` today) unless the coding agent's investigation finds that extending `handlePostJourney` to also accept an optional `productId` is a cleaner, lower-duplication path than duplicating the `startSkill` branch logic in `handlePostProductFeature`. Either approach is acceptable; document the choice in `decisions.md`.
- **The current "New feature" button is a single-click form with no user input** (`products.js` line ~610: `<form method="POST" action="/products/:id/features"><button type="submit">New feature</button></form>`) — this story must change it to present the same two-option choice before submitting, not silently keep the single-click UX and guess.

## Dependencies

- **Upstream:** None.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given an operator viewing a product's page, When they click "New feature", Then they are presented with the same two-option choice already used on `/journey` ("Rough idea — explore the opportunity space first" vs "Formed idea — jump straight to discovery") before a journey/session is created — not an immediate single-click POST with no choice.

**AC2:** Given the operator selects "Rough idea", When they confirm, Then the created session is registered under `ideate` (not `discovery`), the journey's `productId` is still correctly set to the product they started from, and they land on `/skills/ideate/sessions/:id/chat`.

**AC3:** Given the operator selects "Formed idea", When they confirm, Then the created session is registered under `discovery` exactly as today's existing behaviour, the journey's `productId` is still correctly set, and they land on `/skills/discovery/sessions/:id/chat`.

**AC4:** Given AC2's rough-idea path completes and the operator later views the product's page again, When they look at the feature/journey list, Then the newly-created feature is visible and correctly attributed to this product (i.e. `productId`-scoping is not broken by the ideate path, matching AC3's discovery path's existing correct behaviour).

**AC5:** Given the existing `/journey` page's own "Start a new feature" form and `handlePostJourney`'s existing behaviour, When this story ships, Then neither is changed or regressed — this story only adds the missing choice to the product-scoped entry point, confirmed by existing tests for `/journey`'s own flow (if any) still passing unmodified.

## Out of Scope

- Any redesign of the `/journey` page's own existing choice UI — reused as-is, not changed.
- A third "browse existing ideas" option or any other entry-point consolidation — this story is scoped to adding the missing rough/formed choice, not a broader entry-point redesign.
- Any change to `/ideate`'s or `/discovery`'s own skill session behaviour once started — out of scope, this story only affects which one is entered.

## NFRs

- **Performance:** Negligible — one additional confirm step before form submission, no new backend cost beyond what `handlePostJourney`'s existing `startSkill` branch already does.
- **Security:** None new — reuses the existing session-registration and product-ownership logic verbatim.
- **Accessibility:** The new choice UI must be keyboard-operable radio buttons, matching `/journey`'s own existing accessible pattern (reused, not redesigned).
- **Audit:** Not applicable — no new audited action, same journey-creation event as today.

## Complexity Rating

**Rating:** 2 — the underlying branching logic is proven and already exists elsewhere (low risk), but correctly wiring it into `handlePostProductFeature` while preserving `productId`-scoping (AC4) requires care, and the exact code-reuse-vs-duplication decision (Architecture Constraints) is a genuine implementation-time choice.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic — N/A (short-track, no epic); Low oversight (UX-consistency fix reusing an already-proven mechanism)
