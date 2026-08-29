# Definition of Ready: Add the Sequence diagram type, conditionally emitted

**Story reference:** artefacts/2026-08-29-diagram-validation-and-types/stories/s5-sequence-diagram-type.md
**Test plan reference:** artefacts/2026-08-29-diagram-validation-and-types/test-plans/s5-sequence-diagram-type-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-29

---

## Contract Proposal

See `s5-sequence-diagram-type-dor-contract.md`.

## Contract Review

One ambiguity resolved (not a blocking mismatch): which SKILL.md file(s) host the new instruction. Resolved to `skills/design/SKILL.md` only, alongside System Architecture — see contract's Assumptions for full rationale.

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: Developer/engineer |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 7 tests + 1 acknowledged manual gap across 5 ACs |
| H4 | Out-of-scope section is populated | ✅ | 2 items |
| H5 | Benefit linkage field references a named metric | ✅ | New diagram type (sequence) adoption |
| H6 | Complexity is rated | ✅ | 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 2 — 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | AC1/AC2 gap explicitly acknowledged with manual scenario — see test plan gap table |
| H8-ext | Cross-story schema dependency check | ✅ | No upstream dependencies declared — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-026 + render-site-inventory pattern referenced; Run 2 Architecture compliance score 5 |
| H-E2E | CSS-layout-dependent gate | ✅ | The AC1/AC2 gap is `Untestable-by-nature` (model judgment), not `CSS-layout-dependent` — H-E2E's specific trigger condition does not apply |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-08-29-diagram-validation-and-types/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not applicable |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Profile exists |
| H-GOV | Governance approval check | ✅ | Same discovery artefact — passes |
| H-ADAPTER | Injectable adapter wiring | ✅ | No new adapter introduced — `renderCanvasBlock` dispatch is not an injectable adapter in the D37 sense |
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
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | The AC1/AC2 gap is explicitly typed and handled (manual, 🔴), not left UNCERTAIN |

---

## Standards injection

**Domain tags:** [web-ui]
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`, `.github/standards/testing/test-design-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Add the Sequence diagram type, conditionally emitted — artefacts/2026-08-29-diagram-validation-and-types/stories/s5-sequence-diagram-type.md
Test plan: artefacts/2026-08-29-diagram-validation-and-types/test-plans/s5-sequence-diagram-type-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js/CommonJS, matches existing src/web-ui/routes/skills.js conventions
- ADR-026: dispatch through the existing renderCanvasBlock/buildDiagramBodyHtml — add one more `else if` branch, do not introduce a new rendering path
- Add the new instruction to skills/design/SKILL.md only (alongside System Architecture) — not skills/definition/SKILL.md — per the contract's resolved ambiguity
- check-csd-s2-canvas-diagram-rendering.js currently asserts buildDiagramBodyHtml is called from exactly 3 diagram-type branches (4 total occurrences across both the live and read-only scripts, not 8) — this count must be updated to 4 branches (5 total occurrences) once sequence is added; do not let this check silently start failing
- Emission must be conditional (per AC2) — do not make the instruction read as unconditional like System Architecture's
- Mutation-test the new tests (.github/standards/testing/test-design-patterns.md) before trusting them
- Architecture standards: read .github/architecture-guardrails.md before implementing.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium

## Applicable standards

### .github/standards/web-ui/web-ui-patterns.md (domain: web-ui)
Read this file directly before implementing — the render-site-inventory pattern is directly applicable to this story.

### .github/standards/testing/test-design-patterns.md (domain: web-ui)
Read this file directly before implementing.
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech lead awareness required only
**Signed off by:** Hamish King — Platform Owner (confirmed aware, 2026-08-29)
