# Definition of Ready Checklist

## Definition of Ready: Require verification-strength tagging and a live UI-evidence gate at /verify-completion and /definition-of-done

**Story reference:** artefacts/2026-09-13-dod-live-verification-gate/stories/dvlg-s1-dod-verification-strength-and-live-ui-gate.md
**Test plan reference:** artefacts/2026-09-13-dod-live-verification-gate/test-plans/dvlg-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-13

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "an operator relying on a COMPLETE DoD verdict to mean the shipped behaviour genuinely works" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 6/6 (T4 covers AC4 dedicated, others 1:1) |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track process fix, per its own stated Benefit Linkage — closes two named, real DoD findings from this session's sweep |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips `/review` |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — two named SKILL.md files, plus the required `check-skill-contracts.js` update, following `evcg-s1`'s own proven pattern exactly |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | Instructional text change, no rendered UI of its own |
| H-NFR | NFR profile or explicit "None" field | ✅ | All explicitly N/A — instructional text only |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No adapter involved |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | Text-assertion tests against known-good instruction strings, fully self-verifying | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | No gaps | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Require verification-strength tagging and a live UI-evidence gate — artefacts/2026-09-13-dod-live-verification-gate/stories/dvlg-s1-dod-verification-strength-and-live-ui-gate.md
Test plan: artefacts/2026-09-13-dod-live-verification-gate/test-plans/dvlg-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- skills/verify-completion/SKILL.md and skills/definition-of-done/SKILL.md
  only, plus .github/scripts/check-skill-contracts.js for the required
  new contract strings (this repo's own established convention -- see
  evcg-s1 precedent).
- Follow the exact conditional-step shape already used by the existing
  "Route/handler E2E coverage check" -- named trigger, explicit N/A
  path, completion-report line.
- Do not touch skills/branch-complete/SKILL.md or any other skill file.
- Re-run tests/check-evcg-s1-verify-completion-e2e-check.js unmodified
  -- all existing assertions must still pass.
- Open a draft PR when tests pass -- do not mark ready for review.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — additive instructional-text change to two governed skill files, following an already-proven pattern, operator explicitly requested this fix)
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-13

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
