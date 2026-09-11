# Verify Completion: Thread impersonation state into the /dashboard route's renderShell call (ibg-s1)

**Story:** artefacts/2026-08-17-impersonation-banner-dashboard-gap/stories/ibg-s1-thread-impersonation-into-dashboard.md

---

## AC verification

| AC | Status | Evidence |
|----|--------|----------|
| AC1 | ✅ | T1/T2 in `tests/check-ibg-s1-dashboard-impersonation-banner.js`: banner div + exit control render on both `/dashboard` and `/dashboard?view=board` when impersonating |
| AC2 | ✅ | T3/T4: no banner when not impersonating; product list / board content unchanged |
| AC3 | ✅ | T5: banner carries a real, non-placeholder CSRF token (reuses `_csrf.generateCsrfToken`, the exact `d2`/`dashboard.js` exit-flow mechanism, untouched) |
| AC4 | ✅ | T6: `check-d2-banner-exit-permission-visibility.js` 24/24 still passing |

**New test file:** `tests/check-ibg-s1-dashboard-impersonation-banner.js` — 14/14 passing.

## Regression check

- `check-fresc-s1-empty-state-clarity-copy.js` (calls `_renderProductDashboard` directly): 8/8 passing, unaffected by the new trailing `impersonation` parameter.
- `check-bvnd-s1-board-view-products-nav.js`: 15/15 passing.
- `check-kanban-consolidation.js`: 51/51 passing.
- `check-kbsf-s1-kanban-shell-wrapping.js`: 3/3 passing.
- `check-pan-s1-product-aware-navigation.js`: 29/29 passing.

## Full suite

`NODE_ENV=test npm test`: 639 files run, 3 failed. All 3 confirmed pre-existing and unrelated to this change:
- `tests/check-p3.5-validate-trace.js` — confirmed in `tests/known-baseline-failures.json` (documented PowerShell/pwsh resource-contention issue, unrelated to any specific PR).
- `tests/check-bjs-s1-billing-journey-staging-safe.js` — fails on a Stripe/billing test-endpoint env-var check (`AC1: secret unset -> _isTestEndpointAllowed false`), a domain this change does not touch. Not yet added to `known-baseline-failures.json` (baseline drift).
- `tests/check-s6.1-cache-scope-session-threading.js` — fails with `Adapter not wired: sessionStore` (an LLM prompt-caching session-adapter wiring issue in this test harness), a domain this change does not touch. Not yet added to `known-baseline-failures.json` (baseline drift).

Both baseline-drift files are confirmed unrelated by scope: `git diff --stat` against the branch point shows exactly one source file touched (`src/web-ui/routes/products.js`, 15 insertions/4 deletions — matching this story's own scoped fix), plus the new test file. Neither `bjs-s1`'s Stripe webhook module nor `s6.1`'s session-cache adapter is imported or referenced anywhere in the diff.

**0 new failures introduced by this change.**

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
