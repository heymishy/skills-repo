## Definition of Ready: The admin/credits panel is gated by per-person role, not tenant membership

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s4.md
**Test plan reference:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s4-role-gated-credits-panel-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-07-13

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ | |
| H6 | Complexity is rated | ✅ | |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1 clean — cleanest story in the batch |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | |

Full detail (including H8-ext, H-NFR/2/3, H-NFR-profile, H-GOV, H-ADAPTER, H-INF, H-MIG): see `tir-s4-dor-contract.md`.

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
Story: The admin/credits panel is gated by per-person role, not tenant membership — artefacts/2026-07-09-team-identity-roles/stories/tir-s4.md
Test plan: artefacts/2026-07-09-team-identity-roles/test-plans/tir-s4-role-gated-credits-panel-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- CommonJS only, no Express, no TypeScript.
- This is the epic's highest-security-criticality story — AC4's fail-closed
  behaviour on role ambiguity is a hard requirement, not best-effort.
  When in doubt, deny access.
- Depends on tir-s1's login-time role resolution already populating
  req.session.role correctly — verify this precondition holds rather than
  re-deriving role from the database on every request.
- Do not change what an admin can do inside the credits panel — only who
  can reach it.
- Architecture standards: read `.github/architecture-guardrails.md` before
  implementing. ADR-025 applies.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium — share this DoR artefact with the operator before
assigning.
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No
**Signed off by:** Not required — operator directly reviewing in-session
