## Definition of Ready: Team-membership lookups stay indexed at ~100 members per tenant

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s6.md
**Test plan reference:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s6-schema-scale-validation-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-07-13

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 3 of 4 are `DATABASE_URL`-gated, see H8 |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ | |
| H6 | Complexity is rated | ✅ | |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1 clean (1 LOW, non-blocking) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | RISK-ACCEPT logged in decisions.md (2026-07-13) |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | |

Full detail (including H8-ext, H-NFR/2/3, H-NFR-profile, H-GOV, H-ADAPTER, H-INF, H-MIG): see `tir-s6-dor-contract.md`.

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | | |
| W2 | Scope stability is declared | ✅ | | |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | | |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | Acknowledged — proceed (see dor-contract) |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | Known gap, RISK-ACCEPT logged — not an unaddressed uncertainty | |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Team-membership lookups stay indexed at ~100 members per tenant — artefacts/2026-07-09-team-identity-roles/stories/tir-s6.md
Test plan: artefacts/2026-07-09-team-identity-roles/test-plans/tir-s6-schema-scale-validation-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- CommonJS only, no Express, no TypeScript.
- AC1/AC2/AC4 require a real Postgres connection (DATABASE_URL) to produce
  meaningful evidence — per the operator-confirmed RISK-ACCEPT
  (decisions.md, 2026-07-13), these tests must skip visibly (explicit
  skip message) when DATABASE_URL is absent, never silently pass. Do not
  mock a canned "used index" result as a substitute — that was explicitly
  rejected.
- AC2's threshold is a firm 50ms, confirmed by the operator — do not treat
  it as a placeholder.
- Check whether tir-s1's existing PRIMARY KEY (person_id, tenant_id)
  already satisfies AC1's indexing requirement before assuming a new
  index is needed.
- Architecture standards: read `.github/architecture-guardrails.md` before
  implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.
- Before this story is considered fully verified in practice (not just at
  DoR), confirm AC1/AC2/AC4 actually ran for real against a DATABASE_URL-
  backed environment at least once, not just skipped every time.

Oversight level: Medium — share this DoR artefact with the operator before
assigning.
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No
**Signed off by:** Not required — operator directly reviewing in-session
