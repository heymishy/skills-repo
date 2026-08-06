# Definition of Ready: Detect a genuine cross-surface conflict, resolve it to pipeline-state.json's value, and log it

**Review artefact:** artefacts/2026-08-07-cross-surface-state-sync/review/css-s3-review-1.md
**Story reference:** artefacts/2026-08-07-cross-surface-state-sync/stories/css-s3-detect-and-resolve-cross-surface-conflicts.md
**Test plan reference:** artefacts/2026-08-07-cross-surface-state-sync/test-plans/css-s3-test-plan.md
**Assessed by:** Copilot (Claude Code)
**Date:** 2026-08-07

---

## Contract Proposal

See `artefacts/2026-08-07-cross-surface-state-sync/dor/css-s3-dor-contract.md`.

**Contract Review outcome:** No mismatches found. The one open implementation detail (exact storage location of the "last synced" marker) is explicitly left to the coding agent's judgment in the Contract Proposal's Assumptions, bounded by ADR-003's schema-first constraint — this does not affect any AC's observable outcome. ✅ **Contract review passed.**

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: Platform maintainer relying on this sync mechanism |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC4 all covered |
| H4 | Out-of-scope section is populated | ✅ | 2 items named |
| H5 | Benefit linkage field references a named metric | ✅ | "Conflict-resolution correctness (no silent overwrites)" |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 1: 0 HIGH, 0 MEDIUM, 0 LOW (clean from the start) |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies lists css-s1, css-s2 (in-feature, both already reviewed/DoR'd in this same session). Neither declares new schema fields that css-s3 depends on directly — the "last synced" marker is css-s3's own addition, not a pre-existing dependency. Not applicable. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-003, D37 named; Run 1 review: 0 HIGH |
| H-E2E | CSS-layout-dependent AC check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-08-07-cross-surface-state-sync/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFRs |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Profile exists |
| H-GOV | `## Approved By` in discovery has ≥1 non-blank entry | ✅ | Confirmed |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ | Story names D37 constraint; wiring task required in implementation plan |
| H-INF | Infra-plan gate | ✅ N/A | Not set |
| H-MIG | Migration-review gate | ✅ N/A | Not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | 0 MEDIUM findings ever | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Coding agent implements against an unreviewed script | Hamish King — RISK-ACCEPT logged in `decisions.md` (shared entry covering all 4 stories) |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table: None | — |

---

## Standards injection

Domain tags: `[data, web-ui]`. Matched standards files: `.github/standards/data/data-standards.md`, `.github/standards/web-ui/web-ui-patterns.md` (both confirmed present on disk).

---

## Oversight level

**Medium** (from parent epic `css-e1`). Confirmed: Hamish King (solo maintainer).

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Detect a genuine cross-surface conflict, resolve it to pipeline-state.json's value, and log it — artefacts/2026-08-07-cross-surface-state-sync/stories/css-s3-detect-and-resolve-cross-surface-conflicts.md
Test plan: artefacts/2026-08-07-cross-surface-state-sync/test-plans/css-s3-test-plan.md
Contract: artefacts/2026-08-07-cross-surface-state-sync/dor/css-s3-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- ADR-003 (schema-first): if the "last synced" marker is added to
  pipeline-state.json, add the field to pipeline-state.schema.json in the
  SAME commit. If instead added as a journeys column, no pipeline-state
  schema change is needed -- choose whichever is simpler, but do not leave
  either choice half-done.
- D37 (injectable adapter rule): the conflict-resolver's comparison/resolution
  function must be injectable with a throwing stub default.
- pipeline-state.json's value is ALWAYS the canonical winner on a genuine
  conflict -- never the journey's value, per decisions.md's ARCH decision.
- Reuse the sync_log table css-s2 introduces (entry_type: 'conflict') --
  do not create a second table for conflicts.
- Out of scope: automatic conflict avoidance/locking; a conflict-log
  browsing UI.
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
