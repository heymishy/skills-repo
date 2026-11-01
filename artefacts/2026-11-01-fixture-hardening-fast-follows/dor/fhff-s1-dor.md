# Definition of Ready Checklist: Sweep fragile wall-clock NFR budgets and re-tune run-all-tests.js's concurrency cap

**Story reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/stories/fhff-s1-nfr-budget-sweep-concurrency-retune.md
**Test plan reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/test-plans/fhff-s1-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-11-01

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | Persona matches discovery's "Who It Affects" item 1 |
| H2 | ≥3 ACs in G/W/T | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test in the test plan | ✅ | AC2 has a unit test; AC1/AC3/AC4/AC5 have explicit manual NFR-test entries, not silently uncovered |
| H4 | Out-of-scope populated | ✅ | 4 exclusions |
| H5 | Benefit linkage references a named metric | ✅ | m1, m2 |
| H6 | Complexity rated | ✅ | 3 |
| H7 | No unresolved HIGH findings from review | ✅ | Run 1: 0 HIGH, 1 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | All 5 explicitly handled (1 unit, 4 manual with named Coverage gaps entries) |
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
| W3 | MEDIUM review findings acknowledged | ✅ | — | None to acknowledge (0 MEDIUM at `/review`) |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | Hamish King (solo-operator capacity) — RISK-ACCEPTed below, same precedent as every story in the parent epic |
| W5 | No UNCERTAIN gap-table items left unaddressed | ✅ | — | All 4 Coverage gaps entries have a named handling mechanism, not left open |

---

## Standards injection

**Domain tags:** [testing]
**Matched standards files:** `.github/standards/testing/test-design-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Sweep fragile wall-clock NFR budgets and re-tune run-all-tests.js's concurrency cap — artefacts/2026-11-01-fixture-hardening-fast-follows/stories/fhff-s1-nfr-budget-sweep-concurrency-retune.md
Test plan: artefacts/2026-11-01-fixture-hardening-fast-follows/test-plans/fhff-s1-test-plan.md

Goal:
Make every test in the test plan pass. This story is deliberately
investigation-heavy — AC1/AC3/AC4/AC5 are real-environment manual
verifications, not synthetic unit tests (see the test plan's own
Honest scoping note for why). Do not try to force these into
synthetic tests; follow the plan's own AC-coverage mapping.

Constraints:
- Plain Node, no test framework.
- Do not build a synthetic mini-batch test to simulate contention —
  the test plan explicitly rejected this approach as testing a
  different, easier problem than what the ACs actually claim.
- Do not add a CLI flag or environment variable to make concurrency
  operator-configurable.
- Do not modify any .github/workflows/*.yml file.
- Do not fix any file beyond the 3 named (rb-s3, cat-s4, cat-s1)
  without first logging a decision — if the sweep finds more fragile
  files, stop and add a PR comment describing the finding.
- If fixing one of the 3 files would require a threshold wide enough
  that it would never meaningfully fail, do not force it through —
  defer that specific file's fix and log it in decisions.md (AC5).
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing it and do not mark ready for review.

Oversight level: Medium

## Applicable standards

### .github/standards/testing/test-design-patterns.md (matched domain: testing)

# Test Design Patterns — Cross-Cutting

Rules for writing tests that genuinely prove what they claim to prove, independent of any single domain.

## Mutation-test a fix's own new test before trusting it

When a code-quality review or a corrective task adds a NEW test specifically to prove a specific bug is fixed, do not trust that the test passing means the fix is real. Temporarily revert the fix and re-run the unmodified test. If the test still passes with the fix reverted, the test is not exercising what it claims to.

**Applied to this story specifically:** the AC2 unit test on `getPoolConcurrency()` should be checked this way — temporarily set the function to return the OLD value, confirm the test fails; restore, confirm it passes. This is cheap and directly verifies the test has real discriminating power before trusting it.

## A whole-file source-text regex assertion is vacuous if the same string legitimately appears elsewhere in the file

Prefer asserting against genuine runtime OUTPUT over source TEXT wherever a real call is reachable.

**Applied to this story specifically:** this is exactly why AC2's test calls `getPoolConcurrency()` directly rather than regex-matching the file's own source text for a number — a source-text match would be fragile and exactly the vacuous-test shape this standard warns against.
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness required (epic's own Rationale)
**Signed off by:** Hamish King, Platform Owner (solo-operator)
