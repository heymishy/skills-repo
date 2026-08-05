# Definition of Ready Checklist

## Definition of Ready: Optionally install the full outer loop during bootstrap

**Story reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s5-optional-outer-loop-install.md
**Test plan reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/test-plans/rb-s5-test-plan.md
**Assessed by:** Copilot (Claude Code)
**Date:** 2026-08-05

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As an engineering-capable evaluator or SaaS-hosted consumer who has just bootstrapped a repo" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated | ✅ | 2 items |
| H5 | Benefit linkage field references a named metric | ✅ | Fork/clone avoidance rate among new adopters |
| H6 | Complexity is rated | ✅ | 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 1, 0 HIGH, 1 MEDIUM (accepted) |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: []` declared — code-level dependency |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Category E score 5 |
| H-E2E | CSS-layout-dependent AC check | ✅ | Not applicable |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not applicable |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence check | ✅ | |
| H-GOV | Discovery Approved By populated | ✅ | Same as rb-s1 |
| H-ADAPTER | Injectable adapter wiring check | N/A | No `setX()`-style adapter — pure CLI flag/registry logic |
| H-INF | Infra-plan gate | N/A | Not set |
| H-MIG | Migration-review gate | N/A | Not set |

**10/10 applicable hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | Already RISK-ACCEPTed (add-on mode reconciliation with rb-s1 AC3) |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Coding agent implements against an unreviewed script | Hamish King — acknowledged, combined RISK-ACCEPT in `decisions.md` 2026-08-05 |
| W5 | No UNCERTAIN items left unaddressed | ✅ | — | — |

---

## Standards injection

Domain tags: none. Skipped silently.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Optionally install the full outer loop during bootstrap — artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s5-optional-outer-loop-install.md
Test plan: artefacts/2026-08-05-repo-bootstrap-no-fork/test-plans/rb-s5-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Read the rb-s2 registry to determine outer-loop skills — no separate hardcoded list.
- AC4's add-on mode MUST be explicitly reconciled against rb-s1 AC3's existing refusal-to-overwrite behaviour — implement both stories' file-conflict logic together, do not resolve this independently in each story. See the open finding in decisions.md before writing this logic.
- Do not build any outer-loop removal mechanism — out of scope.
- Architecture standards: read `.github/architecture-guardrails.md` before implementing.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness required before assigning
**Signed off by:** Hamish King (platform maintainer and tech lead in this solo-operator context) — 2026-08-05
