# Add error handling and a missing-customer guard to the Stripe Billing Portal redirect — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/bpe-s1`
**Worktree:** `.worktrees/bpe-s1`
**Test command:** `npm test`

---

## File map

```
Create:
  tests/check-bpe-s1-billing-portal-error-handling.js  — unit tests for AC1-AC5

Modify:
  src/web-ui/routes/billing.js  — add a missing-stripeCustomerId guard and a
                                    try/catch around createPortalSession in
                                    handleGetBillingPortal
```

---

## Task 1: Regression baseline — port the existing lab-s3.5 happy-path/no-session tests (AC1, AC2, AC3)

**Files:**
- Create: `tests/check-bpe-s1-billing-portal-error-handling.js`
- Read only: `src/web-ui/routes/billing.js`, `tests/check-lab-s3.5-billing-portal.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-bpe-s1-billing-portal-error-handling.js`:

```javascript
'use strict';
// check-bpe-s1-billing-portal-error-handling.js — bpe-s1
//
// AC verification for handleGetBillingPortal's error handling + missing-
// customer guard. AC1-AC3 are regression coverage (behaviour already
// shipped in lab-s3.5, re-asserted here since this story touches the same
// function); AC4-AC5 are the new behaviour this story adds.
//
// Set process.env BEFORE any require() of application code.
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.NODE_ENV = 'test';

var path = require('path');
var ROOT = path.join(__dirname, '..');

var passed = 0;
var failed = 0;

function check(label, ok) {
  if (ok) {
    passed++;
    console.log('PASS:', label);
  } else {
    failed++;
    console.error('FAIL:', label);
  }
}

function mockReq(opts) {
  opts = opts || {};
  return {
    session: opts.session !== undefined ? opts.session : { accessToken: 'tok', tenantId: 'tenant-abc' },
    headers: opts.headers || { host: 'test.example.com' },
    query: opts.query || {},
  };
}

function mockRes() {
  return {
    _statusCode: null,
    _headers: {},
    _body: null,
    writeHead: function(status, headers) {
      this._statusCode = status;
      if (headers) {
        var self = this;
        Object.keys(headers).forEach(function(k) { self._headers[k] = headers[k]; });
      }
    },
    end: function(body) {
      this._body = body || null;
    }
  };
}

setImmediate(function() {
  var stripeClientPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'stripe-client'));
  var billingPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'billing'));

  delete require.cache[stripeClientPath];
  delete require.cache[billingPath];

  var stripeClient = require(stripeClientPath);

  var portalCalls = [];
  var _shouldThrow = false;
  var mockStripe = {
    billingPortal: {
      sessions: {
        create: async function(params) {
          portalCalls.push(params);
          if (_shouldThrow) {
            throw new Error('Stripe API error: no such customer');
          }
          return { url: 'https://billing.stripe.com/session/test_portal_123' };
        }
      }
    }
  };
  stripeClient.setStripeAdapter(mockStripe);

  delete require.cache[billingPath];
  var billing = require(billingPath);

  (async function runTests() {

    // ── AC1: valid session + stripeCustomerId → 302 to portal URL ──
    console.log('\n── AC1: valid session + stripeCustomerId → 302 to portal URL ──');
    portalCalls.length = 0;
    _shouldThrow = false;
    var req1 = mockReq({ session: { accessToken: 'tok', tenantId: 'tenant-abc', stripeCustomerId: 'cus_test_123' } });
    var res1 = mockRes();
    await billing.handleGetBillingPortal(req1, res1);
    check('billingPortal_validCustomerId_redirectsToPortalUrl',
      res1._statusCode === 302 &&
      res1._headers['Location'] === 'https://billing.stripe.com/session/test_portal_123' &&
      portalCalls.length === 1 &&
      portalCalls[0].customer === 'cus_test_123'
    );

    // ── AC2: returnUrl contains /dashboard ──
    console.log('\n── AC2: returnUrl contains /dashboard ──');
    check('billingPortal_returnUrlContainsDashboard',
      portalCalls.length === 1 &&
      typeof portalCalls[0].return_url === 'string' &&
      portalCalls[0].return_url.includes('/dashboard')
    );

    // ── AC3: no session → 302 to / ──
    console.log('\n── AC3: no session → 302 to / ──');
    portalCalls.length = 0;
    var req3a = mockReq({ session: {} });
    var res3a = mockRes();
    await billing.handleGetBillingPortal(req3a, res3a);
    check('billingPortal_noSession_redirectsToRoot',
      res3a._statusCode === 302 && res3a._headers['Location'] === '/' && portalCalls.length === 0
    );

    var req3b = mockReq({ session: null });
    var res3b = mockRes();
    await billing.handleGetBillingPortal(req3b, res3b);
    check('billingPortal_nullSession_redirectsToRoot',
      res3b._statusCode === 302 && res3b._headers['Location'] === '/' && portalCalls.length === 0
    );

    console.log('\n' + passed + ' passed, ' + failed + ' failed');
    if (failed > 0) process.exit(1);

  })().catch(function(err) {
    console.error('Test error:', err.message, err.stack);
    process.exit(1);
  });
});
```

