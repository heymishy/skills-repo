# Story: Fix "New feature" redirecting to the sign-in page for logged-in users

**Epic reference:** None — short-track (bounded bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the live bug found during staging verification of the product-rollup epic
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **an authenticated operator creating a new feature from a product page**,
I want **clicking "New feature" to actually open the new journey's discovery stage**,
So that **I can start work on it immediately, instead of being shown the sign-in page and thinking I've been logged out**.

## Benefit Linkage

**Metric moved:** Core "add a feature to a product" flow — currently completely broken for every product, not a metric target from a formal benefit-metric artefact (short-track).
**How:** This is the single entry point for adding a feature to any product (button exists on every product page). It has never worked correctly: clicking it always lands on the login page regardless of authentication state, discovered live on `wuce-staging` on 2026-07-19.

## Architecture Constraints

- `src/web-ui/routes/products.js`'s `handlePostProductFeature` redirects to `/journeys/<journeyId>/discovery` (plural "journeys"). No route in `server.js` matches this pattern — every registered journey-related route uses singular `/journey/...` (e.g. `/journey/<slug>/resume`, `/journey/<id>/stage-review`). An unmatched path falls through to `server.js`'s final `else` branch, which unconditionally renders the login page (`renderLoginPage()`) regardless of session state — this is why the bug looks like a session/auth problem when it is a plain routing mismatch.
- The correct fix target is whichever existing journey-entry route is actually meant to open a freshly-created journey at its discovery stage — trace `handleGetJourney` (`src/web-ui/routes/journey.js:278`, registered at singular `/journey`) and its `req.params.journeyId` handling, and the `/journey/<slug>/resume` pattern, before deciding whether to (a) change the redirect target to an existing, correct route, or (b) the existing routes genuinely don't cover "open a specific journey by ID at its discovery stage" and a new route needs registering. Do not guess — read the actual current routing table in `server.js` in full first, since this story's own investigation found the routes already don't match what the story's own repo-wide docs assume.
- No new architecture pattern — this is a routing correction, following existing patterns in `server.js`'s router chain.

## Dependencies

- **Upstream:** None.
- **Downstream:** None directly, but every product's "add a feature" flow is blocked until this ships.

## Acceptance Criteria

**AC1:** Given an authenticated operator on a product's page, When they click "New feature," Then a new journey row is created (existing, working behaviour, unchanged) and the response redirects to a route that actually exists and returns HTTP 200, not the login page.

**AC2:** Given the redirect from AC1 completes, When the resulting page loads, Then it shows the newly created journey's discovery stage, ready for the operator to begin work — not a 404, not the login page, not an unrelated journey.

**AC3:** Given an operator whose session has genuinely expired (a real logged-out state, not this bug), When they attempt the same flow, Then they are still correctly redirected to sign in — this fix must not remove real authentication enforcement for genuinely unauthenticated requests.

**AC4:** Given the fix is in place, When any other existing route in `server.js` is requested (a regression check across the full router chain), Then no previously-working route's behaviour changes — this fix is additive/corrective to the New Feature flow only.

## Out of Scope

- Any change to `handleGetJourney`'s or `/journey/<slug>/resume`'s own internal logic beyond what's needed to correctly receive this redirect — if either already works correctly for this purpose, reuse as-is.
- The two other gaps found in the same staging session (repo-connection UX, kanban consolidation) — each has its own story.
- Any broader audit of every redirect in the codebase for the same class of mismatch — this story fixes the one confirmed instance (New Feature), not a general sweep.

## NFRs

- **Performance:** Not applicable — a routing correction, no new computation.
- **Security:** AC3 is the explicit guard — real unauthenticated requests must still be redirected to sign-in; this fix must not create an auth bypass.
- **Accessibility:** Not applicable — no new UI.
- **Audit:** Not applicable — no new logging beyond what already exists on journey creation.

## Complexity Rating

**Rating:** 1 — well understood once traced; the exact mismatch is already identified precisely (redirect target vs. registered routes), the remaining work is confirming the correct existing target or registering the missing one.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
