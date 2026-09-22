# Test Plan: Add Pod Manager to the sidebar nav (pmnv-s1)

**Story reference:** artefacts/2026-09-23-pod-manager-nav-fix/stories/pmnv-s1-pod-manager-nav-entry.md
**Domain:** web-ui
**Date:** 2026-09-23

---

## User Story

As a **product owner or feature lead**,
I want **Pod Manager reachable from the sidebar**,
So that **I can create and manage pods without already knowing the direct URL**.

---

## Acceptance Criteria

**AC1:** Given any authenticated, non-viewer user, When the sidebar renders, Then a "Pod Manager" nav item is present in the main (non-account) section, alongside "Org board".
**AC2:** Given the "Pod Manager" nav item, When inspected, Then its `href` is `/admin/pods/manager` and it is not marked `adminOnly`.
**AC3:** Given a non-admin authenticated user, When the sidebar renders, Then "Pod Manager" is still present.
**AC4:** Given the existing `check-b2-account-nav.js` dangling-link regression suite, When re-run after this change, Then it still passes.

---

## Test Data Strategy

**Strategy selected:** Synthetic — no real data, no PII, no sensitive data. `renderShell()` is called directly with a minimal `{ title, bodyContent, user: { login }, active, isAdmin }` object, matching `check-b2-account-nav.js`'s own established convention exactly.

---

## AC Coverage & Test Approach

| AC | Test type | Coverage | Gap? |
|----|-----------|----------|------|
| AC1 | Unit | `renderShell({isAdmin: false})` output contains "Pod Manager" and "Org board" in the main nav section | No |
| AC2 | Unit | Direct inspection of `NAV_ITEMS` array: find the `id: 'pod-manager'` entry, assert `href === '/admin/pods/manager'` and `adminOnly` is falsy | No |
| AC3 | Unit | `renderShell({isAdmin: false})` — same assertion as AC1, phrased as an explicit non-admin regression guard (distinguishing this entry from `admin-credits`) | No |
| AC4 | Integration | Re-run `tests/check-b2-account-nav.js` unmodified after the fix — 0 failures | No |

**Gap table:** None — all ACs have corresponding tests.

---

## Unit Tests

### AC1/AC3: Pod Manager Nav Item Renders for Every Authenticated User

**Test name:** `pmnv-s1.unit.pod-manager-nav-item-present`

**What it tests:** AC1 (present in main section, alongside Org board) and AC3 (present for non-admin — the same render call covers both, since the item must be unconditional).

**Setup:** `freshRequire('../src/web-ui/utils/html-shell.js')` (matching `check-b2-account-nav.js`'s own `freshRequire` helper, to avoid stale `require.cache` state across test files).

**Action:** Call `renderShell({ title: 'Dashboard', bodyContent: '<h1>Dashboard</h1>', user: { login: 'alice' }, active: 'dashboard', isAdmin: false })`.

**Expected result:**
- Output contains `Pod Manager`
- Output contains `/admin/pods/manager`
- Output contains `Org board` (regression guard — confirms the existing entry wasn't accidentally removed/reordered)

---

### AC2: Nav Item's Own Shape (href, not adminOnly)

**Test name:** `pmnv-s1.unit.nav-item-shape-correct`

**What it tests:** AC2 — the raw `NAV_ITEMS` array entry itself, not just the rendered HTML (a direct, unambiguous check on the data, independent of `renderShell`'s own rendering logic).

**Setup:** `freshRequire` html-shell.js, read its exported `NAV_ITEMS` array directly.

**Action:** `NAV_ITEMS.find(item => item.id === 'pod-manager')`.

**Expected result:**
- The entry exists (not `undefined`)
- `entry.href === '/admin/pods/manager'`
- `entry.adminOnly` is falsy (`undefined` or `false` — matching the real route's `authGuard`-only, non-admin-gated access level)
- `entry.section` is NOT `'account'` (confirms it's in the main section, alongside `org-kanban`, not the account-settings bottom section)

---

## Integration Tests

### AC4: Existing Dangling-Link Regression Suite Still Passes

**Test name:** `pmnv-s1.integration.b2-account-nav-regression-suite-passes`

**What it tests:** AC4 — the new entry doesn't introduce a dangling link, verified by re-running the EXISTING, unmodified `check-b2-account-nav.js` suite (not a new test — this story adds no new regression-check machinery, since `check-b2-account-nav.js`'s own AC3 test already walks every `NAV_ITEMS` entry).

**Setup:** None beyond the code change itself.

**Action:** `node tests/check-b2-account-nav.js`

**Expected result:** All existing checks in that file continue to pass (0 failures) — in particular its own AC3 check ("zero dangling NAV_ITEMS entries"), which will now also cover the new `pod-manager` entry automatically since it iterates the whole array.

---

## Test Summary

- **Unit tests:** 2 (nav item renders for all users, nav item's own shape is correct)
- **Integration tests:** 1 (existing dangling-link regression suite re-run)
- **Total:** 3
- **All ACs covered:** Yes
- **Test data gaps:** None
- **Gaps in AC coverage:** None

---

# AC Verification Script: Add Pod Manager to the Sidebar Nav (pmnv-s1)

**Setup:** You are logged in as any authenticated, non-admin user.

---

### Scenario AC1/AC2/AC3: Pod Manager Visible in Sidebar for Every User

**Expected outcome:** A "Pod Manager" link appears in the sidebar's main section, next to "Org board", for every authenticated user regardless of admin status.

1. Log in as a non-admin user.
2. Navigate to any page rendered via the shared shell (e.g. the dashboard).
3. **Verify:** The sidebar's main (top) section shows both "Org board" and "Pod Manager" as links.
4. **Verify:** Clicking "Pod Manager" navigates to `/admin/pods/manager` and the real Pod Manager page loads (unchanged from before this story — this story only adds the link, not the page).
5. Log in as an admin user; repeat steps 2-4.
6. **Verify:** "Pod Manager" is present identically for both admin and non-admin users (unlike "Admin credits", which should still only appear for admins).

---

### Scenario AC4: No Regression to Existing Nav Tests

**Expected outcome:** The pre-existing nav test suite passes unmodified.

1. Run `node tests/check-b2-account-nav.js`.
2. **Verify:** All checks pass, 0 failures.
