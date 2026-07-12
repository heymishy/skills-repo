# Create and wire the 3 initial flags across both projects — Implementation Plan

> **For agent execution:** Executed directly with /tdd discipline per task in this session (no subagent fan-out — story complexity is rated 2, single-session execution is appropriate per /subagent-execution's fallback note, consistent with bri-s1.1-bri-s1.4).

**Goal:** Make every automated test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/bri-s1.5`
**Worktree:** `.worktrees/bri-s1.5`
**Test command:** `node tests/check-bri-s1.5-initial-flags-wired.js` (targeted); full suite via `node scripts/run-all-tests.js` (pcr-s1's dynamic runner, replacing the old `npm test` `&&`-chain).

---

## Scope note (read before Task 1)

Before writing any code, the pre-existing state of the two live call sites this story wires was inspected directly (not assumed from the DoR contract's touch-point list):

- `handleGetProductKanban` / `handleGetOrgKanban` (`src/web-ui/routes/products.js`) already have live GET routes (`/products/:id/kanban`, `/org/kanban`, both in `server.js`) but had **zero flag gating** — they queried the DB and rendered unconditionally. This story adds the `isEnabled()` gate here (matches the DoR contract's touch points exactly).
- `handleGetWizard` (`src/web-ui/routes/journey.js`) already has the `wizard-ui` gate wired from bri-s1.3 (reading `req.session.flags['wizard-ui']`), and `handleGetWizardBootstrapped` (also bri-s1.3) resolves that flag via `bootstrapFlags()` before delegating to it. However, **`server.js` registers no live GET route for `/journey/wizard` at all** — only the `POST /journey/wizard` selection handler is wired. This was flagged explicitly in `decisions.md`'s bri-s1.3 DESIGN entry as a revisit trigger for "a future story [that] wires a live GET route to `handleGetWizardBootstrapped`." Per this story's stated intent ("actually wired to gate real, already-shipped app behaviour... proven end-to-end, not just the abstract mechanism from S1.1-S1.4") and AC1's requirement that the flag gate a reachable page, this plan adds that one route registration. This is additive-only (no change to `handleGetWizard`'s own logic or its two pre-existing test files' call sites) and is logged as a SCOPE decision beyond the DoR contract's literal touch-point list, following the same transparency precedent as bri-s3.2's decisions.md entry.

Adding the `isEnabled()` gate to `handleGetProductKanban`/`handleGetOrgKanban` changes their behaviour for the two pre-existing test files that call them directly without wiring any adapter (`tests/check-psh-s6-product-kanban.js`, `tests/check-psh-s7-org-kanban.js`) — without a wired adapter, `isEnabled()` rejects with the D37 stub-throw error (by design), which would regress both suites. Both files are updated to wire a default-enabled adapter at the top (one line each), preserving every existing assertion; this story's own test file covers the flag-off path directly.

---

## File map

```
Create:
  src/web-ui/modules/flag-keys.js                    — shared constants for the 3 flag key strings (AC4 code-side)
  tests/check-bri-s1.5-initial-flags-wired.js         — AC1-AC4 unit + integration tests

Modify:
  src/web-ui/routes/products.js  — gate handleGetProductKanban on isEnabled('product-kanban-view', ...) (AC2);
                                    gate handleGetOrgKanban on isEnabled('org-kanban-view', {tenantId}) (AC3)
  src/web-ui/server.js           — register GET /journey/wizard -> handleGetWizardBootstrapped (AC1 live wiring)
  tests/check-psh-s6-product-kanban.js  — wire a default-enabled flags adapter (pre-existing suite predates the gate)
  tests/check-psh-s7-org-kanban.js      — wire a default-enabled flags adapter (pre-existing suite predates the gate)
```

---

## Task 1: Flag key constants module (AC4 code-side)

**Files:**
- Create: `src/web-ui/modules/flag-keys.js`
- Test: `tests/check-bri-s1.5-initial-flags-wired.js` (U1)

- [x] **Step 1: Write the failing test**

```js
test('U1: flag-keys module equals { WIZARD_UI, PRODUCT_KANBAN_VIEW, ORG_KANBAN_VIEW }', function() {
  assert.strictEqual(flagKeys.WIZARD_UI, 'wizard-ui');
  assert.strictEqual(flagKeys.PRODUCT_KANBAN_VIEW, 'product-kanban-view');
  assert.strictEqual(flagKeys.ORG_KANBAN_VIEW, 'org-kanban-view');
  var values = Object.keys(flagKeys).map(function(k) { return flagKeys[k]; });
  assert.ok(values.indexOf('model-routing-glm52') === -1);
  assert.ok(values.indexOf('billing-v2') === -1);
  assert.strictEqual(Object.keys(flagKeys).length, 3);
});
```

- [x] **Step 2: Implement**

```js
'use strict';
module.exports = {
  WIZARD_UI: 'wizard-ui',
  PRODUCT_KANBAN_VIEW: 'product-kanban-view',
  ORG_KANBAN_VIEW: 'org-kanban-view'
};
```

- [x] **Step 3: Run**

```
$ node tests/check-bri-s1.5-initial-flags-wired.js
  [PASS] U1: flag-keys module equals { WIZARD_UI, PRODUCT_KANBAN_VIEW, ORG_KANBAN_VIEW }
```

- [x] **Commit:** `feat(bri-s1.5): add shared flag-key constants module (AC4)`

---

## Task 2: Gate `handleGetProductKanban` on `product-kanban-view` (AC2)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-bri-s1.5-initial-flags-wired.js` (U2, IT3, IT4)

- [x] **Step 1: Write the failing tests** (U2 — no DB call when off; IT3 — 404 when off; IT4 — normal payload when on)

- [x] **Step 2: Implement** — `require('../modules/posthog-flags')` and `require('../modules/flag-keys')` at top of `products.js`; add a shared `_respondFlagDisabled(res)` helper (404 + `{ error: 'not_found' }`); in `handleGetProductKanban`, call `await _postHogFlags.isEnabled(_flagKeys.PRODUCT_KANBAN_VIEW, { tenantId })` before the DB query and short-circuit to `_respondFlagDisabled(res)` when false.

- [x] **Step 3: Run**

```
$ node tests/check-bri-s1.5-initial-flags-wired.js
  [PASS] U2: pool.query is never called when isEnabled(product-kanban-view) resolves false
  [PASS] IT3: handleGetProductKanban returns not-found/disabled shape when flag is off
  [PASS] IT4: handleGetProductKanban returns { columns } when the flag is on
```

- [x] **Step 4: Regression-proof the pre-existing suite** — add one line to `tests/check-psh-s6-product-kanban.js` wiring `setPostHogFlagsAdapter({ evaluateFlag: async () => true })` before its existing assertions.

```
$ node tests/check-psh-s6-product-kanban.js
[psh-s6] Results: 7 passed, 0 failed
```

- [x] **Commit:** `feat(bri-s1.5): gate handleGetProductKanban on product-kanban-view flag (AC2)`

---

## Task 3: Gate `handleGetOrgKanban` on `org-kanban-view` with tenant targeting (AC3)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-bri-s1.5-initial-flags-wired.js` (IT5, IT6)

- [x] **Step 1: Write the failing tests** (IT5 — on for targeted tenant renders; IT6 — off for non-targeted tenant returns not-found/disabled with zero cross-tenant data anywhere in the response, and confirms zero DB calls at all)

- [x] **Step 2: Implement** — in `handleGetOrgKanban`, call `await _postHogFlags.isEnabled(_flagKeys.ORG_KANBAN_VIEW, { tenantId })` before the products query and short-circuit to `_respondFlagDisabled(res)` when false. Keyed on `tenantId` so bri-s1.4's PostHog group-targeting derivation (`_withTenantGroup`) applies automatically — no bespoke per-flag logic (D37).

- [x] **Step 3: Run**

```
$ node tests/check-bri-s1.5-initial-flags-wired.js
  [PASS] IT5: handleGetOrgKanban returns { groups } for tenant-x when the flag resolves true for tenant-x
  [PASS] IT6: handleGetOrgKanban never leaks tenant-x data into tenant-y's flag-off response
```

- [x] **Step 4: Regression-proof the pre-existing suite** — same one-line adapter wiring in `tests/check-psh-s7-org-kanban.js`.

```
$ node tests/check-psh-s7-org-kanban.js
[psh-s7] Results: 7 passed, 0 failed
```

- [x] **Commit:** `feat(bri-s1.5): gate handleGetOrgKanban on org-kanban-view flag with tenant targeting (AC3)`

---

## Task 4: Verify `wizard-ui` gate + wire the live GET route (AC1)

**Files:**
- Modify: `src/web-ui/server.js`
- Test: `tests/check-bri-s1.5-initial-flags-wired.js` (IT1, IT2)

- [x] **Step 1: Write the failing tests** (IT1 — flag off omits `#wizard-canvas-gated`; IT2 — flag on includes it). These exercise the pre-existing `handleGetWizard` gate from bri-s1.3 directly, confirming it still holds.

- [x] **Step 2: Implement** — add `handleGetWizardBootstrapped` to `server.js`'s destructured import from `./routes/journey`; register `GET /journey/wizard` -> `authGuard(req, res, async () => { await handleGetWizardBootstrapped(req, res); })`, placed next to the existing `POST /journey/wizard` route. See Scope note above and the SCOPE decision logged in `decisions.md`.

- [x] **Step 3: Run**

```
$ node tests/check-bri-s1.5-initial-flags-wired.js
  [PASS] IT1: handleGetWizard omits #wizard-canvas-gated when req.session.flags["wizard-ui"] is false
  [PASS] IT2: handleGetWizard includes #wizard-canvas-gated when req.session.flags["wizard-ui"] is true
$ node --check src/web-ui/server.js
(no output — syntax OK)
$ node tests/check-wucp4-session-wizard.js
=== wucp4 results: 20 passed, 0 failed ===
$ node tests/check-pmf3-orientation-wizard.js
Results: 8 passed, 0 failed
```

- [x] **Commit:** `feat(bri-s1.5): wire GET /journey/wizard to handleGetWizardBootstrapped (AC1)`

---

## Notes

- Two manual scenarios (AC1's "verified in both environments independently," AC4's real dashboard parity) are explicitly out of this plan's automated scope, per the DoR contract and test plan's Coverage gaps table — they remain manual steps in the verification script for Hamish to run post-deploy.
- Baseline pre-existing environment gaps (Windows `cmd.exe` command-line length limit on the old aggregate chain — moot now under pcr-s1's dynamic runner; missing `.github/skills/definition/SKILL.md`; a broader set of pre-existing unrelated failures across the repo's full suite, e.g. `orient/SKILL.md`-dependent checks, `cli-outer-loop` scaffolding not yet built) are the same class of gap already documented for bri-s1.1 through bri-s1.4 in `decisions.md` and are not re-investigated here, per those stories' own RISK-ACCEPT precedent.
