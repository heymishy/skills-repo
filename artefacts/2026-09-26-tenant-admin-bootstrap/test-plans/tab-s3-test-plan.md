## Test Plan: Retire the legacy admin-bootstrap path

**Story reference:** artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s3.md
**Epic reference:** artefacts/2026-09-26-tenant-admin-bootstrap/epics/real-admin-bootstrap.md
**Test plan author:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-28

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `server.js` wiring removed AND `getUserRole`/`setGetUserRole` functions removed from `user-roles.js` | 2 tests | — | — | — | — | 🟢 |
| AC2 | `_backfillOne` and its call site removed from `resolveRoleForTenant` | 1 test | — | — | — | — | 🟢 |
| AC3 | `ADMIN_GITHUB_LOGINS` Fly secret removed from both real deployments | — | — | — | 1 scenario | External-dependency | 🟡 |
| AC4 | Full suite passes, zero regressions, removed-functionality tests themselves removed/updated | — | 1 test | — | — | — | 🟢 |
| AC5 | Fresh grep across `src/web-ui/` for all 4 legacy identifiers returns zero production-code matches | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

AC3 (removing a real Fly secret from two live deployments) cannot be automated-tested — it's an operator action against real infrastructure, not application code. Handled as a manual, DoD-tracked action (see Test Gaps and Risks below), not silently skipped.

---

## Test Data Strategy

**Source:** Synthetic — mostly source-code assertions (reading `server.js`/`user-roles.js` as text and grepping, matching this repo's own established "wiring test" convention, e.g. `rtri-s1`'s `testServerWiring`), plus a full-suite regression run. AC3 is a manual operator-action item, not test data at all.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained (AC3's Fly secret removal: operator, Hamish King).

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Real file contents of `server.js` and `user-roles.js`, post-implementation | Source code (read as text) | None | Asserts specific strings are absent |
| AC2 | Real file contents of `user-roles.js`, post-implementation | Source code | None | Asserts `_backfillOne` and its call site are gone |
| AC4 | The real, full test suite | This repo's own test suite | None | Confirms zero regressions |
| AC5 | Real file contents of every file under `src/web-ui/`, post-implementation | Source code | None | A fresh grep, not a fixture |

### PCI / sensitivity constraints

None.

### Gaps

AC3's real Fly secret removal — see Test Gaps and Risks below.

---

## Unit Tests

### server.js no longer wires the legacy user_roles adapter or arl-s4's seeding block

- **Verifies:** AC1
- **Precondition:** Post-implementation `server.js`
- **Action:** Read `server.js` as text; assert absence of `setGetUserRole(`, the `arl-s4` seeding block's own literal SQL (`INSERT INTO user_roles`), and any reference to `ADMIN_GITHUB_LOGINS`
- **Expected result:** All 3 patterns absent from `server.js`
- **Edge case:** No

### getUserRole and setGetUserRole are removed entirely from user-roles.js

- **Verifies:** AC1
- **Precondition:** Post-implementation `user-roles.js`
- **Action:** Read `user-roles.js` as text; assert absence of `function getUserRole`, `function setGetUserRole`, and their exports from `module.exports`
- **Expected result:** All patterns absent
- **Edge case:** No

### _backfillOne and its call site are removed from resolveRoleForTenant

- **Verifies:** AC2
- **Precondition:** Post-implementation `user-roles.js`
- **Action:** Read `user-roles.js` as text; assert absence of `function _backfillOne` and of any call to `_backfillOne(` inside `resolveRoleForTenant`'s own function body; separately confirm `resolveRoleForTenant` itself still exists (not accidentally removed) and its remaining behaviour for an unmigrated/unknown tenant is the pre-existing default (`'user'`), not a thrown error
- **Expected result:** `_backfillOne` and its call site both gone; `resolveRoleForTenant`'s own remaining default-fallback behaviour is unchanged
- **Edge case:** Yes — confirms the removal doesn't silently break the function's own legitimate remaining behaviour

### A fresh grep for all 4 legacy identifiers returns zero production-code matches

- **Verifies:** AC5
- **Precondition:** Post-implementation `src/web-ui/` tree
- **Action:** Grep the entire `src/web-ui/` tree for `ADMIN_GITHUB_LOGINS`, `getUserRole`, `setGetUserRole`, and `_backfillOne`
- **Expected result:** Zero matches in any production (non-test) file. A test file specifically asserting the absence (i.e. this very test) is the one permitted exception the AC itself names.
- **Edge case:** No

---

## Integration Tests

### Full regression — every test that legitimately tested removed functionality is itself removed or updated, everything else still passes

- **Verifies:** AC4
- **Components involved:** The full test suite
- **Precondition:** All of AC1/AC2/AC5's removals applied
- **Action:** Run `node scripts/run-all-tests.js`; separately, grep `tests/*.js` for any file that references `getUserRole`, `setGetUserRole`, `_backfillOne`, or `ADMIN_GITHUB_LOGINS` before this story, to confirm each such file was either removed or updated to no longer assert on the removed functionality
- **Expected result:** Full suite passes with only the established pre-existing/environmental baseline failures (`tests/check-p3.5-validate-trace.js`, and possibly the known `tests/check-pcr-s1-test-runner.js` timing flake) — zero regressions attributable to this story; every legacy-referencing test file accounted for (removed or updated, not silently left referencing dead code)

---

## NFR Tests

None — confirmed with story owner. The story's own NFR section states Performance/Accessibility/Audit as Not Applicable (pure removal, no new path) and Security as a qualitative hygiene improvement already covered structurally by AC1/AC2/AC5's own removal assertions, not a separate measurable NFR.

---

## Out of Scope for This Test Plan

- Any test of `tab-s1`'s new bootstrap mechanism or `tab-s2`'s backfill — separate stories, separate test plans; this plan only asserts the legacy path's absence.
- Dropping the actual `user_roles` table — explicitly out of scope for the story itself.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC3 (removing the `ADMIN_GITHUB_LOGINS` Fly secret from `wuce-staging` and production) cannot be automated-tested | It is a real operator action against live infrastructure, not application code — no test runner can assert a Fly secret's absence without live credentials/access this test suite doesn't have | Manual verification scenario in the AC verification script; explicitly tracked as a DoD action item, not silently accepted as "tested" |
