## Definition of Ready: Re-validate admin role on every gated request so a mid-session demotion takes effect immediately

**Story reference:** artefacts/2026-07-01-security-perf-hardening/stories/sec-perf-s2.md
**Test plan reference:** artefacts/2026-07-01-security-perf-hardening/test-plans/sec-perf-s2-stale-role-revalidation-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track feature, no benefit-metric artefact — see dor-contract |
| H6 | Complexity is rated | ✅ | |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: 0 HIGH, 1 MEDIUM resolved via decisions.md, 1 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | |

Full detail (including H8-ext, H-NFR/2/3, H-NFR-profile, H-GOV, H-ADAPTER, H-INF, H-MIG): see `sec-perf-s2-dor-contract.md`.

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | | |
| W2 | Scope stability is declared | ✅ | | |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | | Resolved via `decisions.md` D1 |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | Acknowledged — proceed (see dor-contract) |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ N/A | | |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Re-validate admin role on every gated request so a mid-session demotion
takes effect immediately — artefacts/2026-07-01-security-perf-hardening/stories/sec-perf-s2.md
Test plan: artefacts/2026-07-01-security-perf-hardening/test-plans/sec-perf-s2-stale-role-revalidation-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- CommonJS only, no Express, no TypeScript.
- This is a fix-forward story for a real gap found by direct code reading:
  req.session.role is set once at login (routes/auth.js, routes/auth-email.js)
  and never re-checked or invalidated for the life of the session.
  team-management.js's addOrUpdateTeammate (tir-s3) can change a person's role
  in team_memberships, but that write never touches the target person's live
  session -- so a demoted admin keeps stale admin access (e.g. to
  /admin/credits, gated by requireAdmin) until they log out and back in.
- Fix: add a new injectable adapter to src/web-ui/middleware/require-admin.js
  -- setGetCurrentRole(fn) / internal _getCurrentRole, defaulting to null
  (unwired). Make requireAdmin async. When wired and the session has a
  userId, call _getCurrentRole(req.session.tenantId) to get the live role,
  overwrite req.session.role with it (self-heal), and grant access only if
  the live value is exactly 'admin'. On adapter rejection, deny (fail
  closed). When unwired, preserve requireAdmin's EXACT pre-story behaviour
  (synchronous decision from cached req.session.role, no await in that
  branch) -- do not add any await before the decision when the adapter is
  not wired, or the existing arl-s2/tir-s4/tir-s5 test files (which are NOT
  modified by this story) will break.
- Wire it in server.js: setGetCurrentRole to a closure calling the
  already-imported getRoleForTenant(tenantId) from user-roles.js (the SAME
  adapter already used at login -- do not introduce a second, parallel
  role-resolution code path). Add getRoleForTenant to the existing
  destructured require of './modules/user-roles' if not already present.
  Add `await` to all 5 existing requireAdmin(req, res, ...) call sites in
  server.js (search for "requireAdmin(req, res," -- each one currently
  reads a `_raOk` flag synchronously immediately after the call, which will
  break once requireAdmin does a real await internally).
- Do NOT modify addOrUpdateTeammate, team_memberships, credits-guard.js, or
  any of tests/check-arl-s2-admin-middleware.js,
  tests/check-tir-s4-role-gated-credits-panel.js,
  tests/check-tir-s5-github-org-bulk-add.js -- all three must continue to
  pass completely unmodified (they exercise requireAdmin unwired).
- AC5 requires the wiring to be verified by a test that asserts two
  different sessions sharing one tenantId resolve to two different,
  individually-correct roles through the actual wired closure -- not merely
  that a function reference was assigned.
- Before implementing the fix, confirm the new tests actually fail against
  the pre-fix code (regression proof).
- Architecture standards: read `.github/architecture-guardrails.md` before
  implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium — this is a fix-forward story for a
security/correctness-critical bug; share this DoR artefact with the
operator before assigning (already done in this session).
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No
**Signed off by:** Not required — operator directly reviewing in-session; fix-forward security gap dispatched immediately per this session's brief
