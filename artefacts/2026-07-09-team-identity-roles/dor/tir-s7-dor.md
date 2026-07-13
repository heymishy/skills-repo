## Definition of Ready: Login role resolution is scoped by person, not just tenant

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s7.md
**Test plan reference:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s7-person-scoped-login-resolution-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-07-13

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ | |
| H6 | Complexity is rated | ✅ | |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1 clean |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | |

Full detail (including H8-ext, H-NFR/2/3, H-NFR-profile, H-GOV, H-ADAPTER, H-INF, H-MIG): see `tir-s7-dor-contract.md`.

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | | |
| W2 | Scope stability is declared | ✅ | | |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | | |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | Acknowledged — proceed (see dor-contract) |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ N/A | | |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Login role resolution is scoped by person, not just tenant — artefacts/2026-07-09-team-identity-roles/stories/tir-s7.md
Test plan: artefacts/2026-07-09-team-identity-roles/test-plans/tir-s7-person-scoped-login-resolution-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- CommonJS only, no Express, no TypeScript.
- This is a fix-forward story for a real bug already merged in tir-s1
  (PR #463): the login-time role lookup (`resolveRoleForTenant`, wired
  via `getRoleForTenant`/`setGetRoleForTenant`) currently ignores which
  person is logging in, filtering only by tenant_id with LIMIT 1. Fix it
  to resolve the authenticating identity to a personId first (reuse
  tir-s2's `resolvePersonForIdentity` from `identity-links.js` — do not
  reimplement identity resolution), then query team_memberships by BOTH
  person_id AND tenant_id.
- Do NOT add auto-creation of a new person/team_membership row for a
  brand-new signup — AC4 is a regression check (falls through to the
  existing default 'user' role), not new functionality. Confirm this by
  reading server.js: user_roles only ever gets a row via the
  ADMIN_GITHUB_LOGINS startup seed, never at ordinary signup.
- Do not touch the legacy getUserRole/setGetUserRole adapter (arl-s1) —
  only the tir-s1 getRoleForTenant/setGetRoleForTenant path.
- AC5 requires the server.js wiring update to be verified by a test, not
  just a code read.
- Architecture standards: read `.github/architecture-guardrails.md`
  before implementing. ADR-025 applies.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium — this is a fix-forward story for a security/
correctness-critical bug; share this DoR artefact with the operator
before assigning (already done in this session).
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No
**Signed off by:** Not required — operator directly reviewing in-session; operator explicitly directed this fix to be filed and dispatched immediately