- [ ] **Step 2: Run test — must pass already**

```bash
node tests/check-bpe-s1-billing-portal-error-handling.js
```

Expected output: `4 passed, 0 failed` — AC1-AC3 assert on behaviour that is already shipped and unmodified by this task; this establishes the regression baseline before Task 2 changes the handler.

- [ ] **Step 3: Commit the baseline test file**

```bash
git add tests/check-bpe-s1-billing-portal-error-handling.js
git commit -m "test: add bpe-s1 regression baseline for handleGetBillingPortal (AC1-AC3)"
```

---

## Task 2: Missing/falsy stripeCustomerId guard (AC4)

**Files:**
- Modify: `src/web-ui/routes/billing.js`
- Test: `tests/check-bpe-s1-billing-portal-error-handling.js` (append)

- [ ] **Step 1: Write the failing test**

Insert into the `(async function runTests() { ... })()` block, after the AC3 block and before the final `console.log('\n' + passed ...)` line:

```javascript
    // ── AC4: missing/null/empty stripeCustomerId → guarded redirect, Stripe not called ──
    console.log('\n── AC4: missing/null/empty stripeCustomerId → 302 to /settings?error=no_billing_account ──');

    portalCalls.length = 0;
    var req4a = mockReq({ session: { accessToken: 'tok', tenantId: 'tenant-abc' } }); // no stripeCustomerId key
    var res4a = mockRes();
    await billing.handleGetBillingPortal(req4a, res4a);
    check('billingPortal_missingCustomerId_redirectsToSettingsWithNoBillingAccountError',
      res4a._statusCode === 302 &&
      res4a._headers['Location'] === '/settings?error=no_billing_account' &&
      portalCalls.length === 0
    );

    var req4b = mockReq({ session: { accessToken: 'tok', tenantId: 'tenant-abc', stripeCustomerId: null } });
    var res4b = mockRes();
    await billing.handleGetBillingPortal(req4b, res4b);
    check('billingPortal_nullCustomerId_redirectsToSettingsWithNoBillingAccountError',
      res4b._statusCode === 302 &&
      res4b._headers['Location'] === '/settings?error=no_billing_account' &&
      portalCalls.length === 0
    );

    var req4c = mockReq({ session: { accessToken: 'tok', tenantId: 'tenant-abc', stripeCustomerId: '' } });
    var res4c = mockRes();
    await billing.handleGetBillingPortal(req4c, res4c);
    check('billingPortal_emptyStringCustomerId_redirectsToSettingsWithNoBillingAccountError',
      res4c._statusCode === 302 &&
      res4c._headers['Location'] === '/settings?error=no_billing_account' &&
      portalCalls.length === 0
    );
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-bpe-s1-billing-portal-error-handling.js
```

Expected: the 3 new AC4 checks FAIL (the handler still calls `createPortalSession` unconditionally with `customerId === undefined`/`null`/`''`, which the mock adapter accepts and resolves — so the current handler redirects to the portal URL instead of `/settings?error=no_billing_account`).

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/billing.js`, replace `handleGetBillingPortal`'s body:

```javascript
async function handleGetBillingPortal(req, res) {
  // AC2 (regression): auth guard — no session → redirect to /
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  // bpe-s1 AC4: explicit guard for a missing/falsy stripeCustomerId — never
  // attempt the Stripe call without one. This is the "not fully set up yet"
  // case (e.g. a trial tenant that has never completed Checkout), distinct
  // from a genuine Stripe API failure below. This is the exact real-world
  // condition confirmed live against wuce-staging.fly.dev (beta-001 #1/#6).
  var customerId = req.session.stripeCustomerId;
  if (!customerId) {
    console.warn(JSON.stringify({ event: 'billing_portal_no_customer_id', tenantId: req.session.tenantId || null }));
    res.writeHead(302, { Location: '/settings?error=no_billing_account' });
    res.end();
    return;
  }

  // bpe-s1 AC5: a real Stripe API failure (network error, invalid customer,
  // Stripe outage, etc.) must not reach the caller as an unhandled 500 —
  // catch it and fail open to Settings with an error indicator, matching
  // this file's own existing fail-open precedent (handleGetBillingSuccess above).
  try {
    var portalUrl = await stripeClient.createPortalSession(customerId, '/dashboard');
    res.writeHead(302, { Location: portalUrl });
    res.end();
  } catch (err) {
    console.error(JSON.stringify({ event: 'billing_portal_error', tenantId: req.session.tenantId || null, message: err && err.message }));
    res.writeHead(302, { Location: '/settings?error=billing_unavailable' });
    res.end();
  }
}
```

(This single replacement covers both Task 2's guard and Task 3's try/catch — implementing them together is more coherent than a half-guarded intermediate state; Task 3 below adds the test coverage for the try/catch half and confirms it.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-bpe-s1-billing-portal-error-handling.js
```

