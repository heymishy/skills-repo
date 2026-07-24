# Decisions: Offer the formed-idea/rough-idea choice when creating a new feature from a product's page

**Story reference:** artefacts/2026-07-24-product-new-feature-idea-choice/stories/pnfc-s1.md

---

## Decision: Duplicate the `startSkill` branch in `handlePostProductFeature` rather than extend `handlePostJourney`

**Date:** 2026-07-24

**Context:** The DoR contract (Architecture Constraints, pnfc-s1.md) explicitly allowed either of two implementation paths: (a) duplicate `handlePostJourney`'s one-line `startSkill` ternary directly inside `handlePostProductFeature` (`src/web-ui/routes/products.js`), or (b) extend `handlePostJourney` (`src/web-ui/routes/journey.js`) to also accept an optional `productId` and call it from the product-scoped route instead.

**Decision:** Duplicated the branch logic in `handlePostProductFeature`. `handlePostJourney` itself was not modified.

**Rationale:**
- The duplicated logic is a single line (`var startSkill = (req.body && req.body.startSkill === 'ideate') ? 'ideate' : 'discovery';`) — the duplication cost is trivial, while routing through `handlePostJourney` would require restructuring its journey-creation, billing-cap, `newProduct` modal-redirect, and `e2eForceFailStage` branches to also thread an optional `productId` all the way through to `setJourneyFields`, none of which exist there today.
- `handlePostProductFeature` already duplicates (rather than calls) `handlePostJourney`'s session-registration pattern for the exact same reason, established by the prior `jrf-s1`/`jrf-s2` fixes (see the existing comments in `products.js` referencing "Following the same pattern as handlePostJourney"). Keeping this story's change in the same style is consistent with that precedent rather than introducing a second reuse mechanism.
- AC5 requires that `/journey`'s own flow and `handlePostJourney` are "not changed or regressed." Leaving `journey.js` completely untouched is the simplest possible way to guarantee zero regression risk to that route — its own existing test suite runs unmodified and needs no re-verification of new code paths.
- `handlePostProductFeature` has several product-scoping behaviours (`productId` field, a synthetic `featureSlug` derived from the journey ID rather than the feature name, no billing-cap check, no `newProduct` reference-modal redirect) that are meaningfully different from `handlePostJourney`'s. Merging the two call sites into one shared function would have required either adding several new conditional branches to `handlePostJourney` (increasing its complexity and blast radius for every other caller) or extracting a smaller shared helper — a larger refactor than this story's scope (Out of Scope: "any other entry-point consolidation").

**Trade-off accepted:** The `startSkill` ternary now exists in two places (`journey.js` and `products.js`). If a third branch value is ever added to the rough-idea/formed-idea choice, both call sites need updating. This is judged an acceptable, low-probability maintenance cost against the lower regression risk of leaving `handlePostJourney` untouched.

---

## Decision: Hardened `_readBody` (`products.js`) to tolerate legacy test request objects lacking a real stream

**Date:** 2026-07-24

**Context:** `handlePostProductFeature` previously never read the request body at all (it hardcoded `'discovery'` with no branching). Making it read `startSkill` from the submitted form requires calling the existing shared `_readBody(req)` helper. Two existing test files (`tests/check-jrf-s2-register-product-feature-journeys.js`, `tests/check-psh-s4-navigation.js`) call `handlePostProductFeature` with plain `{ params, session }` request-object literals — no `body` property and no `.on()` stream method.

**Decision:** Added a guard to `_readBody`: if `req.body` is `undefined` AND `req.on` is not a function, resolve to `{}` instead of attempting to attach stream listeners (which would throw `TypeError: req.on is not a function`).

**Rationale:** This is a strictly additive safety net — before this change, no code path ever called `_readBody` with such a request object (because no handler needed the body from `handlePostProductFeature`'s call site), so the previously-unreachable crash case is now reachable and needed a safe default. The guard does not change behaviour for any request that supplies either a real `body` or a real readable stream, so it does not affect any other `_readBody` caller (`handlePostProductNew`, `handlePostProductConfirm`, `handlePutProductEdit`, module CRUD handlers) — all of their existing tests already supply `body` directly. This kept the fix scoped to `products.js` and avoided having to edit two other stories' test files to add throwaway `body: {}` fields.
