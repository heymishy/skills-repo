## Test Plan: Stage side panel: edit all optional attributes

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s3.md
**Epic reference:** journey-entity-and-stage-management
**Test plan author:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-08

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`.

**Real architecture grounding (confirmed by direct code read, 2026-10-08):**
- Design system reference (`artefacts/2026-09-18-design-system-adoption/reference/DESIGN.md`) read in full per this story's own Architecture Constraints. No existing named layout pattern matches "side panel that opens on click" exactly — closest precedents are `html-shell.js`'s own off-canvas sidebar drawer (mobile: `position:fixed; left:-240px` closed → `left:0` open, `transition: left 0.25s`, `box-shadow` on open) and `products.js`'s `ep4s1-pods-modal` dialog (`role="dialog" aria-modal="true"`, initial-focus-on-open, Escape-to-close, focus-restore-on-close via a captured `_triggerBtn`). Neither existing precedent implements a full keyboard focus trap — `ep4s1-pods-modal`'s own comment explicitly says so ("not a full keyboard focus trap... Tab can still leave the dialog... judged disproportionate"). This story's own AC5 requires a real one; it is implemented fresh here, following the standard WCAG pattern (capture all focusable elements inside the panel on open, intercept `Tab`/`Shift+Tab` at the first/last element and wrap).
- New handler `handlePatchJourneyStage` (PATCH `/journeys/:id/stages/:stageId`) added to `journeys.js`. CSRF-guarded as its first statement (mandatory from first implementation, per `jcg-s1`'s precedent, now also required for every new mutating route in this file per `ep1-s2`'s own DoR note). Journey ownership (404 for cross-tenant) AND stage ownership (404 if the stage doesn't belong to that journey) both checked before any update, matching `handlePostJourneyStage`'s own pattern.
- PATCH payload shape: `{ field: string, value: string|boolean, _csrf: string }` — one field per request, matching AC2's own "edit a field and move focus away (blur)" semantics (autosave per-field, not a bulk form submit). `field` validated against a fixed allowlist (`description`, `customer_actions`, `touchpoints`, `channel`, `emotion`, `pain_points`, `opportunities`, `moment_of_truth`) before building the `UPDATE` statement — never interpolating the client-supplied field name directly into SQL. `channel`/`emotion` values additionally validated against their own fixed enum sets server-side (not just by the `<select>`'s own client-side options).
- **No full-page reload on save** (a deliberate deviation from `ep1-s1`/`ep1-s2`'s own simpler "fetch-then-reload" convention) — AC2's own wording ("a success indicator is shown briefly") only makes sense if the panel and page stay in place across each field's autosave; reloading after every blur would be poor UX for an 8-field panel and would defeat "briefly." The success indicator and (for `moment_of_truth`) the stage card's own visible-indicator update are both done via targeted in-place DOM changes instead.
- **No fake-test-db.js support for `customer_journeys`/`customer_journey_stages`** (confirmed by grep — zero references) — this is the same gap already noted as a known, explicitly out-of-scope limitation on `bmau-s1`'s own E2E spec for a different adapter; a real Playwright spec against these routes can only run with a real `DATABASE_URL` set, exactly matching `bmau-s1`'s own precedent (not fixed in this story — extending `fake-test-db.js` is separable work, logged as a decision below, not a silent gap).

**E2E/browser-layout detection (Step 3a):** AC1 (open-on-click-with-focus), AC4 (Escape-closes + focus-returns), and AC5 (focus trap) are real, WCAG-mandated browser-only behaviours with zero server-testable surface — unlike `ep1-s2`'s own simpler AC1 (deferred via RISK-ACCEPT), these are explicit hard architecture constraints for this story specifically (not an optional nicety), so a dedicated Playwright spec is written rather than deferred again. The spec is NOT wired into CI's own Scenario A/B blocking job lists (those use an explicit file list in `.github/workflows/e2e.yml`, not auto-discovery — adding a new file there is a separate, more consequential CI-infrastructure decision out of this story's own scope) and cannot be run in this session (no real `DATABASE_URL`, no local Postgres, matching `ep5-s1`'s and `bmau-s1`'s own precedent for this exact limitation) — it is a real, committed, operator-runnable spec, not a RISK-ACCEPT placeholder.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Panel markup contains all 8 editable fields with correct types/options | 1 test | — | — | — | — | 🟢 |
| AC1 (interaction) | Clicking a stage card opens the panel with focus inside it | — | — | 1 spec (written, not run this session — no real DB) | — | written-but-unexecuted | 🟡 |
| AC2 | Valid field edit PATCHes the record, scoped to tenant/journey/stage | 1 test | — | — | — | — | 🟢 |
| AC2 (security) | Disallowed field name is rejected | 1 test | — | — | — | — | 🟢 |
| AC2 (security) | Invalid channel/emotion enum value is rejected | 1 test | — | — | — | — | 🟢 |
| AC3 | Toggling moment_of_truth updates the DB value | 1 test | — | — | — | — | 🟢 |
| AC3 | Canvas render shows the moment-of-truth indicator for a true row | 1 test | — | — | — | — | 🟢 |
| AC4 | Escape closes the panel; focus returns to the triggering stage card | — | — | 1 spec (written, not run this session) | — | written-but-unexecuted | 🟡 |
| AC5 | Tab/Shift+Tab cycle within the panel while open (real focus trap) | — | — | 1 spec (written, not run this session) | — | written-but-unexecuted | 🟡 |
| (security) | CSRF guard rejects a missing/mismatched token | 1 test | — | — | — | — | 🟢 |
| (security) | Cross-tenant journey id is rejected (404) | 1 test | — | — | — | — | 🟢 |
| (security) | Stage id not belonging to the given journey is rejected (404) | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

AC1's interaction half, AC4, and AC5 are written as a real Playwright spec but cannot be executed this session (no `DATABASE_URL`/local Postgres available) — logged honestly as "written-but-unexecuted," not silently dropped and not misrepresented as RISK-ACCEPT (RISK-ACCEPT means "deliberately not writing a test"; this is "wrote the test, can't run it in this environment"). The operator (or CI, if ever wired into a DATABASE_URL-backed job) can run it directly. All other ACs are fully unit-testable server-side against the real handler functions with mock `pool`/`req`/`res` objects.

---

## Test Data Strategy

**Source:** Synthetic — extends `check-ep1-s2-journey-stage-create.js`'s own `makeMockPool`/`makeMockRes`/CSRF-fixture conventions. The E2E spec uses real HTTP against a real Postgres via the `withAuth` fixture, matching `bmau-s1-bulk-assign-rerender.spec.js`'s own pattern.
**PCI/sensitivity in scope:** No.
**Availability:** Available now for unit tests; E2E spec requires a real `DATABASE_URL` (not available this session).
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 (markup) | Mock pool returning one stage row with all optional fields populated | Synthetic | None | Assert rendered `bodyContent` contains a textarea/select/checkbox for each of the 8 fields, and that the `channel`/`emotion` selects contain exactly their 6/4 expected `<option>` values |
| AC2 | Mock pool: journey + stage ownership SELECTs both succeed; UPDATE returns 1 row | Synthetic | None | Assert the UPDATE's own SQL targets only the allowlisted column named in the request, with `WHERE id = stageId AND journey_id = journeyId AND tenant_id = tenantId` |
| AC2 (security, field) | `req.body.field = 'tenant_id'` (not on the allowlist) | Synthetic | None | Assert 400, zero UPDATE ops |
| AC2 (security, enum) | `req.body.field = 'channel'`, `req.body.value = 'carrier-pigeon'` | Synthetic | None | Assert 400, zero UPDATE ops |
| AC3 | `req.body.field = 'moment_of_truth'`, `req.body.value = true` | Synthetic | None | Assert UPDATE params include `true` for `moment_of_truth` |
| AC3 (render) | Mock pool stage row with `moment_of_truth: true` | Synthetic | None | Assert rendered stage card HTML contains a moment-of-truth indicator (icon + label text) |
| (security) CSRF | No/mismatched `_csrf` | Synthetic | None | Assert 403, zero UPDATE ops |
| (security) cross-tenant | Journey-ownership SELECT returns zero rows for this tenant | Synthetic | None | Assert 404, zero UPDATE ops |
| (security) cross-journey stage | Stage-ownership SELECT returns zero rows for this journey id | Synthetic | None | Assert 404, zero UPDATE ops |

### PCI / sensitivity constraints

None.

### Gaps

AC1 (interaction)/AC4/AC5 — see Coverage gaps above.

---

## Unit Tests

### Side panel markup contains all 8 editable fields with correct types and options

- **Verifies:** AC1 (markup)
- **Action:** Call `handleGetJourneyCanvas` with a mock pool returning one fully-populated stage row
- **Expected result:** Rendered `bodyContent` contains: a `description` textarea, a `customer_actions` textarea, a `touchpoints` textarea, a `channel` select with exactly `web/mobile/in-person/phone/email/other` options, an `emotion` select with exactly `positive/neutral/negative/mixed` options, a `pain_points` textarea, an `opportunities` textarea, and a `moment_of_truth` checkbox
- **Edge case:** No

### Valid field edit updates the scoped record

- **Verifies:** AC2
- **Action:** Call `handlePatchJourneyStage` with a matching CSRF token, a journey/stage owned by the session's tenant, `field: 'description'`, `value: 'Updated description'`
- **Expected result:** Exactly one `UPDATE customer_journey_stages` op targeting `description`, scoped by `id`/`journey_id`/`tenant_id`; 200 response
- **Edge case:** No

### Disallowed field name is rejected

- **Verifies:** AC2 (security)
- **Action:** Call `handlePatchJourneyStage` with `field: 'tenant_id'`
- **Expected result:** 400 response; zero UPDATE ops
- **Edge case:** Yes

### Invalid channel/emotion enum value is rejected

- **Verifies:** AC2 (security)
- **Action:** Call `handlePatchJourneyStage` with `field: 'channel'`, `value: 'carrier-pigeon'`
- **Expected result:** 400 response; zero UPDATE ops
- **Edge case:** Yes

### Toggling moment_of_truth updates the DB value

- **Verifies:** AC3
- **Action:** Call `handlePatchJourneyStage` with `field: 'moment_of_truth'`, `value: true`
- **Expected result:** UPDATE params include `true` for the `moment_of_truth` column; 200 response
- **Edge case:** No

### Canvas render shows the moment-of-truth indicator for a true row

- **Verifies:** AC3 (render)
- **Action:** Call `handleGetJourneyCanvas` with a mock pool returning a stage row with `moment_of_truth: true`
- **Expected result:** Rendered stage card HTML contains a moment-of-truth icon/label
- **Edge case:** No

### Missing or mismatched CSRF token is rejected

- **Verifies:** (security) CSRF
- **Action:** Call `handlePatchJourneyStage` with no/mismatched `_csrf`
- **Expected result:** 403 response; zero UPDATE ops
- **Edge case:** Yes — two sub-cases, mirroring every prior story's own CSRF test shape

### Cross-tenant journey id is rejected

- **Verifies:** (security) cross-tenant
- **Action:** Call `handlePatchJourneyStage` with a journey id belonging to a different tenant
- **Expected result:** 404 response; zero UPDATE ops
- **Edge case:** Yes

### Stage id not belonging to the given journey is rejected

- **Verifies:** (security) cross-journey stage
- **Action:** Call `handlePatchJourneyStage` with a real stage id that belongs to a DIFFERENT journey than the one named in the URL
- **Expected result:** 404 response; zero UPDATE ops
- **Edge case:** Yes

---

## E2E Spec (written, not executed this session — see Coverage gaps)

### File: `tests/e2e/ep1-s3-stage-panel-focus-management.spec.js`

- **Verifies:** AC1 (interaction), AC4, AC5
- **Not in npm test chain** (matches `bmau-s1-bulk-assign-rerender.spec.js`'s own precedent) — run with `npx playwright test tests/e2e/ep1-s3-stage-panel-focus-management.spec.js`, requires a real `DATABASE_URL`.
- **Scenario:** Create a journey and a stage via real HTTP (`withAuth` fixture), open the canvas, click the stage card. Assert: the panel becomes visible and `document.activeElement` is inside it (AC1). Press `Tab` repeatedly past the last focusable element inside the panel and assert focus wraps back to the first one, not out to the page (AC5). Press `Shift+Tab` from the first element and assert it wraps to the last (AC5). Press `Escape` and assert the panel closes and `document.activeElement` is the original stage card element (AC4).
