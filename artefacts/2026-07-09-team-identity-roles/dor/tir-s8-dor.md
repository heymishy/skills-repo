## Definition of Ready: Bulk-add fetches real GitHub org members, not the admin's own org memberships

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s8.md
**Test plan reference:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s8-real-org-members-fetch-test-plan.md
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

Full detail (including H8-ext, H-NFR/2/3, H-NFR-profile, H-GOV, H-ADAPTER, H-INF, H-MIG): see `tir-s8-dor-contract.md`.

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
Story: Bulk-add fetches real GitHub org members, not the admin's own org memberships — artefacts/2026-07-09-team-identity-roles/stories/tir-s8.md
Test plan: artefacts/2026-07-09-team-identity-roles/test-plans/tir-s8-real-org-members-fetch-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- CommonJS only, no Express, no TypeScript.
- CONFIRMED BUG (not a hypothesis): tir-s5's bulkAddFromGithubOrg reuses
  routes/auth.js's setFetchOrgs adapter, which calls GET /user/orgs --
  this lists organizations a token belongs to, NOT members of a specific
  org. Each returned .login is an ORG'S name, not a person's username.
  This makes bulk-add a functional no-op in production (every "member"
  fails resolvePersonForIdentity and gets silently skipped as
  UnknownIdentityError, so addedCount is always 0).
- Fix: add a NEW D37 adapter (setFetchOrgMembers/getOrgMembers,
  org-name-parameterized) wired to GET /orgs/{org}/members, reusing the
  exact pagination-parsing pattern already used for setFetchOrgs's
  wiring in server.js. Rewire bulkAddFromGithubOrg's _fetchAllOrgMembers
  to call the new function instead of the old one.
- Do NOT touch setFetchOrgs/resolveTenant -- correct and unrelated.
- Do NOT touch the bulk-add route, gating, skip-existing logic, or audit
  logging from tir-s5 -- all correct, only the data source changes.
- Correct tests/check-tir-s5-github-org-bulk-add.js's existing mocks
  (currently person-shaped fetchOrgs fixtures, which masked this bug) to
  use realistic getOrgMembers member-object shapes -- do not leave the
  old incorrect mock in place alongside a new one.
- ADR-025: the org name passed to getOrgMembers must always be
  req.session.tenantId, never request-supplied. Dedicated test required.
- Architecture standards: read `.github/architecture-guardrails.md`
  before implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium — this is a fix-forward story for a functional
correctness bug found immediately after tir-s5's implementation; share
this DoR artefact with the operator before assigning (already done in
this session).
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No
**Signed off by:** Not required — operator directly reviewing in-session; operator explicitly directed this fix to be filed and dispatched immediately
