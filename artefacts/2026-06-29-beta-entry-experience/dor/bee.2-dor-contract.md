# DoR Contract — bee.2 — First-run empty-state experience

**Story:** `artefacts/2026-06-29-beta-entry-experience/stories/bee.2.md`
**Date:** 2026-06-29
**Status:** Approved

---

## What will be built

- `src/web-ui/routes/journey.js` — add `handleJourneys(req, res)` and `setListJourneys(fn)` for test isolation. Default stub throws per D37. The handler calls the injected `listJourneys(tenantId)` function; on empty array → empty-state HTML; on populated array → journey card HTML; on throw → HTTP 500 + console.error('[journey-store]').
- Empty-state HTML block: (a) explanation that no skill sessions have been started yet, (b) description of what a skill session produces, (c) `<a href="/skills">` link to skill picker
- Journey list HTML: one card element per journey (includes `data-journey-id` attribute for test assertion)
- `GET /journeys` dispatch in `src/web-ui/server.js`, protected by `authGuard`
- Production wiring (separate task): `setListJourneys(tenantId => journeyStore.listJourneys(tenantId))` called in `server.js` — this must be a named separate task from the handler task

## What will NOT be built

- PostHog instrumentation on the dashboard — bee.3
- Interactive tutorial, modal walkthrough, dismiss/skip mechanism for empty state
- Any change to the skill picker itself (`/skills` route)

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — empty listJourneys → 200 + empty-state | T1, T2: wire `setListJourneys(() => [])`, call `handleJourneys`; assert 200 + empty-state block present | Unit |
| AC2 — empty-state: explanation + session desc + skill picker link | T3, T4, T5: assert "no sessions" text, session output description, `href="/skills"` all in body | Unit |
| AC3 — populated → 200 + journey cards, no empty-state | T6, T7: wire `[{id:'j1',...},{id:'j2',...}]`, assert cards present; empty-state text absent | Unit |
| AC4 — correct state in raw HTTP response body (no JS) | T11: assert empty-state content present as plain string in `res.body` | NFR/Unit |
| AC5 — listJourneys throws → 500, no empty-state, [journey-store] error logged | T8, T9: wire throwing stub; assert status 500; empty-state text absent | Unit |

## Assumptions

- `setListJourneys` will be added to `routes/journey.js` for test isolation — the route calls the injected function (not `journeyStore.listJourneys` directly). Production wiring in `server.js` connects the two.
- `req.session.tenantId` is available post-auth. If not present, derive from `req.session.login` as fallback.
- `authGuard` middleware is used for `/journeys` dispatch in `server.js` — same pattern as existing protected routes.

## Estimated touch points

Files: `src/web-ui/routes/journey.js` (add handleJourneys + setListJourneys), `src/web-ui/server.js` (add /journeys dispatch + production wiring call)
Services: `src/web-ui/modules/journey-store.js` — read-only via injectable
APIs: None

## schemaDepends

[] — bee.1 (landing page) is a user-journey prerequisite but bee.2 consumes no specific pipeline-state schema fields produced by bee.1
