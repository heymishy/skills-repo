# Remove the standards/standard_product_optouts DB tables and their references — Implementation Plan

> **For agent execution:** Use /subagent-execution (subagents available).

**Goal:** Make every test in the test plan pass — drop the `standards`/`standard_product_optouts` tables from the schema (with an explicit `DROP TABLE IF EXISTS` migration), and remove every real code path that still queries them, so this feature's own `decisions.md` ARCH entry #4 ("avoid carrying a dead data concept in the codebase") is actually complete.
**Branch:** `feature/wugs-s12`
**Worktree:** `.worktrees/wugs-s12`
**Test command:** per-task files listed below / `npm test` (full suite, final step)

---

## File map

```
Modify:
  src/web-ui/server.js                    — remove 2 CREATE TABLE blocks, add 2 DROP TABLE IF EXISTS,
                                              remove the setStandardsAdapter real-Postgres wiring block
  src/web-ui/routes/products.js           — remove 2 DELETE lines from handleDeleteProduct
  scripts/cleanup-e2e-staging-data.js     — remove 2 DELETE lines from deleteProduct
  src/web-ui/adapters/fake-test-db.js     — remove the dead standards fixture array, counter,
                                              2 SQL-matching branches, reset line
  tests/check-prc-s4.2-delete-product.js  — invert T1's standards/optouts assertions (AC2)
  tests/check-b3-cleanup-script.js        — surgically remove standards/optouts expectations,
                                              keep all other coverage (users/journeys/stripe/credits/etc.)
  tests/check-psh-s1-schema.js            — surgically remove T3/T6 (standards-specific),
                                              adjust T5, keep T1/T2/T4/T7/T8 (products/journeys/pipeline-state)

Create:
  tests/check-wugs-s12-remove-db-tables.js — AC1, AC3, AC4 lock-in
```

**Design note — the real removal scope is materially larger than the story's own AC text names, discovered via the exhaustive whole-repo grep sweep wugs-s11's own DoD explicitly recommended for removal stories.** The story's AC2/Architecture Constraints name exactly one cross-reference: `handleDeleteProduct`. A precise grep for the real SQL verbs (`FROM standards`, `INTO standards`, `CREATE TABLE.*standards`, `FROM standard_product_optouts`) across `src/` and `scripts/` found **three** real code paths that issue live queries against these tables, not one:

1. **`handleDeleteProduct`** (`products.js:2345-2346`) — the one the story names. Removing its two `DELETE FROM` lines is AC2's explicit requirement.
2. **`scripts/cleanup-e2e-staging-data.js`'s `deleteProduct`** (lines 183-184) — a near-identical, independently-written mirror of the exact same two `DELETE FROM` lines, in a *different* story's script (`b3-staging-test-data-cleanup`, epic `2026-07-23-e2e-core-journey-coverage`), used by a scheduled/CI-adjacent E2E-staging-data cleanup job. Not named anywhere in this story's text, but functionally identical risk to `handleDeleteProduct`: left in place after the tables are dropped, every future run of this cleanup script would throw on every real product it deletes, not just standards-related ones.
3. **`server.js`'s `setStandardsAdapter` real-Postgres wiring** (`server.js:1117-1132`, `psh-s10`) — a D37 injectable adapter's real implementation, issuing a live `SELECT ... FROM standards ... standard_product_optouts ...` query. Confirmed via a repo-wide search for its only real call site (`buildSystemPromptWithProductContext` in `skills.js:5386-5415`, itself only ever invoked from its own unit tests — zero production callers found anywhere in `src/`) that this wiring is **currently unreachable in production**, and its dedicated tests (`check-psh-s5-context-injection.js`, `check-psh-s10-standards-injection.js`) both wire their own mock adapter via `setStandardsAdapter(async function() { return []; })`, never touching real Postgres — so removing this wiring block breaks nothing currently reachable. Left un-wired, the adapter reverts to its D37-mandated throwing stub (`standards-adapter.js:3-5`), the correct outcome if it's ever wired up again in the future with a different real implementation.

This is consistent with AC1's own plain-language wording — "no route, **handler**, or test still queries them" — and AC4's — "the full regression suite... proving the table removal didn't silently break unrelated... functionality." A story that removes the tables while leaving #2 and #3 in place would leave exactly the kind of "dead, disconnected data concept" (this story's own Benefit Linkage language) it exists to eliminate — just relocated from `standards.js`'s routes (removed in `wugs-s11`) to these two remaining call sites.

