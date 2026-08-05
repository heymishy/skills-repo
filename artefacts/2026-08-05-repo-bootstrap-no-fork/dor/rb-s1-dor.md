# Definition of Ready Checklist

## Definition of Ready: Bootstrap a minimal fresh repo with one init command

**Story reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s1-minimal-fresh-repo-init.md
**Test plan reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/test-plans/rb-s1-test-plan.md
**Assessed by:** Copilot (Claude Code)
**Date:** 2026-08-05

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As an engineering-capable evaluator" — matches benefit-metric persona |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1-3 automated, AC4 manual with documented reason |
| H4 | Out-of-scope section is populated | ✅ | 4 items |
| H5 | Benefit linkage field references a named metric | ✅ | Bootstrap-to-first-inner-loop-run time; Fork/clone avoidance rate |
| H6 | Complexity is rated | ✅ | 3 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 2, 0 HIGH, 0 MEDIUM |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | AC4 gap acknowledged, External-dependency |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | 5 constraints populated, Category E score 5 (Run 2) |
| H-E2E | CSS-layout-dependent AC + no E2E tooling + no RISK-ACCEPT | ✅ | Not applicable — no CSS-layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-08-05-repo-bootstrap-no-fork/nfr-profile.md |
| H-NFR2 | Compliance NFR with regulatory clause has sign-off | ✅ | Not applicable — no compliance NFRs |
| H-NFR3 | Data classification field not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence check | ✅ | Story has real NFRs, profile exists |
| H-GOV | Discovery Approved By has ≥1 non-blank named entry | ✅ | "Hamish King — Platform maintainer" — ambiguous role, passes with M1 signal recorded as unverified for independent sign-off quality |
| H-ADAPTER | Injectable adapter wiring check | N/A | This story introduces no `setX()`-style adapter — pure CLI wrapper, no server.js route involved |
| H-INF | Infra-plan gate | N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | N/A | `hasMigrationTrack` not set |

**10/10 applicable hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | — (Run 2 has 0 open MEDIUM) |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Coding agent implements against an unreviewed script | Hamish King — acknowledged, RISK-ACCEPT logged in `decisions.md` 2026-08-05 |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | — | — |

---

## Standards injection

Domain tags: none — story has no `domain` field. Skipped silently.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Bootstrap a minimal fresh repo with one init command — artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s1-minimal-fresh-repo-init.md
Test plan: artefacts/2026-08-05-repo-bootstrap-no-fork/test-plans/rb-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Plain Node.js, CommonJS — matches `scripts/platform-init.js`'s existing style. No external npm dependencies in the CLI's own runtime code.
- WRAP `scripts/platform-init.js`'s existing COPY_DIRS logic via `require` — do not reimplement file-copying, existing-file-skip, or directory-creation logic. Only the `PLATFORM_ROOT` resolution (bundled package files vs. env-var/local checkout) and the new `context.yml`/`pipeline-state.json` seeding are new code.
- Do NOT call `git init` on the target directory — explicitly out of scope per this story's Architecture Constraints.
- Do NOT modify `platform-init.js`'s existing behaviour — any change to that script is a separate concern.
- Do NOT build the full skill set, registry, or harness-agnostic instructions — those are `rb-s2`/`rb-s3`'s scope.
- Architecture standards: read `.github/architecture-guardrails.md` before implementing. Do not introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs (ADR-004, ADR-011 apply to this story).
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness required before assigning
**Signed off by:** Hamish King (platform maintainer and tech lead in this solo-operator context) — 2026-08-05
