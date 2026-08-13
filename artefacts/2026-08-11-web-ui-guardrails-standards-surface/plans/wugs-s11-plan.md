# Remove smug-s1's promote/opt-out routes and old Standards tab rendering — Implementation Plan

> **For agent execution:** Use /subagent-execution (subagents available).

**Goal:** Make every test in the test plan pass — delete the entire DB-backed `standards.js` route surface and the old HTML Standards tab, repoint the "Standards" nav link to the new repo-backed view, remove all now-dangling test files, with zero remaining references anywhere in `src/`/`tests/` (AC4).
**Branch:** `feature/wugs-s11`
**Worktree:** `.worktrees/wugs-s11`
**Test command:** `node tests/check-wugs-s11-remove-smug-s1-routes-and-tab.js` (per task) / `npm test` (full suite, final step)

---

## File map

```
Create:
  tests/check-wugs-s11-remove-smug-s1-routes-and-tab.js   — AC1, AC2

Delete:
  src/web-ui/routes/standards.js
  tests/check-smug-s1-standards-tab-and-query-fix.js
  tests/check-rapp-s2-standards-tab-nav-and-breadcrumb.js
  tests/check-psh-s8-standards-management.js
  tests/check-psh-s9-standard-promotion.js

Modify:
  src/web-ui/routes/products.js — remove _standardsRoutes require, handleGetProductStandardsTab,
                                   _renderStandardsTab; repoint the Standards nav link href
  src/web-ui/server.js          — remove 7 route registrations (see Design note below)
  tests/check-bri-s3.4-cross-tenant-isolation.js — surgically remove ONLY the
                                   standardsPost/standardsList/standardsPut test blocks;
                                   this file is NOT wholly dedicated to standards.js
```

**Design note — the real removal scope is larger than the story's AC1/AC3/AC4 text literally enumerates (confirmed by reading the actual merged code, not just the story).** The story's AC1 names 3 routes and AC3/AC4 name function/file lists that use WRONG or INCOMPLETE names (`handlePutStandardPromote`/`handlePostStandardOptout` don't exist under those names — the real functions are `standardsPromote`/`optoutPost`/`optoutDelete`). The story's own Architecture Constraints section is the authoritative scope statement — "standardsPost/standardsList/standardsPut... are deleted" plus the promote/optout handlers — and reading the real, merged `standards.js` confirms its ENTIRE export surface (`standardsPost`, `standardsList`, `standardsPut`, `standardsPromote`, `optoutPost`, `optoutDelete`, `fetchStandardsForProduct`) is being removed, not just the 3 routes AC1 names as examples. Grep-confirmed (`grep -rn` across `src/` and `tests/`) real, complete scope:

- **7 server.js routes** reference `standards.js` or `handleGetProductStandardsTab`, not 3: `GET /products/:id/standards-tab` (smug-s1), `POST /products/:id/standards` (psh-s8), `GET /products/:id/standards` (psh-s8), `PUT /standards/:id` (psh-s8), `PUT /standards/:id/promote` (psh-s9), `POST /standards/:id/optout` (psh-s9), `DELETE /standards/:id/optout` (psh-s9).
- **`fetchStandardsForProduct`** is used ONLY by `handleGetProductStandardsTab` (grep-confirmed, zero other call sites) — once that handler is removed, `standards.js` has no remaining live consumer anywhere, so **the whole file is deleted**, matching the story's own Out of Scope note ("if the file becomes fully empty after removal, delete the file").
- **`products.js:22`**'s `var _standardsRoutes = require('./standards');` becomes a dead import once `handleGetProductStandardsTab` (its only user) is removed — must be deleted too, or AC4's dangling-reference grep would still find a reference to the deleted file's path.
- **5 test files reference this code, not 2:** `check-smug-s1-standards-tab-and-query-fix.js` and `check-rapp-s2-standards-tab-nav-and-breadcrumb.js` (named in AC3) — PLUS `check-psh-s8-standards-management.js` (tests `standardsPost`/`standardsList`/`standardsPut` exclusively) and `check-psh-s9-standard-promotion.js` (tests `standardsPromote`/`optoutPost`/`optoutDelete` exclusively), neither named in the story text but both wholly dedicated to now-removed code — confirmed via `grep -n "require('../src" <file>`, each has exactly one require line pulling only from `routes/standards`. Both must be deleted or AC4 fails.
- **`check-bri-s3.4-cross-tenant-isolation.js` is DIFFERENT from the other 4 — it is a broad, mixed cross-tenant-isolation regression suite** (also tests `handleGetProductView`, `handleGetProductKanban`, credits, user-roles — confirmed via its own require lines) that HAPPENS to include 3 test blocks calling `standardsPost`/`standardsList`/`standardsPut`. **Do NOT delete this file** — deleting it would silently drop real, unrelated cross-tenant-isolation coverage that has nothing to do with this story. Only the specific `standardsPost`/`standardsList`/`standardsPut` test blocks within it are removed; everything else in the file stays exactly as-is.
- **`scripts/update-psh-implementation-plan-state.js`** references these function names only as descriptive strings inside historical, already-run, one-off pipeline-state task-seeding metadata (`{ id: 'task-2', name: 'create src/web-ui/routes/standards.js — standardsPost, standardsList, standardsPut (GREEN)', ... }`) — not a live code import. Confirmed via direct read: no `require('../routes/standards')` in this file. Left untouched — it is historical documentation-as-code, not a dangling reference in the sense AC4 means (an actual broken `require`/call), and re-running it would not fail.
- **`src/web-ui/adapters/fake-test-db.js`** has comments and an SQL-pattern-matching branch that simulates the `standards`/`standard_product_optouts` tables for E2E fixtures. This is DB-table-level fixture code, not a route/handler import — the story's own Dependencies section states DB table removal is `wugs-s12`'s job, downstream of this story. Left untouched in this story; once no route calls into it (after this story merges) it becomes dead but harmless, and `wugs-s12` is the natural place to clean it up alongside the real table drop.

**Design note on the nav repoint (AC2):** the "Standards" link lives in `products.js`'s per-product action bar (NOT a sidebar), a single `<a href="/products/ID/standards-tab">Standards</a>` at line ~901, alongside Kanban/Roadmap links in the same style. Repointing means changing its `href` to `/products/' + _escapeHtml(productId) + '/guardrails` (wugs-s2/wugs-s3's real, merged route) — there is exactly one "Standards"-labelled link in the whole file (grep-confirmed), so AC2's "not duplicated" concern is automatically satisfied by editing in place rather than adding a second link.

