# DoR Contract — bee.1 — Public landing page

**Story:** `artefacts/2026-06-29-beta-entry-experience/stories/bee.1.md`
**Date:** 2026-06-29
**Status:** Approved

---

## What will be built

- New module `src/web-ui/routes/landing.js` exporting `handleLanding(req, res)` — serves landing page HTML (HTTP 200) for unauthenticated requests; returns HTTP 302 to `/journeys` for authenticated requests (check: `req.session && req.session.accessToken`)
- Landing page HTML authored as a string literal in `landing.js` or a static file at `src/web-ui/public/landing.html` — contains product name, skill session description, and "Sign in with GitHub" `<a href="/auth/github">` link; no CDN CSS frameworks; renders without JavaScript
- `GET /` dispatch added to `src/web-ui/server.js` routing chain (before existing catch-all)

## What will NOT be built

- PostHog snippet or any analytics instrumentation — bee.3
- Any CSS framework or client-side JavaScript beyond the CTA link
- Any `/about` or secondary public page — only the root `/` landing page is in scope
- Any change to the `/auth/github` OAuth flow itself

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — unauthenticated GET / returns 200 with product name + CTA | T1, T2 in `tests/check-bee1-landing-page.js`: call `handleLanding` with `req.session = {}`; assert status 200 + body contains `href="/auth/github"` + "Sign in with GitHub" text | Unit |
| AC2 — authenticated GET / returns 302 to /journeys | T3, T9: call with `session.accessToken` set; assert status 302 + `Location: /journeys` | Unit |
| AC3 — no CDN CSS; renders without JS | T5, T6: assert body has no CDN URLs; strip script blocks and assert CTA link still present | Unit |
| AC4 — copy: platform description + session description + CTA | T2, T7: assert body contains product name, session output description, visible CTA text | Unit |
| AC5 — existing routes unaffected | T9 (health 200), T11 (health integration); manual Scenario 6 post-implementation for /journeys, /auth/github, /api/skills | Integration + Manual |
| AC6 — path hardcoded from `__dirname`, not request data | T8: read source; assert no `req.url`/`req.params`/`req.query` in path assembly; `__dirname` literal present | Unit |

## Assumptions

- Landing page HTML can be authored as an inline string literal in `landing.js` — consistent with zero-npm-dep constraint
- The `/` path is not currently routed in `server.js` (confirmed — no `pathname === '/'` branch exists)
- Session check: `req.session && req.session.accessToken` (truthy; `req.session.token` is NOT checked)

## Estimated touch points

Files: `src/web-ui/server.js`, new `src/web-ui/routes/landing.js` (and optionally `src/web-ui/public/landing.html`)
Services: None (static response — no external calls)
APIs: None

## schemaDepends

[] — no upstream story dependencies; no pipeline-state schema fields consumed from other stories
