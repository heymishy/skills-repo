## Definition of Ready: Extract a shared mockReq/mockRes fixture module for journeys.js tests

**Story reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s7-journeys-js-fixture-walking-skeleton.md
**Test plan reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s7-journeys-js-fixture-walking-skeleton-test-plan.md
**Review artefact:** artefacts/2026-10-30-test-fixture-hardening-continuation/review/tfhc-s7-review-1.md
**Contract Proposal:** artefacts/2026-10-30-test-fixture-hardening-continuation/dor/tfhc-s7-dor-contract.md
**Assessed by:** Copilot
**Date:** 2026-10-31

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs. The contract's file list exactly matches the test plan's own Data requirements per AC, and each AC maps to a specific, already-proven test approach (same shape as `tfhc-s3`'s own contract, which shipped cleanly).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format with named persona | ✅ | Persona: "developer/engineer debugging or extending journeys.js's existing test coverage" |
| H2 | At least 3 ACs in Given/When/Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | All 5 ACs covered |
| H4 | Out-of-scope section populated | ✅ | Names 3 exclusions |
| H5 | Benefit linkage references a named metric | ✅ | "journeys.js fixture duplication (m8)" |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | Review Run 1: 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block names `tfhc-s5` (spike) as upstream, but this is a narrative/spike-unlock relationship, already resolved and closed — not a schema-field dependency. No field of `tfhc-s5`'s pipeline-state entry is read by this story's own implementation or tests, and the Contract Proposal declares no `schemaDepends`. Passes without requiring one. |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | `product/constraints.md` #13 + CLAUDE.md Platform change policy, both verified accurate at `/review` |
| H-E2E | CSS-layout-dependent AC without E2E tooling | ✅ N/A | No AC is CSS-layout-dependent |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-30-test-fixture-hardening-continuation/nfr-profile.md`, updated for this story |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFRs |
| H-NFR3 | Data classification not blank | ✅ | Public |
| H-GOV | Discovery Approved By populated | ✅ | Hamish King — Platform Owner — 2026-10-30 |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No `setX()` adapter introduced |
| H-INF / H-MIG / H-DESIGN | Track-specific gates | ✅ N/A | All three track flags absent |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ | — | — (0 MEDIUM) |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases before coding begins | **RISK-ACCEPT logged in `decisions.md`, 2026-10-31 — covers tfhc-s7/s8 as one entry** |
| W5 | No UNCERTAIN items left in gap table | ✅ | — | — (no gaps present) |

---

## Oversight level

**Oversight:** Medium (from parent epic `fixture-divergence-closure`)

---

## Standards injection

Domain tags: `[testing]`
Matched standards files: `.github/standards/testing/test-design-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Extract a shared mockReq/mockRes fixture module for journeys.js tests — artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s7-journeys-js-fixture-walking-skeleton.md
Test plan: artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s7-journeys-js-fixture-walking-skeleton-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Files in scope: tests/helpers/journeys-fixture.js (new), tests/check-journeys-fixture-self-test.js (new), tests/check-ep3-s2-journey-health.js (modified — migrate its one inline session literal only), scripts/check-journeys-fixture-usage.js (new), tests/fixtures/tfhc-s7-hand-rolled-mockreq.js (new), tests/fixtures/tfhc-s7-shared-fixture-usage.js (new), skills/review/SKILL.md (modified — add Category H, update category count at BOTH the Step 1 announcement line and the rssp-s1 operational instruction).
- journeysFixture()'s default session must be exactly { tenantId: <non-empty default> } — do not add accessToken/login/userId/role/csrfToken to the default; journeys.js's own code reads only tenantId (confirmed via grep).
- The self-test must independently re-derive journeys.js's real session fields from source at test-run time (regex scan of req.session.<field> in src/web-ui/routes/journeys.js) — do not hardcode the field list.
- The structural check's detection regex must match ad-hoc inline literals (const/var/let req = { session: {...} }), not just a named mockReq factory function — 0 of the 30 real journeys.js consumers use even a local factory.
- Out of scope: migrating any of the other 29 hand-rolled journeys.js files; any products.js work; promoting the check to a DoR hard block.
- Architecture standards: .github/standards/testing/test-design-patterns.md injected below.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review.

## Applicable standards

### .github/standards/testing/test-design-patterns.md (domain: testing)
[Full text injected at DoR time.]

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only
**Signed off by:** Not required (Medium oversight)
