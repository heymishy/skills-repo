## Definition of Ready: arl-s5 — Audit trail for admin credit adjustments

**Story reference:** artefacts/2026-07-03-admin-role-panel/stories/arl-s5.md
**Test plan reference:** artefacts/2026-07-03-admin-role-panel/test-plans/arl-s5-test-plan.md
**Review reference:** artefacts/2026-07-03-admin-role-panel/review/arl-s5-review-1.md
**Assessed by:** Claude Sonnet 5 (/definition-of-ready skill)
**Date:** 2026-07-11

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with named persona | ✅ | "As a Platform operator (Hamish King)" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 7 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 9 tests across 7 ACs (AC3/AC6 share one behavioural wiring test; AC4 has 2 sub-scenarios) |
| H4 | Out-of-scope section populated — not blank or N/A | ✅ | 5 explicit exclusions |
| H5 | Benefit linkage references a named metric | ⚠️ N/A | No numeric M-metric target moved; linkage instead cites the exact deferred-scope sentence in discovery.md's Out of Scope section. Acknowledged as review finding 1-L1 (accepted, no action). |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ | 0 HIGH findings (arl-s5-review-1.md) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | Zero coverage gaps — no CSS-layout-dependent or browser-only ACs in this story |
| H8-ext | Cross-story schema dependency check | ✅ | Upstream arl-s3 must be DoD-complete before coding starts (confirmed already complete — PR #435 merged). No pipeline-state.json schema fields depended on beyond the existing epics[].stories[] shape. schemaDepends: [] |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-011 (artefact-first), no-new-D37-adapter (additive functions on already-injectable credits.js, per arl-s3 H-ADAPTER precedent), idempotent-migration convention named explicitly, no-Express/no-npm-deps/CommonJS, accessToken-never-persisted constraint with dedicated AC7 |
| H-E2E | CSS-layout-dependent AC with RISK-ACCEPT classification | ✅ N/A | No CSS-layout-dependent ACs in this story — no UI is built (audit write only) |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-07-03-admin-role-panel/nfr-profile.md (feature-level profile; this story's NFRs — immutability, integrity, security, performance — are additive and consistent with it) |
| H-NFR2 | Compliance NFRs with regulatory clause have human sign-off | ✅ | No regulatory compliance NFRs — non-regulated feature (per pipeline-state.json `regulated: false`) |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | "Non-regulated" stated explicitly in feature NFR profile |
| H-GOV | Discovery Approved By is populated with ≥1 named entry | ✅ | Inherited from feature discovery.md: "Hamish King — Platform operator — 2026-07-03" |
| H-ADAPTER | Injectable adapter check | ✅ | No new injectable adapter (`setX` function) introduced. New functions `adjustBalanceWithAudit()` and `getAuditLog()` are added to `src/web-ui/modules/credits.js` and share the existing `_db` wired by `setCreditsAdapter`. D37 does not apply to additive functions on an already-injectable module (matches arl-s3 precedent exactly). The story nonetheless includes a D37-flavoured behavioural wiring test (AC3/AC6) as good practice per CLAUDE.md's `team-identity-roles` lesson, even though it is not strictly required. |
| H-INF | Infra-plan gate | ✅ | hasInfraTrack not set — skipped |
| H-MIG | Migration-review gate | ✅ | hasMigrationTrack not set — skipped |

**All hard blocks: PASS**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|-------------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | 0 MEDIUM findings | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Solo operator — W4 RISK-ACCEPT per architecture-guardrails.md operating posture; platform owner is sole expert and sole reviewer | Hamish King — Platform operator — 2026-07-11 |
| W5 | No UNCERTAIN items in gap table | ✅ | — | — |

---

## Proceed Only When

arl-s3 is already DoD-complete (PR #435 merged) — no blocking upstream dependency. Proceed immediately.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: arl-s5 — Audit trail for admin credit adjustments
Story artefact: artefacts/2026-07-03-admin-role-panel/stories/arl-s5.md
Test plan: artefacts/2026-07-03-admin-role-panel/test-plans/arl-s5-test-plan.md

Goal:
Make every test in tests/check-arl-s5-credit-audit-log.js pass. Do not add scope,
behaviour, or structure beyond what the tests and ACs specify. No new D37 adapter --
reuse the existing setCreditsAdapter-wired _db in src/web-ui/modules/credits.js.

Implementation:

TASK 1 -- Extend credits.js with the audit-write and audit-read functions:
  - Add adjustBalanceWithAudit(tenantId, delta, adminId) to src/web-ui/modules/credits.js:
      async function adjustBalanceWithAudit(tenantId, delta, adminId) {
        const db = requireAdapter();
        const result = await db.query(
          'UPDATE credits SET balance = balance + $1, updated_at = now() WHERE tenant_id = $2 RETURNING balance',
          [delta, tenantId]
        );
        const balanceAfter = result.rows.length ? result.rows[0].balance : null;
        const balanceBefore = balanceAfter === null ? null : balanceAfter - delta;
        await db.query(
          'INSERT INTO credit_audit_log (tenant_id, admin_id, delta, balance_before, balance_after) VALUES ($1, $2, $3, $4, $5)',
          [tenantId, adminId, delta, balanceBefore, balanceAfter]
        );
        return { balanceBefore: balanceBefore, balanceAfter: balanceAfter };
      }
  - Add getAuditLog(tenantId):
      async function getAuditLog(tenantId) {
        const db = requireAdapter();
        const result = await db.query(
          'SELECT tenant_id, admin_id, delta, balance_before, balance_after, created_at FROM credit_audit_log WHERE tenant_id = $1 ORDER BY created_at DESC',
          [tenantId]
        );
        return result.rows;
      }
  - Export both from credits.js alongside the existing exports (getBalance, adjustBalance,
    setCreditsAdapter, getAllTenantBalances, getValidTenantIds). Do NOT remove adjustBalance --
    it may still be used elsewhere; adjustBalanceWithAudit is additive.
  - Both functions use the existing _db (requireAdapter()) -- no new injectable setter (H-ADAPTER).

TASK 2 -- Update admin-credits.js POST handler to call the audited path:
  - In src/web-ui/routes/admin-credits.js, change the import to include adjustBalanceWithAudit
    alongside the existing imports from '../modules/credits'.
  - In adminCreditsPost, after tenantId/amount validation passes, derive adminId:
      const adminId = String((req.session && (req.session.login || req.session.userId)) || 'unknown');
    Never use req.session.accessToken here (AC7).
  - Replace the existing `await adjustBalance(tenantId, amountNum);` call with:
      await adjustBalanceWithAudit(tenantId, amountNum, adminId);
  - No other behaviour changes to the handler (response codes, redirect target, validation order
    all stay exactly as arl-s3 shipped them).

TASK 3 -- Wire the credit_audit_log table migration in server.js:
  - In the same auto-migration startup block where `credits` and `stripe_events` tables are
    created (server.js, near the existing `CREATE TABLE IF NOT EXISTS credits` /
    `CREATE TABLE IF NOT EXISTS stripe_events` calls, using the same _creditsPool), add:
      _creditsPool.query(`
        CREATE TABLE IF NOT EXISTS credit_audit_log (
          id              BIGSERIAL PRIMARY KEY,
          tenant_id       VARCHAR NOT NULL,
          admin_id        VARCHAR NOT NULL,
          delta           INTEGER NOT NULL,
          balance_before  INTEGER,
          balance_after   INTEGER,
          created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `).then(function() { console.log('credit_audit_log table ready'); })
        .catch(function(err) { console.error('credit_audit_log table migration failed:', err.message); });
  - No new adapter wiring call is needed -- this table is queried through the same
    _creditsPool/_db already wired via setCreditsAdapter(_creditsPool) for the credits table.

Test injection note -- CRITICAL (same pattern as arl-s3):
  Use a multi-purpose mock DB in check-arl-s5-credit-audit-log.js that branches by SQL text:
    - sql.includes('SELECT tenant_id FROM') -> allowlist rows
    - sql.includes('UPDATE credits') && sql.includes('RETURNING') -> { rows: [{ balance: <after> }] }
    - sql.includes('INSERT INTO credit_audit_log') -> capture params via spy, return { rows: [] }
    - sql.includes('SELECT') && sql.includes('credit_audit_log') -> return captured audit rows
  For AC3/AC6 (behavioural wiring), build a small stateful mock that tracks a balance map and an
  audit array, so adjustBalanceWithAudit + getAuditLog can be exercised as a genuine round trip
  rather than two independently-stubbed calls -- this is what proves per-actor correctness, not
  just that a write happened (per CLAUDE.md D37 rule 4, applied here as good practice).

Security -- accessToken must never be persisted (AC7):
  Derive adminId from req.session.login (fallback req.session.userId), never
  req.session.accessToken. Add a test where req.session.accessToken is set to an obviously
  fake secret-shaped string and assert it never appears in any INSERT param.

Constraints:
  - Node.js CommonJS only -- require(), module.exports
  - No new npm dependencies
  - No Express -- raw res.writeHead / res.end pattern unaffected (no route/response shape changes)
  - No new D37 adapter -- reuse setCreditsAdapter's existing _db
  - credit_audit_log is insert-only in this story -- no UPDATE/DELETE code path against it anywhere
  - Run node tests/check-arl-s5-credit-audit-log.js and confirm all tests pass before PR
  - Run the full suite (node scripts/run-all-tests.js or npm test) to confirm no regression in
    arl-s3's existing tests/check-arl-s3-admin-credits.js (adjustBalance export must remain intact)
  - Open a draft PR when tests pass -- do not mark ready for review

Test file to create: tests/check-arl-s5-credit-audit-log.js
No package.json edit needed -- scripts/run-all-tests.js auto-discovers tests/check-*.js (pcr-s1).
Conflict marker scan required before any git add (CLAUDE.md wsm/D40).

State bookkeeping:
  Add the arl-s5 story object into .github/pipeline-state.json under
  features[slug='2026-07-03-admin-role-panel'].epics[id='arl-e1'].stories[] on this story's
  OWN branch only. Do NOT also push a copy directly to master -- bundle the state update into
  this story's PR/branch per CLAUDE.md's epic-nested-story bookkeeping rule and per the explicit
  instruction to avoid repeating the pcr-s1 sibling-agent merge-conflict incident.

Oversight level: Medium
Post-merge manual action: None required -- no CSS-layout-dependent AC, no manual smoke test needed.
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (solo operator — W4 RISK-ACCEPT posture)
**Signed off by:** Hamish King — Platform operator — 2026-07-11
