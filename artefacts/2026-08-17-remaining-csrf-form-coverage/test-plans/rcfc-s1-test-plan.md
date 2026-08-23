## Test Plan: Extend CSRF token protection to the remaining server-rendered POST forms

**Story reference:** artefacts/2026-08-17-remaining-csrf-form-coverage/stories/rcfc-s1-extend-csrf-to-remaining-forms.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-24

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Journey-flow forms (6 routes) rejected without token, succeed with valid token | — | 12 tests | — | — | — | 🟢 |
| AC2 | Annotations + skill-session-form + skill-commit-form rejected without token, succeed with valid token (annotations also needs a prerequisite form-parsing fix) | — | 7 tests | — | — | — | 🟢 |
| AC3 | Products confirm + features rejected without token, succeed with valid token | — | 4 tests | — | — | — | 🟢 |
| AC4 | Legacy login shell form rejected without token, succeeds with valid token once embedded | — | 3 tests | — | — | — | 🟢 |
| AC5 | Full round-trip (render → extract real token → submit → validate) for every route in AC1–AC4 | — | (covered by the "succeeds with valid token" test in each AC above — no separate test file) | — | — | — | 🟢 |

Per `sec-perf-s3`'s own established convention (this story's direct precedent), every test dispatches through the real `server.js` router — not the handler in isolation — so during the TDD RED phase (before `csrfGuard` is wired at each new call site) the "rejected without token" tests fail exactly as the current, unprotected code behaves (the POST succeeds/reaches the underlying write function with no `_csrf` field present). This is the `CLAUDE.md` D37 wiring-test proof-of-vulnerability convention; once `csrfGuard` is wired, the same tests pass. No separate permanently-failing test is kept.

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — in-memory `req`/`res` mocks dispatched through the real `server.js` router, matching `sec-perf-s3`'s own established pattern (this story's direct precedent) and this feature's own prior short-track sibling stories.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A real authenticated session (seeded via this repo's established `seedTestSession`/`seed-multi-user-roles` test endpoints) with an active journey to exercise `gate-confirm`/`reference`/`reference-modal/skip`/`stories` | Synthetic | None | `journey.js`'s own existing test fixtures for journey creation are reused as setup, not duplicated |
| AC2 | Same authenticated-session pattern; `annotations` additionally needs a real artefact file path fixture (mirrors existing `check-wuce8-annotation.js` fixture conventions) | Synthetic | None | |
| AC3 | Authenticated session with an existing product | Synthetic | None | |
| AC4 | An UNauthenticated request to an unmatched route (to reach the fallback shell) | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Integration Tests

Scope: full `server.js` router dispatch, exercising the seam between session state (`req.session.csrfToken`), the CSRF middleware, and each route's own handler. All tests are integration-level per `sec-perf-s3`'s established convention — no unit-only coverage, since the thing under test (`csrfGuard` wired at a specific call site) only has meaning in the context of a real dispatched request.

### `tests/check-rcfc-s1-journey-forms-csrf.js` — AC1 (6 routes)

For **each** of `POST /journey/wizard`, `POST /api/journey`, `POST /api/journey/:journeyId/gate-confirm`, `POST /api/journey/:journeyId/reference-modal/skip`, `POST /api/journey/:journeyId/reference`, `POST /api/journey/:journeyId/stories`:

- **[route]-rejected-without-csrf**
  - **Verifies:** AC1
  - **Precondition:** Real authenticated session (and an active journey, for the routes that require one), dispatched through the real router.
  - **Action:** POST to the route with no `_csrf` field in the body.
  - **Expected result:** `403`, body `"Forbidden"`; the underlying write/state-mutating call for that route is never reached (confirmed by asserting no state change occurred — e.g. no journey created, no gate advanced, no artefact reference added — not just the status code).
  - **Edge case:** No.
- **[route]-full-round-trip** (also verifies AC5 for this route)
  - **Verifies:** AC1, AC5
  - **Precondition:** Same as above.
  - **Action:** GET the real rendering page for this form, extract the embedded `_csrf` value from the returned HTML, then POST with that extracted value and valid field data.
  - **Expected result:** Request succeeds exactly as it did before this story (same status code, same redirect/response shape as the pre-story behaviour) — proves the CSRF check does not regress legitimate use.
  - **Edge case:** No.

12 tests total (6 routes × 2 tests).

### `tests/check-rcfc-s1-annotations-skills-csrf.js` — AC2 (3 routes + 1 prerequisite fix)

