## Definition of Ready: Extract a shared mockReq/mockRes fixture module for journey.js tests

**Story reference:** artefacts/2026-10-29-test-suite-infra-refactor/stories/tsir-s1-shared-journey-fixture-module.md
**Test plan reference:** artefacts/2026-10-29-test-suite-infra-refactor/test-plans/tsir-s1-shared-journey-fixture-module-test-plan.md
**Contract Proposal:** artefacts/2026-10-29-test-suite-infra-refactor/dor/tsir-s1-dor-contract.md
**Assessed by:** Copilot
**Date:** 2026-10-29

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs. Every AC maps to a specific test approach in the test plan; no mismatch found between the contract's "What will be built" and the story's stated ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format with named persona | ✅ | Persona: "developer/engineer debugging or extending journey.js's existing test coverage" — matches discovery.md's named persona list |
| H2 | At least 3 ACs in Given/When/Then format | ✅ | 4 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: 2 unit tests, AC2: 1 integration test, AC3: 1 unit test, AC4: 1 unit test |
| H4 | Out-of-scope section populated | ✅ | Names 2 exclusions |
| H5 | Benefit linkage references a named metric | ✅ | "Fixture duplication" |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | Review Run 2: 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block: Upstream "None" — no upstream dependency declared, schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | "None identified — checked against .github/architecture-guardrails.md"; Review Category E: no findings |
| H-E2E | CSS-layout-dependent AC without E2E tooling | ✅ N/A | No AC is CSS-layout-dependent |
| H-NFR | NFR profile exists or story states "None — reviewed" | ✅ | `artefacts/2026-10-29-test-suite-infra-refactor/nfr-profile.md` exists, Status: Active |
| H-NFR2 | Compliance NFR with named clause has human sign-off | ✅ N/A | No compliance NFRs present |
| H-NFR3 | Data classification not blank | ✅ | nfr-profile.md: Public (checked) |
| H-GOV | Discovery `## Approved By` has ≥1 non-blank named entry | ✅ | "Hamish King — Platform Owner — 2026-10-29" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | This story introduces no `setX()` injectable adapter |
| H-INF / H-MIG / H-DESIGN | Infra/migration/design-system tracks | ✅ N/A | `hasInfraTrack`/`hasMigrationTrack`/`hasDesignSystemTrack` all absent on this story |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ | — | — (Run 2: 0 MEDIUM remaining) |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases before coding begins | **Pending — see below** |
| W5 | No UNCERTAIN items left in gap table | ✅ | — | — (gap table: None) |

---

## Oversight level

**Oversight:** Medium (from parent epic — `.github/architecture-guardrails.md` guidance + epic rationale: low technical risk, but this epic exists because a fixture-divergence gap contributed to `ctpl-s1`)

---

## Standards injection

Domain tags: `[testing]`
Matched standards files: `.github/standards/testing/test-design-patterns.md`

These will be appended to the coding agent instructions block.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Extract a shared mockReq/mockRes fixture module for journey.js tests — artefacts/2026-10-29-test-suite-infra-refactor/stories/tsir-s1-shared-journey-fixture-module.md
Test plan: artefacts/2026-10-29-test-suite-infra-refactor/test-plans/tsir-s1-shared-journey-fixture-module-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Plain Node.js (CommonJS, `require()`), no new npm dependencies — matches this repo's existing tests/check-*.js convention (assert module + this repo's own test(name, fn) helper).
- Files in scope: tests/helpers/journey-fixture.js (new), tests/check-tsir-s1-shared-journey-fixture.js (new), tests/check-ep1-s1-journey-feature-merge.js (migrate only — do not change its own test assertions' intent).
- Out of scope: any other journey.js-touching test file; skills.js/products.js/journeys.js consumers.
- Architecture standards: read `.github/architecture-guardrails.md` before implementing. No anti-pattern or mandatory-constraint violations found at review time.
- Ground the default mockReq.session shape in journey.js's REAL req.session reads (grep the route file yourself — do not copy an existing hand-rolled mock's shape verbatim, since those are what currently diverge).
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review.

## Applicable standards

### .github/standards/testing/test-design-patterns.md (domain: testing)
[Full text injected at DoR time — see that file for the "mutation-test a fix's own new test" and "vacuous whole-file regex assertion" rules. Not directly triggered by this story's own ACs (no bug-fix-proving test here), but read before writing AC3's tenantId-collision test, which is exactly the class of test these rules apply to.]

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only
**Signed off by:** Not required (Medium oversight)
