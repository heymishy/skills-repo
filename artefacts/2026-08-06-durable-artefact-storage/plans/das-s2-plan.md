# Implementation Plan: das-s2 -- Require a connected repo before a new product can start its first journey

**Story:** artefacts/2026-08-06-durable-artefact-storage/stories/das-s2-require-connected-repo-for-new-products.md
**DoR contract:** artefacts/2026-08-06-durable-artefact-storage/dor/das-s2-dor-contract.md
**Test plan:** artefacts/2026-08-06-durable-artefact-storage/test-plans/das-s2-test-plan.md

## Contract deviation found during planning

The DoR contract's "Estimated touch points" names `src/web-ui/routes/journey.js` (the journey-creation handler) as the file to change. Direct inspection shows this is factually imprecise: `handlePostJourney` in `journey.js` is the generic, product-less "New Journey" form -- journeys it creates always have `productId == null` (confirmed by the existing filter at `journey.js:324`, `journeys.filter(function(j) { return j.productId == null; })`). It has no concept of a `productId` at request time at all, so it cannot implement a per-product gate.

The actual product-scoped "start a journey for this product" entry point is `handlePostProductFeature` in `src/web-ui/routes/products.js` (wired at `POST /products/:id/features` in `server.js`, matched by `pathname.match(/^\/products\/[^/]+\/features$/)`). This handler already receives `productId` via `req.params.id`, already sets `productId` on the created journey via `_journeyStore.setJourneyFields`, and already has a directly analogous pre-flight gate (the `MAX_JOURNEYS_PER_TENANT` billing-cap check at ~line 1787) to mirror in structure and response style.

Per CLAUDE.md's standing rule ("DoR contract must not contradict the test plan... the contract is the authoring defect: update the contract to match the ACs and test plan, not the other way around"), this plan implements the gate in `handlePostProductFeature` (products.js), not `handlePostJourney` (journey.js), and notes the correction inline in `decisions.md`. All 4 ACs are written in product-scoped terms ("a product with zero journeys", "the operator starts their first journey" from within a specific product) which only this handler can satisfy.

## Tasks

1. **Write failing unit tests** in a new file `tests/check-das-s2-require-connected-repo.js`, following the exact convention of `tests/check-product-feature-cap-bypass.js` (freshRequire + makeRes + inline pool mock) extended with a stateful pool mock that returns `repo_owner`/`repo_name` rows keyed by `product_id`/`tenant_id` (mirroring `export-data-source.js`'s query shape) and journey-count control via `journeyStore.setJourneyFields`/`createJourney` + `productId`. Cover:
   - AC1: zero-journey, no-repo product -> rejected with actionable message (not generic/silent)
   - AC2: after connecting repo (simulated by updating the mock pool's row), retry succeeds
   - AC3: product with >=1 existing journey, no repo -> NOT blocked (regression guard, the review-caught boundary)
   - AC4: zero-journey product WITH repo already connected -> no gate friction
   - Integration: picker-connect-then-journey-start end-to-end via the real gate-check code path
   - NFR: gate check performs exactly 1 query (latency proxy) and the blocking response has a semantic heading + descriptive link to the repo picker
2. **Add the gate check** in `handlePostProductFeature` (`src/web-ui/routes/products.js`), positioned before journey creation (alongside the existing billing-cap block):
   - Count existing journeys for this `productId` using the same in-memory `listJourneys().filter(...)` idiom already used for the tenant cap (no new DB read needed for the count -- `journey-store.js` is the authoritative source, consistent with the existing cap check style).
   - Read `repo_owner`/`repo_name` for the product via the `pool` param already threaded into this handler (finally used, previously unused): `SELECT repo_owner, repo_name FROM products WHERE product_id = $1 AND tenant_id = $2` -- exact query shape reused from `export-data-source.js`.
   - Block (reject) only when `journeyCount === 0 AND !repo_owner AND !repo_name`. Any other combination proceeds unchanged.
   - On block: respond with a 4xx status (409, since this is a state-conflict on the resource, distinct from the 402 billing gate) and a semantic HTML body (`<h1>` heading + descriptive `<a>` link pointing at the product's repo-connection picker, i.e. `/products/:id` where `mtrr-s2`'s picker lives) -- reusing `_htmlShell.renderShell` for consistency with the existing 402 block.
3. **Run the new test file alone** until all new tests pass (RED -> GREEN).
4. **Run the full suite** (`npm test`) and diff the failing-file list against the recorded baseline (37 failed files) to confirm zero new regressions.
5. **Manually walk** the verification script's 4 scenarios against the new test file's assertions (feasible without a live browser since all 4 scenarios are server-side/logic-only per the test plan's own gap analysis).
6. **Update `decisions.md`** with a short entry noting the contract-vs-reality correction (file above, not a new architectural decision).

## Out of scope (unchanged from story)

- No changes to `mtrr-s2`'s picker UI/behaviour.
- No retroactive migration/blocking of existing repo-less products (AC3 is the explicit guard).
- No changes to `handlePostJourney` / `journey.js` at all -- the product-less flow is untouched, matching the story's actual scope regardless of the contract's misnamed touch point.