**Two additional test files require surgical (not wholesale) edits, following the exact `check-bri-s3.4-cross-tenant-isolation.js` pattern established in `wugs-s11`:**
- **`tests/check-b3-cleanup-script.js`** tests `scripts/cleanup-e2e-staging-data.js` broadly (users, products, journeys, Stripe customers, credits, tenant-plan, user-roles) — only its `standards`/`standard_product_optouts` fixture fields and one AC1 assertion need updating to match the script's new (shorter) `deleteProduct` behaviour; every other test in the file stays untouched.
- **`tests/check-psh-s1-schema.js`** tests the schema migration broadly (T1/T2/T7: `products` table, T4: `journeys.product_id`, T8: pipeline-state) — only T3 (`standards` table schema) and T6 (`standards.visibility` default) are wholly about the removed tables and must be deleted; T5 (migration-block placement) needs its `standardsMigIdx` assertion removed but its `productsMigIdx` assertion kept, since that check is still meaningful for `products`.

**`src/web-ui/adapters/fake-test-db.js`'s `standards`/`standard_product_optouts` simulation branch (flagged as deferred to this story in `wugs-s11`'s own decisions.md) is now confirmed fully dead**, not just deferred: `wugs-s11` already removed the one E2E spec (`bri-s3.4-cross-tenant-isolation-journey.spec.js`) that ever called `INSERT INTO STANDARDS`/`SELECT ... FROM STANDARDS` through this fake DB. A repo-wide search confirms no other E2E spec references these SQL string patterns. Safe to remove entirely: the `standards`/`nextStandardSeq` fixture state (lines ~33, 37), both SQL-matching branches (lines ~217-259), and the reset line (~484).

**Design note on migration/DROP ordering:** `standard_product_optouts.standard_id` has an `ON DELETE CASCADE` FK reference to `standards.standard_id` — the referencing table must be dropped first (or `CASCADE` used on the referenced table's drop). This plan drops `standard_product_optouts` before `standards`, matching standard FK-safe drop order and avoiding any dependency on Postgres's own `DROP ... CASCADE` behavior (explicit is safer than implicit for a one-way, unrecoverable schema change).

---

## Task 1: AC2 — remove `handleDeleteProduct`'s two DELETE lines, TDD-first per the DoR's own instruction

**Files:**
- Modify: `src/web-ui/routes/products.js`, `tests/check-prc-s4.2-delete-product.js`

- [ ] **Step 1: Invert the existing T1 test's assertions FIRST (per the DoR's explicit TDD-discipline instruction)**

