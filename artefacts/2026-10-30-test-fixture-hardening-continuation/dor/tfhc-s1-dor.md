## Definition of Ready: Extract a shared E2E fixture for seeding an approval journey

**Story reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s1-e2e-seed-journey-fixture.md
**Test plan reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s1-e2e-seed-journey-fixture-test-plan.md
**Review artefact:** artefacts/2026-10-30-test-fixture-hardening-continuation/review/tfhc-s1-review-1.md
**Contract Proposal:** artefacts/2026-10-30-test-fixture-hardening-continuation/dor/tfhc-s1-dor-contract.md
**Assessed by:** Copilot
**Date:** 2026-10-30

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs, including AC4's revised deterministic-only scope (amended 2026-10-30 to resolve Review finding 1-M2).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format with named persona | ✅ | Persona: "developer/engineer extending existing E2E test coverage" |
| H2 | At least 3 ACs in Given/When/Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | All 4 ACs covered by E2E tests |
| H4 | Out-of-scope section populated | ✅ | Names 2 exclusions |
| H5 | Benefit linkage references a named metric | ✅ | "E2E seed-fixture duplication (m1)" |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | Review Run 1: 0 HIGH, 2 MEDIUM both resolved same-day by story amendment, 0 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency check | ✅ N/A | Dependencies block states "None" — no upstream story referenced |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Cites ADR-018 (added 2026-10-30 to resolve Review finding 1-M1) |
| H-E2E | CSS-layout-dependent AC without E2E tooling | ✅ N/A | No AC is CSS-layout-dependent; E2E tooling (Playwright) already configured per ADR-018 |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-30-test-fixture-hardening-continuation/nfr-profile.md` |
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
| W3 | MEDIUM review findings acknowledged | ✅ | — | — (0 remaining — both resolved by story amendment before this DoR run) |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases before coding begins | **RISK-ACCEPT logged in `decisions.md`, 2026-10-30 — covers tfhc-s1/s2/s3/s4 as one entry, same precedent as `tsir` epic** |
| W5 | No UNCERTAIN items left in gap table | ✅ | — | — (gap table: None) |

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
Story: Extract a shared E2E fixture for seeding an approval journey — artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s1-e2e-seed-journey-fixture.md
Test plan: artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s1-e2e-seed-journey-fixture-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Playwright (ADR-018) — fixture lives under tests/e2e/fixtures/, devDependency only, no invocation from the unit-test chain (node scripts/run-all-tests.js).
- Files in scope: tests/e2e/fixtures/seed-journey.js (new), tests/e2e/ep3-s1-regression.spec.js (modified), tests/e2e/ep2-s4-concurrent-merge.spec.js (modified). Do not touch the other 2 real callers (dsa-s2-dashboard-restyle.spec.js, ep2-s3-approval.spec.js) — fast-follow, out of scope.
- Do not modify src/web-ui/server.js's real /test/seed-approval-journey route — this story wraps it, it does not change it.
- AC4 is deterministic-only: capture a pass/fail baseline for both migrated specs before editing them, then confirm the same outcome after migration. Do not attempt to assert flakiness in a test.
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
