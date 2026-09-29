# Implementation Plan: Retire the legacy admin-bootstrap path (tab-s3)

**Story:** artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s3.md
**DoR:** artefacts/2026-09-26-tenant-admin-bootstrap/dor/tab-s3-dor.md
**Test plan:** artefacts/2026-09-26-tenant-admin-bootstrap/test-plans/tab-s3-test-plan.md

---

## File map

| File | Change |
|------|--------|
| `src/web-ui/modules/user-roles.js` | Remove `_getUserRole`/`setGetUserRole`/`getUserRole`; remove `getRoleForTenant`'s legacy-fallback branch; remove `_backfillOne`; remove `migrateTeamSchema`'s legacy-backfill loop; simplify `resolveRoleForTenant`'s fallback to a plain `'user'` default; update `module.exports`. |
| `src/web-ui/server.js` | Remove `setGetUserRole` from the require destructure and its wiring call; remove the `arl-s4` admin-seeding block (`ADMIN_GITHUB_LOGINS` parsing + upsert). Keep `CREATE TABLE IF NOT EXISTS user_roles` (confirmed required by `check-tir-s1-person-team-schema.js`'s own existing T2 assertion — Out of Scope: do not drop the table). |
| `src/web-ui/routes/auth.js` | Reword one historical comment to not contain the literal string `ADMIN_GITHUB_LOGINS` (AC5's grep scope covers all of `src/web-ui/`, comments included). |
| `src/web-ui/config/validate-env.js` | Remove the `ADMIN_GITHUB_LOGINS` boot-time warning block — a real production-code reference the DoR's own file list didn't name but AC5's grep scope (`src/web-ui/` tree) requires removing. |
| `tests/check-arl-s1-user-roles.js` | **Delete entirely.** All 6 tests exercise `getUserRole`/`setGetUserRole` directly — the file's whole subject is retired functionality. |
| `tests/check-arl-s4-admin-billing-bypass.js` | Rewire `runCallback()`'s role setup from `setGetUserRole` to `setGetRoleForTenant` (T1/T2 still valid — the admin-bypass *behaviour* isn't removed, only the legacy *way of becoming admin*). Remove T4 (asserts the now-deleted `ADMIN_GITHUB_LOGINS` seeding). |
| `tests/check-tir-s1-person-team-schema.js` | T2: flip the `setGetUserRole(` presence assertion to an absence assertion (was "(Out of Scope: do not remove)" — tab-s3 is exactly the story that removes it). T5: remove the `legacyCalled`/`setGetUserRole` sentinel-proof mechanism (no legacy path left to prove isn't called); keep the rest of the cross-provider role-resolution verification; update the test's own name. |
| `tests/check-bri-s3.4-cross-tenant-isolation.js` | Remove the "AC1 — user_roles" block (its own `getUserRole`/`setGetUserRole` require + test) — a legacy-adapter-specific isolation smoke check with nothing left to test. |
| `tests/check-bri-s3.6-auth-journey.js` | Replace all 9 occurrences of `userRoles.setGetUserRole(async function() { return 'user'; });` with the equivalent `userRoles.setGetRoleForTenant(...)` call — pure test-setup boilerplate, not the subject under test. |
| `tests/check-ebv-s1-boot-time-env-var-warnings.js` | Remove the U3/U4/U5 block (tests the now-removed `ADMIN_GITHUB_LOGINS` warning) and the stale `ADMIN_GITHUB_LOGINS` property from `FULLY_CONFIGURED`. |
| `tests/check-tab-s3-legacy-removal.js` | **New.** AC5's own grep-for-absence test (the "permitted exception" file the AC itself names) plus `resolveRoleForTenant`'s unchanged-default-fallback regression check (AC2). |

**Explicitly out of scope, not touched:** the 4 `tests/e2e/*.js` files referencing `ADMIN_GITHUB_LOGINS` in comments/documentation — outside AC5's grep scope (`src/web-ui/` only, not `tests/`) and outside AC4's "full test suite" scope (`scripts/run-all-tests.js` does not run Playwright specs; those run via a separate invocation). Logged in decisions.md as a deliberate scope boundary, not an oversight.

---

## Design notes

- **`resolveRoleForTenant`'s post-removal behaviour (AC2):** `membership found → return its role; else → return 'user'`. No legacy-table read, no `_backfillOne` call, matching the test plan's own explicit expectation ("its remaining behaviour for an unmigrated/unknown tenant is the pre-existing default ('user'), not a thrown error").
- **`getRoleForTenant`'s post-removal shape:** `if (_getRoleForTenant) { return _getRoleForTenant(...); } throw new Error(...)` — the `if (_getUserRole)` fallback branch is deleted along with `_getUserRole` itself (they're the same removal; leaving the branch would reference a deleted variable).
- **`CREATE TABLE IF NOT EXISTS user_roles` stays in `server.js`** — confirmed required by `check-tir-s1-person-team-schema.js`'s own pre-existing T2 assertion, and consistent with the story's own Out-of-Scope note (leave the table itself in place). Only the *wiring* (`setGetUserRole` call) and the *seeding* (`arl-s4`'s `ADMIN_GITHUB_LOGINS` block) are removed — the idempotent `CREATE TABLE IF NOT EXISTS` is neither a read, a write of row data, nor a seed.
- **AC5's grep scope is `src/web-ui/` only** — confirmed by the AC's own literal wording. `tests/` (including `tests/e2e/`) is out of that scope; AC4 separately governs test-file cleanup, scoped to the suite `scripts/run-all-tests.js` actually runs.

---

## Task 1 — `user-roles.js`: remove legacy adapter + cascading references (AC1, AC2)

Remove `_getUserRole`, `setGetUserRole`, `getUserRole`, the `getRoleForTenant` fallback branch, `_backfillOne`, `migrateTeamSchema`'s legacy-backfill loop (with its log message adjusted), and `resolveRoleForTenant`'s legacy-table fallback. Update `module.exports`.

Verify: `node tests/check-tir-s1-person-team-schema.js` (after Task 3's own update) and the new `check-tab-s3-legacy-removal.js` (Task 6) both pass; `require('./user-roles')` loads without error.

**Commit:** `feat(tab-s3): remove legacy getUserRole/setGetUserRole/_backfillOne from user-roles.js (AC1, AC2)`

---

## Task 2 — `server.js`: remove legacy wiring + `arl-s4` seeding block (AC1)

Remove `setGetUserRole` from the require destructure and its wiring call; remove the `ADMIN_GITHUB_LOGINS` parsing + admin-seeding block. Keep `CREATE TABLE IF NOT EXISTS user_roles`.

Verify: `node -e "require('./src/web-ui/server.js')"`-style syntax check is implicit in the full test run; `check-tir-s1-person-team-schema.js` T2's flipped assertion passes.

**Commit:** `feat(tab-s3): remove legacy setGetUserRole wiring and arl-s4 admin-seeding block from server.js (AC1)`

---

## Task 3 — Update tests referencing the legacy adapter's *presence* (AC1, AC4)

`check-tir-s1-person-team-schema.js` T2 (flip assertion) and T5 (drop the `legacyCalled` sentinel mechanism, keep the role-resolution verification). `check-bri-s3.4-cross-tenant-isolation.js` (remove the AC1 user_roles block). `check-arl-s4-admin-billing-bypass.js` (rewire `runCallback` to `setGetRoleForTenant`; remove T4). `check-bri-s3.6-auth-journey.js` (9x mechanical replacement).

Verify: each file individually, then together.

**Commit:** `test(tab-s3): update tests referencing the removed legacy adapter (AC4)`

---

## Task 4 — Delete `check-arl-s1-user-roles.js`; clean up `check-ebv-s1` (AC1, AC4)

Delete the whole `check-arl-s1-user-roles.js` file. Remove U3/U4/U5 and the stale `FULLY_CONFIGURED.ADMIN_GITHUB_LOGINS` property from `check-ebv-s1-boot-time-env-var-warnings.js`.

Verify: `node scripts/run-all-tests.js` file count drops by exactly 1 (the deleted file); `check-ebv-s1...` still passes its remaining U-tests.

**Commit:** `test(tab-s3): remove check-arl-s1-user-roles.js (retired feature); drop ADMIN_GITHUB_LOGINS coverage from check-ebv-s1 (AC4)`

---

## Task 5 — `validate-env.js` + `auth.js` comment (AC5)

Remove the `ADMIN_GITHUB_LOGINS` warning block from `validate-env.js`. Reword `auth.js`'s historical comment to avoid the literal banned string while preserving its explanation.

**Commit:** `fix(tab-s3): remove ADMIN_GITHUB_LOGINS reference from validate-env.js and auth.js comment (AC5)`

---

## Task 6 — New test: AC5 grep-for-absence + AC2 default-fallback regression

New file `tests/check-tab-s3-legacy-removal.js`:
1. Grep `src/web-ui/` (recursively, all `.js` files) for `ADMIN_GITHUB_LOGINS`, `getUserRole`, `setGetUserRole`, `_backfillOne` — assert zero matches (AC5).
2. `resolveRoleForTenant(pool, tenantId)` for a completely unmigrated tenant returns `'user'` without throwing, and makes no `user_roles` query (AC2 regression, confirms the removal didn't just move the bug).

**Commit:** `test(tab-s3): add AC5 grep-for-absence test and AC2 default-fallback regression (AC5, AC2)`

---

## Task 7 — Full suite + AC4 verification

`node scripts/run-all-tests.js` — full regression. Confirm only the established baseline failures remain (`check-p3.5-validate-trace.js`, possibly `check-pcr-s1-test-runner.js`), zero new failures.

**Commit:** (bundled with Task 6, or a final no-op verification commit if issues are found and fixed)

---

## Self-review checklist

- [x] Exact file paths, no placeholders
- [x] Real touchpoints identified by reading actual code first (not guessed from the DoR's own narrower file list) — `validate-env.js` and `auth.js`'s comment were not named in the DoR but are required by AC5's own literal grep scope
- [x] Every legacy-referencing test file in `scripts/run-all-tests.js`'s own suite accounted for (removed or updated), matching AC4
- [x] `tests/e2e/*` explicitly and deliberately out of scope, logged, not silently skipped
- [x] No scope beyond the 5 ACs
