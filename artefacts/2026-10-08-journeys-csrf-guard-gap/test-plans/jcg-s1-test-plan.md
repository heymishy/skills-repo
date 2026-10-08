## Test Plan: Add the missing CSRF guard to POST /journeys

**Story reference:** artefacts/2026-10-08-journeys-csrf-guard-gap/stories/jcg-s1-add-csrf-guard-to-post-journeys.md
**Epic reference:** None — short-track
**Test plan author:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`.

**Real architecture grounding (confirmed by direct code read, 2026-10-08):**
- `src/web-ui/middleware/csrf.js`'s `csrfGuard(req, res)` reads/caches the body itself, compares `body._csrf` to `req.session.csrfToken`, writes `403`/`text/plain`/`"Forbidden"` on mismatch, returns `true`/`false`. Already proven, unmodified by this story.
- Established retrofit pattern confirmed in `products.js` (`handlePostGuardrailsForm`, `handlePostProductModule`): `var csrfOk = await _csrf.csrfGuard(req, res); if (!csrfOk) return;` as the handler's first statement, with no separate `_readBody` call afterward (`csrfGuard` already set `req.body`).
- `tests/check-rcfc-s1-journey-forms-csrf.js` is this repo's own established convention for CSRF regression tests: dispatch through the real handler (not a bypassed shortcut), assert a request with no/invalid `_csrf` is rejected (403, no side effect), and a request with the real session-matching token succeeds.

**E2E/browser-layout detection (Step 3a):** N/A — no UI form exists yet for this route (ships in `ep4-s1`); this is a server-side handler fix only.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | No/mismatched `_csrf` → 403, no insert | 1 test | — | — | — | — | 🟢 |
| AC2 | Matching `_csrf` → unchanged behaviour (400 on missing name; insert + redirect on valid name) | 2 tests (reuses former AC1/AC2 shape) | — | — | — | — | 🟢 |
| AC3 | Former AC3 (tenant-spoofing guard) still passes with a matching `_csrf` added | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All three ACs are unit-testable against the real `handlePostJourneys` function with a mock `pool`/`req` (`req.session.csrfToken` + matching/mismatched `req.body._csrf`) /`res` (needs a `writeHead`/`end` pair added to the existing mock, since `csrfGuard`'s 403 path writes via that interface, not `res.status`/`res.json`) — no external dependency, no `DATABASE_URL` needed.

---

## Test Data Strategy

**Source:** Synthetic — extends the existing `makeMockPool`/mock `req`/`res` convention already in `tests/check-ep1-s1-journey-create.js`.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | `req.session.csrfToken = 'real-token'`, `req.body._csrf` absent or set to a different value | Synthetic | None | Assert `res` received a `writeHead(403, ...)` call (mock `res` must capture this) and zero `INSERT` ops on the mock pool |
| AC2 | `req.session.csrfToken = 'real-token'`, `req.body._csrf = 'real-token'`, plus the former AC1/AC2 fixtures (valid name / missing name) | Synthetic | None | Re-run former AC1 (insert + 201/redirect) and AC2 (missing name → 400, no insert) with the matching token added; assert identical outcomes to before |
| AC3 | `req.session.csrfToken = 'real-token'`, `req.body._csrf = 'real-token'`, `req.body.tenantId` spoofed to a different tenant | Synthetic | None | Re-run the former AC3 (tenant-spoofing guard) with the matching token added; assert the INSERT still uses only `req.session.tenantId` |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### No or mismatched CSRF token is rejected

- **Verifies:** AC1
- **Action:** Call `handlePostJourneys` with `req.session.tenantId`/`req.session.csrfToken` set, a valid `name`, but `req.body._csrf` absent (and, as a second case, present but not matching)
- **Expected result:** Mock `res.writeHead` called with `403`; zero `INSERT INTO customer_journeys` ops recorded
- **Edge case:** Yes — two sub-cases (absent token, mismatched token)

### Matching CSRF token preserves existing valid-submission behaviour

- **Verifies:** AC2 (former AC1)
- **Action:** Call `handlePostJourneys` with a matching `req.body._csrf`/`req.session.csrfToken` pair and a valid `name`
- **Expected result:** Exactly one `INSERT INTO customer_journeys` op with the session's `tenantId`/`name`; 201/redirect response — byte-for-byte the same assertions as `ep1-s1`'s original AC1 test
- **Edge case:** No

### Matching CSRF token preserves existing missing-name behaviour

- **Verifies:** AC2 (former AC2)
- **Action:** Call `handlePostJourneys` with a matching `_csrf`/`csrfToken` pair and an empty `name`
- **Expected result:** 400 response; zero INSERT ops — same assertions as `ep1-s1`'s original AC2 test
- **Edge case:** No

### Matching CSRF token preserves the tenant-spoofing guard

- **Verifies:** AC3 (former AC3)
- **Action:** Call `handlePostJourneys` with a matching `_csrf`/`csrfToken` pair, `req.session.tenantId = 'org-A'`, `req.body.tenantId = 'org-B'`
- **Expected result:** INSERT params include `'org-A'`, never `'org-B'` — same assertion as `ep1-s1`'s original AC3 test
- **Edge case:** No
