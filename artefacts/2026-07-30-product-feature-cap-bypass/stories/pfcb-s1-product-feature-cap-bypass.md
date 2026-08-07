## Story: Close the usage-cap bypass in the "add feature from within a product" flow

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery
**Benefit-metric reference:** None — short-track skips benefit-metric

## User Story

As the **Platform operator**,
I want **every feature-creation entry point to enforce the same trial usage cap, not just the standalone /journey form**,
So that **a tenant who signs up and never completes Stripe checkout gets the intended "some free usage, then capped" trial experience everywhere in the product, not unlimited access via a second, ungated path**.

## Background / Investigation

The operator signed up a new account, deliberately did not complete Stripe checkout, and found they could still create products and features "as per normal" with no restriction. Confirmed intended policy (operator confirmation, 2026-07-30): a trial tenant should get some free usage before being capped — this is the existing `bri-s3.5` usage-gate design (`MAX_JOURNEYS_PER_TENANT`), already correctly enforced on the standalone `/journey` "new feature" form (`handlePostJourney`, `routes/journey.js`, s2.1's pre-flight billing gate).

Root cause (confirmed via code review): `handlePostProductFeature` (`routes/products.js`) — the "add feature" flow reached from within a product's own page, a *separate* code path from the standalone `/journey` form — creates a journey directly via `journeyStore.createJourney()`/`setJourneyFields()` with **no reference anywhere to `tenantPlan.checkJourneyCap`**. This entry point was never wired to the usage-cap check at all, so a trial tenant hitting "Add feature" from a product page bypassed the cap entirely, regardless of `MAX_JOURNEYS_PER_TENANT`'s configured value.

## Architecture Constraints

- Ports the exact same pre-flight gate `handlePostJourney` already uses (s2.1): compute the tenant's current journey count via `journeyStore.listJourneys(repoRoot)` filtered by `tenantId`, call `tenantPlan.checkJourneyCap(tenantId, count, repoRoot)`, and render the same "Journey limit reached" 402 page (via `_htmlShell.renderShell`, already imported in `products.js`) when blocked.
- No new cap mechanism, no new env var — reuses `MAX_JOURNEYS_PER_TENANT`/`tenantPlan.js`'s existing priority chain (injected `capReader` > in-memory remote override > `tenant-caps.json` file > env var > unlimited) unchanged.
- Gate runs before any journey is created — a blocked request creates zero journeys, matching the standalone form's exact behaviour.

## Dependencies

- **Upstream:** None — this closes a gap in an existing, already-shipped mechanism (`bri-s3.5`'s usage gate).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a tenant already at their journey cap, When they submit the "add feature" form from within a product page (`POST /products/:id/features`), Then the response is a 402 with the same human-readable "Journey limit reached" message the standalone `/journey` form already shows — not a silently-created feature.

**AC2:** Given the same blocked request, When inspected, Then zero journeys were created in the store — the gate runs before journey creation, not after.

**AC3:** Given a tenant well under their cap, When they submit the same form, Then it succeeds exactly as before this fix (real redirect to the new feature's chat session) — no regression to the healthy path.

**AC4:** Given no cap is configured at all (`MAX_JOURNEYS_PER_TENANT` unset, no override), When the same form is submitted, Then it succeeds unchanged — matching this handler's pre-existing behaviour for every existing test that doesn't configure a cap.

**AC5:** Given a tenant with `paid`/`active` plan state, When they submit the same form, Then the cap is lifted entirely (unlimited), exactly matching the standalone `/journey` form's own AC1/AC4 behaviour (a paid tenant is never capped, regardless of which entry point they use).

**AC6 (regression guard):** Given these changes, When the existing unit test suite runs, Then it shows the same pre-existing baseline failure count with zero new regressions, and every existing test touching `handlePostProductFeature` (`check-jrf-s1-new-feature-redirect.js`, `check-jrf-s2-register-product-feature-journeys.js`, `check-fdn-s1-feature-display-name.js`, `check-pnfc-s1-product-feature-choice.js`, `check-psh-s4-navigation.js`, `check-pan-s1-product-aware-navigation.js`) continues to pass unchanged.

## Out of Scope

- Gating **product creation** itself (`handlePostProductNew`) behind any cap or plan check — confirmed with the operator that the trial model is "some free usage, then capped" at the journey/feature level; products themselves have never been a metered resource in this design, and introducing a product-level cap is a separate product decision not requested here.
- Any change to the actual `MAX_JOURNEYS_PER_TENANT` value or `tenant-plan.js`'s cap-resolution logic itself — reused unchanged.
- Auditing every other route in the codebase for a similarly-missed cap-gate — this was the one instance surfaced by direct operator testing; a broader audit is a valid follow-up but not scoped here.

## NFRs

- **Performance:** Negligible — one additional `listJourneys` scan + one cap lookup per feature-creation request, identical cost to the already-shipped standalone-form gate.
- **Security:** None — this closes a business-logic bypass (unlimited free usage), not a data-exposure issue; no new attack surface introduced.
- **Accessibility:** Not applicable — reuses the existing 402 page's markup unchanged.
- **Audit:** The `console.error` log line on a blocked request mirrors the standalone form's existing logging.

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
