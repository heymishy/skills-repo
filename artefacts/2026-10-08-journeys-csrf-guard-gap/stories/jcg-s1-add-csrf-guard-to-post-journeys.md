# Story: Add the missing CSRF guard to POST /journeys

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the real gap found below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator of this platform's production deployment**,
I want **every mutating form POST in this application, including `POST /journeys`, to require a valid session-scoped CSRF token before it takes effect**,
So that **a malicious external page cannot forge a request that creates a journey (or any other mutating action) under a logged-in operator's session without their knowledge**.

## Benefit Linkage

**Metric moved:** None formally tracked — short-track security fix, not a metric-bearing feature. Direct benefit: closes a real CSRF (Cross-Site Request Forgery) gap on a live, merged, mutating production route.
**How:** Found by direct code read while grounding `ep1-s2`'s own test plan (2026-10-08) — `handlePostJourneys` in `src/web-ui/routes/journeys.js` (merged in PR #956, `ep1-s1`) never calls `csrfGuard`, unlike every other mutating POST handler in this codebase. Confirmed this is an established, mandatory, repo-wide convention — not a judgment call — via `src/web-ui/middleware/csrf.js`'s own header comment ("protects general server-rendered form POSTs"), `products.js`'s own retrofit comment at `_csrf` import ("module CRUD forms need CSRF like every other mutating form in this app"), and the dedicated prior feature `artefacts/2026-08-17-remaining-csrf-form-coverage` (`rcfc-s1`), which extended CSRF coverage to `routes/journey.js` (singular — the platform's own pre-existing, unrelated journey file) specifically because an earlier audit found gaps. `routes/journeys.js` (plural) did not exist at the time of that audit, so it was never covered — this story closes that gap for the one new route that needs it now, before `ep1-s2` adds a second mutating route to the same file.

## Architecture Constraints

**Root cause:** `handlePostJourneys` (`src/web-ui/routes/journeys.js`) inserts a `customer_journeys` row directly from `req.body`/`req.session` with no CSRF check anywhere in its own code or in `server.js`'s dispatch entry for `POST /journeys`. Every comparable mutating handler in `products.js` (e.g. `handlePostProductModule`, `handlePostGuardrailsForm`) calls `_csrf.csrfGuard(req, res)` as its first action and returns early if it fails, per the established pattern:
```js
var csrfOk = await _csrf.csrfGuard(req, res);
if (!csrfOk) return;
req.body = csrfOk ... // csrfGuard already set req.body via its own _readBody call
```
`csrfGuard` (`src/web-ui/middleware/csrf.js`) reads and caches the request body itself, validates `body._csrf` against `req.session.csrfToken`, and writes a `403 Forbidden` (`text/plain`, body `"Forbidden"`) on mismatch — matching `routes/auth.js`'s own OAuth-state-mismatch response shape for consistency. No change to `csrf.js` itself is needed; this story only wires the existing, already-proven guard into the one handler that is missing it.

**Fix shape:**
1. Add `var _csrf = require('../middleware/csrf');` to `journeys.js`.
2. In `handlePostJourneys`, call `csrfGuard(req, res)` as the very first statement; return immediately if it returns `false`. `csrfGuard` already sets `req.body`, so the handler's existing `req.body && req.body.name` reads continue to work unchanged.
3. `handleGetJourneyCanvas` (a read-only GET) is explicitly out of scope — CSRF protects mutating requests only, matching every other GET handler in this codebase (none of them call `csrfGuard`).
4. The four existing unit tests in `tests/check-ep1-s1-journey-create.js` (AC1–AC3, which all exercise `handlePostJourneys`) must be updated to supply a matching `req.session.csrfToken` / `req.body._csrf` pair — otherwise they will now correctly fail with a 403, since they currently submit no CSRF token at all. AC4 (`handleGetJourneyCanvas`, read-only) needs no change.

## Dependencies

- **Upstream:** `ep1-s1` (merged, PR #956) — this story retrofits its handler.
- **Downstream:** `ep1-s2` (not yet started) — its own new `POST /journeys/:id/stages` handler must include `csrfGuard` from the start, citing this story as the established pattern, rather than repeating this gap.

## Acceptance Criteria

**AC1:** Given a `POST /journeys` request with a valid authenticated session but no `_csrf` field (or one that does not match `req.session.csrfToken`), When the request is processed, Then a `403` response is returned and no `customer_journeys` record is inserted.

**AC2:** Given a `POST /journeys` request with a valid authenticated session and a `_csrf` field that matches `req.session.csrfToken`, When the request is processed, Then behaviour is unchanged from today: a missing `name` still returns 400 with no insert, and a valid `name` still inserts a tenant-scoped `customer_journeys` record and responds as before.

**AC3:** Given the three existing `handlePostJourneys` unit tests in `tests/check-ep1-s1-journey-create.js` (the former AC1, AC2, AC3 of `ep1-s1`), When this fix lands, Then all three continue to pass, updated only to supply a matching session/`_csrf` token pair in their request fixtures — no change to what each test actually asserts about insert behaviour, response codes, or the tenant-spoofing guard.

## Out of Scope

`ep1-s2`'s own new mutating route (must include `csrfGuard` from first implementation, not retrofitted later — tracked in that story's own DoR). Any change to `csrf.js` itself. Any change to `handleGetJourneyCanvas` (GET, not mutating).

## NFRs

- **Security:** This IS the security fix — closes a real CSRF gap on a live, merged, mutating route. No new input surface is introduced; `csrfGuard` is an existing, already-audited mechanism.
- **Performance:** Negligible — one additional session-token comparison per POST, identical cost to every other CSRF-guarded route in this app.
- **Reliability:** No behavioural change for a legitimate, correctly-tokened request (AC2).
- **Accessibility:** N/A — no UI change; no form currently renders against this route (that ships in `ep4-s1`), so there is no hidden `_csrf` field to add to a form yet. Once `ep4-s1` ships a real create-journey form, it MUST embed the CSRF token via `_csrf.csrfField(csrfToken)`, matching every other mutating form in this app — noted here so it isn't missed at that story's own DoR.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

<!-- Populated at /definition-of-ready. -->
