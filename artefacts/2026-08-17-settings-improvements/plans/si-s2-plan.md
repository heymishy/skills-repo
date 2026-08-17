# Implementation Plan: Add a timezone and date-format preference to Settings

**Story reference:** artefacts/2026-08-17-settings-improvements/stories/si-s2-locale-preference.md
**DoR reference:** artefacts/2026-08-17-settings-improvements/dor/si-s2-dor.md
**Test plan reference:** artefacts/2026-08-17-settings-improvements/test-plans/si-s2-test-plan.md

---

## File map

| File | Change |
|------|--------|
| `src/web-ui/modules/user-roles.js` | Add two idempotent `ALTER TABLE people ADD COLUMN IF NOT EXISTS` statements to `migrateTeamSchema()` |
| `src/web-ui/routes/settings.js` | Add `renderLocaleForm()`, extend `renderProfileTab()`/`renderSettingsPage()` to thread locale data + success banner, add `handlePostLocalePreference` to `createSettingsHandlers(pool)` |
| `src/web-ui/server.js` | Add module-level `_handlePostLocalePreference` reference, wire it in the DATABASE_URL block alongside `_handleGetSettings`, register `POST /settings/locale-preference` route |
| `tests/check-si-s2-locale-preference.js` | New test file — self-contained inline fake pool (tir-s2 convention, not `fake-test-db.js`), 10 tests covering all 6 ACs + 3 NFRs |
| `tests/check-c2-billing-tab.js` | Found-and-fixed: one pre-existing assertion narrowed from page-wide to Billing-panel-scoped (see decisions.md) |

No new adapter (H-ADAPTER: DoR confirms reuse of existing `pool` injection + `resolvePersonForIdentity`).

---

## Task 1 — Schema migration (people.timezone, people.date_format)

**File:** `src/web-ui/modules/user-roles.js`

Add after the existing `team_memberships` `CREATE TABLE IF NOT EXISTS` block inside `migrateTeamSchema()`:

```js
// si-s2: idempotent column additions for per-person locale preference —
// mirrors product-repo.js's migrateProductRepoColumns() ALTER TABLE ... ADD
// COLUMN IF NOT EXISTS convention exactly.
await pool.query('ALTER TABLE people ADD COLUMN IF NOT EXISTS timezone TEXT');
await pool.query('ALTER TABLE people ADD COLUMN IF NOT EXISTS date_format TEXT');
```

