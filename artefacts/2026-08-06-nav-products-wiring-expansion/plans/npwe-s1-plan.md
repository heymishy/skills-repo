# Implementation Plan: npwe-s1 — Wire Products nav into skill-chat sessions

**Story:** artefacts/2026-08-06-nav-products-wiring-expansion/stories/npwe-s1-wire-products-nav-into-skill-chat-sessions.md
**Branch:** npwe-s1-wire-products-nav-into-skill-chat-sessions

## Investigation findings (before coding)

- `src/web-ui/routes/skills.js` has exactly 15 `renderShell(...)` call sites. Two of them (`handleGetChatHtml`'s session-not-found and forbidden-owner 404 branches, no session/journey context resolvable) are out of scope. The remaining 13 are the story's target call sites, spread across 6 handler functions: `handleGetSkillsHtml` (+ `_renderSkillsList` helper), `handlePostSkillSessionHtml`, `handleGetQuestionHtml`, `handlePostAnswerHtml`, `handleGetCommitPreviewHtml`, `handlePostCommitHtml`, `handleGetResultHtml`, `_renderChatPage` (called by `handleGetChatHtml`), `htmlGetCompletePage`.
- `_journeyStore.getJourney(journeyId).productId` is already populated in production (`products.js`'s `handlePostProductFeature` calls `setJourneyFields(journeyId, { ..., productId })`, and `journey.js`'s own `/journey` list handler filters on `journey.productId` the same way) — so active-product resolution needs **no new Postgres query**, just the existing in-memory journey lookup already used elsewhere in this codebase.
- The session-store (`_sessionStore`, module-level Map in skills.js) carries `session.journeyId` once `linkSessionToJourney` has run — the same field `handleGetChatHtml`/`_renderChatPage` already read for the stage navigator. Re-used here to resolve which journey (and therefore which product) a given `sessionId` belongs to.
- Regression risk: skills.js has ~13 call sites and hundreds of pre-existing tests that render these pages with NO pool wired. A D37 adapter whose stub throws unconditionally would break all of them. Fix: wrap the nav-context resolution in try/catch — on an unwired pool (or any lookup failure) the page renders exactly as before (`products` stays `undefined`, which `renderProductsSection` already treats as "render nothing", per `pan-s1`'s AC5 contract). This is the same graceful-degradation contract `products.js`'s `_enrichColumnsWithArtefactCounts` already uses for its own optional enrichment step.

## Tasks

1. **D37 adapter + wiring (server.js) — separate task, per D37 rule 3.**
   Add `setDbPool(pool)` / `getDbPool()` to `skills.js` (stub throws when unwired, mirroring `mtrr-s1`'s `export-data-source.js`). Wire it in `server.js`'s existing `if (process.env.DATABASE_URL) { ... }` block pattern (own dedicated `Pool` instance, same shape as the `mtrr-s1` / export-data-source wiring block already there).

2. **Shared nav-context helper (skills.js).**
   Add `_getSkillsNavContext(req, sessionId)`: calls `getDbPool()` + `getProductsNavSummary(pool, tenantId)` (imported from `./products`, mirroring `journey.js`'s own import) exactly once; resolves `activeProductId` via `_sessionStore.get(sessionId).journeyId` → `_journeyStore.getJourney(journeyId).productId`; wrapped in try/catch to degrade to `{}` (no sidebar) on any failure/unwired pool.

3. **Wire the 13 render-function call sites (skills.js).**
   Each of the 6 handler functions computes `_nav` once via `_getSkillsNavContext` and threads `products`/`activeProductId`/`noProductJourneyCount` into every `renderShell(...)` call in that function (success and error branches alike). `_renderSkillsList` and `_renderChatPage` gain a `navContext` parameter; `htmlGetCompletePage` becomes `async` and gains a `req` parameter (its one call site in `server.js` is updated to `await` it and pass `req` — not a pool-threading change, just an existing value already in scope there).

4. **Tests (TDD, RED first).**
   Write the 10 tests from the test plan (`tests/check-npwe-s1-...js`), run to confirm RED, then implement tasks 1–3 to GREEN. AC4's regression guard: capture HTML snapshots of a representative sample of the ~50 excluded call sites BEFORE any change (checked out at the branch point / master), diff after.

5. **Full regression pass.**
   Run the full skills.js / server.js / html-shell.js test files plus the new suite; confirm no pre-existing test broken by the D37 addition (proves the try/catch degradation contract holds).

6. **Commit, push, open draft PR.**

## Out of scope (unchanged)

`journey.js` sub-pages, `artefact.js`, `features.js`, admin pages, `settings.js` — no edits.
