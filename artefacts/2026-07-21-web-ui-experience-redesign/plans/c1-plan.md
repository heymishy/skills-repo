## Implementation Plan: Settings page shell with Profile tab (C1)

**Story:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/c1-settings-shell-and-profile-tab.md`
**Test plan:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/c1-test-plan.md`
**DoR:** `artefacts/2026-07-21-web-ui-experience-redesign/dor/c1-dor.md`

## File map

| File | Change |
|------|--------|
| `src/web-ui/modules/identity-links.js` | Add `getLinkedProviders(pool, identityKey)` — lists providers explicitly linked via `person_identities` for the person who owns `identityKey`. |
| `src/web-ui/routes/auth.js` | Add `req.session.authProvider = 'github'` / `'google'` at the end of the two successful-login callbacks. Session bookkeeping only — no OAuth logic touched. |
| `src/web-ui/routes/settings.js` (NEW) | `renderProfileTab(user, linkedSet)`, `renderSettingsPage(opts)` (pure render functions, no I/O), and `createSettingsHandlers(pool)` → `{ handleGetSettings }` (the real route handler, factory-over-pool pattern matching `account-linking.js`/`team-management.js`). |
| `src/web-ui/server.js` | Import + wire `createSettingsHandlers(_userRolesPool)` inside the existing DATABASE_URL wiring block (same pattern as tir-s2/tir-s3). Add `GET /settings` route (authGuard + handler, 503 fallback if unwired). Change `GET /settings/link-account` to redirect (302) to `/settings`, preserving the query string, instead of calling `handleGetLinkSettings` directly. |
| `tests/check-c1-settings-shell-and-profile-tab.js` (NEW) | AC1–AC4 tests, hand-rolled `test()`/`assert` style matching `tests/check-tir-s2-cross-provider-linking.js`. |

**Explicitly NOT touched:** `handleStartGoogleLink`, `handleStartGithubLink`, `_handleLinkCallback`, `createLinkCallbackHandlers` in `account-linking.js` — reused unmodified per the DoR constraint. `html-shell.js`'s `NAV_ITEMS` (sidebar Settings link is B2's scope, not C1's — B2 is still at `definition-of-ready`, not yet implemented; this is a known cross-story sequencing gap, noted in the closing report, not fixed here to avoid duplicating/conflicting with B2's own AC1/AC2).

---

## Task 1 — `getLinkedProviders` in identity-links.js (supports AC2/AC4)

**RED:** Add test `identity-links: getLinkedProviders returns [] for a person with no explicit links, and the provider list after one link` to the new test file. Run — fails (function does not exist).

**GREEN:**
```js
async function getLinkedProviders(pool, identityKey) {
  var personId = await resolvePersonForIdentity(pool, identityKey);
  if (personId == null) return [];
  var result = await pool.query('SELECT provider FROM person_identities WHERE person_id = $1', [personId]);
  return result.rows.map(function(r) { return r.provider; });
}
```
Export it from `module.exports`.

**Run:** `node tests/check-c1-settings-shell-and-profile-tab.js` — expect this test PASS.

**Commit:** `feat(c1): add getLinkedProviders to identity-links.js`

---

## Task 2 — `authProvider` session field (supports AC2)

**RED:** Test asserting `handleAuthCallback` sets `req.session.authProvider === 'github'` and `handleAuthGoogleCallback` sets `req.session.authProvider === 'google'`.

**GREEN:** One-line addition in each callback, next to the existing `req.session.login = ...` assignment.

**Run:** expect PASS, and re-run `node tests/check-lab-s2.1-google-oauth.js` + `node tests/check-tir-s9-per-person-identitykey-login-fix.js` (existing auth.js consumers) to confirm no regression.

**Commit:** `feat(c1): set session.authProvider at login (github/google)`

---

## Task 3 — `settings.js` render functions + factory (supports AC1/AC2/AC4)

**RED:** Tests:
- AC1: `renderSettingsPage(...)` output includes `renderShell`'s brand mark (`sw-brand-mark`) and nav (`sw-nav-item`), not a bare `<!DOCTYPE html>`-only fragment.
- AC2: with `linkedSet = new Set(['github'])`, output shows `GitHub` + `Linked` pill, `Google` + `Not linked` pill + a `Link Google account` control with `href="/settings/link-account/google/start"`.
- AC4: with `linkedSet = new Set(['github','google'])`, output has zero `Link` anchors for either provider.

**GREEN:** Implement `renderProfileTab`, `renderSettingsPage`, `createSettingsHandlers(pool)` per the design read from `html-shell.js`/`account-linking.js`/`team-management.js` conventions (module-reference requires, `_escapeHtml`, factory-over-pool).

**Run:** expect PASS.

**Commit:** `feat(c1): add settings.js — Settings shell + Profile tab`

---

## Task 4 — Wire into server.js + route (supports AC1, AC3)

**RED:** Integration test — simulate the "Link Google" control's target request reaching `handleStartGoogleLink` (imported directly from `account-linking.js`, unmodified) with the same CSRF-state-setting behaviour tir-s2 already covers.

**GREEN:** server.js wiring block + route dispatch as described in the file map.

**Run:** `node tests/check-c1-settings-shell-and-profile-tab.js` full file — expect all PASS. Then `npm test` (full suite) — expect 0 new failures vs. baseline.

**Commit:** `feat(c1): wire /settings route in server.js, redirect legacy /settings/link-account`

---

## Self-review checklist

- [x] Exact file paths, no placeholders
- [x] Complete code shown per task
- [x] Failing test precedes each implementation step
- [x] Expected output stated for every run command
- [x] Commit messages in imperative mood
- [x] No scope beyond the 4 ACs (Billing/Credits content, unlinking — explicitly excluded)
