## Definition of Ready: arl-s3 — Admin credits page: view all balances and submit top-up

**Story reference:** artefacts/2026-07-03-admin-role-panel/stories/arl-s3.md
**Test plan reference:** artefacts/2026-07-03-admin-role-panel/test-plans/arl-s3-test-plan.md
**Assessed by:** Claude Sonnet 4.6 (/definition-of-ready skill)
**Date:** 2026-07-03

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with named persona | ✅ | "As a Platform operator (Hamish King)" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 9 ACs (AC8 + AC9 added during /review to address security findings 1-M1) |
| H3 | Every AC has at least one test in the test plan | ✅ | 13 tests across 9 ACs; AC7 gap is classified and RISK-ACCEPT applied |
| H4 | Out-of-scope section populated — not blank or N/A | ✅ | 5 explicit exclusions |
| H5 | Benefit linkage references a named metric | ✅ | M2 — Credits top-up time via browser UI (M2 Metric 2 — credit top-up completes in browser under 2 minutes) |
| H6 | Complexity is rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ | 0 HIGH findings (arl-s3-review-1.md: 1M→resolved, 1L→resolved) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | AC7 gap acknowledged and classified: CSS-layout-dependent, RISK-ACCEPT per decisions.md ADR-004 (ADR-004 — keyboard navigation accessibility deferred to manual smoke test) |
| H8-ext | Cross-story schema dependency check | ✅ | Upstream arl-s2 must be DoD-complete before coding starts (see Proceed Only When clause). No pipeline-state.json schema fields depended on. schemaDepends: [] |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-011 (artefact-first — DoR exists before implementation), ADR-004 (RISK-ACCEPT: AC7 keyboard navigation manual-only per B2 classification — see decisions.md), ADR-018 (Playwright E2E not required — AC7 classified RISK-ACCEPT), guardrail ougl-path-traversal (tenantId from POST body validated against DB allowlist before any UPDATE — see AC8), guardrail D37-N/A (no new injectable adapter — adjustBalance and new functions share existing setCreditsAdapter) |
| H-E2E | CSS-layout-dependent AC with RISK-ACCEPT classification | ✅ | AC7 classified as B2 RISK-ACCEPT. RISK-ACCEPT recorded in decisions.md ADR-004. Manual smoke test step present in verification script Scenario 7 (marked 🔴). No automated E2E tooling needed. |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-07-03-admin-role-panel/nfr-profile.md |
| H-NFR2 | Compliance NFRs with regulatory clause have human sign-off | ✅ | No regulatory compliance NFRs — non-regulated feature |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | "Non-regulated" stated explicitly in NFR profile |
| H-NFR-profile | Story declares NFRs → NFR profile exists | ✅ | Profile present |
| H-GOV | Discovery Approved By is populated with ≥1 named entry | ✅ | "Hamish King — Platform operator — 2026-07-03" |
| H-ADAPTER | Injectable adapter check | ✅ | No new injectable adapter (setX function) introduced. New functions getAllTenantBalances() and the tenantId allowlist query are added to src/web-ui/modules/credits.js and share the existing _db wired by setCreditsAdapter. No second setter is required. D37 does not apply to additive functions on an already-injectable module. |
| H-INF | Infra-plan gate | ✅ | hasInfraTrack not set — skipped |
| H-MIG | Migration-review gate | ✅ | hasMigrationTrack not set — skipped |

**All hard blocks: PASS**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ | arl-s3-review-1.md MEDIUM 1-M1 resolved inline: AC8 (tenantId allowlist) and AC9 (HTML escaping) added to story during /review. Both ACs have tests. | Hamish King — Platform operator — 2026-07-03 |
| W4 | Verification script reviewed by domain expert | ⚠️ | Solo operator — W4 RISK-ACCEPT per architecture-guardrails.md operating posture; platform owner is sole expert and sole reviewer | Hamish King — Platform operator — 2026-07-03 |
| W5 | No UNCERTAIN items in gap table | ✅ | — | — |

---

## Proceed Only When

**arl-s2 must be DoD-complete before the coding agent starts arl-s3.** This is not a DoR gate (the DoR is signed off now), but the coding agent must verify requireAdmin middleware exists and is tested before implementing arl-s3. If arl-s2 is not yet complete, code arl-s2 first.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes (once arl-s2 is DoD-complete — see Proceed Only When clause above)
Story: arl-s3 — Admin credits page: view all balances and submit top-up
Story artefact: artefacts/2026-07-03-admin-role-panel/stories/arl-s3.md
Test plan: artefacts/2026-07-03-admin-role-panel/test-plans/arl-s3-test-plan.md
Verification script: artefacts/2026-07-03-admin-role-panel/verification-scripts/arl-s3-verification.md

Goal:
Make every test in tests/check-arl-s3-admin-credits.js pass. Do not add scope,
behaviour, or structure beyond what the tests and ACs specify.

Implementation:

