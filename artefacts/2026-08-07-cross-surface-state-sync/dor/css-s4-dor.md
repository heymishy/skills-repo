# Definition of Ready: Extend automatic sync to the full gate/stage vocabulary and add the reconciliation safety net

**Review artefact:** artefacts/2026-08-07-cross-surface-state-sync/review/css-s4-review-2.md
**Story reference:** artefacts/2026-08-07-cross-surface-state-sync/stories/css-s4-full-gate-coverage-and-reconciliation-safety-net.md
**Test plan reference:** artefacts/2026-08-07-cross-surface-state-sync/test-plans/css-s4-test-plan.md
**Assessed by:** Copilot (Claude Code)
**Date:** 2026-08-07

---

## Contract Proposal

See `artefacts/2026-08-07-cross-surface-state-sync/dor/css-s4-dor-contract.md`.

**Contract Review outcome:** No mismatches found — the proposed generalisation of css-s1/css-s2's mechanisms and the reconciliation function's "attach to an existing authenticated request" design match AC1/AC2 exactly. AC3 is correctly scoped as a manual, real-world measurement (not an automated test), matching the test plan's own explicit External-dependency gap. ✅ **Contract review passed.**

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: Platform maintainer |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 3 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1, AC2 automated; AC3 has a manual scenario |
| H4 | Out-of-scope section is populated | ✅ | 2 items named |
| H5 | Benefit linkage field references a named metric | ✅ | "Automatic cross-surface agreement rate" |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 2: 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | AC3's External-dependency gap explicitly acknowledged with a manual scenario |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies lists css-s1, css-s2, css-s3 (in-feature, all reviewed/DoR'd this session). This story extends their mechanisms but does not depend on a NEW schema field they introduce beyond what css-s2/css-s3 already declared (sync_log) — no additional schemaDepends needed. Not applicable. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | cdg.7 mandate, D37 named; Run 2 review: 0 HIGH |
| H-E2E | CSS-layout-dependent AC check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-08-07-cross-surface-state-sync/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFRs |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Profile exists |
| H-GOV | `## Approved By` in discovery has ≥1 non-blank entry | ✅ | Confirmed |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ | Story names D37; wiring task required in implementation plan |
| H-INF | Infra-plan gate | ✅ N/A | Not set |
| H-MIG | Migration-review gate | ✅ N/A | Not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | Run 2 has 0 MEDIUM remaining (the RISK-ACCEPT for the residual reconciliation-gap risk is already logged in `decisions.md`) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Coding agent implements against an unreviewed script | Hamish King — RISK-ACCEPT logged in `decisions.md` (shared entry covering all 4 stories) |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | AC3's gap has an explicit, scheduled mitigation (4-week manual measurement), not "UNCERTAIN" | — |

---

## Standards injection

Domain tags: `[web-ui, data]`. Matched standards files: `.github/standards/web-ui/web-ui-patterns.md`, `.github/standards/data/data-standards.md` (both confirmed present on disk).

---

## Oversight level

**Medium** (from parent epic `css-e1`). Confirmed: Hamish King (solo maintainer).

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Extend automatic sync to the full gate/stage vocabulary and add the reconciliation safety net — artefacts/2026-08-07-cross-surface-state-sync/stories/css-s4-full-gate-coverage-and-reconciliation-safety-net.md
Test plan: artefacts/2026-08-07-cross-surface-state-sync/test-plans/css-s4-test-plan.md
Contract: artefacts/2026-08-07-cross-surface-state-sync/dor/css-s4-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- cdg.7-style mandate: import GATE_MAP directly from
  src/enforcement/gate-map.js in both the sync mechanism and its tests --
  never re-type the 7 gate values as a second hardcoded array anywhere.
- D37 (injectable adapter rule): src/sync/reconciliation.js's core function
  must be injectable with a throwing stub default.
- The reconciliation re-attempt (AC2) must use ONLY the current live
  request's own session token -- never read or reference a token from the
  original failed attempt. This is a security invariant, not a style
  preference -- write a test that would fail if this were violated.
- One parameterized implementation, not 7 gate-specific functions -- add the
  small structural check script from the Contract Proposal to enforce this
  going forward.
- Out of scope: real-time push notifications for reconciliation gaps; any
  change to gate-map.js's own 7 values.
- Architecture standards: read .github/architecture-guardrails.md and the
  two matched standards files in full before implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only
**Signed off by:** Hamish King — Platform maintainer / Product owner (solo repo), 2026-08-07
