# Definition of Ready Checklist

## Definition of Ready: Install the full skill set with a lightweight outer/inner/ancillary registry

**Story reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s2-full-skill-set-and-registry.md
**Test plan reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/test-plans/rb-s2-test-plan.md
**Assessed by:** Copilot (Claude Code)
**Date:** 2026-08-05

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As an engineering-capable evaluator" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated | ✅ | 2 items |
| H5 | Benefit linkage field references a named metric | ✅ | Bootstrap-to-first-inner-loop-run time |
| H6 | Complexity is rated | ✅ | 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 2, 0 HIGH, 2 MEDIUM (both accepted in decisions.md) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | AC3's representative-instance limitation acknowledged |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: []` declared in contract — dependency is code-level, not a pipeline-state.json field consumption |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Category E score 5 |
| H-E2E | CSS-layout-dependent AC check | ✅ | Not applicable |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not applicable |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence check | ✅ | |
| H-GOV | Discovery Approved By populated | ✅ | Same as rb-s1 — passes with M1 signal unverified |
| H-ADAPTER | Injectable adapter wiring check | N/A | No `setX()`-style adapter introduced |
| H-INF | Infra-plan gate | N/A | Not set |
| H-MIG | Migration-review gate | N/A | Not set |

**10/10 applicable hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | Both open findings already RISK-ACCEPTed |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Coding agent implements against an unreviewed script | Hamish King — acknowledged, RISK-ACCEPT logged in `decisions.md` 2026-08-05 (combined entry covering all 5 stories) |
| W5 | No UNCERTAIN items left unaddressed | ✅ | — | — |

---

## Standards injection

Domain tags: none. Skipped silently.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Install the full skill set with a lightweight outer/inner/ancillary registry — artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s2-full-skill-set-and-registry.md
Test plan: artefacts/2026-08-05-repo-bootstrap-no-fork/test-plans/rb-s2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Build directly on rb-s1's CLI wrapper output — do not create a second install path.
- The registry is a new, separate manifest file — do not fold it into context.yml (ADR-004).
- Do not reimplement platform-init.js/platform-fetch.js/platform-pin.js/platform-verify.js — they already exist and already travel with rb-s1's wrap.
- For AC3, write the representative-instance test as documented in the test plan — do not attempt to prove the general extensibility claim with a single test.
- Architecture standards: read `.github/architecture-guardrails.md` before implementing (ADR-004, ADR-011 apply).
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness required before assigning
**Signed off by:** Hamish King (platform maintainer and tech lead in this solo-operator context) — 2026-08-05