TASK 1 — Extend credits.js with two new functions:
  - Add getAllTenantBalances() to src/web-ui/modules/credits.js:
      async function getAllTenantBalances() {
        const db = requireAdapter();
        const result = await db.query(
          'SELECT tenant_id, balance FROM credits ORDER BY tenant_id',
          []
        );
        return result.rows; // [{tenant_id, balance}, ...]
      }
  - Add getValidTenantIds() for the allowlist check (used by AC8 guard):
      async function getValidTenantIds() {
        const db = requireAdapter();
        const result = await db.query('SELECT tenant_id FROM credits', []);
        return result.rows.map(r => r.tenant_id);
      }
  - Export both from credits.js alongside getBalance, adjustBalance, setCreditsAdapter.
  - Both functions use the existing _db (requireAdapter()) — no new injectable setter.

TASK 2 — Create admin credits route handler:
  - Create src/web-ui/routes/admin-credits.js:
      GET /admin/credits handler:
        - call getAllTenantBalances()
        - render server-side HTML listing each tenant_id and balance
        - each row must include a form: action="/api/admin/credits/adjust",
          method="post", with hidden input name="tenantId" and number input name="amount"
        - HTML-escape all tenant_id values before interpolating into the HTML response
          (replace & < > " with &amp; &lt; &gt; &quot;)
        - return HTTP 200 with Content-Type: text/html
      POST /api/admin/credits/adjust handler:
        - parse req.body (already parsed or use a body-parser helper — follow the
          pattern from other POST routes in the codebase)
        - validate amount: parseInt(amount, 10) must be > 0 and the parsed value
          must round-trip: String(parsedAmount) === amount.trim(); return 400 if invalid
        - validate tenantId: call getValidTenantIds(); if tenantId not in list → 400
        - call adjustBalance(tenantId, parsedAmount)
        - return HTTP 302 with Location: /admin/credits

TASK 3 — Wire in server.js:
  - Import requireAdmin from src/web-ui/middleware/require-admin.js (already exists from arl-s2)
  - Import adminCreditsGetHandler and adminCreditsPostHandler from admin-credits.js
  - Register routes: pathname === '/admin/credits' && method === 'GET' → requireAdmin then get handler
  - Register routes: pathname === '/api/admin/credits/adjust' && method === 'POST' → requireAdmin then post handler
  - requireAdmin must run before the handler in both cases (AC5, AC6)

Test injection note — CRITICAL:
  The test plan references "setGetTenantIds" and "setAdjustBalance" as injection names.
  These do not exist and must NOT be created. The only injection mechanism is setCreditsAdapter
  from src/web-ui/modules/credits.js.

  In check-arl-s3-admin-credits.js, set up a multi-purpose mock DB that branches by SQL:
    const { setCreditsAdapter } = require('../src/web-ui/modules/credits');
    setCreditsAdapter({
      async query(sql, params) {
        if (sql.includes('SELECT tenant_id, balance')) {
          // getAllTenantBalances
          return { rows: [{ tenant_id: 'tenant-a', balance: 10 }, { tenant_id: 'tenant-b', balance: 0 }] };
        }
        if (sql.includes('SELECT tenant_id FROM')) {
          // getValidTenantIds
          return { rows: [{ tenant_id: 'tenant-a' }] };
        }
        if (sql.includes('UPDATE credits')) {
          // adjustBalance
          adjustSpy.calls.push(params); // track spy
          return { rows: [] };
        }
        return { rows: [] };
      }
    });
  Override the mock per-test as needed (e.g. return tenant with special chars for AC9).

Security — ougl path traversal guard:
  The tenantId from POST body is user-supplied input. Per ougl coding standards:
  - Validate against the DB allowlist (getValidTenantIds) before any UPDATE (AC8)
  - Never use tenantId in a file path or shell command
  - Log the tenantId only after validation, never the raw unvalidated value in production

HTML escaping function (must be inline in admin-credits.js — no npm dependency):
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

Constraints:
  - Node.js CommonJS only — require(), module.exports
  - No new npm dependencies (including no template engines)
  - No Express — raw res.writeHead / res.end pattern
  - HTML is assembled via Node.js string interpolation with escapeHtml applied to all
    user-derived values
  - req.session.accessToken is canonical — never use req.session.token
  - Run node tests/check-arl-s3-admin-credits.js and confirm all tests pass before PR
  - Open a draft PR when tests pass — do not mark ready for review

Test file to create: tests/check-arl-s3-admin-credits.js
Add to npm test chain in package.json: && node tests/check-arl-s3-admin-credits.js (after check-arl-s2-admin-middleware.js)
Conflict marker scan required before any git add (CLAUDE.md wsm/D40).

Oversight level: Medium
Post-merge manual action (NOT coding agent responsibility):
  After deploy: keyboard-navigate /admin/credits using Tab/Enter/Space — verify all
  tenant forms are reachable and submittable. Required by B2 RISK-ACCEPT (decisions.md
  ADR-004 — RISK-ACCEPT: arl-s3 AC7 keyboard navigation classified as manual-only;
  no automated Playwright test; verified post-deploy via smoke test).
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (solo operator — W4 RISK-ACCEPT posture)
**Signed off by:** Hamish King — Platform operator — 2026-07-03