Expected output: `7 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same pre-existing failure count/list as the branch-setup baseline (see `decisions.md`'s branch-setup RISK-ACCEPT entry for this feature — re-verify the exact count fresh, do not assume it matches another feature's number), plus the new `check-bpe-s1-billing-portal-error-handling.js` passing, plus `tests/check-lab-s3.5-billing-portal.js` still passing unmodified (same handler, same behaviour for its own covered cases).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/billing.js tests/check-bpe-s1-billing-portal-error-handling.js
git commit -m "fix: guard handleGetBillingPortal against a missing stripeCustomerId (AC4)"
```

---

## Task 3: Catch a genuine Stripe API failure (AC5) + NFR logging test

**Files:**
- Modify: `src/web-ui/routes/billing.js` (already done in Task 2's combined implementation — this task adds test coverage and confirms it)
- Test: `tests/check-bpe-s1-billing-portal-error-handling.js` (append)

- [ ] **Step 1: Write the failing test**

Insert into the same test block, after the AC4 checks:

```javascript
    // ── AC5: Stripe throws → caught, 302 to /settings?error=billing_unavailable ──
    console.log('\n── AC5: createPortalSession throws → caught, 302 to /settings?error=billing_unavailable ──');

    portalCalls.length = 0;
    _shouldThrow = true;
    var req5 = mockReq({ session: { accessToken: 'tok', tenantId: 'tenant-abc', stripeCustomerId: 'cus_test_456' } });
    var res5 = mockRes();
    await billing.handleGetBillingPortal(req5, res5); // must not throw out of this await
    check('billingPortal_stripeThrows_caughtAndRedirectsToSettingsWithBillingUnavailableError',
      res5._statusCode === 302 &&
      res5._headers['Location'] === '/settings?error=billing_unavailable'
    );
    _shouldThrow = false;

    // ── NFR: structured logging, no raw error leaked to the client ──
    console.log('\n── NFR: structured logging on both new failure paths, no raw error in response ──');

    var warnCalls = [];
    var errorCalls = [];
    var origWarn = console.warn;
    var origError = console.error;
    console.warn = function() { warnCalls.push(Array.prototype.slice.call(arguments)); };
    console.error = function() { errorCalls.push(Array.prototype.slice.call(arguments)); };

    try {
      var reqNfr1 = mockReq({ session: { accessToken: 'tok', tenantId: 'tenant-nfr' } });
      var resNfr1 = mockRes();
      await billing.handleGetBillingPortal(reqNfr1, resNfr1);

      _shouldThrow = true;
      var reqNfr2 = mockReq({ session: { accessToken: 'tok', tenantId: 'tenant-nfr', stripeCustomerId: 'cus_nfr' } });
      var resNfr2 = mockRes();
      await billing.handleGetBillingPortal(reqNfr2, resNfr2);
      _shouldThrow = false;
    } finally {
      console.warn = origWarn;
      console.error = origError;
    }

    check('billingPortal_errorLogging_structuredNoRawErrorLeaked',
      warnCalls.length === 1 && String(warnCalls[0][0]).indexOf('billing_portal_no_customer_id') !== -1 &&
      errorCalls.length === 1 && String(errorCalls[0][0]).indexOf('billing_portal_error') !== -1 &&
      // response bodies for both are null (no body written — 302 with no text) and
      // neither response's Location header contains the raw error message text
      String(resNfr1._headers['Location']).indexOf('Stripe API error') === -1 &&
      String(resNfr2._headers['Location']).indexOf('Stripe API error') === -1
    );
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-bpe-s1-billing-portal-error-handling.js
```

Note: because Task 2's implementation already added the full try/catch (both guard and catch were written together — see Task 2 Step 3's note), this AC5 test and the NFR test are expected to already PASS at this point, not fail. This is a deliberate deviation from strict single-behaviour-per-task RED/GREEN sequencing: the guard (AC4) and the catch (AC5) are two branches of the same small function and were more coherent to implement as one replacement. Confirm both pass; if either fails, treat it as a genuine implementation gap and fix `handleGetBillingPortal` accordingly before proceeding.

- [ ] **Step 3: Confirm implementation (no further code change expected)**

Re-read `handleGetBillingPortal` in `src/web-ui/routes/billing.js` and confirm it matches Task 2 Step 3's block exactly — guard first, then try/catch, structured logging on both new paths, no raw error text in any response header or body.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-bpe-s1-billing-portal-error-handling.js
```

Expected output: `9 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same pre-existing failure count/list as the branch-setup baseline, plus `check-bpe-s1-billing-portal-error-handling.js` passing (9/9), plus `check-lab-s3.5-billing-portal.js` still passing unmodified. No new failures.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/billing.js tests/check-bpe-s1-billing-portal-error-handling.js
git commit -m "test: verify handleGetBillingPortal catches Stripe failures and logs structured events (AC5, NFR)"
```

---

## Task 4: Open draft PR

- [ ] **Step 1:** Confirm all 9 unit tests pass and the full suite shows only the known pre-existing failures (no new ones).
- [ ] **Step 2:** Push the branch and open a draft PR (handled by `/branch-complete`, not this plan).
