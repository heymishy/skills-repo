## Implementation Plan: Billing tab — plan status and Stripe portal access (C2)

**Story:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/c2-billing-tab.md`
**Test plan:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/c2-test-plan.md`
**DoR:** `artefacts/2026-07-21-web-ui-experience-redesign/dor/c2-dor.md`
**Depends on:** C1 (`src/web-ui/routes/settings.js`, PR #521, merged into `origin/master`)

## Mock-shape verification finding (pre-implementation)

Read the real, currently-wired production response shape of `GET /billing/plan-state`
(`handleGetBillingPlanState` in `src/web-ui/routes/billing.js`, which calls
`tenantPlan.getPlanState(tenantId)` in `src/web-ui/modules/tenant-plan.js`). The real
shape is `{ plan: 'trial'|'paid', status: 'active'|'past_due'|'canceled' }` — there is
no `trialEndsInDays` field anywhere in the persisted `tenant_plan` table, the SELECT,
or `DEFAULT_PLAN_STATE`. The test-plan's AC1 fixture (`{ plan: 'trial', trialEndsInDays: 9 }`)
describes a field the real endpoint never returns.

**Decision:** implement and test against the real two-field shape only (`plan`, `status`).
AC1's "plan details" is satisfied by showing the plan label ("Trial plan"/"Paid plan")
next to the status pill — not a fabricated days-remaining figure. Logged in
`artefacts/2026-07-21-web-ui-experience-redesign/decisions.md` per the mock-shape
verification rule (CLAUDE.md) — this is exactly the tir-s5/tir-s8 class of mistake
the rule exists to prevent, caught before writing any test.

## File map

| File | Change |
|------|--------|
| `src/web-ui/routes/settings.js` | Add `_billingStatusPill(planState)` + `renderBillingTab(planState, csrfToken)` pure render functions (AC1/AC2/AC3/AC4/AC5). Update `renderSettingsPage(opts)` to accept `opts.planState`/`opts.csrfToken` (safe defaults for backward compatibility with C1's existing tests) and render real Billing panel content instead of the empty C1 placeholder `<div>`. Update `createSettingsHandlers(pool)`'s `handleGetSettings` to fetch `planState` via `tenantPlan.getPlanState(tenantId)` and generate a CSRF token via `csrf.generateCsrfToken(req)`, passing both into `renderSettingsPage`. Add `require('../modules/tenant-plan')` and `require('../middleware/csrf')`. |
| `tests/check-c2-billing-tab.js` (NEW) | AC1–AC5 unit + integration tests, hand-rolled `test()`/`assert` style matching `tests/check-c1-settings-shell-and-profile-tab.js`. |

**Explicitly NOT touched:** `src/web-ui/routes/billing.js` (`handleGetBillingPlanState`, `handleGetBillingPortal`, `handlePostCheckout` reused exactly as-is), `src/web-ui/modules/tenant-plan.js` (reused as-is — no new adapter, `setPlanStateAdapter` already wired in `server.js` by jlc-s1), `src/web-ui/server.js` (no new route needed — `GET /settings`, `GET /settings/billing`, and `POST /billing/checkout` are all already wired).

**No new D37 adapter** (H-ADAPTER: N/A per DoR) — this story reuses `tenant-plan.js`'s existing adapter and `billing.js`'s existing routes; it introduces no new injectable.

---

## Task 1 — `_billingStatusPill` + `renderBillingTab` in settings.js (AC1/AC2/AC3/AC4/AC5)

**RED:** Add to new test file:
- AC1: `renderBillingTab({ plan: 'trial', status: 'active' }, 'tok')` output contains a `sw-pill--accent` pill with text "Trial" and "Trial plan" detail text.
- AC2: `renderBillingTab({ plan: 'paid', status: 'active' }, 'tok')` output contains a `sw-pill--green` pill with text "Active" and contains no substring "Trial" (case-insensitive).
- AC3: `renderBillingTab({ plan: 'trial', status: 'past_due' }, 'tok')` output contains a `sw-pill--amber` pill with text "Past due" (different class from the AC2 active-status `sw-pill--green` rendering). Same check for `{ plan: 'trial', status: 'canceled' }` → `sw-pill--red` "Canceled".
- AC4: every variant's output contains `href="/settings/billing"` with visible text "Manage billing".
- AC5: trial-plan output contains `<form action="/billing/checkout" method="POST"` with a hidden `_csrf` field whose value is the passed `csrfToken`, a hidden `planId` field valued `pro`, and visible text "Upgrade to Pro". Paid-plan output contains none of that (no re-offered upgrade once already paid).
- NFR (security): rendered output for every fixture contains only known-safe fields — assert absence of any of `card`, `cardNumber`, `stripeCustomerId`, `customerId` substrings.

Run — fails (`renderBillingTab` does not exist).

**GREEN:**
```js
// c2: real production shape from tenantPlan.getPlanState() is exactly
// { plan: 'trial'|'paid', status: 'active'|'past_due'|'canceled' } -- no
// trialEndsInDays field exists anywhere in the real store (verified against
// src/web-ui/modules/tenant-plan.js before writing this). See decisions.md.
function _billingStatusPill(planState) {
  var status = (planState && planState.status) || 'active';
  var plan = (planState && planState.plan) || 'trial';

  if (status === 'past_due') return { cls: 'amber', label: 'Past due' };
  if (status === 'canceled') return { cls: 'red', label: 'Canceled' };
  if (plan === 'trial') return { cls: 'accent', label: 'Trial' };
  return { cls: 'green', label: 'Active' };
}

/**
 * Render the Billing tab's panel content (AC1-AC5): a status pill (colour +
 * text label per the accessibility NFR -- never colour alone), the plan
 * label, a "Manage billing" link to the existing portal-redirect route
 * (AC4), and -- only while on a trial plan -- an "Upgrade to Pro" form
 * posting to the existing /billing/checkout route (AC5), reusing
 * handlePostCheckout's existing CSRF + planId contract unmodified.
 * @param {{plan: string, status: string}} planState
 * @param {string} csrfToken
 * @returns {string} HTML fragment
 */
function renderBillingTab(planState, csrfToken) {
  planState = planState || { plan: 'trial', status: 'active' };
  var pill = _billingStatusPill(planState);
  var planLabel = planState.plan === 'paid' ? 'Paid plan' : 'Trial plan';

  var upgradeForm = planState.plan === 'trial'
    ? (
      '<form action="/billing/checkout" method="POST" style="display:inline-block;margin-left:10px">' +
        _csrf.csrfField(csrfToken) +
        '<input type="hidden" name="planId" value="pro">' +
        '<button type="submit" class="sw-btn sw-btn--accent">Upgrade to Pro</button>' +
      '</form>'
    )
    : '';

  return (
    '<div class="sw-card sw-card--lg" style="margin-bottom:20px">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">' +
        '<span class="sw-pill sw-pill--' + pill.cls + '">' + _escapeHtml(pill.label) + '</span>' +
        '<span style="color:var(--muted);font-size:13px">' + _escapeHtml(planLabel) + '</span>' +
      '</div>' +
    '</div>' +
    '<a class="sw-btn sw-btn--subtle" href="/settings/billing">Manage billing</a>' +
    upgradeForm
  );
}
```
Add `var _csrf = require('../middleware/csrf');` near the top of `settings.js` alongside the existing `_htmlShell`/`_identityLinks` requires. Export `renderBillingTab` from `module.exports`.

**Run:** `node tests/check-c2-billing-tab.js` — expect the new AC1-AC5 + NFR tests PASS.

**Commit:** `feat(c2): add renderBillingTab to settings.js`

---

## Task 2 — Wire `renderSettingsPage` to render real Billing panel content (AC1/AC2/AC3/AC4/AC5)

**RED:** Add test: `renderSettingsPage({ user: {...}, linkedSet: new Set(), isAdmin: false, planState: { plan: 'trial', status: 'active' }, csrfToken: 'tok' })` output contains the Billing panel wrapper `id="tab-panel-billing"` with the real pill/link/form content nested inside (not empty). Also re-run C1's existing `testCreditsTabAdminOnly` (calls `renderSettingsPage` without `planState`/`csrfToken`) to confirm it still passes with safe defaults.

Run — fails (billing panel div is still the C1 empty placeholder).

**GREEN:** In `renderSettingsPage(opts)`, replace:
```js
'<div id="tab-panel-billing" class="sw-tab-panel" role="tabpanel" aria-labelledby="tab-billing"></div>' +
```
with:
```js
'<div id="tab-panel-billing" class="sw-tab-panel" role="tabpanel" aria-labelledby="tab-billing">' +
  renderBillingTab(opts.planState, opts.csrfToken) +
'</div>' +
```
Add safe defaults at the top of `renderSettingsPage`: `var planState = opts.planState || { plan: 'trial', status: 'active' };` and `var csrfToken = opts.csrfToken || '';` — preserves C1's existing call sites that do not pass these options.

**Run:** `node tests/check-c2-billing-tab.js` and `node tests/check-c1-settings-shell-and-profile-tab.js` — expect both fully PASS (0 regressions in C1's suite).

**Commit:** `feat(c2): render real Billing tab content in renderSettingsPage`

---

## Task 3 — Wire `handleGetSettings` to fetch real plan-state + CSRF token (AC1/AC2/AC3/AC4/AC5 integration)

**RED:** Add integration test: mock `tenantPlan.getPlanState` (monkeypatch the required module) to return a fixture plan-state; call `handleGetSettings(req, res)` with a session; assert the response HTML reflects that exact fixture's pill/label with no separate/duplicated plan-status computation (same function the real `/billing/plan-state` endpoint itself calls — `tenantPlan.getPlanState`).

Run — fails (`handleGetSettings` does not fetch plan-state yet, always renders the trial default).

**GREEN:** In `createSettingsHandlers(pool)`'s `handleGetSettings`, after resolving `linkedSet`/`user`/`isAdmin`, add:
```js
var tenantId = req.session && req.session.tenantId;
var planState = await _tenantPlan.getPlanState(tenantId);
var csrfToken = _csrf.generateCsrfToken(req);
```
Pass `planState: planState, csrfToken: csrfToken` into the `renderSettingsPage({...})` call. Add `var _tenantPlan = require('../modules/tenant-plan');` near the top of `settings.js`.

**Run:** `node tests/check-c2-billing-tab.js` full file — expect all PASS. Then `node scripts/run-all-tests.js` (full suite) — expect the failing-file list to match the a1 baseline (37 pre-existing failures per `decisions.md`'s RISK-ACCEPT), with zero new failures introduced by this story.

**Commit:** `feat(c2): wire handleGetSettings to real /billing/plan-state data + CSRF token`

---

## Self-review checklist

- [x] Exact file paths, no placeholders
- [x] Complete code shown per task
- [x] Failing test precedes each implementation step
- [x] Expected output stated for every run command
- [x] Commit messages in imperative mood
- [x] No scope beyond the 5 ACs (no new Stripe logic, no webhook changes, no new adapter)
