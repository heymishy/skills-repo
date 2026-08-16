# Show a visible error banner on Settings when a billing-portal redirect carries an error — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/bse-s1`
**Worktree:** `.worktrees/bse-s1`
**Test command:** `npm test`

---

## File map

```
Create:
  tests/check-bse-s1-billing-settings-error-banner.js  — tests for AC1-AC4

Modify:
  src/web-ui/routes/settings.js  — new error-code allowlist dictionary,
                                     renderBillingTab gains an optional 3rd
                                     `opts` param, renderSettingsPage/
                                     handleGetSettings wire req.query.error
                                     through to it
```

**Pre-work verification (done during authoring, re-confirm at task start):**
- All existing `renderBillingTab` call sites are 2-argument (`settings.js:407`, and 8 call sites in `tests/check-c2-billing-tab.js`) — confirmed via `grep -rn "renderBillingTab" src/ tests/`. A new optional 3rd param is additive and safe.
- The two real error-code strings from `bpe-s1`: `no_billing_account` (`billing.js:464`) and `billing_unavailable` (`billing.js:479`) — confirmed via direct read.
- `req.query` is already populated by `server.js`'s router (`server.js:1913`) before any handler runs — no new parsing infrastructure needed.

---

## Task 1: Add the error-code dictionary + extend `renderBillingTab` (AC1, AC2, AC3 banner-shape leg, AC4 markup-shape leg)

**Files:**
- Modify: `src/web-ui/routes/settings.js`
- Test: `tests/check-bse-s1-billing-settings-error-banner.js` (create)

- [ ] **Step 1: Write the failing tests**

Create `tests/check-bse-s1-billing-settings-error-banner.js` with (at minimum):
- `settings_renderBillingTabEmbedsErrorBannerWhenOptsErrorMessageSet` — calls `renderBillingTab` directly with and without `opts.errorMessage`, asserts banner presence/absence and exact markup (`id="billing-error"`, `class="sw-credits-error"`, `role="alert"`).
- The 5 integration-level tests from the test plan (AC1, AC2, AC3 x2, AC4), calling `handlers.handleGetSettings(req, res)` via `createSettingsHandlers(pool)` with `mockReq`/`mockRes` helpers copied from `tests/check-c2-billing-tab.js`'s existing convention (including `query: {}` default on `mockReq`).

Follow this repo's hand-rolled `test()`/`assert` async convention exactly as `tests/check-c2-billing-tab.js` does (no Jest/Mocha).

- [ ] **Step 2: Run test — new file should show new tests failing, everything else in the file unaffected**

```bash
node tests/check-bse-s1-billing-settings-error-banner.js
```

Expected: all new tests FAIL (no dictionary, no `opts` param, no wiring exist yet).

- [ ] **Step 3: Add the allowlist dictionary near the top of `settings.js`**

```javascript
// bse-s1: maps bpe-s1's two known billing-portal error codes (billing.js:464,
// billing.js:479) to a specific, honest, human-readable message. Any other
// value (including absent) intentionally has no entry here -- see
// decisions.md's DESIGN entry: an unrecognized error code shows no banner,
// never a generic fallback or a reflection of the raw query value.
var _BILLING_ERROR_MESSAGES = {
  no_billing_account: "You don't have a billing account set up yet.",
  billing_unavailable: 'Billing is temporarily unavailable — please try again shortly.'
};
```

- [ ] **Step 4: Extend `renderBillingTab`'s signature to accept an optional `opts` param**

```javascript
function renderBillingTab(planState, csrfToken, opts) {
  opts = opts || {};
  planState = planState || { plan: 'trial', status: 'active' };
  var pill = _billingStatusPill(planState);
  var planLabel = planState.plan === 'paid' ? 'Paid plan' : 'Trial plan';

  // bse-s1 (AC1/AC2/AC3): reuses the exact .sw-credits-error CSS class the
  // Credits tab already defines -- no new CSS rule. Renders nothing at all
  // (not a hidden placeholder) when there is no error message, matching
  // AC3's "no banner element is present" requirement.
  var errorBanner = opts.errorMessage
    ? '<div id="billing-error" class="sw-credits-error" role="alert">' + _escapeHtml(opts.errorMessage) + '</div>'
    : '';

  var upgradeForm = ...  // unchanged

  return (
    errorBanner +
    '<div class="sw-card sw-card--lg" ...>' +
    ...
  );
}
```

(Exact placement of `errorBanner` within the returned string: before the existing status-pill card, so it reads first when the Billing tab is visible — mirrors `renderCreditsTab`'s existing placement of `errorBanner` immediately inside its wrapping `<div>`, before the table.)

- [ ] **Step 5: Wire `handleGetSettings` to read `req.query.error` and pass it through**

In `handleGetSettings`, after the existing `planState`/`csrfToken` reads:

```javascript
// bse-s1: read the billing-portal error code bpe-s1's redirect carries, via
// this codebase's already-established req.query convention (server.js:1913;
// see also billing.js:219, products.js:1334) -- not a new req.url parser.
var billingErrorCode = req.query && req.query.error;
var billingErrorMessage = _BILLING_ERROR_MESSAGES[billingErrorCode] || null;
```

Pass `billingError: billingErrorMessage` into the `renderSettingsPage(...)` call's opts object.

- [ ] **Step 6: Wire `renderSettingsPage` to forward `opts.billingError` into `renderBillingTab`'s new 3rd argument**

```javascript
'<div id="tab-panel-billing" class="sw-tab-panel" role="tabpanel" aria-labelledby="tab-billing">' +
  renderBillingTab(planState, csrfToken, { errorMessage: opts.billingError }) +
'</div>' +
```

- [ ] **Step 7: Run the new test file — all tests should pass**

```bash
node tests/check-bse-s1-billing-settings-error-banner.js
```

Expected: all tests PASS, including the two-arg `renderBillingTab` calls in the existing test file (verified in Task 2 below).

- [ ] **Step 8: Run `tests/check-c2-billing-tab.js` — must still fully pass (regression check on the file whose signature this task extends)**

```bash
node tests/check-c2-billing-tab.js
```

Expected: all pre-existing tests in this file still PASS unchanged — the new 3rd `opts` param is optional and additive.

- [ ] **Step 9: Run full suite — no regressions beyond the branch-setup baseline**

```bash
npm test
```

Expected: same pre-existing failures as the branch-setup baseline (see `decisions.md`'s branch-setup RISK-ACCEPT entry for the exact count/file list observed at worktree creation), plus `check-bse-s1-billing-settings-error-banner.js` and `check-c2-billing-tab.js` both passing cleanly.

- [ ] **Step 10: Commit**

```bash
git add src/web-ui/routes/settings.js tests/check-bse-s1-billing-settings-error-banner.js
git commit -m "fix: show a visible error banner on Settings for a billing-portal error redirect"
```

---

## Task 2: Open draft PR

- [ ] **Step 1:** Confirm all new tests pass and the full suite shows only the known pre-existing baseline failures (no new ones).
- [ ] **Step 2:** Push the branch and open a draft PR (handled by `/branch-complete`, not this plan).
