# Definition of Ready Checklist: Extend journeys.js/products.js fixture adoption and DRY-extract the fixture-usage-check scripts

**Story reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/stories/fhff-s3-mechanical-fixture-dry-batch.md
**Test plan reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/test-plans/fhff-s3-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-11-01

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | Persona matches discovery's "Who It Affects" items 1/2 |
| H2 | ≥3 ACs in G/W/T | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test in the test plan | ✅ | All 5 have direct automated coverage, zero gaps |
| H4 | Out-of-scope populated | ✅ | 4 exclusions |
| H5 | Benefit linkage references a named metric | ✅ | m3, m4, m5 |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings from review | ✅ | Run 1: 1 HIGH found and fixed within the same review, 0 remaining |
| H8 | Test plan has no uncovered ACs | ✅ | Zero gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | Dependencies block is "None" |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | "None identified — checked"; Category E scored 5/5 at `/review` |
| H-E2E | CSS-layout-dependent AC + no tooling + no RISK-ACCEPT | ✅ N/A | No CSS-layout-dependent AC |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-11-01-fixture-hardening-fast-follows/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFR with a regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | `[x] Public` |
| H-NFR-profile | NFR profile presence | ✅ | Story NFRs populated; profile exists |
| H-GOV | `## Approved By` has ≥1 named entry | ✅ | "Hamish King — Platform Owner — 2026-11-01" |
| H-ADAPTER | Injectable adapter wiring | ✅ N/A | No `setX()` adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |
| H-DESIGN | Design-token compliance | ✅ N/A | `hasDesignSystemTrack` not set |

**All hard blocks: 15/15 passed (10 substantive + 5 N/A by trigger condition).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ | — | None (0 MEDIUM at `/review`; the 1 HIGH found was fixed within the same review, not carried forward) |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | Hamish King (solo-operator capacity) — RISK-ACCEPTed below, same precedent as every story in the parent epic |
| W5 | No UNCERTAIN gap-table items left unaddressed | ✅ | — | Zero gaps in this story's own test plan |

---

## Standards injection

**Domain tags:** [testing]
**Matched standards files:** `.github/standards/testing/test-design-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Extend journeys.js/products.js fixture adoption and DRY-extract the fixture-usage-check scripts — artefacts/2026-11-01-fixture-hardening-fast-follows/stories/fhff-s3-mechanical-fixture-dry-batch.md
Test plan: artefacts/2026-11-01-fixture-hardening-fast-follows/test-plans/fhff-s3-test-plan.md

Goal:
Make every test in the test plan pass. This story mirrors 3 already-
proven patterns from the parent epic (journey.js/skills.js/journeys.js
walking skeletons) -- follow those same shapes directly, do not
reinvent them.

Constraints:
- Before building tests/helpers/products-fixture.js, read the real
  products.js route handler code directly to ground the default
  session/request shape -- do not guess or assume compatibility
  with journeys-fixture.js's own shape just because the pattern looks
  similar. This repo has a documented precedent (team-identity-roles
  epic, tir-s5) of a reused-adapter mock-shape mismatch shipping a
  no-op feature because this exact check was skipped.
- check-skills-fixture-usage.js currently has NO dedicated regression-
  fixture/mutation-test pair (confirmed via direct search at
  /test-plan) -- creating one is part of AC4, not optional polish.
- Do not change any of the 3 scripts' own detection logic beyond what
  sharing it through the factory requires -- this is a DRY extraction,
  not a redesign. Confirm this by running each script's own existing
  regression fixtures before and after and diffing the verdicts.
- Do not retrofit journeys.js or products.js beyond the bounded
  batch sizes named in the story.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing it and do not mark ready for review.

Oversight level: Medium

## Applicable standards

### .github/standards/testing/test-design-patterns.md (matched domain: testing)

# Test Design Patterns — Cross-Cutting

Rules for writing tests that genuinely prove what they claim to prove, independent of any single domain.

## Mutation-test a fix's own new test before trusting it

When a test's entire purpose is proving a specific guard/branch is what produces an outcome, revert that specific thing and confirm the test then fails for the expected reason, before trusting it as evidence.

**Applied to this story specifically:** AC3's `check-products-fixture-usage.js` mutation-test pair, and AC4's new `check-skills-fixture-usage.js` regression pair, are exactly this shape. For each, confirm the hand-rolled fixture is flagged and the compliant one passes BEFORE wiring them into the shared factory, then confirm both still hold AFTER the refactor — this proves the factory preserves real detection power, not just that it runs without crashing.

## A whole-file source-text regex assertion is vacuous if the same string legitimately appears elsewhere in the file

Prefer scoping a regex match to the specific function/component under test, or asserting against genuine output, over a whole-file source-text search.

**Applied to this story specifically:** when building `scripts/lib/make-fixture-usage-check.js`, preserve the existing windowed-match technique in `check-journeys-fixture-usage.js` (a bounded character window after a declaration, not an unscoped whole-file regex) — this is exactly the discipline that standard describes, already correctly implemented once in this codebase; don't regress it while sharing the logic.
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness required (epic's own Rationale)
**Signed off by:** Hamish King, Platform Owner (solo-operator)
