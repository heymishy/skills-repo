## Definition of Ready: The identityKey passed to login-time role resolution must be each person's own identity, not the shared tenantId

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s9.md
**Test plan reference:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s9-per-person-identitykey-login-fix-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

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

Full detail (including H8-ext, H-NFR/2/3, H-NFR-profile, H-GOV, H-ADAPTER, H-INF, H-MIG): see `tir-s9-dor-contract.md`.

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
Story: The identityKey passed to login-time role resolution must be each person's own identity, not the shared tenantId — artefacts/2026-07-09-team-identity-roles/stories/tir-s9.md
Test plan: artefacts/2026-07-09-team-identity-roles/test-plans/tir-s9-per-person-identitykey-login-fix-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- CommonJS only, no Express, no TypeScript.
- This is a fix-forward story for a real bug: tir-s7 (PR #467, merged)
  correctly fixed resolveRoleForPerson's query logic, but server.js's
  production wiring of setGetRoleForTenant discards any identityKey a
  caller supplies, always calling
  resolveRoleForPerson(_userRolesPool, tenantId, tenantId). Every
  routes/auth.js login call site calls getRoleForTenant(tenantId) with a
  single argument, so identityKey always equals tenantId in production.
  Harmless for a solo tenant or email/password login; wrong once
  TENANT_ORG_ALLOWLIST is configured, because every teammate on that
  shared org tenant then shares the same identityKey, reproducing
  tir-s7's original person-collision bug one layer removed.
- Fix: extend getRoleForTenant(tenantId, identityKey) in user-roles.js
  with an optional second parameter, forwarded to the wired
  implementation; update server.js's wiring to accept and forward it
  (falling back to tenantId when omitted, for auth-email.js's
  unmodified single-argument call sites); update the GitHub and Google
  callbacks in routes/auth.js to pass user.login / userInfo.sub as the
  second argument.
- Do NOT modify resolveRoleForPerson, resolvePersonForIdentity, or
  auth-email.js.
- AC5 requires the wiring fix to be verified by a test that asserts two
  different identities sharing one tenantId resolve to two different,
  individually-correct roles -- not merely that a function reference or
  call shape changed.
- Before implementing the fix, confirm the new tests actually fail
  against the pre-fix code (regression proof) -- this was already done
  during dispatch; the coding agent inherits a repo where this has been
  verified, but must not remove or weaken that proof.
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