- **annotations-form-parsing-fix-verified**
  - **Verifies:** the AC2 prerequisite fix (form-urlencoded body parsing added to `annotation.js`'s `_readBody`)
  - **Precondition:** A real authenticated session, no CSRF concerns yet (this test predates/is independent of the CSRF wiring — proves the underlying parsing bug is fixed).
  - **Action:** POST to `/api/artefacts/:slug/:file/annotations` with a `Content-Type: application/x-www-form-urlencoded` body (matching a genuine browser `<form>` submission), with a valid CSRF token already supplied.
  - **Expected result:** The request is parsed correctly and reaches the annotation-creation logic (does not 400 "Invalid request body" the way the pre-story code does for this content type).
  - **Edge case:** Yes — this is the regression guard for the specific pre-existing bug this story's investigation found; must be written to fail against the pre-fix code (400) and pass once fixed.
- **annotations-rejected-without-csrf** / **annotations-full-round-trip** — same shape as the AC1 pattern above, verifies AC2 + AC5 for this route.
- **skill-session-form-rejected-without-csrf** / **skill-session-form-full-round-trip** — same shape, for `POST /api/skills/:name/sessions` (form path specifically — the JSON path is explicitly out of scope, confirmed unaffected by a negative check that the JSON path's own existing behaviour is untouched).
- **skill-commit-form-rejected-without-csrf** / **skill-commit-form-full-round-trip** — same shape, for `POST /api/skills/:name/sessions/:id/commit` (form path specifically).

7 tests total (1 prerequisite-fix test + 3 routes × 2 tests).

### `tests/check-rcfc-s1-products-csrf.js` — AC3 (2 routes)

- **products-confirm-rejected-without-csrf** / **products-confirm-full-round-trip** — verifies AC3 + AC5 for `POST /products/confirm`.
- **products-features-rejected-without-csrf** / **products-features-full-round-trip** — verifies AC3 + AC5 for `POST /products/:id/features`.

4 tests total.

### `tests/check-rcfc-s1-legacy-login-csrf.js` — AC4 (1 route, 2 forms)

- **legacy-shell-signin-rejected-without-csrf**
  - **Verifies:** AC4
  - **Precondition:** Unauthenticated request to an unmatched route (reaches `renderLoginPage()`'s fallback shell, confirmed still live/reachable at `server.js`'s catch-all).
  - **Action:** POST to `/auth/email/login` with the shell's own form fields but no `_csrf` field.
  - **Expected result:** `403`, `"Forbidden"` — same rejection convention as the primary `GET /` landing page's own sign-in form.
  - **Edge case:** No.
- **legacy-shell-signin-full-round-trip**
  - **Verifies:** AC4, AC5
  - **Action:** GET the fallback shell, extract the now-embedded `_csrf` value (added by this story), POST with it.
  - **Expected result:** Succeeds — same outcome as the primary landing page's own already-working sign-in form. This test is also the regression guard for the pre-existing bug found during investigation (today, this form has no `_csrf` field at all and its target handler already enforces `csrfGuard`, so every real submission currently 403s regardless of credentials) — confirms this story's fix (embedding the token) resolves that, not just theoretically closes a gap.
  - **Edge case:** Yes.
- **legacy-shell-signup-rejected-without-csrf** — same shape as `legacy-shell-signin-rejected-without-csrf`, for the shell's sign-up form / `POST /auth/email/signup`.

3 tests total.

---

## NFR Tests

### csrf-rejection-response-shape-consistent

- **NFR addressed:** Security
- **Measurement method:** Structural assertion — every one of the above `-rejected-without-csrf` tests already asserts the exact `403` status and `"Forbidden"` body (matching `sec-perf-s3`'s own established convention); this is a summary/consolidation check confirming no new route introduced a differently-shaped rejection response.
- **Pass threshold:** All 15 rejection tests across the 4 files use the identical status/body assertion.
- **Tool:** Node `assert`, part of the 4 test files above (not a separate file).

### no-csrf-token-value-logged

- **NFR addressed:** Security
- **Measurement method:** Static review, matching `sec-perf-s3`'s own established approach — confirm no new call site added by this story passes the raw token value to `console.log`/`_logger`.
- **Pass threshold:** Zero matches.
- **Tool:** Manual code review during implementation, not an automated test (same as `sec-perf-s3`).

No Performance/Accessibility NFR tests — same rationale as `sec-perf-s3` (token generation is a single cached call per session; hidden input fields only).

---

## Out of Scope for This Test Plan

- Any change to the CSRF mechanism itself (`csrf.js`) — reused as-is, confirmed unmodified by this story.
- `POST /webhook/stripe` and any `NODE_ENV==='test'`-gated endpoint — correctly excluded per `sec-perf-s3`'s own reasoning.
- The JSON/fetch-only path for `POST /api/skills/:name/sessions` and `POST /api/skills/:name/sessions/:id/commit` — already protected by `SameSite=Strict`, per the story's own established scope boundary. Each relevant test above includes a negative check confirming the JSON path's behaviour is untouched by this story's changes.
- A double-submit-header convention for JSON/fetch-only endpoints — separate, larger decision, not raised again here.
- Any broader refactor of `annotation.js`'s body-reading logic beyond the minimal form-urlencoded support needed for AC2.

---

## Test Gaps and Risks

None.