In `tests/check-prc-s4.2-delete-product.js`, T1 currently asserts these DELETEs **do** fire (lines 58-59):
```javascript
assert(pool._queries.some(q => /DELETE FROM standards WHERE product_id/i.test(q.sql)), 'standards cache rows not deleted');
assert(pool._queries.some(q => /DELETE FROM standard_product_optouts WHERE product_id/i.test(q.sql)), 'standard_product_optouts rows not deleted');
```
Replace with the AC2-required inverse:
```javascript
assert(!pool._queries.some(q => /DELETE FROM standards WHERE product_id/i.test(q.sql)), 'standards DELETE still issued after table removal -- handleDeleteProduct must no longer reference it');
assert(!pool._queries.some(q => /DELETE FROM standard_product_optouts WHERE product_id/i.test(q.sql)), 'standard_product_optouts DELETE still issued after table removal -- handleDeleteProduct must no longer reference it');
```
Also update T1's own pass-message string and the `state` object's now-vestigial `standards`/`optouts` fields (used only by the mock pool's row-count branches for these two tables — safe to leave the mock pool's own branches in place harmlessly, or remove them; removing them is cleaner since the removal code will make them unreachable). Update the test name string to reflect the new behaviour ("removes product, journeys rows (standards/optouts no longer referenced); zero GitHub calls made").

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-prc-s4.2-delete-product.js
```

Expected: T1 fails (`standards DELETE still issued...`), since `handleDeleteProduct` still issues both DELETEs.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/products.js`, remove exactly these two lines from `handleDeleteProduct` (currently lines 2345-2346):
```javascript
await _pool.query('DELETE FROM standard_product_optouts WHERE product_id = $1', [productId]);
await _pool.query('DELETE FROM standards WHERE product_id = $1', [productId]);
```
Leave the surrounding `DELETE FROM journeys` and `DELETE FROM products` lines, and the explanatory comment above them, untouched (only prune the two now-obsolete lines from within it, don't rewrite the whole comment unless it specifically references the removed tables — check first).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-prc-s4.2-delete-product.js
```

Expected: `[prc-s4.2] Results: 4 passed, 0 failed`

- [ ] **Step 5: Run sibling regressions**

```bash
node tests/check-wugs-s11-remove-smug-s1-routes-and-tab.js
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-prc-s4.2-delete-product.js
git commit -m "feat(wugs-s12): remove handleDeleteProduct's standards/optouts DELETE lines, TDD-first per DoR (AC2)"
```

---

## Task 2: Remove `scripts/cleanup-e2e-staging-data.js`'s mirrored DELETE lines + its own dedicated test's expectations

**Files:**
- Modify: `scripts/cleanup-e2e-staging-data.js`, `tests/check-b3-cleanup-script.js`

- [ ] **Step 1: Update the `check-b3-cleanup-script.js`'s AC1 test FIRST (same TDD-first discipline as Task 1)**

Read `tests/check-b3-cleanup-script.js` in full first — it is a broad, mixed test file (also covers users, Stripe customers, credits, tenant-plan, user-roles cleanup — none of which are affected by this change). Only touch:
1. `createMockDb`'s `tables` object (lines ~64-75): remove the `standards:` and `standard_product_optouts:` fixture fields.
2. The `query` function's SQL-matching branches (~lines 145-153): remove the two `if (/^DELETE FROM standard_product_optouts.../...)` and `if (/^DELETE FROM standards.../...)` blocks.
3. The AC1 test (`'AC1: deleting an old tagged product also removes its journeys/standards/standard_product_optouts rows (no orphans)'`, ~lines 257-272): remove the `standards`/`standard_product_optouts` seed fields and their corresponding assertions, keep the `journeys` seed/assertion, update the test name to drop "standards/standard_product_optouts" from its description.

Do not touch any other test in this file (users, Stripe, credits, tenant_plan, user_roles cleanup logic).

- [ ] **Step 2: Run test — confirm the file still parses/runs (this edit removes assertions rather than adding a new failing one, so there's no true RED step here — verify by running before AND after Step 3, confirming the count only changes by the exact assertions removed, not more)**

```bash
node tests/check-b3-cleanup-script.js
```

Record the current pass count before Step 3's source change.

- [ ] **Step 3: Write minimal implementation**

In `scripts/cleanup-e2e-staging-data.js`, remove exactly these two lines from `deleteProduct` (currently lines 183-184):
```javascript
await db.query('DELETE FROM standard_product_optouts WHERE product_id = $1', [product.product_id]);
await db.query('DELETE FROM standards WHERE product_id = $1', [product.product_id]);
```
Leave the surrounding `DELETE FROM journeys`/`DELETE FROM products` lines and the explanatory comment block above `deleteProduct` untouched, unless that comment specifically names the removed tables (check first).

- [ ] **Step 4: Run test — must still pass at the same (now-reduced) assertion count**

```bash
node tests/check-b3-cleanup-script.js
```

- [ ] **Step 5: Run sibling regressions**

```bash
node tests/check-prc-s4.2-delete-product.js
```

- [ ] **Step 6: Commit**

```bash
git add scripts/cleanup-e2e-staging-data.js tests/check-b3-cleanup-script.js
git commit -m "feat(wugs-s12): remove standards/optouts DELETE lines from cleanup-e2e-staging-data.js's deleteProduct (real cross-reference found via wugs-s11's own DoD-recommended repo-wide sweep, not named in this story's AC text)"
```

---

## Task 3: Remove the dead `setStandardsAdapter` real-Postgres wiring + `fake-test-db.js`'s dead standards simulation + `check-psh-s1-schema.js`'s surgical edit

**Files:**
- Modify: `src/web-ui/server.js`, `src/web-ui/adapters/fake-test-db.js`, `tests/check-psh-s1-schema.js`

- [ ] **Step 1: No new failing test needed for this task — pure dead-code removal, verified by existing tests continuing to pass unchanged**

Confirm the baseline pass counts first:
```bash
node tests/check-psh-s5-context-injection.js
node tests/check-psh-s10-standards-injection.js
node tests/check-psh-s1-schema.js
```
These must stay green before AND after this task's edits — `check-psh-s5-context-injection.js`/`check-psh-s10-standards-injection.js` use their own mocked `setStandardsAdapter`, never `server.js`'s real wiring, so removing that wiring should not affect them at all. If either regresses, stop and investigate — that would mean a hidden production dependency this plan's Design note missed.

**PLAN AMENDMENT (found during Task 3's own execution, not anticipated by the original Design note):** `check-psh-s10-standards-injection.js` has a T6 test (`'server.js wires setStandardsAdapter before HTTP server starts'`) that is a pure source-text check asserting `server.js` contains the string `setStandardsAdapter` — this is psh-s10's own original D37-compliance test, proving the *production wiring exists*. It is not a hidden production dependency (the "zero production callers" finding about `buildSystemPromptWithProductContext` itself still holds) — it is a separate, narrower assertion that this task's own removal work directly, correctly breaks, since removing the wiring is the whole point of this step. **`tests/check-psh-s10-standards-injection.js` is added to this task's file map.** Remove T6 entirely (not invert it — there is no meaningful positive assertion to replace it with, unlike Task 1's `handleDeleteProduct` case; the adapter's own D37 stub-throws behavior is already covered by T1, unaffected by this change). Every other test in this file (T1-T5, T-NFR1, T-NFR2) uses its own mocked `setStandardsAdapter` and remains valid, unaffected by removing `server.js`'s real wiring — do not touch them.

- [ ] **Step 2: Remove `server.js`'s `setStandardsAdapter` real-Postgres wiring block**

Remove the whole block (currently lines 1117-1132):
```javascript
    // psh-s10 D37 wiring: wire real Postgres active standards adapter
    {
      setStandardsAdapter(async function(productId, orgId) {
        var r = await _creditsPool.query(
          `SELECT name, content FROM standards
           WHERE (product_id = $1 OR (visibility = 'org' AND org_id = $2))
             AND standard_id NOT IN (
               SELECT standard_id FROM standard_product_optouts WHERE product_id = $1
             )
           ORDER BY created_at ASC`,
          [productId, orgId]
        );
        return r.rows;
      });
      console.log('[psh-s10] standards adapter wired');
    }
```
Also remove the now-unused `setStandardsAdapter` import if nothing else in `server.js` uses it (check the destructured import line ~84: `const { setStandardsAdapter } = require('./standards-adapter');`) — confirm via grep before removing, since `getActiveStandards` (a different export of the same module) is not imported here and doesn't need touching.

- [ ] **Step 3: Remove the 2 CREATE TABLE blocks, add 2 DROP TABLE IF EXISTS**

Remove the two `CREATE TABLE IF NOT EXISTS` blocks (currently lines 824-850, `standards` then `standard_product_optouts`, including their `.then()/.catch()` chains and comments). In their place, add explicit drop statements — **`standard_product_optouts` first** (it has the FK to `standards`), matching this file's own existing `.then().catch()` idiom for schema changes:
```javascript
    // wugs-s12: standards/standard_product_optouts tables removed -- their
    // only real consumers (smug-s1's routes) were removed in wugs-s11, and
    // this feature's decisions.md ARCH entry #4 commits to a clean
    // supersession, not carrying a dead data concept. Explicit DROP (not
    // just stopping the CREATE) so existing deployed databases actually
    // lose the tables, per ADR-003 applied in reverse. standard_product_optouts
    // dropped first -- it has an ON DELETE CASCADE FK to standards.standard_id.
    _creditsPool.query(`DROP TABLE IF EXISTS standard_product_optouts`).then(function() {
      console.log('[wugs-s12] standard_product_optouts table dropped');
    }).catch(function(err) {
      console.error('[wugs-s12] standard_product_optouts drop failed:', err.message);
    });

    _creditsPool.query(`DROP TABLE IF EXISTS standards`).then(function() {
      console.log('[wugs-s12] standards table dropped');
    }).catch(function(err) {
      console.error('[wugs-s12] standards drop failed:', err.message);
    });
```

- [ ] **Step 4: Remove `fake-test-db.js`'s dead standards simulation**

Remove: the `standards`/`nextStandardSeq` fixture declarations (~lines 33, 37), ALL SQL-matching branches under the `── standards (bri-s3.4) ──` comment block (currently ~lines 217-259 in the plan's original estimate — read the file directly, since this may include MORE than the 2 branches originally estimated here: e.g. `INSERT INTO STANDARDS`, a `SELECT ... FROM STANDARDS WHERE` list query, plus any additional `SELECT ORG_ID FROM STANDARDS WHERE STANDARD_ID`/`UPDATE STANDARDS SET NAME` branches that also only exist to serve this fixture — remove all of them, confirm via a repo-wide grep that nothing else references `INSERT INTO STANDARDS`/`FROM STANDARDS`/`UPDATE STANDARDS` before removing), and the reset function's `standards = []; nextStandardSeq = 1;` portion (check if that line/function resets other state too; only remove the standards-specific portion if so).

- [ ] **Step 5: Surgically edit `check-psh-s1-schema.js`**

Remove T3 (`'standards table present with correct columns'`, lines ~43-57) and T6 (`'visibility default is 'product''`, lines ~80-87) entirely. In T5 (lines ~68-78), remove the `standardsMigIdx` variable and its assertion (`assert(standardsMigIdx > dbIdx, ...)`), keep the `productsMigIdx` variable and its assertion, keep the rest of T5 unchanged. Do not touch T1/T2/T4/T7/T8.

- [ ] **Step 6: Run all affected tests**

```bash
node tests/check-psh-s1-schema.js
node tests/check-psh-s5-context-injection.js
node tests/check-psh-s10-standards-injection.js
node -c src/web-ui/server.js
node -c src/web-ui/adapters/fake-test-db.js
```

Expected: all pass; `check-psh-s1-schema.js`'s count drops by exactly 2 (T3, T6 removed); the other two files' counts are unchanged (they never touched the removed wiring).

- [ ] **Step 7: Run sibling regressions**

```bash
node tests/check-wugs-s2-product-level-guardrails-view.js
node tests/check-wugs-s11-remove-smug-s1-routes-and-tab.js
```

- [ ] **Step 8: Commit**

```bash
git add src/web-ui/server.js src/web-ui/adapters/fake-test-db.js tests/check-psh-s1-schema.js
git commit -m "feat(wugs-s12): remove dead standards-adapter Postgres wiring, dead fake-test-db simulation, drop tables (AC3 + real cross-references not named in this story's AC text)"
```

---

## Task 4: AC1/AC4 lock-in test + final regression

**Files:**
- Create: `tests/check-wugs-s12-remove-db-tables.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-wugs-s12-remove-db-tables.js`:

```javascript
'use strict';
// check-wugs-s12-remove-db-tables.js — wugs-s12
//
// Confirms the standards/standard_product_optouts tables and every real
// code path that queried them are fully removed (AC1), the migration now
// drops them explicitly (AC3), and handleDeleteProduct's cleanup no longer
// references them (AC2, locked in here as a source-level sanity check
// alongside check-prc-s4.2-delete-product.js's own behavioural test).

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
var cleanupScriptSrc = fs.readFileSync(require.resolve('../scripts/cleanup-e2e-staging-data.js'), 'utf8');

// ── AC3: CREATE TABLE lines gone, explicit DROP TABLE added, correct order ──
check('AC3: createTableLines_removedFromServerJs', function () {
  assert.ok(serverSrc.indexOf('CREATE TABLE IF NOT EXISTS standards') === -1, 'expected the standards CREATE TABLE to be removed');
  assert.ok(serverSrc.indexOf('CREATE TABLE IF NOT EXISTS standard_product_optouts') === -1, 'expected the standard_product_optouts CREATE TABLE to be removed');
});
check('AC3: dropTableStatements_addedInFkSafeOrder', function () {
  var optoutsDropIdx = serverSrc.indexOf('DROP TABLE IF EXISTS standard_product_optouts');
  var standardsDropIdx = serverSrc.indexOf('DROP TABLE IF EXISTS standards');
  assert.ok(optoutsDropIdx !== -1, 'expected an explicit DROP TABLE IF EXISTS standard_product_optouts');
  assert.ok(standardsDropIdx !== -1, 'expected an explicit DROP TABLE IF EXISTS standards');
  assert.ok(optoutsDropIdx < standardsDropIdx, 'expected standard_product_optouts (the FK-referencing table) to be dropped before standards');
});

// ── AC2 (source-level lock-in, complementing check-prc-s4.2's behavioural test) ──
check('AC2: handleDeleteProduct_noLongerReferencesRemovedTables', function () {
  var idx = productsSrc.indexOf('async function handleDeleteProduct');
  assert.ok(idx !== -1, 'expected to find handleDeleteProduct');
  var fnBody = productsSrc.slice(idx, idx + 1500);
  assert.ok(fnBody.indexOf('DELETE FROM standards') === -1, 'expected no DELETE FROM standards inside handleDeleteProduct');
  assert.ok(fnBody.indexOf('DELETE FROM standard_product_optouts') === -1, 'expected no DELETE FROM standard_product_optouts inside handleDeleteProduct');
});

// ── Real cross-reference #2: cleanup-e2e-staging-data.js also cleaned up ──
check('AC1: cleanupScript_noLongerReferencesRemovedTables', function () {
  assert.ok(cleanupScriptSrc.indexOf('DELETE FROM standards') === -1, 'expected no DELETE FROM standards in cleanup-e2e-staging-data.js');
  assert.ok(cleanupScriptSrc.indexOf('DELETE FROM standard_product_optouts') === -1, 'expected no DELETE FROM standard_product_optouts in cleanup-e2e-staging-data.js');
});

// ── Real cross-reference #3: dead setStandardsAdapter Postgres wiring gone ──
check('AC1: standardsAdapterPostgresWiring_removedFromServerJs', function () {
  assert.ok(serverSrc.indexOf('setStandardsAdapter(async function') === -1, 'expected the real Postgres setStandardsAdapter wiring to be removed');
});

// ── AC1: repo-wide grep, the REAL complete removal list ────────────────────
check('AC1: noReferencesToRemovedTables_inSrcOrScripts', function () {
  var { execSync } = require('child_process');
  var pattern = 'FROM standards\\b|INTO standards\\b|UPDATE standards\\b|CREATE TABLE.*\\bstandards\\b(?!.*wugs-s12)|FROM standard_product_optouts|INTO standard_product_optouts';
  var raw;
  try {
    raw = execSync('grep -rn -E "' + pattern + '" src/ scripts/', { cwd: require('path').join(__dirname, '..'), encoding: 'utf8' });
  } catch (e) {
    if (e.status !== 1) { throw e; }
    raw = '';
  }
  var offendingLines = raw.split('\n').filter(function (line) { return line.trim(); });
  assert.strictEqual(offendingLines.length, 0, 'expected zero live references to the removed tables in src/ or scripts/, found:\n' + offendingLines.join('\n'));
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: Run test — must fail if any prior task's removal was incomplete (should be RED->GREEN in one step here since Tasks 1-3 already did the removal; this task adds the lock-in, it doesn't do new removal work)**

```bash
node tests/check-wugs-s12-remove-db-tables.js
```

- [ ] **Step 3: Fix any remaining gap the grep surfaces (should be none if Tasks 1-3 were complete; if something surfaces, investigate before forcing a pass)**

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s12-remove-db-tables.js
```

Expected: `6 passed, 0 failed`

- [ ] **Step 5: Full regression + story-level check**

```bash
node tests/check-wugs-s12-remove-db-tables.js
node tests/check-prc-s4.2-delete-product.js
node tests/check-b3-cleanup-script.js
node tests/check-psh-s1-schema.js
node tests/check-psh-s5-context-injection.js
node tests/check-psh-s10-standards-injection.js
node tests/check-wugs-s11-remove-smug-s1-routes-and-tab.js
node tests/check-bri-s3.4-cross-tenant-isolation.js
```

```bash
npm test
```

Expected: the documented pre-existing baseline count (33 failures, same names), file count adjusted for this story's own new/unchanged file count. **Per wugs-s11's own DoD Observation, ALSO do a manual scan of `tests/e2e/*.spec.js` for any literal reference to `standards`/`standard_product_optouts` table names or the removed routes** — the grep-based lock-in test only covers `src/`/`scripts/`, not `tests/e2e/`, for the same noise-avoidance reason established in `wugs-s11`. Confirmed already (pre-implementation investigation): `wugs-s11` already removed the only E2E spec (`bri-s3.4`) that ever touched these tables; re-confirm this holds after Tasks 1-3's changes, not just trust the earlier finding.

- [ ] **Step 6: Commit**

```bash
git add tests/check-wugs-s12-remove-db-tables.js
git commit -m "test(wugs-s12): AC1/AC2/AC3 lock-in covering the real, complete removal scope (3 cross-references, not the 1 this story's AC text names)"
```

---

## Final story-level check (before /verify-completion)

After all 4 tasks: `node tests/check-wugs-s12-remove-db-tables.js` → `6 passed, 0 failed`, all 7 sibling/surgically-edited regression files unchanged or correctly reduced, `npm test` at the documented baseline. This is the terminal story for the `web-ui-guardrails-standards-surface` feature's MVP — after it merges, `decisions.md`'s ARCH entry #4 supersession is fully complete, and `/trace` should be run across the whole 12-story feature.
