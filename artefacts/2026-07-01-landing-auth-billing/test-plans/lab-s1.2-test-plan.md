# Test Plan — lab-s1.2 — Landing page at `/`

**Story:** lab-s1.2
**Feature:** 2026-07-01-landing-auth-billing
**Review status:** PASS (run 1, 2026-07-01)
**Test runner:** `node tests/check-lab-s1.2-landing-page.js`
**Date written:** 2026-07-01

---

## Test data strategy

**Strategy:** Synthetic. Tests generate their own mock `req`/`res` objects and mock sessions in test setup. No real database, no real PostHog, no real browser.

- `posthog-server.js` adapter is monkeypatched in tests to capture calls without making real network requests.
- `authGuard` middleware is tested by injecting a mock session.
- HTML content assertions use string matching against the response body.

**PCI/sensitivity:** None.

**Test data gaps:** None.

---

## AC coverage table

| AC | Summary | Test type | Test IDs | Gap? |
|----|---------|-----------|----------|------|
| AC1 | GET / returns 200 with pitch content | Unit | T1.1, T1.2, T1.3 | None |
| AC2 | CTA click navigates to /auth/github | Unit | T2.1 | None |
| AC3 | Authenticated user → 302 /dashboard | Unit | T3.1 | None |
| AC4 | PostHog `landing_page_viewed` fired on unauthenticated visit | Unit | T4.1, T4.2 | None |
| AC5 | Responsive layout (320px and 1280px) | CSS-layout-dependent | — | Manual (RISK-ACCEPT) |
| AC6 | No auth data in landing page HTML | Unit | T6.1 | None |

---

## Gap table

| AC | Gap type | Handling | Justification |
|----|----------|----------|---------------|
| AC5 | CSS-layout-dependent | Manual scenario in verification script; RISK-ACCEPT recorded in decisions.md | CSS layout (no horizontal scroll, CTA tappable) cannot be verified by a Node.js unit test. RISK-ACCEPT accepted by operator on 2026-07-01 — verified as part of pre-launch smoke test (lab-s3.5). |

---

## E2E / browser-layout detection

**AC5 is browser-layout-dependent.** `GET /` HTML contains a responsive template; whether the headline, value proposition, and CTA are visible without horizontal scrolling at 320px and 1280px requires CSS rendering in a real browser. Handling: manual verification only (option 2). RISK-ACCEPT documented in decisions.md.

No E2E tooling is required for the other ACs. `e2eToolingRequired: false`.

---

## Unit tests

### T1 — GET / returns 200 with required HTML content (AC1)

**T1.1** — `landing-page-returns-200-unauthenticated`
Covers: AC1
Precondition: `GET /` handler loaded; no session set (unauthenticated)
Action: Call handler with mock unauthenticated `req`; capture response
Expected: `res.statusCode === 200`
Edge case: none

**T1.2** — `landing-page-body-contains-pitch-headline`
Covers: AC1
Precondition: T1.1 passes
Action: Assert response body string contains the platform pitch headline text
Expected: headline text present in response body (non-empty string match)
Edge case: none

**T1.3** — `landing-page-body-contains-cta-button`
Covers: AC1
Precondition: T1.1 passes
Action: Assert response body contains a "Get started" CTA element (string match on `Get started`)
Expected: "Get started" appears in response body
Edge case: case-insensitive match acceptable

### T2 — CTA links to auth entry point (AC2)

**T2.1** — `cta-href-targets-auth-github`
Covers: AC2
Precondition: Landing page HTML available
Action: Assert response body contains `href="/auth/github"` or `action="/auth/github"` (form or anchor)
Expected: `/auth/github` appears as the CTA target
Edge case: Once lab-s1.3 is complete, the CTA target may become a multi-provider chooser — this test is scoped to lab-s1.2 only

### T3 — Authenticated redirect (AC3)

**T3.1** — `authenticated-user-redirects-to-dashboard`
Covers: AC3
Precondition: `req.session.accessToken` set to a non-empty value
Action: Call handler with mock authenticated session; capture response
Expected: `res.statusCode === 302` and `Location` header is `/dashboard`
Edge case: `req.session.accessToken` must use the canonical field name — if `req.session.token` is checked, the test would pass but the implementation would be wrong; verify the handler reads `req.session.accessToken`

### T4 — PostHog event fired (AC4)

**T4.1** — `posthog-landing-viewed-fired-on-unauthenticated-visit`
Covers: AC4
Precondition: `posthog-server.js` adapter monkeypatched to capture calls; unauthenticated request
Action: Call handler; check captured PostHog calls
Expected: at least one call with event name `landing_page_viewed`
Edge case: none

**T4.2** — `posthog-landing-viewed-not-fired-when-authenticated-redirecting`
Covers: AC4 (negative — event should not fire when redirecting an authenticated user)
Precondition: Authenticated session (AC3 scenario)
Action: Call handler; check captured PostHog calls
Expected: no `landing_page_viewed` call (authenticated user is redirected before rendering)
Edge case: Acceptable if implementation fires before the redirect check — document explicitly; preferred behaviour is not firing

### T6 — No auth data in HTML response (AC6)

**T6.1** — `response-body-contains-no-access-token`
Covers: AC6
Precondition: Landing page response body captured (T1.1 result)
Action: Assert response body does NOT match `/accessToken|session_id|req\.session/i`
Expected: zero matches
Edge case: Partial matches (e.g. the word "session" in marketing copy) — use specific patterns to avoid false positives; assert no token-value patterns like hex strings adjacent to `token` or `session_id=`

---

## Integration tests

**IT1** — `public-route-mounted-in-server`
Covers: AC1 (integration with server routing)
Precondition: `server.js` exports app or can be required in test mode
Action: Require server module; check `GET /` is registered (route table inspection or HTTP call to test server)
Expected: `GET /` route exists and returns 200 for unauthenticated request; 302 for authenticated
Edge case: `server.js` is not required directly in CI (it starts listening) — use the route module directly if server binding is avoided in tests

**IT2** — `auth-guard-integration-on-landing-route`
Covers: AC3 (integration between session check and redirect)
Precondition: Route handler loaded; `authGuard` pattern applied
Action: Send request with `req.session.accessToken = 'valid-token'`; assert 302 to `/dashboard`
Expected: 302 to `/dashboard`
Edge case: Verify it uses `req.session.accessToken` not `req.session.token`

---

## NFR tests

**NFR1** — `posthog-capture-is-non-blocking`
Covers: NFR — PostHog capture must not delay landing page response
Precondition: PostHog adapter replaced with a slow stub (100ms delay)
Action: Call handler; measure time to response
Expected: Response arrives before the PostHog stub resolves (fire-and-forget pattern — response does not await PostHog call)
Edge case: If PostHog capture is synchronous, this test will fail and implementation must be corrected

---

## State update fields

- `totalTests`: 9
- `acTotal`: 6
- `hasLayoutDependentGaps`: true
- `e2eToolingRequired`: false
