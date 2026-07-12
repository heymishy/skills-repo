## Definition of Ready: Person and team-membership schema replaces tenant-wide role lookup

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s1.md
**Test plan reference:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s1-person-team-schema-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-07-13

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ | |
| H6 | Complexity is rated | ✅ | |
| H7 | No unresolved HIGH findings from the review report | ✅ | |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged in /decisions) | ✅ | |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-ADAPTER | D37 adapter wiring check | ✅ | Gap found and fixed during this DoR pass — see dor-contract, logged in decisions.md |

Full detail (including H8-ext, H-NFR/2/3, H-NFR-profile, H-GOV, H-INF, H-MIG): see `tir-s1-dor-contract.md`.

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
Story: Person and team-membership schema replaces tenant-wide role lookup — artefacts/2026-07-09-team-identity-roles/stories/tir-s1.md
Test plan: artefacts/2026-07-09-team-identity-roles/test-plans/tir-s1-person-team-schema-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- CommonJS only, no Express, no TypeScript (per this repo's conventions).
- D37 injectable adapter rule applies: the replacement/extended adapter's
  stub default MUST throw, not silently return null/empty. AC6 requires
  the production wiring in server.js to be rewired as its own distinct
  task in the implementation plan, separate from the handler/call-site
  update task — do not bundle them into one task.
- `req.session.accessToken` is the canonical session token field name —
  never `req.session.token`.
- Do not remove the legacy `user_roles` table or its adapter code in this
  story — leaving it in place, unused, is explicitly in scope per Out of
  Scope.
- Architecture standards: read `.github/architecture-guardrails.md` before
  implementing. ADR-025 applies (tenant scoping stays the isolation
  boundary; this story adds a person-scoping layer inside it, not a
  parallel mechanism).
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium — share this DoR artefact with the operator before
assigning (solo-operator repo; the operator reviews this directly).
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (Medium = awareness, not formal sign-off)
**Signed off by:** Not required — operator directly reviewing in-session
