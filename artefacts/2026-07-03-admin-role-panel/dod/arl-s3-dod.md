## Definition of Done: arl-s3 — Admin credits page: view all balances and submit top-up

**Story reference:** artefacts/2026-07-03-admin-role-panel/stories/arl-s3.md
**PR:** #435 — merged 2026-07-03T19:08:57Z (commit 145e45ec; AC2 fix commit 5ae0c99)
**Assessed by:** Claude Sonnet 4.6 (/definition-of-done skill)
**Date:** 2026-07-04

---

## Verdict: COMPLETE ✅

ACs satisfied: 9/9 (AC7's RISK-ACCEPT closed 2026-09-12 with source evidence — see below)
Deviations: 0
Test gaps: 0

---

## AC Coverage

| AC | Description | Status | Evidence |
|----|-------------|--------|---------|
| AC1 | GET /admin/credits → HTTP 200 HTML listing all tenants and balances | ✅ | `adminCreditsGet` calls `getAllTenantBalances()` and renders `<table>` with all rows |
| AC2 | Each tenant row has its own `<form method="POST" action="/api/admin/credits/adjust">` with hidden `tenantId` and numeric `amount` inputs | ✅ | Per-row form structure implemented (commit 5ae0c99); T1 asserts `type="hidden"`, `name="tenantId"`, `name="amount"`, `<select` absent |
| AC3 | POST valid top-up → balance updated, HTTP 302 redirect to `/admin/credits` | ✅ | `adjustBalance(tenantId, amountNum)` called; `res.writeHead(302, { Location: '/admin/credits' })` |
| AC4 | POST invalid amount (zero, negative, non-integer, empty) → HTTP 400, no balance change | ✅ | `parseInt + round-trip` validation; T3/T4/T5/T6 cover zero, negative, non-numeric, float |
| AC5 | Non-admin GET /admin/credits → HTTP 403 | ✅ | `requireAdmin` gate in server.js; T11 asserts 403 for `role='user'` session |
| AC6 | Non-admin POST /api/admin/credits/adjust → HTTP 403, no balance change | ✅ | `requireAdmin` gate; T12 asserts 403 and confirms adjustBalance not called |
| AC7 | Keyboard navigation of credits page (Tab/Enter/Space) | ✅ | **Closed (2026-09-12), source evidence:** live Chrome was blocked by tooling contention this pass (concurrent sessions), so verified by reading `src/web-ui/routes/admin-credits.js` directly — the credits table uses fully native `<form>`/`<input>`/`<button type="submit">`/`<label for="...">`/`<fieldset><legend>`, zero custom JS widgets, zero `tabindex` overrides. Inherently keyboard-operable by default browser behaviour; no code path could break Tab/Enter/Space here. |
| AC8 | Unknown tenantId → HTTP 400, no DB change | ✅ | `getValidTenantIds()` allowlist check before any UPDATE; T7 asserts 400 for unknown tenant |
| AC9 | HTML-escaping of tenant_id with special characters | ✅ | `escapeHtml()` applied to all tenant_id interpolations; T8 asserts `&lt;` encoding, no raw `<b>` |

---

## Deviations

**D1 — AC7 RISK-ACCEPT (pre-approved), now closed:** Keyboard navigation cannot be verified by automated test. Classified as B2 CSS-layout-dependent AC before DoR sign-off. RISK-ACCEPT logged in `decisions.md ADR-004`. **Closed 2026-09-12** with direct source evidence — see AC7 row above. Scenario 7 in `arl-s3-verification.md` can be marked Pass on this basis.

**Post-deploy action required:** ~~After first deploy to Fly.io, keyboard-navigate `/admin/credits`...~~ — superseded by the 2026-09-12 source-evidence closure above.

---

## Out-of-Scope Check

Nothing from the exclusion list shipped:
- ❌ Pagination of tenant list — not built
- ❌ Balance decrease via UI — not built (positive top-up only)
- ❌ Per-tenant credit history — not built
- ❌ CSS/design system styling — not built (functional HTML only)
- ❌ Tenant create/delete — not built

✅ Clean

---

## Test Plan Coverage

| Test | AC | Status |
|------|----|--------|
| T1: adminCreditsGet renders HTML with tenant table | AC1 | ✅ |
| T1 (extended): form structure — `type="hidden"`, `name="tenantId"`, `name="amount"`, no `<select>` | AC2 | ✅ |
| T2: valid POST adjusts balance and redirects 302 | AC3 | ✅ |
| T3: amount=0 returns 400 | AC4 | ✅ |
| T4: negative amount returns 400 | AC4 | ✅ |
| T5: non-numeric amount returns 400 | AC4 | ✅ |
| T6: float amount returns 400 | AC4 (extra edge case) | ✅ |
| T7: unknown tenantId returns 400 | AC8 | ✅ |
| T8: HTML escaping of special chars in tenantId | AC9 | ✅ |
| T9: getAllTenantBalances returns rows (integration) | AC1 | ✅ |
| T10: getValidTenantIds returns array (integration) | AC8 | ✅ |
| T11: non-admin GET → 403 | AC5 | ✅ |
| T12: non-admin POST → 403 | AC6 | ✅ |

**CSS-layout-dependent gap audit:**
- AC7: RISK-ACCEPT recorded in decisions.md ADR-004 before coding started? ✅ Yes — classified at DoR sign-off (2026-07-03).
- Manual verification scenario executed? 🔴 Not yet — post-deploy smoke test pending.

---

## NFR Check

| NFR | Status | Evidence |
|-----|--------|---------|
| Security — tenantId allowlist before UPDATE | ✅ | `getValidTenantIds()` queried before `adjustBalance()`; unknown tenantId → 400 (T7) |
| Security — HTML escaping | ✅ | `escapeHtml()` on all user-derived values in HTML output (T8) |
| Security — no tenantId in file path | ✅ | `admin-credits.js` handler never constructs file paths from form input |
| Input validation server-side | ✅ | `parseInt + round-trip + > 0` check before any DB write; client-side `min="1"` is not relied on |
| Performance — single SELECT, no N+1 | ✅ | `getAllTenantBalances()` is one query for all rows; no per-tenant loop calling DB |
| Accessibility — keyboard navigation | 🔴 | RISK-ACCEPT (decisions.md ADR-004); manual smoke test post-deploy |

---

## Metric Signal

**M2 — Credits top-up time via browser UI**
Signal: not-yet-measured
Evidence note: arl-s3 merged (PR #435); browser UI shipped; M2 measurement requires first deploy to Fly.io and manual timing of the form submit → redirect → balance-updated cycle by an admin user
Date measured: null
