# Decision Log: nav-products-wiring-expansion

**Feature:** Show the Products sidebar during skill chat sessions
**Track:** Short-track (per CLAUDE.md: `/test-plan → /definition-of-ready → coding agent`)
**Last updated:** 2026-08-06

---

## Decision categories

| Code | Meaning |
|------|---------|
| `GAP` | A structural gap in the skill/process itself, surfaced transparently rather than silently bypassed |
| `ARCH` | Architecture or significant technical design choice |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-08-06 | GAP | /definition-of-ready**
**Decision:** Proceed past H-GOV without a discovery artefact's `## Approved By` section, since short-track stories have no discovery artefact by design.
**Context:** Same structural gap already documented for `pcr-s1`/`stis-s1`/`tpac-s1`.
**Rationale:** Satisfied via the operator's direct in-session instruction to scope and proceed.
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** See `tpac-s1`'s equivalent entry — same underlying process gap.
---

---
**2026-08-06 | ARCH | /review Run 1**
**Decision:** `skills.js` gains its own module-level D37 pool reference (`setDbPool`/`getDbPool`), rather than threading `pool` through `server.js`'s 13 dispatch call sites for these routes.
**Alternatives considered:** Passing `pool` as an explicit parameter through every one of `server.js`'s dispatch calls for these 13 routes, mirroring `journey.js`'s `handleGetJourney(req, res, _next, pool)` signature.
**Rationale:** The module-level D37 pattern (already proven by `mtrr-s1`'s `export-data-source.js`, itself mirroring `routes/auth.js`'s `setOrganisationsPool`) avoids a second file's signature changes across 13 call sites, is more consistent with the majority of this codebase's Postgres-backed adapters, and keeps the change contained to `skills.js` + one `server.js` wiring block. Caught as review finding 1-M1 (the story originally implied trivial reuse without naming this real plumbing gap), fixed before Run 2 passed clean.
**Made by:** Hamish King — Platform maintainer / Product owner (caught during review), implemented by Claude Code
**Revisit trigger:** If a future story needs `pool` threaded through `server.js`'s dispatch signatures for an unrelated reason, reconsider whether the module-level pattern is still the right fit for `skills.js` specifically.
---

---
**2026-08-06 | RISK-ACCEPT | /definition-of-ready**
**Decision:** Proceed past DoR without the verification script (`npwe-s1-verification.md`) being reviewed by a domain expert first (W4).
**Rationale:** Same rationale as every other story this session.
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** If a post-merge smoke test reveals the verification script described the wrong expected behaviour.
---

---
**2026-08-06 | ARCH | coding agent (implementation)**
**Decision:** `activeProductId` for skills.js's 13 call sites is resolved via `_sessionStore.get(sessionId).journeyId` → `_journeyStore.getJourney(journeyId).productId` — an existing in-memory field, not a new Postgres query. `getProductsNavSummary(pool, tenantId)` is still called exactly once per render (the products list itself); no second data-fetch pattern was invented for that part, matching the DoR contract's constraint.
**Context:** The DoR contract specified reusing `getProductsNavSummary`/the 3-param `renderShell` convention but did not specify how skills.js — which has no route-level access to a specific journey's product the way `/products/:id` (URL param) or `/journey` (always no-product) do — should resolve which product is *active* for a given skill-chat session.
**Alternatives considered:** (1) An additional `SELECT product_id FROM journeys WHERE journey_id = $1` query per render. (2) Threading `pool` through the request.
**Rationale:** `products.js`'s `handlePostProductFeature` already writes `productId` onto the in-memory journey via `_journeyStore.setJourneyFields(journeyId, {..., productId})`, and `journey.js`'s own `/journey` handler already reads it the same way (`journeys.filter(j => j.productId == null)`). Reusing this avoids a redundant DB round-trip on every skill-session page render and keeps the "one `getProductsNavSummary` call per render" NFR trivially true rather than needing a second query to explain away.
**Made by:** Claude Code (coding agent, npwe-s1 implementation)
**Revisit trigger:** If a future story moves journey/product linkage fully into Postgres-only reads (removing the in-memory `_journeyStore` map's `productId` field), this resolution path needs a replacement query.
---

---
**2026-08-06 | ARCH | coding agent (implementation)**
**Decision:** The D37 pool lookup + nav-context resolution (`_getSkillsNavContext`) is wrapped in try/catch and degrades to `{}` (no Products sidebar rendered) on an unwired pool or any lookup failure, rather than letting the D37 stub's throw propagate and break the page render.
**Context:** skills.js's 13 target render functions are exercised by hundreds of pre-existing tests that never wire a pool. D37's rule 1 (stub throws by default) is about the *adapter's own default*, not a mandate that every calling code path must always have a pool wired before it can render at all.
**Rationale:** Matches `pan-s1`'s own AC5 contract (`renderProductsSection()` already renders nothing when `products` is `undefined`) and `products.js`'s existing `_enrichColumnsWithArtefactCounts` precedent (an optional enrichment step that degrades gracefully rather than breaking the underlying render on adapter failure). Verified empirically: the full skills.js-dependent regression suite (49 test files) shows zero new failures after this change — every pre-existing failure was confirmed identical before/after via `git stash`.
**Made by:** Claude Code (coding agent, npwe-s1 implementation)
**Revisit trigger:** If a future audit finds the Products sidebar silently missing in production despite `DATABASE_URL` being set (i.e., the try/catch masking a real, ongoing failure) — add explicit error logging inside the catch block at that point.
---

---
**2026-08-06 | ARCH | coding agent (implementation)**
**Decision:** `htmlGetCompletePage(skillName, sessionId, navContext)` stays synchronous and gains a plain pre-resolved `navContext` object as its 3rd parameter, rather than becoming `async` and resolving nav context internally (as every other npwe-s1 call site does).
**Context:** `check-wusl-s1-session-redis-fallback.js`'s AC4 test explicitly asserts this function "remain[s] synchronous", and multiple pre-existing tests (`check-dsq3-post-session-clarify-gate.js`) call it as `const html = routes.htmlGetCompletePage(name, sid)` with no `await`, using the return value directly as a string.
**Rationale:** Making it `async` would have returned a `Promise` to every existing synchronous caller, silently breaking ~7 pre-existing tests (confirmed by trial: making it `async` did break them before this fix). Its one production caller (`server.js`'s `/skills/:name/sessions/:id/complete` route) is already inside an `async` wrapper, so resolving `navContext` there via the newly-exported `_getSkillsNavContext(req, sessionId)` and passing the plain result in costs nothing extra and keeps the function's public contract unchanged for every other caller.
**Made by:** Claude Code (coding agent, npwe-s1 implementation)
**Revisit trigger:** None expected — this is a permanent characteristic of this function's public contract, not a temporary workaround.
---