**Test:** covered by the integration tests in Task 3 (fake pool no-ops `ALTER TABLE` already; a real-Postgres smoke check is out of this test plan's scope per its own "Out of Scope" section).

---

## Task 2 — Render locale preference form (AC1, AC3)

**File:** `src/web-ui/routes/settings.js`

Add constants near the top (after `PROVIDERS`). Note: implementation deviated from the original plan here after discovering `Intl.supportedValuesOf('timeZone')` does not enumerate `'UTC'` even though it is a genuinely valid IANA/ECMA-402 identifier — see decisions.md-equivalent inline code comment. `IANA_TIMEZONES` is used only to populate the `<select>`; validation at save time uses `Intl.DateTimeFormat` construction directly (`_isValidTimezone`), not array membership.

```js
var IANA_TIMEZONES = ['UTC'].concat(Intl.supportedValuesOf('timeZone'));
var DEFAULT_TIMEZONE = 'UTC';
function _isValidTimezone(tz) {
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch (e) { return false; }
}
var DATE_FORMATS = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (UK/EU)' }
];
var DEFAULT_DATE_FORMAT = 'YYYY-MM-DD';

// si-s2: bse-s1's query-param -> fixed-dictionary -> conditional-banner
// pattern, reused verbatim for a SUCCESS confirmation instead of an error.
var _LOCALE_SUCCESS_MESSAGES = {
  saved: 'Your timezone and date format preferences have been saved.'
};
```

Add `renderLocaleForm(locale, csrfToken, opts)` rendering two `<select>` elements (timezone, date format), each defaulting to a sensible value when unset, echoing an unrecognized/legacy stored value as an extra escaped `<option>` rather than silently discarding it, and a success banner (`#locale-success`, `.sw-locale-success`) shown only when `opts.successMessage` is set.

Extend `renderProfileTab(user, linkedSet, opts)` — add optional 3rd param, append `renderLocaleForm(...)` output inside the profile panel. `opts` defaults to `{}` so the existing 2-arg call sites (`check-c1-*`) still render valid, harmless output with UTC/ISO defaults and no CSRF token.

Add a small CSS rule to `_TAB_CSS`:

```css
.sw-locale-success{background:var(--green-soft);color:var(--green);border-radius:8px;padding:8px 12px;margin-bottom:12px;font-size:13.5px}
```

**Test (unit):** `AC1: locale form renders sensible non-blank defaults when unset` — call `renderLocaleForm({timezone: null, date_format: null}, 'tok')`, assert both selects present, assert `selected` attribute lands on `UTC` and `YYYY-MM-DD`.

---

## Task 3 — Wire GET to read saved locale + success banner (AC1, AC3)

**File:** `src/web-ui/routes/settings.js`, inside `handleGetSettings`

After the existing `identityKey`/`linkedFromDb` lines, resolve `personId` via the SAME `identityKey`, read `timezone`/`date_format` from `people` when resolved, and compute `localeSuccessMessage` from `req.query.locale` via the dictionary above. Thread both into `renderSettingsPage` → `renderProfileTab`.

**Tests:** `AC3: reload pre-populates saved values, not defaults`, banner half of `AC2: valid submit persists to people table via resolvePersonForIdentity + shows confirmation`.

---

## Task 4 — POST handler: validate, write, redirect (AC2, AC4, AC5, AC6)

**File:** `src/web-ui/routes/settings.js`

`handlePostLocalePreference` — CSRF guard first, then validates timezone (via `_isValidTimezone`) and date format (allowlist membership) BEFORE any identity resolution or write (AC4, no partial write, field-specific JSON-400 message, matching `admin-credits.js`'s established shape). Resolves `personId` via the same `identityKey`; a `null` result is a clean 400, never an unhandled throw and never a write to a wrong/new row (AC5). On success: `UPDATE people SET timezone = $1, date_format = $2 WHERE id = $3`, fires `_posthog.capture(identityKey, 'locale_preference_saved', {...})` (AC6), then 302-redirects to `/settings?locale=saved` (AC2).

Added `var _posthog = require('../modules/posthog-server');` to the top requires. `handlePostLocalePreference` returned from `createSettingsHandlers`'s returned object alongside `handleGetSettings`.

**Tests:** `AC2`, `AC4` (×2 — invalid + empty timezone), `AC5`, `AC6`, plus the 3 NFR tests (allowlist range, no-unescaped-value, under-1-second).

---

## Task 5 — Server wiring

**File:** `src/web-ui/server.js`

Added `let _handlePostLocalePreference = null;` near `_handleGetSettings`, wired it from the same `createSettingsHandlers(_userRolesPool)` factory call, and registered `POST /settings/locale-preference` behind `authGuard` next to the existing `GET /settings` route, with the same 503-if-unwired fallback shape.

**Test:** exercised indirectly — the test file calls `createSettingsHandlers(pool).handlePostLocalePreference` directly (mirrors `check-bse-s1-*`'s convention of calling handlers directly rather than through the router).

---

## Task 6 — Write the test file (RED first)

**File:** `tests/check-si-s2-locale-preference.js`

Self-contained inline fake pool, following `tests/check-tir-s2-cross-provider-linking.js`'s established convention (NOT `fake-test-db.js` — that shared fixture has no `people.timezone`/`date_format` support and its own docstring reserves it for query shapes shared across many test files; this pool is single-file-scoped).

Fake pool supports: `CREATE TABLE`/`ALTER TABLE` (no-op), `SELECT PERSON_ID FROM PERSON_IDENTITIES WHERE IDENTITY_KEY`, `SELECT PERSON_ID FROM TEAM_MEMBERSHIPS WHERE TENANT_ID` (fallback), `SELECT TIMEZONE, DATE_FORMAT FROM PEOPLE WHERE ID`, `UPDATE PEOPLE SET TIMEZONE`, and the pre-existing `SELECT PROVIDER FROM PERSON_IDENTITIES WHERE PERSON_ID` (handleGetSettings's existing linked-providers call). Plus `_seedPerson(id, {timezone, date_format})` / `_seedIdentity(identityKey, personId)` test-setup helpers, mirroring tir-s2's `_seedPerson` convention.

10 tests total (1 render unit, 1 posthog unit, 4 integration incl. one extra AC4 empty-timezone case, 1 identity-resolution edge case, 3 NFR). Mock PostHog by monkeypatching `posthogModule.capture` directly (matches `check-bsc-s1-billing-success-confirmation.js`'s established pattern), not a D37 adapter (`posthog-server.js` is a plain module, not an injectable setter/getter pair).

**Confirmed RED:** all 10 tests failed before implementation (`settings.renderLocaleForm is not a function` / `handlers.handlePostLocalePreference is not a function`).

---

## Task 7 — Implement, then confirm GREEN

**Confirmed GREEN:** `node tests/check-si-s2-locale-preference.js` → `[si-s2] 10 passed, 0 failed`.

Full suite (`npm test`) run twice: first run surfaced one genuine regression (`tests/check-c2-billing-tab.js`, caused by the locale form's always-present CSRF field breaking a page-wide "no CSRF field" assertion that was actually scoped to the Billing panel — fixed, see Task 8 and decisions.md). Second full run: 529 files run, 33 failed — all 33 are a strict subset of the pre-implementation `/branch-setup` baseline (35 failed, 2 of which — `check-shr1-schema-harness.js` and `.github/scripts/check-viz-syntax.js` — did not fail on the second run either, consistent with flakiness unrelated to this story). Zero new failures.

---

## Task 8 — Found-and-fixed: check-c2-billing-tab.js assertion scope (not in original plan)

**File:** `tests/check-c2-billing-tab.js`

`testHandleGetSettingsReflectsRealPlanStateNoDuplicateComputation` asserted zero `name="_csrf"` occurrences anywhere in the full rendered page when the Billing tab shows no upgrade form (paid/past_due plan state). si-s2's locale-preference form is unconditionally rendered on the Profile tab (AC1 requires always-visible defaults) and always embeds its own CSRF field, which broke that assertion. Fixed by scoping the check to the Billing panel's own HTML boundary (`id="tab-panel-billing"` to the next tab panel), matching the assertion's own stated intent (no CSRF field when no *billing* form is shown) rather than the accidentally page-wide check it had been written as. See `decisions.md` for the full RISK-ACCEPT entry.

---

## Commit sequence (actual)

1. `test: add failing si-s2 locale-preference test file (RED)`
2. `feat: add timezone/date_format columns to people table (si-s2)`
3. `feat: render locale preference form on Settings Profile tab (si-s2)`
4. `feat: add POST /settings/locale-preference handler with validation (si-s2)`
5. `feat: wire locale-preference route in server.js (si-s2)`
6. `fix: scope check-c2-billing-tab.js CSRF assertion to the Billing panel (si-s2 regression)`
7. `chore: add si-s2 implementation plan + decisions.md entries`
