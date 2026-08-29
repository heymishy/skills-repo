# Definition of Ready: Structured diagnostic for invalid mermaid syntax inside a diagram

**Story reference:** artefacts/2026-08-29-diagram-validation-and-types/stories/s2-mermaid-syntax-diagnostic.md
**Test plan reference:** artefacts/2026-08-29-diagram-validation-and-types/test-plans/s2-mermaid-syntax-diagnostic-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-29

---

## Contract Proposal

See `s2-mermaid-syntax-diagnostic-dor-contract.md`.

## Contract Review

One clarification noted (not a blocking mismatch): AC2 could be read as requiring the failure reason to be inserted into the pre-existing `<details>` element specifically, but AC1's error box itself already satisfies the real requirement (text, not colour alone) — recorded in the contract's Assumptions so the implementer doesn't duplicate effort.

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: Developer/engineer |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 8 tests across 4 ACs |
| H4 | Out-of-scope section is populated | ✅ | 2 items |
| H5 | Benefit linkage field references a named metric | ✅ | Diagram render-failure diagnosability |
| H6 | Complexity is rated | ✅ | 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 1 — 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | No gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Upstream: S1 (reuses diagnostic shape) — `schemaDepends: ["dorStatus"]` declared; field confirmed present in `pipeline-state.schema.json` |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-026 + testing-standards referenced; Run 1 Architecture compliance score 5 |
| H-E2E | CSS-layout-dependent gate | ✅ | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-08-29-diagram-validation-and-types/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not applicable |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Profile exists |
| H-GOV | Governance approval check | ✅ | Same discovery artefact as S1 — passes |
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
| W3 | MEDIUM review findings acknowledged | ✅ | — | 0 MEDIUM — not applicable |
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
Story: Structured diagnostic for invalid mermaid syntax inside a diagram — artefacts/2026-08-29-diagram-validation-and-types/stories/s2-mermaid-syntax-diagnostic.md
Test plan: artefacts/2026-08-29-diagram-validation-and-types/test-plans/s2-mermaid-syntax-diagnostic-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js/CommonJS, matches existing src/web-ui/routes/skills.js conventions
- ADR-026: modify markDiagramRenderError in the single shared _CANVAS_RENDER_FN_LINES array — do not create a second copy for the live vs. read-only history scripts
- Depends on S1 (reuses its diagnostic shape for consistency) — confirm S1's dorStatus/prStatus in pipeline-state.json before assuming its shape is stable (H8-ext)
- Do not duplicate the failure reason into both the error box AND the pre-existing <details> element — the error box's own text already satisfies the accessibility requirement (see contract's Assumptions)
- The surfaced error text must be escaped before DOM insertion — no raw-HTML injection
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