---

## Task 1: Remove the JSON standards API (`standards.js`, its 6 routes, its 3 wholly-dedicated test files, surgical edit of the mixed test file) — AC4 groundwork

**Files:**
- Delete: `src/web-ui/routes/standards.js`, `tests/check-psh-s8-standards-management.js`, `tests/check-psh-s9-standard-promotion.js`
- Modify: `src/web-ui/server.js`, `tests/check-bri-s3.4-cross-tenant-isolation.js`

- [ ] **Step 1: Confirm current state (no test to write yet — this task is pure removal, verified by the existing suite continuing to pass minus the deleted files' own tests)**

Before touching anything, run and record:
```bash
node tests/check-bri-s3.4-cross-tenant-isolation.js
```
Note the current pass count — you will re-run this after editing to confirm the remaining (non-standards) tests in this file still pass.

- [ ] **Step 2: Delete the 3 wholly-dedicated files**

```bash
rm src/web-ui/routes/standards.js
rm tests/check-psh-s8-standards-management.js
rm tests/check-psh-s9-standard-promotion.js
```

- [ ] **Step 3: Remove the 6 JSON-API route registrations from `server.js`**

Delete these 6 `else if` blocks entirely (search for the exact comment markers `// psh-s8` and `// psh-s9` near `/products/:id/standards` and `/standards/:id` route patterns):
- `pathname.match(/^\/products\/[^/]+\/standards$/) && req.method === 'POST'` (psh-s8 — standardsPost)
- `pathname.match(/^\/products\/[^/]+\/standards$/) && req.method === 'GET'` (psh-s8 — standardsList)
- `pathname.match(/^\/standards\/[^/]+$/) && req.method === 'PUT'` (psh-s8 — standardsPut)
- `pathname.match(/^\/standards\/[^/]+\/promote$/) && req.method === 'PUT'` (psh-s9 — standardsPromote)
- `pathname.match(/^\/standards\/[^/]+\/optout$/) && req.method === 'POST'` (psh-s9 — optoutPost)
- `pathname.match(/^\/standards\/[^/]+\/optout$/) && req.method === 'DELETE'` (psh-s9 — optoutDelete)

Do NOT remove the `GET /products/:id/standards-tab` route yet — that is Task 2's job (it calls `handleGetProductStandardsTab`, not `standards.js` directly, and Task 2 handles that removal alongside the nav repoint as one coherent unit).

- [ ] **Step 4: Surgically edit `check-bri-s3.4-cross-tenant-isolation.js`**

Read the file first. Remove ONLY the `describe`/test block(s) that call `standardsPost`/`standardsList`/`standardsPut` (search for the require line `const { standardsPost, standardsList, standardsPut } = require('../src/web-ui/routes/standards');` and remove that require line plus every test block below it that calls those three functions). Do NOT touch the file's other test blocks (`handleGetProductView`, `handleGetProductKanban`, credits, user-roles) — those must remain byte-for-byte unchanged.

- [ ] **Step 5: Run — confirm no crash, remaining tests still pass**

```bash
node tests/check-bri-s3.4-cross-tenant-isolation.js
```
Expected: fewer total checks than Step 1's baseline (the standards-specific ones are gone), but every remaining check still passes — zero failures, zero crashes from a dangling require.

```bash
node src/web-ui/server.js --check-syntax 2>&1 || node -e "require('./src/web-ui/server.js')" 2>&1 | head -5
```
(Use whichever syntax-check approach this codebase's other stories have used — e.g. `node -c src/web-ui/server.js` to confirm no syntax error from the removed blocks before running the full suite.)

- [ ] **Step 6: Grep-verify (partial AC4 check for this task's scope)**

```bash
grep -rn "standardsPost\|standardsList\|standardsPut\|standardsPromote\|optoutPost\|optoutDelete" src/ tests/
```
Expected: zero matches. (`fetchStandardsForProduct` and `handleGetProductStandardsTab` will still match at this point — Task 2 removes those. `_renderStandardsTab` also still present until Task 2.)

- [ ] **Step 7: Commit**

```bash
git add -A -- src/web-ui/routes/standards.js src/web-ui/server.js tests/check-psh-s8-standards-management.js tests/check-psh-s9-standard-promotion.js tests/check-bri-s3.4-cross-tenant-isolation.js
git commit -m "chore(wugs-s11): remove standards.js JSON API, its 6 routes, and its 3 dedicated/surgical test references"
```

(Use `git add -A --` with explicit deleted/modified paths, not `git add -A .`, to avoid sweeping in unrelated pre-existing uncommitted files in this worktree.)

---

## Task 2: Remove the HTML Standards tab, repoint the nav link (AC2), lock in AC1's 404s

**Files:**
- Create: `tests/check-wugs-s11-remove-smug-s1-routes-and-tab.js`
- Delete: `tests/check-smug-s1-standards-tab-and-query-fix.js`, `tests/check-rapp-s2-standards-tab-nav-and-breadcrumb.js`
- Modify: `src/web-ui/routes/products.js`, `src/web-ui/server.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-wugs-s11-remove-smug-s1-routes-and-tab.js`:

```javascript
'use strict';
// check-wugs-s11-remove-smug-s1-routes-and-tab.js — wugs-s11
//
// Confirms the old smug-s1 Standards tab and its DB-backed JSON API are
// fully removed (AC1: old routes 404), and the "Standards" nav link now
// points at the new repo-backed view (AC2), not duplicated.

var assert = require('assert');
var fs = require('fs');

var passed = 0;
var failed = 0;

function check(name, fn) {
  try { fn(); console.log('PASS:', name); passed++; }
  catch (e) { console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1; }
}

var serverSrc = fs.readFileSync(require.resolve('../src/web-ui/server.js'), 'utf8');
var productsSrc = fs.readFileSync(require.resolve('../src/web-ui/routes/products.js'), 'utf8');

// ── AC1: old routes no longer registered (equivalent to a 404 at the
// dispatch layer -- this codebase's manual if/else-if router returns 404
// for any unmatched pathname by design, so "the route is not registered"
// IS "returns 404"; confirmed by reading the router's final else branch). ──
check('AC1: standardsTabRoute_removedFromServerJs', function () {
  assert.ok(
    !/\/products\/\[\^\/\]\+\/standards-tab/.test(serverSrc) && serverSrc.indexOf('standards-tab') === -1,
    'expected no remaining reference to the /standards-tab route in server.js'
  );
});
check('AC1: standardsPromoteRoute_removedFromServerJs', function () {
  assert.ok(
    serverSrc.indexOf('/standards/[^/]+/promote') === -1 && serverSrc.indexOf("standardsPromote") === -1,
    'expected no remaining reference to the PUT /standards/:id/promote route in server.js'
  );
});
check('AC1: standardsOptoutRoutes_removedFromServerJs', function () {
  assert.ok(
    serverSrc.indexOf('optoutPost') === -1 && serverSrc.indexOf('optoutDelete') === -1,
    'expected no remaining reference to the /standards/:id/optout routes in server.js'
  );
});

// ── AC2: nav link repointed, not duplicated ──────────────────────────────
check('AC2: standardsNavLink_repointedToGuardrailsView_exactlyOnce', function () {
  var matches = productsSrc.match(/>Standards<\/a>/g) || [];
  assert.strictEqual(matches.length, 1, 'expected exactly one "Standards"-labelled nav link, found ' + matches.length);
  assert.ok(productsSrc.indexOf("/guardrails' style") !== -1 || /\/products\/'[^']*productId[^']*'\/guardrails/.test(productsSrc),
    'expected the Standards link\'s href to point at the /guardrails route');
  assert.ok(productsSrc.indexOf('standards-tab') === -1, 'expected no remaining reference to the old /standards-tab href');
});

// ── Removed-function sanity: handleGetProductStandardsTab/_renderStandardsTab gone ──
check('AC1/AC4: oldHandlers_removedFromProductsJs', function () {
  assert.ok(productsSrc.indexOf('handleGetProductStandardsTab') === -1, 'expected handleGetProductStandardsTab to be fully removed');
  assert.ok(productsSrc.indexOf('_renderStandardsTab') === -1, 'expected _renderStandardsTab to be fully removed');
  assert.ok(productsSrc.indexOf("require('./standards')") === -1, 'expected the dead _standardsRoutes require to be removed');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s11-remove-smug-s1-routes-and-tab.js
```

Expected: all 5 checks fail (nothing removed yet).

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/products.js`:
1. Delete line 22: `var _standardsRoutes = require('./standards'); // smug-s1 -- fetchStandardsForProduct, shared with the JSON standards API`
2. Delete `_renderStandardsTab` (the whole function, ~lines 1084-1158).
3. Delete `handleGetProductStandardsTab` (the whole function, ~lines 2025-2064, including its leading JSDoc comment).
4. Remove `handleGetProductStandardsTab` from `module.exports`.
5. Change the nav link at ~line 901 from:
   ```javascript
   '<a href="/products/' + _escapeHtml(productId) + '/standards-tab" style="padding:8px 14px;border:1px solid var(--line);border-radius:6px;text-decoration:none;font-size:13px;color:var(--ink)">Standards</a>' +
   ```
   to:
   ```javascript
   '<a href="/products/' + _escapeHtml(productId) + '/guardrails" style="padding:8px 14px;border:1px solid var(--line);border-radius:6px;text-decoration:none;font-size:13px;color:var(--ink)">Standards</a>' +
   ```

In `src/web-ui/server.js`: delete the `GET /products/:id/standards-tab` route registration block (the `else if` matching `/^\/products\/[^/]+\/standards-tab$/`, calling `handleGetProductStandardsTab`).

```bash
rm tests/check-smug-s1-standards-tab-and-query-fix.js
rm tests/check-rapp-s2-standards-tab-nav-and-breadcrumb.js
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s11-remove-smug-s1-routes-and-tab.js
```

Expected: `5 passed, 0 failed`

- [ ] **Step 5: Run sibling regressions**

```bash
node tests/check-bri-s3.4-cross-tenant-isolation.js
node tests/check-wugs-s2-product-level-guardrails-view.js
node tests/check-wugs-s3-org-level-guardrails-view.js
```

- [ ] **Step 6: Commit**

```bash
git add -A -- src/web-ui/routes/products.js src/web-ui/server.js tests/check-wugs-s11-remove-smug-s1-routes-and-tab.js tests/check-smug-s1-standards-tab-and-query-fix.js tests/check-rapp-s2-standards-tab-nav-and-breadcrumb.js
git commit -m "feat(wugs-s11): remove old Standards tab, repoint nav to repo-backed view (AC1/AC2)"
```

---

## Task 3: AC4 full-repo grep verification + final regression

**Files:** None (verification-only task; may touch `fake-test-db.js` comments ONLY if the grep below flags them — see design note on why they are expected to remain, as comments not live references)

- [ ] **Step 1: Run the AC4 grep exactly as the test plan specifies**

```bash
grep -rn "standardsPost\|standardsList\|standardsPut\|handlePutStandardPromote\|handlePostStandardOptout" src/ tests/
```

Expected: zero matches (the story's own AC4 wording uses the wrong function names for promote/optout — `handlePutStandardPromote`/`handlePostStandardOptout` never existed under those names in the real code, so this exact grep was always going to return zero for those two terms; that is expected and not evidence of incomplete removal — see this plan's own Design note for the real, complete removal list already verified in Tasks 1-2).

- [ ] **Step 2: Run the REAL complete grep (the one that actually matters, given the story's own AC4 wording used incorrect function names)**

```bash
grep -rn "standardsPost\|standardsList\|standardsPut\|standardsPromote\|optoutPost\|optoutDelete\|fetchStandardsForProduct\|handleGetProductStandardsTab\|_renderStandardsTab" src/ tests/
```

Expected: zero matches in `src/` and `tests/`. (A match inside `scripts/update-psh-implementation-plan-state.js` for the string `standardsPost, standardsList, standardsPut` — inside a historical task-name string, not a `require`/call — is expected and NOT a failure; this plan's Design note explains why. If this grep also flags `scripts/`, treat only `src/` and `tests/` hits as blocking, per the test plan's own literal scope.)

- [ ] **Step 3: Add a lock-in test for this real, complete grep so a future regression can't silently reintroduce a reference**

Add to `tests/check-wugs-s11-remove-smug-s1-routes-and-tab.js`, before the final `console.log`:

```javascript
// ── AC4: repo-wide grep, the REAL complete removal list (not the story's
// own AC4 text, which used incorrect function names for the promote/optout
// handlers) ──
check('AC4: noReferencesToRemovedStandardsExports_inSrcOrTests', function () {
  var { execSync } = require('child_process');
  var pattern = 'standardsPost|standardsList|standardsPut|standardsPromote|optoutPost|optoutDelete|fetchStandardsForProduct|handleGetProductStandardsTab|_renderStandardsTab';
  var out;
  try {
    out = execSync('grep -rln -E "' + pattern + '" src/ tests/', { cwd: require('path').join(__dirname, '..'), encoding: 'utf8' });
  } catch (e) {
    // grep exits 1 when no matches are found -- that is the SUCCESS case here.
    out = '';
  }
  assert.strictEqual(out.trim(), '', 'expected zero files referencing removed standards.js exports, found:\n' + out);
});
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s11-remove-smug-s1-routes-and-tab.js
```

Expected: `6 passed, 0 failed`

- [ ] **Step 5: Full regression + story-level check**

```bash
node tests/check-wugs-s11-remove-smug-s1-routes-and-tab.js
node tests/check-bri-s3.4-cross-tenant-isolation.js
node tests/check-wugs-s10-audit-log-promotion-events.js
node tests/check-wugs-s9-approve-reject-promotion.js
node tests/check-wugs-s8-request-promotion.js
node tests/check-wugs-s2-product-level-guardrails-view.js
```

```bash
npm test
```

Expected: the documented pre-existing baseline count, MINUS the 5 deleted files' own historical failure/pass status (none of them were in the 33-failure baseline list, so the total file count drops by 5 with the same 33 unrelated pre-existing failures still present — confirm this explicitly, don't just check the count).

- [ ] **Step 6: Commit**

```bash
git add -A -- tests/check-wugs-s11-remove-smug-s1-routes-and-tab.js
git commit -m "test(wugs-s11): lock in the real, complete AC4 grep (story's own AC4 text named incorrect function names)"
```

---

## Final story-level check (before /verify-completion)

After all 3 tasks: `node tests/check-wugs-s11-remove-smug-s1-routes-and-tab.js` → `6 passed, 0 failed`, `check-bri-s3.4-cross-tenant-isolation.js` still green (minus its 3 removed standards-specific checks), all sibling regression files unchanged, `npm test` at baseline minus 5 files. This story is Epic 4's first of two (wugs-s12 removes the underlying DB tables next) — after both ship, the old smug-s1/psh-s8/psh-s9 DB-backed standards system is fully superseded by Epics 1-3's repo-backed guardrails/standards views.
