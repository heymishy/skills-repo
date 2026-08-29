# Definition of Ready: Drift-comparator recognizes subgraphs

**Story reference:** artefacts/2026-08-29-diagram-validation-and-types/stories/s4-drift-comparator-subgraphs.md
**Test plan reference:** artefacts/2026-08-29-diagram-validation-and-types/test-plans/s4-drift-comparator-subgraphs-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-29

---

## Contract Proposal

See `s4-drift-comparator-subgraphs-dor-contract.md`.

## Contract Review

✅ **Contract review passed** — no mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: Tech lead / squad lead |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 5 tests across 4 ACs |
| H4 | Out-of-scope section is populated | ✅ | 2 items |
| H5 | Benefit linkage field references a named metric | ✅ | Drift-comparator parsing accuracy |
| H6 | Complexity is rated | ✅ | 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 2 — 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | No gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Upstream: S3 — `schemaDepends: ["dorStatus"]` declared; field confirmed present in `pipeline-state.schema.json` |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Stack constraint + testing-standards referenced (added at Run 2); Run 2 Architecture compliance score 5 |
| H-E2E | CSS-layout-dependent gate | ✅ | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-08-29-diagram-validation-and-types/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not applicable |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Profile exists |
| H-GOV | Governance approval check | ✅ | Same discovery artefact — passes |
| H-ADAPTER | Injectable adapter wiring | ✅ | No new adapter introduced |
| H-INF | Infra-plan gate | ✅ | Not applicable |
| H-MIG | Migration-review gate | ✅ | Not applicable |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | Stable |
| W3 | MEDIUM review findings acknowledged | ✅ | — | Run 2 has 0 MEDIUM — not applicable |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | RISK-ACCEPT logged in `decisions.md` (2026-08-29) — covers all 5 stories in this batch |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | No gaps |

---

## Standards injection

**Domain tags:** [web-ui]
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`, `.github/standards/testing/test-design-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Drift-comparator recognizes subgraphs — artefacts/2026-08-29-diagram-validation-and-types/stories/s4-drift-comparator-subgraphs.md
Test plan: artefacts/2026-08-29-diagram-validation-and-types/test-plans/s4-drift-comparator-subgraphs-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js/CommonJS, matches existing src/modules/drift-comparator.js conventions
- Depends on S3 (same parser function) — implement after S3 is committed, confirm S3's dorStatus/prStatus before assuming its parsing changes are stable (H8-ext)
- Hand-rolled regex/line-scan parsing only — no new npm dependency
- Mutation-test the new subgraph-parsing tests (.github/standards/testing/test-design-patterns.md) before trusting them
- Nested subgraphs are explicitly out of scope — do not build support speculatively
- Architecture standards: read .github/architecture-guardrails.md before implementing.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium

## Applicable standards

### .github/standards/web-ui/web-ui-patterns.md (domain: web-ui)
Read this file directly before implementing.

### .github/standards/testing/test-design-patterns.md (domain: web-ui)
Read this file directly before implementing.
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech lead awareness required only
**Signed off by:** Hamish King — Platform Owner (confirmed aware, 2026-08-29)
