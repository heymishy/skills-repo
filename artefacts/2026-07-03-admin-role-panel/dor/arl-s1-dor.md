## Definition of Ready: arl-s1 — Create user_roles DB table and load role into session for all auth paths

**Story reference:** artefacts/2026-07-03-admin-role-panel/stories/arl-s1.md
**Test plan reference:** artefacts/2026-07-03-admin-role-panel/test-plans/arl-s1-test-plan.md
**Assessed by:** Claude Sonnet 4.6 (/definition-of-ready skill)
**Date:** 2026-07-03

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with named persona | ✅ | "As a Platform operator (Hamish King)" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 7 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 10 tests across 7 ACs |
| H4 | Out-of-scope section populated — not blank or N/A | ✅ | 4 explicit exclusions |
| H5 | Benefit linkage references a named metric | ✅ | M1 (admin bypass precondition) and M3 (regression baseline) |
| H6 | Complexity is rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ | 0 HIGH findings (arl-s1-review-1.md) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | All 7 ACs covered; no gaps |
| H8-ext | Cross-story schema dependency check | ✅ | No upstream story dependencies declared — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | D37 (getUserRole adapter), ADR-011 (artefact-first), req.session.accessToken canonical |
| H-E2E | CSS-layout-dependent AC without E2E tooling or RISK-ACCEPT | ✅ | No CSS-layout-dependent ACs in this story |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-07-03-admin-role-panel/nfr-profile.md |
| H-NFR2 | Compliance NFRs with regulatory clause have human sign-off | ✅ | No regulatory compliance NFRs — non-regulated feature |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | "Non-regulated" stated explicitly in NFR profile Compliance section |
| H-NFR-profile | Story declares NFRs → NFR profile exists | ✅ | Profile present |
| H-GOV | Discovery Approved By is populated with ≥1 named entry | ✅ | "Hamish King — Platform operator — 2026-07-03" |
| H-ADAPTER | Injectable adapter (getUserRole): stub-throws AC present (AC6) ✓; wiring AC present (AC7) ✓; implementation plan names wiring as separate task ✓ | ✅ | D37 fully satisfied per all three mandatory requirements |
| H-INF | Infra-plan gate | ✅ | hasInfraTrack not set — skipped |
| H-MIG | Migration-review gate | ✅ | hasMigrationTrack not set — skipped |

**All hard blocks: PASS**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ | No MEDIUM findings on arl-s1 | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Solo operator — W4 RISK-ACCEPT per architecture-guardrails.md operating posture; platform owner is sole expert and sole reviewer | Hamish King — Platform operator — 2026-07-03 |
| W5 | No UNCERTAIN items in gap table | ✅ | — | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: arl-s1 — Create user_roles DB table and load role into session for all auth paths
Story artefact: artefacts/2026-07-03-admin-role-panel/stories/arl-s1.md
Test plan: artefacts/2026-07-03-admin-role-panel/test-plans/arl-s1-test-plan.md
Verification script: artefacts/2026-07-03-admin-role-panel/verification-scripts/arl-s1-verification.md

Goal:
Make every test in tests/check-arl-s1-user-roles.js pass. Do not add scope,
behaviour, or structure beyond what the tests and ACs specify.

Implementation order (two separate tasks per D37):
TASK 1 — DB migration + role adapter + auth path integration:
  - Add CREATE TABLE IF NOT EXISTS user_roles (tenant_id VARCHAR PRIMARY KEY, role VARCHAR NOT NULL DEFAULT 'user') to the startup auto-migration block in server.js
  - Create src/web-ui/modules/user-roles.js: export getUserRole(tenantId) and setGetUserRole(fn). Stub default MUST throw: throw new Error('Adapter not wired: getUserRole. Call setGetUserRole() before use.'). Default to 'user' if DB returns no row.
  - In src/web-ui/routes/auth.js handleAuthCallback: after setting req.session.tenantId, call getUserRole(req.session.tenantId) and assign result to req.session.role
  - In src/web-ui/routes/auth.js handleAuthGoogleCallback: same addition
  - In src/web-ui/routes/auth-email.js login handler: same addition
TASK 2 — Production wiring (separate task, separate commit or at minimum separate PR section):
  - In server.js: require user-roles.js and call setGetUserRole(async (tenantId) => { const result = await pool.query('SELECT role FROM user_roles WHERE tenant_id = $1', [tenantId]); return result.rows[0]?.role || 'user'; }) BEFORE the server.listen() call
  - Verify wiring with: const { getUserRole } = require('./src/web-ui/modules/user-roles'); // called after setGetUserRole — should not throw

Constraints:
- Node.js CommonJS only — require(), module.exports
- No new npm dependencies
- No Express — raw http.createServer pattern
- req.session.accessToken is the canonical GitHub token field — never use req.session.token
- Read .github/architecture-guardrails.md before implementing
- Do not introduce patterns listed as anti-patterns
- Run node tests/check-arl-s1-user-roles.js and confirm all tests pass before opening PR
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter ambiguity not covered by ACs or tests: add a PR comment describing it

Test file to create: tests/check-arl-s1-user-roles.js
Add to npm test chain in package.json: && node tests/check-arl-s1-user-roles.js
Conflict marker scan required before any git add (CLAUDE.md wsm/D40).

Oversight level: Medium
Post-deploy action required (NOT coding agent responsibility):
  Run seed SQL after first deploy: INSERT INTO user_roles (tenant_id, role) VALUES ('heymishy', 'admin') ON CONFLICT (tenant_id) DO UPDATE SET role = 'admin';
  This is documented in arl-s1-verification.md Scenario 8.

Applicable standards (web-ui):
- Injectable adapter pattern (D37): stub MUST throw, not return null/empty. Setter exported from route module. Production wiring in server.js as a separate task.
- req.session.accessToken is canonical — never use req.session.token
- No new npm dependencies; no Express; all session state via req.session.*
Applicable standards (auth):
- No credentials in URLs or logs
- No client-side auth decisions without server verification
- GitHub OAuth token is at req.session.accessToken — see auth-patterns.md
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (solo operator — W4 RISK-ACCEPT posture)
**Signed off by:** Hamish King — Platform operator — 2026-07-03
