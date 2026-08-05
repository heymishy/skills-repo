# Definition of Ready Checklist

## Definition of Ready: Generate harness-agnostic instruction files from one source

**Story reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s3-harness-agnostic-instructions.md
**Test plan reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/test-plans/rb-s3-test-plan.md
**Assessed by:** Copilot (Claude Code)
**Date:** 2026-08-05

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As an engineering-capable evaluator using VS Code with GitHub Copilot, Cursor, or Claude Code" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC3 manual, documented |
| H4 | Out-of-scope section is populated | ✅ | 2 items |
| H5 | Benefit linkage field references a named metric | ✅ | Fork/clone avoidance rate among new adopters |
| H6 | Complexity is rated | ✅ | 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 1, 0 HIGH, 1 MEDIUM (accepted) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | AC3 gap acknowledged, External-dependency |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: rb-s1, rb-s2 (code-level, not schema) — `schemaDepends: []` declared below |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Category E score 5 (strongest of all 5 stories — correctly extends ADR-005) |
| H-E2E | CSS-layout-dependent AC check | ✅ | Not applicable |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not applicable |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence check | ✅ | |
| H-GOV | Discovery Approved By populated | ✅ | Same as rb-s1 |
| H-ADAPTER | Injectable adapter wiring check | N/A | No `setX()`-style adapter introduced |
| H-INF | Infra-plan gate | N/A | Not set |
| H-MIG | Migration-review gate | N/A | Not set |

**Schema dependency declaration (H8-ext): `schemaDepends: []`** — Dependencies on `rb-s1`/`rb-s2` are code-level composition (this story reads their materialized output on disk), not `pipeline-state.json` schema fields.

**10/10 applicable hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | Already RISK-ACCEPTed |
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
Story: Generate harness-agnostic instruction files from one source — artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s3-harness-agnostic-instructions.md
Test plan: artefacts/2026-08-05-repo-bootstrap-no-fork/test-plans/rb-s3-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- EXTEND scripts/assemble-copilot-instructions.sh — do not introduce a symlink-based mechanism (explicitly rejected at /definition, see decisions.md) and do not create a second, parallel assembly script.
- Preserve the existing GitHub-path behaviour exactly (regression test required) — this story is additive to ADR-005's mechanism, not a replacement.
- Target-harness detection reads/writes context.yml (ADR-004) — no new parallel config file.
- AC3 is manual-only per the test plan — do not attempt to fabricate an automated cross-tool comparison test; write the PR description to include the one-time manual verification result per harness instead.
- Architecture standards: read `.github/architecture-guardrails.md` before implementing (ADR-004, ADR-005, ADR-011 apply).
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness required before assigning
**Signed off by:** Hamish King (platform maintainer and tech lead in this solo-operator context) — 2026-08-05
