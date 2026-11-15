# Production error sweep findings

Date: 2026-11-15. Target: skills-framework.fly.dev (v190), operator's signed-in Chrome tab, operator-requested. Method: GET requests and page navigation only; no form submits, deletes, syncs, sign-out or account changes. Purpose: find errors and edge cases, and check they reach the error chain (PostHog, alert, GitHub issue).

## What was run

- Route map: 397 internal links collected from 8 seed pages; 22 representative pages fetched (dashboard, board, products, product page and its kanban/roadmap/guardrails, journeys, customer journeys, org kanban, pod manager, signals with 4 filters and paging, settings, billing, two skill-session lists, an artefact page, a journey page, a feature page). All returned 200; slowest 908 ms (guardrails); the rest under 650 ms.
- 38 edge-case requests: unknown and malformed ids, null bytes, a broken percent-escape, SQL-looking text, path-traversal text, 5,000-character values, negative, non-numeric and huge page numbers, array-style and script-tag query values, unknown routes.
- Browser navigation of dashboard, product, signals, org kanban, settings and a journey page with console tracking: no console errors.

## Findings

1. **Server errors on logged-in pages never reach the error chain (high).** `authGuard` (`src/web-ui/routes/auth.js` lines 610 to 616, `handleGuardedError`) turns a rejected handler into a plain-text 500 itself and does not call `captureServerError`. The coha-s5 capture is wired only in the outer router catch (`server.js` around line 5266), which a guarded handler never reaches. After the six 500s below, PostHog held zero `$exception` events for the previous 40 minutes and no GitHub issue was opened. The only errors the chain has ever caught were ones that call capture explicitly (for example `tenant_admin_bootstrap_failed`).
2. **Malformed ids return 500 instead of 404 (medium).** `/products/not-a-uuid`, `/products/%00`, `/products/%E0%A4%A`, `/products/<SQL-looking text>`, `/journeys/not-a-uuid`, `/journeys/%00` all return 500 "Internal Server Error". Cause (from the code path): the id is passed straight into a query on a uuid column, so Postgres rejects the value. A well-formed but unknown uuid correctly gives 404. No injection effect was seen; the value is parameterised.
3. **Unknown artefacts take about 6 seconds to answer 404 (low to medium).** `/artefact/<unknown>/discovery`, `/artefact/<real slug>/nonsense` and a traversal-style slug each took 6.0 to 6.5 s before "Artefact Not Found", because the fetcher probes many GitHub paths before giving up. Traversal-style slugs were refused safely (404, no file content).
4. **Everything else handled gracefully.** Negative, non-numeric and huge `page` values, oversized query strings, unknown filters, script-tag input, unknown routes and `//` all returned 200 or 404 without errors.

## Candidate stories

- `ecg-s1`: report authGuard-caught handler errors to error capture (with the request url), plus a test that a rejecting guarded handler produces one capture and still a 500. Highest value: it makes every other bug of this kind visible.
- `uid-s1`: validate id parameters (uuid shape) on `/products/:id` and `/journeys/:id` (and any sibling route found by the same pattern) and return 404; add a test per route; check the same for other `:id` routes.
- `anf-s1`: bound the artefact-not-found probe (stop after the first definite 404, or cap attempts and time).

Note: items 2 and 3 are only worth fixing after item 1, so the fix can be seen working through the chain (a deliberate bad id then opens exactly one issue).
