# Credits tab — restyle admin credit management into the shared design system — Implementation Plan

> **For agent execution:** Use /tdd per task (single session, no subagents dispatched for this story).

**Goal:** Add a real, restyled Credits tab (admin-only) to the Settings shell (`src/web-ui/routes/settings.js`), reusing `adminCreditsGet`/`adminCreditsPost` (`src/web-ui/routes/admin-credits.js`) exactly as-is — same CSRF flow, same validation, same payload shape — with zero changes to `admin-credits.js` itself.
**Branch:** `feature/c3-credits-tab-restyle`
**Worktree:** `.claude/worktrees/agent-a2cbf15216477b737` (already isolated; created fresh from `origin/master` after C1 (#521) merged)
**Test command:** `node tests/check-c3-credits-tab-restyle.js` (new file); full suite: `node tests/run-all.js` (or equivalent — confirmed in Step 2 of verify-completion)

---

## File map

```
Create:
  tests/check-c3-credits-tab-restyle.js  — AC1-AC4 unit + integration tests for the Credits tab restyle

Modify:
  src/web-ui/routes/settings.js          — add renderCreditsTab(), wire real balance data + CSRF token
                                            into handleGetSettings() when isAdmin, add client-side fetch
                                            interception script for the top-up form (AC3/AC4), no change
                                            to admin-credits.js's request/response contract
```

No changes to `src/web-ui/routes/admin-credits.js`, `src/web-ui/middleware/csrf.js`, `src/web-ui/middleware/require-admin.js`, or `src/web-ui/server.js` routing — all reused exactly as-is per the DoR contract's touch-point list and the story's Architecture Constraints.

---

## Task 1: Render real tenant balance data in the Credits tab (AC1)

**Files:**
- Modify: `src/web-ui/routes/settings.js`
- Test: `tests/check-c3-credits-tab-restyle.js`

- [ ] **Step 1: Write the failing test**

```javascript
async function testAC1CreditsTabRendersRealBalances() {
  var settings = freshRequireSettings();
  var html = settings.renderCreditsTab(
    [
      { tenant_id: 'tenant-a', balance: 10 },
      { tenant_id: 'tenant-b', balance: 25 },
      { tenant_id: 'tenant-c', balance: 0 }
    ],
    'csrf-tok-1'
  );

  assert.ok(html.indexOf('tenant-a') !== -1, 'AC1: tenant-a shown');
  assert.ok(html.indexOf('tenant-b') !== -1, 'AC1: tenant-b shown');
  assert.ok(html.indexOf('tenant-c') !== -1, 'AC1: tenant-c shown');
  assert.ok(html.indexOf('>10<') !== -1 || html.indexOf('10') !== -1, 'AC1: balance 10 shown');
  assert.ok(html.indexOf('sw-table') !== -1, 'AC1: restyled with a real shared-design-system class, not the bare table');
  assert.ok(html.indexOf('sw-card') !== -1, 'AC1: wrapped in the shared card component');
  assert.ok(html.indexOf('_csrf') !== -1 && html.indexOf('csrf-tok-1') !== -1, 'AC1: CSRF token embedded exactly as admin-credits.js embeds it');
}
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-c3-credits-tab-restyle.js
```

Expected output: `FAIL — settings.renderCreditsTab is not a function`

- [ ] **Step 3: Write minimal implementation**

Add to `src/web-ui/routes/settings.js` (near the top, alongside the existing requires):

```javascript
var _credits = require('../modules/credits');
var _csrf = require('../middleware/csrf');
```

Add a new render function (after `renderProfileTab`):

```javascript
/**
 * Render the Credits tab's panel content: the same tenant balance data
 * adminCreditsGet already returns, restyled into the shared design system
 * (AC1) instead of the bare `<table>` admin-credits.js renders standalone.
 * Reuses adminCreditsGet's exact data shape (tenant_id, balance) and
 * admin-credits.js's exact form contract (POST /api/admin/credits/adjust,
 * tenantId hidden field, amount number field, _csrf hidden field) --
 * AC3: the restyle does not change the request contract.
 * @param {Array<{tenant_id: string, balance: number}>} rows
 * @param {string} csrfToken
 * @param {{errorMessage?: string}} [opts]
 * @returns {string} HTML fragment (no <html>/<body> wrapper)
 */
function renderCreditsTab(rows, csrfToken, opts) {
  opts = opts || {};
  var errorBanner = opts.errorMessage
    ? '<div id="credits-error" class="sw-credits-error" role="alert">' + _escapeHtml(opts.errorMessage) + '</div>'
    : '<div id="credits-error" class="sw-credits-error" role="alert" hidden></div>';

  var tableRows = (rows || []).map(function(r) {
    return (
      '<tr>' +
        '<td>' + _escapeHtml(r.tenant_id) + '</td>' +
        '<td>' + _escapeHtml(String(r.balance)) + '</td>' +
        '<td>' +
          '<form method="POST" action="/api/admin/credits/adjust" class="sw-credits-form">' +
            _csrf.csrfField(csrfToken) +
            '<input type="hidden" name="tenantId" value="' + _escapeHtml(r.tenant_id) + '">' +
            '<input type="number" name="amount" min="1" required class="sw-input sw-credits-amount">' +
            '<button type="submit" class="sw-btn sw-btn--accent">Add</button>' +
          '</form>' +
        '</td>' +
      '</tr>'
    );
  }).join('');

  return (
    '<div id="tab-panel-credits" class="sw-tab-panel" role="tabpanel" aria-labelledby="tab-credits">' +
      '<div class="sw-card sw-card--lg">' +
        '<div class="sw-section-title">Tenant credit balances</div>' +
        errorBanner +
        '<table class="sw-table">' +
          '<thead><tr><th>Tenant ID</th><th>Balance</th><th>Top-up</th></tr></thead>' +
          '<tbody>' + tableRows + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>'
  );
}
```

Wire it into `renderSettingsPage`/`handleGetSettings` (see Task 3 below for the full wiring — the empty `tab-panel-credits` div C1 left behind is replaced by a call to `renderCreditsTab` when `isAdmin`).

Export it: add `renderCreditsTab: renderCreditsTab` to `module.exports`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-c3-credits-tab-restyle.js
```

Expected output: `PASS` for the AC1 test.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node tests/check-c1-settings-shell-and-profile-tab.js
```

Expected output: all existing C1 tests still pass (renderSettingsPage signature unchanged from C1's perspective at this step).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/settings.js tests/check-c3-credits-tab-restyle.js
git commit -m "feat(c3): render real tenant balances in the Credits tab, restyled"
```

---

## Task 2: Wire real Credits content into handleGetSettings + confirm non-admin sees nothing (AC1, AC2)

**Files:**
- Modify: `src/web-ui/routes/settings.js`
- Test: `tests/check-c3-credits-tab-restyle.js`

- [ ] **Step 1: Write the failing test**

```javascript
async function testAC1FullPageIncludesRealCreditsContentForAdmin() {
  var settings = freshRequireSettings();
  var html = settings.renderSettingsPage({
    user: { login: 'ivy' },
    linkedSet: new Set(),
    isAdmin: true,
    creditsRows: [{ tenant_id: 'tenant-z', balance: 99 }],
    csrfToken: 'tok-xyz'
  });

  assert.ok(html.indexOf('tenant-z') !== -1, 'AC1: admin sees real tenant balance data in the full page, not an empty container');
  assert.ok(html.indexOf('sw-table') !== -1, 'AC1: restyled table present');
}

async function testAC2NonAdminGetsNoCreditsContentAtAll() {
  var settings = freshRequireSettings();
  var html = settings.renderSettingsPage({
    user: { login: 'jack' },
    linkedSet: new Set(),
    isAdmin: false,
    creditsRows: [{ tenant_id: 'should-never-appear', balance: 1 }],
    csrfToken: 'tok-should-not-appear'
  });

  assert.ok(html.indexOf('tab-credits') === -1, 'AC2: no Credits tab button');
  assert.ok(html.indexOf('tab-panel-credits') === -1, 'AC2: no Credits panel container at all');
  assert.ok(html.indexOf('should-never-appear') === -1, 'AC2: tenant balance data never reaches the HTML for a non-admin, even if accidentally passed in');
}
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-c3-credits-tab-restyle.js
```

Expected output: `FAIL` — `renderSettingsPage` still renders the old empty `tab-panel-credits` div from C1, ignoring `creditsRows`/`csrfToken`, and the "should-never-appear" guard test may pass by accident but the real-data test fails.

- [ ] **Step 3: Write minimal implementation**

In `renderSettingsPage`, replace the C1 placeholder line:

```javascript
(isAdmin ? '<div id="tab-panel-credits" class="sw-tab-panel" role="tabpanel" aria-labelledby="tab-credits"></div>' : '') +
```

with:

```javascript
(isAdmin ? renderCreditsTab(opts.creditsRows || [], opts.csrfToken, { errorMessage: opts.creditsError }) : '')
```

Note `renderCreditsTab` already emits the full `id="tab-panel-credits" class="sw-tab-panel" role="tabpanel" aria-labelledby="tab-credits"` wrapper itself (see Task 1) — the class list also needs `sw-tab-panel` added there (already present in Task 1's implementation).

In `createSettingsHandlers(pool)` → `handleGetSettings`, after computing `isAdmin`:

```javascript
var creditsRows = [];
var csrfToken = null;
if (isAdmin) {
  creditsRows = await _credits.getAllTenantBalances();
  csrfToken = _csrf.generateCsrfToken(req);
}

var creditsError = req.query && req.query.creditsError ? String(req.query.creditsError) : null;

var html = renderSettingsPage({
  user: user,
  linkedSet: linkedSet,
  isAdmin: isAdmin,
  creditsRows: creditsRows,
  csrfToken: csrfToken,
  creditsError: creditsError
});
```

This keeps the server-side-only gate (AC2, architecture constraint): a non-admin request never calls `getAllTenantBalances()` and never generates/embeds a CSRF token for this form — there is nothing to hide client-side because nothing is ever produced.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-c3-credits-tab-restyle.js
```

Expected output: `PASS` for both AC1 and AC2 tests.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node tests/check-c1-settings-shell-and-profile-tab.js
```

Expected output: all existing C1 tests still pass — `testCreditsTabAdminOnly` (button-only assertions) is unaffected since the button-rendering code path (`_renderTabNav`) is untouched.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/settings.js tests/check-c3-credits-tab-restyle.js
git commit -m "feat(c3): wire real tenant balance data into the Settings Credits tab, admin-only"
```

---

## Task 3: Preserve the exact CSRF/payload request contract on submit (AC3)

**Files:**
- Modify: `src/web-ui/routes/settings.js` (test only — no server-side change needed; the form Task 1 wrote already targets the real endpoint with the real fields)
- Test: `tests/check-c3-credits-tab-restyle.js`

- [ ] **Step 1: Write the failing test**

```javascript
async function testAC3FormMatchesExistingPayloadAndCsrfShape() {
  var settings = freshRequireSettings();
  var html = settings.renderCreditsTab([{ tenant_id: 'tenant-q', balance: 5 }], 'real-csrf-token');

  assert.ok(/action="\/api\/admin\/credits\/adjust"/.test(html), 'AC3: form posts to the exact existing endpoint');
  assert.ok(/name="_csrf" value="real-csrf-token"/.test(html), 'AC3: same _csrf hidden field admin-credits.js already emits');
  assert.ok(/name="tenantId" value="tenant-q"/.test(html), 'AC3: same tenantId hidden field');
  assert.ok(/name="amount"/.test(html), 'AC3: same amount field name');

  // Confirm the exact payload shape adminCreditsPost expects still round-trips
  // through the existing handler unmodified (reuses arl-s3/sec-perf-s3 fixtures).
  var adminCredits = freshRequireAdminCredits();
  var credits = freshRequireCredits();
  credits.setCreditsAdapter({
    query: async function(sql) {
      if (sql.includes('SELECT tenant_id FROM')) return { rows: [{ tenant_id: 'tenant-q' }] };
      if (sql.includes('UPDATE')) return { rows: [{ balance: 15 }] };
      if (sql.includes('INSERT INTO credit_audit_log')) return { rows: [] };
      return { rows: [] };
    }
  });
  var adminCredits2 = freshRequireAdminCreditsWithCredits(credits);

  var body = '_csrf=real-csrf-token&tenantId=tenant-q&amount=10';
  var req = {
    session: { userId: 1, role: 'admin', csrfToken: 'real-csrf-token', login: 'admin-a' },
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    on: function(event, cb) { if (event === 'data') cb(body); if (event === 'end') cb(); }
  };
  var res = makeRes();
  await adminCredits2.adminCreditsPost(req, res);
  assert.strictEqual(res._status, 302, 'AC3: the exact same payload shape the restyled form sends is accepted unmodified by adminCreditsPost');
}
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-c3-credits-tab-restyle.js
```

Expected output: `FAIL` until Task 1's `renderCreditsTab` exists — once Task 1/2 are done this test should already pass without further code changes, since the form markup already matches. This task exists to make that parity explicit and regression-proof.

- [ ] **Step 3: Write minimal implementation**

No production code change — Task 1's form markup already satisfies this. If the test fails, fix `renderCreditsTab`'s form markup (field names/action) to match exactly, not `admin-credits.js`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-c3-credits-tab-restyle.js
```

Expected output: `PASS`.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node tests/check-arl-s3-admin-credits.js
node tests/check-sec-perf-s3-admin-credits-csrf.js
```

Expected output: both existing suites pass unmodified — confirms this story did not alter `admin-credits.js`'s request contract or CSRF handling.

- [ ] **Step 6: Commit**

```bash
git add tests/check-c3-credits-tab-restyle.js
git commit -m "test(c3): pin the restyled form's payload/CSRF shape to admin-credits.js's existing contract"
```

---

## Task 4: Surface a clear rejection message for invalid amounts, not raw JSON (AC4)

**Files:**
- Modify: `src/web-ui/routes/settings.js`
- Test: `tests/check-c3-credits-tab-restyle.js`

- [ ] **Step 1: Write the failing test**

```javascript
async function testAC4InvalidAmountShowsClearMessageNotRawJson() {
  var settings = freshRequireSettings();
  var html = settings.renderCreditsTab(
    [{ tenant_id: 'tenant-r', balance: 3 }],
    'tok-1',
    { errorMessage: 'amount must be a positive integer' }
  );

  assert.ok(html.indexOf('amount must be a positive integer') !== -1, 'AC4: the rejection message is shown');
  assert.ok(html.indexOf('{&quot;error&quot;') === -1 && html.indexOf('{"error"') === -1, 'AC4: raw JSON error body is never shown verbatim');
  assert.ok(/id="credits-error"[^>]*role="alert"/.test(html), 'AC4: shown in a clearly-marked alert region, not silently swallowed');
  assert.ok(html.indexOf('hidden') === -1, 'AC4: when an error is present, the alert region is not hidden');
}

async function testCreditsErrorBannerHiddenWhenNoError() {
  var settings = freshRequireSettings();
  var html = settings.renderCreditsTab([{ tenant_id: 'tenant-s', balance: 1 }], 'tok-2');
  assert.ok(/id="credits-error"[^>]*hidden/.test(html), 'No error -- alert region present but hidden, not shown empty');
}
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-c3-credits-tab-restyle.js
```

Expected output: `FAIL — renderCreditsTab does not accept opts.errorMessage` (fails until Task 1's `opts` param lands; if Task 1 already includes it, this simply confirms the escaping/markup).

- [ ] **Step 3: Write minimal implementation**

`renderCreditsTab`'s `errorBanner` block (already written in Task 1) covers rendering. Add the client-side wiring so a real rejection reaches this render path in the browser without changing `admin-credits.js`'s response contract (still 400 JSON on rejection, still 302 on success — unchanged, per `check-arl-s3-admin-credits.js`/`check-sec-perf-s3-admin-credits-csrf.js`).

Add a small inline script (in the same file, appended near `_TAB_JS`), intercepting the Credits top-up forms' submit so a 400 JSON response is shown inline instead of navigating to a raw-JSON page:

```javascript
var _CREDITS_JS =
  '<script>(function(){' +
    'document.querySelectorAll(".sw-credits-form").forEach(function(f){' +
      'f.addEventListener("submit",function(ev){' +
        'ev.preventDefault();' +
        'var errEl=document.getElementById("credits-error");' +
        'var fd=new URLSearchParams(new FormData(f));' +
        'fetch(f.action,{method:"POST",body:fd,headers:{"Content-Type":"application/x-www-form-urlencoded"}})' +
          '.then(function(r){' +
            'if(r.status===400){return r.json().then(function(j){' +
              'if(errEl){errEl.textContent=(j&&j.error)||"Request rejected";errEl.hidden=false;}' +
            '});}' +
            'window.location.reload();' +
          '})' +
          '.catch(function(){if(errEl){errEl.textContent="Request failed";errEl.hidden=false;}});' +
      '});' +
    '});' +
  '})()</script>';
```

Append `_CREDITS_JS` inside `renderCreditsTab`'s returned markup (after the table, before the closing wrapper divs), so it is only ever sent to the browser when the Credits panel itself is rendered (i.e., admin-only — consistent with AC2, no client script referencing credits ships to non-admins).

Note: `errEl.textContent` is used (never `innerHTML`) so the server-supplied error string from JSON is never re-parsed as HTML client-side — this mirrors the existing app-wide XSS discipline (`_escapeHtml` server-side, safe DOM APIs client-side).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-c3-credits-tab-restyle.js
```

Expected output: `PASS` for both AC4 tests.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node tests/check-c1-settings-shell-and-profile-tab.js
node tests/check-arl-s3-admin-credits.js
node tests/check-sec-perf-s3-admin-credits-csrf.js
node tests/check-tir-s4-role-gated-credits-panel.js
```

Expected output: all pass, no regressions to any existing credits/settings/CSRF suite.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/settings.js tests/check-c3-credits-tab-restyle.js
git commit -m "feat(c3): surface invalid-amount rejections as a clear inline message, not raw JSON"
```

---

## Task 5: Defense-in-depth regression check — API layer still enforces admin-only, independent of the UI (AC2 NFR)

**Files:**
- Test only: `tests/check-c3-credits-tab-restyle.js`

- [ ] **Step 1: Write the (already-passing, pinning) test**

```javascript
async function testDefenseInDepthApiLayerStillEnforced() {
  var requireAdmin = require(path.resolve(__dirname, '../src/web-ui/middleware/require-admin')).requireAdmin;
  var adminCredits = freshRequireAdminCredits();

  var req = { session: { userId: 9, role: 'user' } };
  var res = makeRes();

  var called = false;
  await requireAdmin(req, res, function() { called = true; });
  if (called) { await adminCredits.adminCreditsGet(req, res); }

  assert.strictEqual(res._status, 403, 'A non-admin session must still be rejected at the API layer directly, not merely hidden in the Settings UI');
  assert.ok(res._body.indexOf('<table') === -1, 'No credits HTML must ever be produced for a non-admin, regardless of UI path');
}
```

This is a pinning test, not new behaviour — `requireAdmin`/`adminCreditsGet` are unmodified by this story (already proven by `check-arl-s3-admin-credits.js` T11). Including it directly in this story's suite makes the story's own AC2 NFR claim ("enforced at the API layer, not just hidden in the UI") independently verifiable from this story's test file, without relying on a different story's suite continuing to exist untouched.

- [ ] **Step 2–4:** This test passes immediately (no RED phase expected — it pins existing, unmodified behaviour). Run it once to confirm:

```bash
node tests/check-c3-credits-tab-restyle.js
```

Expected output: `PASS`.

- [ ] **Step 5: Run full suite**

```bash
node tests/check-arl-s3-admin-credits.js
```

Expected output: pass, unmodified.

- [ ] **Step 6: Commit**

```bash
git add tests/check-c3-credits-tab-restyle.js
git commit -m "test(c3): pin API-layer admin gate as independent of the Settings UI (AC2 defense-in-depth)"
```

---

## Task 6: Full local verification pass

- [ ] Run `node tests/check-c3-credits-tab-restyle.js` — all new tests pass
- [ ] Run the full existing suite (per verify-completion skill) — 0 regressions
- [ ] Confirm no changes to `src/web-ui/routes/admin-credits.js`, `src/web-ui/middleware/csrf.js`, `src/web-ui/middleware/require-admin.js` (`git diff --stat` shows only `settings.js` + new test file)
- [ ] Update `.github/pipeline-state.json`: story `c3` → `stage: "branch-complete"` once the draft PR is open (per /branch-complete's own state-update step)

---

<!-- End of plan. 5 implementation/test tasks + 1 verification pass, covering all 4 ACs
     (AC1: Task 1/2, AC2: Task 2/5, AC3: Task 3, AC4: Task 4) plus the NFR (CSRF preservation,
     verified by re-running sec-perf-s3's existing suite unmodified in Task 3/4). -->
