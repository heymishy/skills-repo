# Definition of Ready Checklist

## Definition of Ready: Unify skill-categorization into one source of truth and close the --with-outer-loop NFR gap

**Story reference:** artefacts/2026-08-07-skill-categorization-reconciliation/stories/scr-s1-unify-skill-categorization-and-fix-nfr.md
**Test plan reference:** artefacts/2026-08-07-skill-categorization-reconciliation/test-plans/scr-s1-test-plan.md
**Review artefact:** artefacts/2026-08-07-skill-categorization-reconciliation/review/scr-s1-review-1.md
**Assessed by:** Copilot (autonomous, short-track)
**Date:** 2026-08-07

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "Platform maintainer relying on skill categorization staying consistent..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | Silent-divergence risk eliminated + rb-s5's NFR gap closed (operational, short-track) |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 1: PASS, 0 HIGH/MEDIUM/LOW |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Single-source-of-truth mandate, D37 N/A, cross-directory require reasoning; Category E score 5 |
| H-E2E | CSS-layout-dependent AC check | ✅ N/A | CI-time/build-time script logic only |
| H-NFR | NFR profile exists | ⚠️ N/A | Story has explicit NFRs field (4 categories) — no separate feature-level nfr-profile.md for this short-track feature |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ N/A | No feature-level NFR profile for short-track; story-level NFRs cover this directly |
| H-NFR-profile | NFR profile presence check | ✅ N/A | Story NFR section populated — proceeds without a separate nfr-profile.md per established short-track precedent |
| H-GOV | Discovery Approved By populated | ⚠️ **See decisions.md GAP entry (2026-08-07)** | No discovery artefact exists — short-track skips /discovery by design |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter introduced — build-time/CI-time script refactor only |
| H-INF | Infra-plan gate | ✅ N/A | Not set |
| H-MIG | Migration-review gate | ✅ N/A | Not set |

**All hard blocks pass — 15/15 (10 direct passes + 5 explicit N/A), with the H-GOV and H-NFR-profile notes recorded transparently.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | — (Stable) |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review Run 1: 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Coding agent implements against an unreviewed script | Hamish King — acknowledged, RISK-ACCEPT logged in `decisions.md` (2026-08-07) |
| W5 | No UNCERTAIN items left unaddressed | ✅ | AC4's timing measurement is environment-sensitive (noted in test plan's Test Gaps and Risks, not left silently unaddressed) | Hamish King — acknowledged, same RISK-ACCEPT entry |

---

## Standards injection

No `domain` field on this story — CI-governance and CLI-assembly scripts don't clearly match any domain in `.github/standards/index.yml`. Skipped silently per the standards-injection algorithm's own rule for this case.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Unify skill-categorization into one source of truth and close the --with-outer-loop NFR gap — artefacts/2026-08-07-skill-categorization-reconciliation/stories/scr-s1-unify-skill-categorization-and-fix-nfr.md
Test plan: artefacts/2026-08-07-skill-categorization-reconciliation/test-plans/scr-s1-test-plan.md
DoR contract: artefacts/2026-08-07-skill-categorization-reconciliation/dor/scr-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- cli/lib/skills-registry.js's SKILL_CATEGORIES becomes the ONE place a
  skill's category is declared -- check-assembly.js's OUTER_LOOP_SKILLS/
  INNER_LOOP_SKILLS must be DERIVED from it (a filter expression), not a
  second hardcoded copy with the same values.
- Do NOT touch check-assembly.js's separate OUTER_LOOP_AC3 constant (a
  distinct 6-skill subset for a different check) -- out of scope.
- assemble-copilot-instructions.sh's fix is specifically the "enabled"
  branch's double call to get_skill_triggers per skill -- compute once,
  store in a variable, reuse for both the presence check and the formatted
  output. Do NOT touch the separate, pre-existing "Core Platform Layer"
  loop's own description-extraction calls -- explicitly out of scope.
- AC4 (NFR re-measurement) must report the HONEST result -- if the fix
  doesn't fully close the gap to under 3 seconds, say so and update the
  RISK-ACCEPT with new numbers rather than silently dropping it or
  fabricating a passing result.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.

- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — touches shared CI governance tooling and the bootstrap CLI's assembly step used by every consumer of this platform, warranting tech-lead-equivalent awareness even though each individual change is small and well understood.
**Sign-off required:** No (Medium — awareness only)
**Signed off by:** Hamish King — Platform maintainer / Product owner — 2026-08-07
