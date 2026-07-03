## Definition of Ready: arl-s2 — Credits guard admin bypass and requireAdmin middleware

**Story reference:** artefacts/2026-07-03-admin-role-panel/stories/arl-s2.md
**Test plan reference:** artefacts/2026-07-03-admin-role-panel/test-plans/arl-s2-test-plan.md
**Assessed by:** Claude Sonnet 4.6 (/definition-of-ready skill)
**Date:** 2026-07-03

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with named persona | ✅ | "As a Platform operator (Hamish King)" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 8 tests across 6 ACs; no gaps |
| H4 | Out-of-scope section populated — not blank or N/A | ✅ | 4 explicit exclusions |
| H5 | Benefit linkage references a named metric | ✅ | M1 (admin bypass) and M3 (non-admin regression gate — M3 Metric 3 — non-admin enforcement not regressed) |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ | 0 HIGH findings (arl-s2-review-1.md) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | All 6 ACs covered; no gaps declared |
| H8-ext | Cross-story schema dependency check | ✅ | Upstream arl-s1 must be DoD-complete before coding starts (see Proceed Only When clause). No pipeline-state.json schema fields depended on — dependency is code-level only (req.session.role set by arl-s1 auth handlers). schemaDepends: [] |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | D37 not applicable (no new injectable adapters), ADR-011 (artefact-first), strict equality check required, M3 CI gate declared in architecture constraints |
| H-E2E | CSS-layout-dependent AC without E2E tooling or RISK-ACCEPT | ✅ | No CSS-layout-dependent ACs in this story |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-07-03-admin-role-panel/nfr-profile.md |
| H-NFR2 | Compliance NFRs with regulatory clause have human sign-off | ✅ | No regulatory compliance NFRs — non-regulated feature |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | "Non-regulated" stated explicitly in NFR profile |
| H-NFR-profile | Story declares NFRs → NFR profile exists | ✅ | Profile present |
| H-GOV | Discovery Approved By is populated with ≥1 named entry | ✅ | "Hamish King — Platform operator — 2026-07-03" |
| H-ADAPTER | Injectable adapter check | ✅ | No new injectable adapter introduced in this story. The creditsGuard modification reads req.session.role (session data — no DB call). requireAdmin reads req.session fields only. D37 does not apply. |
| H-INF | Infra-plan gate | ✅ | hasInfraTrack not set — skipped |
| H-MIG | Migration-review gate | ✅ | hasMigrationTrack not set — skipped |

**All hard blocks: PASS**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ | No MEDIUM findings on arl-s2 (arl-s2-review-1.md: 0H/0M/0L) | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Solo operator — W4 RISK-ACCEPT per architecture-guardrails.md operating posture; platform owner is sole expert and sole reviewer | Hamish King — Platform operator — 2026-07-03 |
| W5 | No UNCERTAIN items in gap table | ✅ | — | — |

---

## Proceed Only When

**arl-s1 must be DoD-complete before the coding agent starts arl-s2.** This is not a DoR gate (the DoR is signed off now), but the coding agent must verify this condition before writing any code. If arl-s1 is not yet complete, code the arl-s1 tests first, then arl-s2.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes (once arl-s1 is DoD-complete — see Proceed Only When clause above)
Story: arl-s2 — Credits guard admin bypass and requireAdmin middleware
Story artefact: artefacts/2026-07-03-admin-role-panel/stories/arl-s2.md
Test plan: artefacts/2026-07-03-admin-role-panel/test-plans/arl-s2-test-plan.md
Verification script: artefacts/2026-07-03-admin-role-panel/verification-scripts/arl-s2-verification.md

Goal:
Make every test in tests/check-arl-s2-admin-middleware.js pass. Do not add scope,
behaviour, or structure beyond what the tests and ACs specify.

Implementation:
TASK 1 — Modify creditsGuard to add admin bypass:
  - In src/web-ui/middleware/credits-guard.js, add before the getBalance call:
    if (req.session && req.session.role === 'admin') { return next(); }
  - The check must use strict equality (=== 'admin'). No truthy check, no loose equality.
  - Do not change any other behaviour of creditsGuard.

TASK 2 — Create requireAdmin middleware:
  - Create src/web-ui/middleware/require-admin.js
  - Export requireAdmin(req, res, next). Guard logic:
    if (!req.session || !req.session.userId || req.session.role !== 'admin') {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Forbidden' }));
      return;
    }
    next();
  - Both 'no userId' and 'non-admin role' must return 403 (not 401) — same response for
    both states to avoid route enumeration (AC5).

TASK 3 — Wire requireAdmin in server.js:
  - require require-admin.js in server.js
  - Register requireAdmin as the first middleware for all /admin/* pathnames.
    It must appear in the route matching block before any admin handler is called.

Test injection note — CRITICAL:
  The test plan references "setGetBalance" or "setAdjustBalance" as injection names.
  These do not exist. The actual injection mechanism is setCreditsAdapter from
  src/web-ui/modules/credits.js. In check-arl-s2-admin-middleware.js, to control
  what getBalance returns inside creditsGuard, inject a mock DB pool via setCreditsAdapter:
    const { setCreditsAdapter } = require('../src/web-ui/modules/credits');
    setCreditsAdapter({ query: async () => ({ rows: [{ balance: 0 }] }) });
  To assert that getBalance was NOT called (AC1), set a spy on the mock pool's query
  method and assert it was never invoked.

Constraints:
  - Node.js CommonJS only — require(), module.exports
  - No new npm dependencies
  - No Express — raw res.writeHead / res.end pattern
  - req.session.accessToken is canonical — never use req.session.token
  - Run node tests/check-arl-s2-admin-middleware.js and confirm all tests pass before PR
  - Open a draft PR when tests pass — do not mark ready for review

Test file to create: tests/check-arl-s2-admin-middleware.js
Add to npm test chain in package.json: && node tests/check-arl-s2-admin-middleware.js (after check-arl-s1-user-roles.js)
Conflict marker scan required before any git add (CLAUDE.md wsm/D40).

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (solo operator — W4 RISK-ACCEPT posture)
**Signed off by:** Hamish King — Platform operator — 2026-07-03
