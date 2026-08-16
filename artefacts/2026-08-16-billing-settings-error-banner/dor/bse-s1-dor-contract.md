# DoR Contract: Show a visible error banner on Settings when a billing-portal redirect carries an error

**Story reference:** artefacts/2026-08-16-billing-settings-error-banner/stories/bse-s1-billing-settings-error-banner.md
**Test plan reference:** artefacts/2026-08-16-billing-settings-error-banner/test-plans/bse-s1-test-plan.md

---

## Contract Proposal

**What will be built:**
1. In `src/web-ui/routes/settings.js`, a new small allowlist dictionary (`_BILLING_ERROR_MESSAGES` or equivalent) mapping the two known codes to their hardcoded messages:
   - `no_billing_account` → "You don't have a billing account set up yet."
   - `billing_unavailable` → "Billing is temporarily unavailable — please try again shortly."
   Any other value (including absent) resolves to no message.
2. `renderBillingTab(planState, csrfToken, opts)` gains a third, optional `opts` parameter (mirroring `renderCreditsTab`'s existing signature). When `opts.errorMessage` is set, it renders a `<div id="billing-error" class="sw-credits-error" role="alert">` banner with the escaped message, inside the returned Billing-tab fragment. When not set, no banner element is rendered at all (not a hidden placeholder — see story AC3).
3. `renderSettingsPage` passes `opts.billingError` through to `renderBillingTab`'s new third argument when building the `#tab-panel-billing` block.
4. `handleGetSettings` reads `req.query && req.query.error`, maps it through the allowlist dictionary, and passes the result as `billingError` into `renderSettingsPage`'s opts — using this codebase's already-established `req.query` convention (confirmed via `server.js:1913` and existing call sites in `billing.js`/`products.js`/`journey.js`), not a new `req.url` parser.
5. New test file `tests/check-bse-s1-billing-settings-error-banner.js` covering all 4 ACs, following `tests/check-c2-billing-tab.js`'s existing `mockReq`/`mockRes`/`freshRequire` convention.

**What will NOT be built:**
- No change to `billing.js`'s `handleGetBillingPortal` redirect logic — already correct, reused unmodified.
- No change to the Credits tab's own `#credits-error` element, `hidden` default, or `creditsJs` script — reused as a styling reference only.
- No new CSS class or rule in `_TAB_CSS` — `.sw-credits-error` is reused verbatim.
- No generic/fallback banner for an unrecognized `error` value (see `decisions.md` DESIGN entry).
- No in-app plan-management UI (the larger `beta-005.md` signal #2 ask).

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (`no_billing_account` banner) | Integration test: call `handleGetSettings` with `req.query = { error: 'no_billing_account' }`, assert response body contains `id="billing-error"`/`role="alert"`/exact text | integration |
| AC2 (`billing_unavailable` banner) | Integration test: same shape, `req.query = { error: 'billing_unavailable' }` | integration |
| AC3 (no/unrecognized error → no banner, no reflection, no regression) | Two integration tests: (a) no `error` key — no banner, existing content intact; (b) adversarial/unknown value — no banner, raw value never appears in body | integration |
| AC4 (Billing/Credits isolation) | One unit test on `renderBillingTab` directly (markup shape) + one integration test with an admin fixture asserting positional isolation and byte-for-byte unchanged Credits markup/script | unit + integration |

**Assumptions:**
- `req.query` is already populated by `server.js`'s router before `handleGetSettings` runs (confirmed, `server.js:1913`) — no new parsing infrastructure needed.
- `renderBillingTab`'s existing two-argument call sites (if any exist outside `settings.js` itself) continue to work unmodified since the new third parameter is optional and defaults to no-banner behaviour — confirmed via `grep -rn "renderBillingTab" src/ tests/` before implementation to enumerate all call sites.
- The exact two error-code strings (`no_billing_account`, `billing_unavailable`) are re-verified via a fresh read of `billing.js` immediately before implementation, not trusted from the story text alone, per this session's established discipline.

**Estimated touch points:**
Files: `src/web-ui/routes/settings.js` (modified — new dictionary, `renderBillingTab` signature +1 optional arg, `renderSettingsPage`/`handleGetSettings` wiring), `tests/check-bse-s1-billing-settings-error-banner.js` (new).
Services: None.
APIs: None — no new routes, no changed request/response shape for any existing endpoint.

---

## Contract Review

Reviewed against all 4 ACs and the test plan. No mismatches found — every AC has a proposed implementation approach and a matching test type. This story has no CSS-layout-dependent gap — every claim is a response-body string assertion, fully provable without a browser or visual-regression tooling, so there is nothing to RISK-ACCEPT under CLAUDE.md's B2 rule.

No file listed as out-of-scope in the story contradicts the test plan's required touchpoints (CLAUDE.md's B1/D1 check): the only files touched are `src/web-ui/routes/settings.js` and the new test file, both explicitly in scope; `billing.js` is explicitly out of scope and has zero test assertions against it in this story's own test plan (it is referenced only as prior art / dependency context, not modified or tested here).

✅ **Contract review passed** — proposed implementation aligns with all ACs.
