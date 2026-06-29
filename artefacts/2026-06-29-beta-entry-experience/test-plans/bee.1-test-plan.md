# Test Plan: bee.1 — Public landing page

**Story reference:** `artefacts/2026-06-29-beta-entry-experience/stories/bee.1.md`
**Epic reference:** `artefacts/2026-06-29-beta-entry-experience/epics/bee-entry-surface.md`
**Test plan author:** /test-plan skill (agent-auto)
**Date:** 2026-06-29

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Unauthenticated GET / returns 200 HTML with product name and CTA link | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | Authenticated GET / returns 302 to /journeys | 2 tests | — | — | — | — | 🟢 |
| AC3 | Landing page HTML has no CDN CSS framework references; renders without JS | 2 tests | — | — | — | — | 🟢 |
| AC4 | Landing page copy: description, skill session description, visible CTA | 3 tests | — | — | — | — | 🟢 |
| AC5 | All existing routes unchanged (health 200, auth/github 302, api/skills 303/401, journeys 200/302) | — | 2 tests | — | 1 scenario | — | 🟡 |
| AC6 | HTML path is hardcoded — not derived from request data | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| Existing routes for dashboard (/journeys) and skills sessions require full server wiring to test all status codes in AC5 | AC5 | External-dependency | /journeys handler does not exist yet (bee.2); /api/skills/* require full wiring | Integration test covers health + auth routes only; manual scenario covers remaining routes |

---

## Test Data Strategy

**Source:** Synthetic — all test data generated inline in test setup
**PCI/sensitivity in scope:** No
**Availability:** Available now — no external dependencies
**Owner:** Self-contained — tests generate their own mock req/res

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Unauthenticated req (no session.accessToken) | Inline mock | None | `req.session = {}` |
| AC2 | Authenticated req (session.accessToken set) | Inline mock | None | `req.session = { accessToken: 'tok', login: 'alice' }` |
| AC3 | Landing page HTML string | Route handler output | None | Assert absence of CDN framework URLs |
| AC4 | Landing page HTML string | Route handler output | None | Assert required copy strings |
| AC5 | Mock req/res for each existing route | Inline mock | None | Partial — health and auth routes only |
| AC6 | Handler source or handler function reference | require() of handler module | None | Assert path not constructed from req.url, req.params |

### PCI / sensitivity constraints

None.

### Gaps

None — test data is synthetic and self-contained.

---

## Unit Tests

### T1 — handleLanding: unauthenticated request returns 200

- **Verifies:** AC1
- **Precondition:** `req.session` is `{}` (no accessToken); `process.env.POSTHOG_KEY` unset
- **Action:** Call `handleLanding(req, res)` directly
- **Expected result:** `res.statusCode === 200` and `res.headers['Content-Type']` includes `text/html`
- **Edge case:** No

### T2 — handleLanding: unauthenticated response body contains product name and CTA

- **Verifies:** AC1, AC4
- **Precondition:** `req.session = {}`
- **Action:** Call `handleLanding(req, res)`; inspect `res.body`
- **Expected result:** `res.body` contains a recognisable product name string (e.g. "Skills" or "skills-framework" or "skills platform") and contains `href="/auth/github"` and contains visible text "Sign in with GitHub"
- **Edge case:** No

### T3 — handleLanding: authenticated request returns 302 redirect to /journeys

- **Verifies:** AC2
- **Precondition:** `req.session = { accessToken: 'test-token', login: 'alice' }`
- **Action:** Call `handleLanding(req, res)`
- **Expected result:** `res.statusCode === 302` and `res.headers['Location'] === '/journeys'`
- **Edge case:** No

### T4 — handleLanding: session check uses accessToken not token

- **Verifies:** AC2, coding standard (req.session.accessToken canonical)
- **Precondition:** `req.session = { token: 'old-style-token' }` (uses wrong field name)
- **Action:** Call `handleLanding(req, res)`
- **Expected result:** `res.statusCode === 200` (NOT 302) — the `token` field is not treated as authenticated
- **Edge case:** Yes — guards against the req.session.token coding standard violation

### T5 — handleLanding HTML: no CDN CSS framework URLs

- **Verifies:** AC3
- **Precondition:** `req.session = {}`
- **Action:** Call `handleLanding(req, res)`; inspect `res.body`
- **Expected result:** `res.body` does not contain `cdn.jsdelivr.net`, `cdnjs.cloudflare.com`, `unpkg.com`, `bootstrap`, `tailwind`, `cdn.tailwindcss.com`
- **Edge case:** No

### T6 — handleLanding HTML: renders meaningful content without a script block

- **Verifies:** AC3
- **Precondition:** `req.session = {}`, `POSTHOG_KEY` unset (snippet absent)
- **Action:** Call `handleLanding(req, res)` ; remove all `<script>` blocks from body; check remaining HTML
- **Expected result:** Remaining HTML (after script removal) contains the CTA link and product description — page is usable without JavaScript
- **Edge case:** No

### T7 — handleLanding HTML: copy contains platform description and skill session description

- **Verifies:** AC4
- **Precondition:** `req.session = {}`
- **Action:** Call `handleLanding(req, res)`; inspect `res.body`
- **Expected result:** `res.body` contains a sentence describing what the platform does AND a description of what a "skill session" produces (e.g. "governed artefact" or equivalent)
- **Edge case:** No

### T8 — handleLanding: path assembly uses __dirname literal, not request data

- **Verifies:** AC6
- **Precondition:** Read handler source (`src/web-ui/routes/landing.js` or equivalent)
- **Action:** Inspect source string for use of `req.url`, `req.params`, `req.query` in any `path.join` or `readFileSync` call
- **Expected result:** Source does not contain `req.url`, `req.params`, or `req.query` adjacent to `path.join` or `readFileSync`; path uses `__dirname` + literal string segment only
- **Edge case:** No

### T9 — handleLanding: 302 location when accessToken present regardless of other session fields

- **Verifies:** AC2
- **Precondition:** `req.session = { accessToken: 'any-value', login: 'bob', tenantId: 'org-1' }`
- **Action:** Call `handleLanding(req, res)`
- **Expected result:** `res.statusCode === 302`, `res.headers['Location'] === '/journeys'`
- **Edge case:** Yes — confirms redirect with a fully populated session

---

## Integration Tests

### T10 — Route dispatch: GET / with no session routes to landing page handler

- **Verifies:** AC1, AC5
- **Components involved:** `server.js` URL dispatch chain + `handleLanding`
- **Precondition:** `req.method === 'GET'`, `req.url === '/'`, `req.session = {}`; server module loaded in test mode
- **Action:** Feed the request through the server dispatch function (or call the registered handler directly)
- **Expected result:** `res.statusCode === 200`; `res.body` contains landing page content
- **Edge case:** No

### T11 — Existing route: GET /health still returns 200 after landing page added

- **Verifies:** AC5
- **Components involved:** `server.js` URL dispatch + `healthCheckHandler`
- **Precondition:** `req.method === 'GET'`, `req.url === '/health'`
- **Action:** Feed request through dispatch
- **Expected result:** `res.statusCode === 200`
- **Edge case:** No

---

## NFR Tests

### NFR-T1 — Landing page handler makes no external network calls

- **NFR addressed:** Performance / Correctness
- **Measurement method:** Wrap `global.fetch` and `http.get`/`https.get` in no-op spies before calling `handleLanding`; assert spies were not called
- **Pass threshold:** 0 external network calls during handler execution
- **Tool:** Node.js built-in (spy pattern with `require` interception)

### NFR-T2 — HTML response has balanced open/close tags for key elements

- **NFR addressed:** Correctness (HTML must be valid — no unclosed tags)
- **Measurement method:** Count `<html`, `</html>`, `<body`, `</body>`, `<head`, `</head>`, `<title`, `</title>` occurrences in `res.body`
- **Pass threshold:** Each open count === close count for html, body, head, title
- **Tool:** Node.js string counting

---

## Out of Scope for This Test Plan

- PostHog snippet presence — covered by bee.3 test plan
- Visual styling or CSS layout correctness — not testable without a browser; no E2E test required (AC3 only excludes CDN CSS, not layout)
- Authenticated routes that require bee.2 implementation (GET /journeys) — cannot test before bee.2 is implemented
- End-to-end OAuth flow (GET /auth/github → GitHub → callback) — existing wuce.1 test covers this

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC5 full route regression (GET /journeys 200 authenticated, POST /api/skills/:name/sessions 303/401) | /journeys requires bee.2; /api/skills/* require skill wiring | Manual verification scenario in bee.1-verification.md covers these routes post-implementation |
