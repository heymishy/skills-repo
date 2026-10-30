## Definition of Ready: Stub the real git-commit adapter in the 13 remaining skill-turn test files

**Story reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s8-skill-turn-git-commit-adapter-stubbing.md
**Test plan reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s8-skill-turn-git-commit-adapter-stubbing-test-plan.md
**Review artefact:** artefacts/2026-10-30-test-fixture-hardening-continuation/review/tfhc-s8-review-1.md
**Contract Proposal:** artefacts/2026-10-30-test-fixture-hardening-continuation/dor/tfhc-s8-dor-contract.md
**Assessed by:** Copilot
**Date:** 2026-10-31

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs (as corrected by `/review` finding 1-M1: 13 files, not the story's original 14). Each AC maps to a specific test approach already present in the test plan.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format with named persona | ✅ | Persona: "the platform maintainer who owns the long-term health of this repo's test infrastructure" |
| H2 | At least 3 ACs in Given/When/Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | All 4 ACs covered |
| H4 | Out-of-scope section populated | ✅ | Names 3 exclusions |
| H5 | Benefit linkage references a named metric | ✅ | "Parallelization risk resolution, implementation half (m9)" |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | Review Run 1: 0 HIGH; 1 MEDIUM (1-M1) resolved same session before this DoR run — re-verified the story's own AC1/AC2/AC4 text and `benefit-metric.md`/epic/`pipeline-state.json` all consistently say 13, not 14 |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block names `tfhc-s6` (spike) as upstream — narrative/spike-unlock relationship, already resolved and closed, not a schema-field dependency. No field of `tfhc-s6`'s pipeline-state entry is read by this story's own implementation. Passes without a `schemaDepends` declaration. |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | D37 injectable adapter rule correctly cited and correctly disclaims introducing a new adapter — verified accurate at `/review` |
| H-E2E | CSS-layout-dependent AC without E2E tooling | ✅ N/A | No AC is CSS-layout-dependent |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-30-test-fixture-hardening-continuation/nfr-profile.md`, updated for this story |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFRs |
| H-NFR3 | Data classification not blank | ✅ | Public |
| H-GOV | Discovery Approved By populated | ✅ | Hamish King — Platform Owner — 2026-10-30 |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No NEW `setX()` adapter introduced — this story applies the existing `setSkillTurnGitCommitAdapter` to 13 more call sites, correctly disclaimed in Architecture Constraints |
| H-INF / H-MIG / H-DESIGN | Track-specific gates | ✅ N/A | All three track flags absent |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ | — | 1-M1 was resolved directly (not deferred) before this DoR run — see `decisions.md`, "LEARNING" entry 2026-10-31 |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases before coding begins | **RISK-ACCEPT logged in `decisions.md`, 2026-10-31 — covers tfhc-s7/s8 as one entry** |
| W5 | No UNCERTAIN items left in gap table | ✅ | — | — (the one gap present is explicitly handled — re-confirmation at DoD named, not left uncertain) |

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
Story: Stub the real git-commit adapter in the 13 remaining skill-turn test files — artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s8-skill-turn-git-commit-adapter-stubbing.md
Test plan: artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s8-skill-turn-git-commit-adapter-stubbing-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Files in scope: the 13 named test files (see story AC1 for the exact list — NOT 14; check-isc-s1-ideate-success-lens-cycling.js was removed from this story's scope at /review because it never calls handlePostTurnStreamHtml at all), scripts/check-skill-turn-git-commit-stubbing.js (new), workspace/learnings.md (modified).
- For each of the 13 files, add a setSkillTurnGitCommitAdapter(...) call before its first test that drives a turn reaching done && _artefactText — copy the exact pattern from an existing safe file (e.g. tests/check-dic1-story-cards.js), do not invent a different stubbing style.
- Do not modify any test's own assertions or logic — only add the stub call. Confirm each of the 13 files' pass/fail counts are identical before and after.
- The new structural check must correctly exclude files that call handlePostTurnStreamHtml but never drive a turn with an ARTEFACT-END-bearing fixture (the 15 non-risk files) — do not flag them.
- Out of scope: implementing scripts/run-all-tests.js parallelization itself; touching any of the 12 already-stubbed files.
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
