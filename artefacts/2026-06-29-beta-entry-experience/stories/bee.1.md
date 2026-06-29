# Story bee.1 — Public landing page

**Feature:** 2026-06-29-beta-entry-experience
**Epic:** bee-entry-surface
**Status:** Definition
**Complexity:** 1
**Scope stability:** Stable

## User story

As a beta developer visiting `skills-framework.fly.dev` for the first time,
I want to see a public landing page that explains what the platform is before being asked to authenticate,
So that I can make an informed decision to sign in with GitHub rather than encountering a raw OAuth redirect with no context — enabling M3 (landing page conversion rate) to be measured from day one.

## Metric linkage

- **M3** (Landing page conversion rate): bee.1 creates the page that M3 measures. Without this story, M3 cannot be assessed at all.
- **M1** (Beta activation rate): the landing page is the entry point for all external users — a lower-friction first impression increases the probability of users completing their first session.

## Acceptance criteria

**AC1** — Unauthenticated root request serves landing page
Given a GET request to `/` with no authenticated session (no `req.session.accessToken`),
When the server handles the request,
Then it responds with HTTP 200 and an HTML body containing the product name and a "Sign in with GitHub" call-to-action link pointing to `/auth/github`.

**AC2** — Authenticated root request redirects to dashboard
Given a GET request to `/` with an active authenticated session (`req.session.accessToken` is set),
When the server handles the request,
Then it responds with HTTP 302 redirect to `/journeys` (or the current authenticated home route), not the landing page.

**AC3** — Landing page is self-contained HTML (no external CSS framework, no client-side framework)
Given the landing page HTML response,
When inspected,
Then it contains only inline `<style>` or a single `<link rel="stylesheet">` to a local asset, and no references to CDN-hosted CSS frameworks (Bootstrap, Tailwind, etc.). The page renders correctly with JavaScript disabled.

**AC4** — Landing page copy is accurate
Given the landing page,
When a developer reads it,
Then it contains: (a) a one-to-two sentence description of what the skills platform does, (b) a description of what a "skill session" produces, and (c) the "Sign in with GitHub" CTA as a visible, labelled link or button. No aspirational features are described that are not currently live.

**AC5** — All existing routes are unaffected
Given the modified server router,
When any existing URL path (e.g. `/auth/github`, `/journeys`, `/api/skills/:name/sessions`, `/health`) is requested,
Then each existing route continues to return its expected HTTP status: `GET /health` returns 200; `GET /auth/github` returns 302 (redirect to GitHub); `POST /api/skills/:name/sessions` returns 303 (authenticated) or 401 (unauthenticated); `GET /journeys` returns 200 (authenticated) or 302 to `/auth/github` (unauthenticated). No existing path begins returning 404 or 500 where it previously returned another code. [Resolved: 1-M1]

**AC6** — File path for any served HTML asset is hardcoded
Given the landing page route handler,
When it serves HTML (whether from a string, a module, or a file read),
Then no path component is derived from `req.url`, `req.params`, or any other request input. If a file is read from disk, the path is constructed from `__dirname` with literal path segments only.

## Out of scope

- PostHog snippet or any analytics instrumentation — that is bee.3
- Styling beyond functional legibility — copy and layout are sufficient for beta; visual design polish is a later story
- A `/about` or separate public marketing page — the root `/` landing page is the only unauthenticated surface in scope
- Any change to the `/auth/github` OAuth flow itself

## Dependencies

None. This is the first story in the feature.

## Architecture constraints

- **Node.js CommonJS** — route handler uses `require()`, not `import`. No TypeScript.
- **No Express** — handler added to the existing URL-dispatch `if/else` chain in `src/web-ui/server.js` (or equivalent router). No `app.get()`.
- **Zero new npm dependencies** — HTML served as a string literal or read from a static file in `src/web-ui/public/`. No template engine.
- **Path traversal guard** — if landing page HTML is read from a file, the file path is assembled from `__dirname` + literal segment (e.g. `path.join(__dirname, '../public/landing.html')`). The path is never derived from request data. `path.resolve()` + `startsWith(repoRoot)` guard must be present if path assembly is dynamic.
- **`req.session.accessToken` is canonical** — AC2 session check uses `req.session && req.session.accessToken` to determine authenticated state. Never `req.session.token`.
- **ADR-011** — this story artefact must exist before any `src/` implementation is committed.

## NFRs

- Landing page must respond in under 200ms (local, no network calls in handler)
- HTML response must be valid (no unclosed tags) — verifiable by test asserting key string presence
- No external network calls in the route handler — static content only
