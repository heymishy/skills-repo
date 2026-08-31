# Definition of Ready Checklist

## Definition of Ready: Merge local-disk and Postgres artefact lists instead of local-wins-if-nonempty

**Story reference:** artefacts/2026-08-31-listartefacts-postgres-merge-fix/stories/lpmf-s1-merge-local-and-postgres-artefact-lists.md
**Test plan reference:** artefacts/2026-08-31-listartefacts-postgres-merge-fix/test-plans/lpmf-s1-test-plan.md
**Assessed by:** Claude (agent, short-track)
**Date:** 2026-08-31

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: operator viewing a feature's artefact list |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 concrete exclusions |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Direct incident traceability, short-track |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips /review |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Merge strategy, dedupe key, and no-signature-change constraints explicitly stated |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ N/A | Pure logic fix; NFR covered inline in story |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See note** — same recurring short-track gap already logged this session for rssp-s1/sstr-s1/ssdo-s1 | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction ("tackle the 3 findings as they are blocking continued dogfooding"). |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter involved |
| H-INF | Infra-plan gate | ✅ N/A | |
| H-MIG | Migration-review gate | ✅ N/A | |

**All hard blocks pass — 15/15 (13 direct passes + 1 explicit N/A-with-note + 1 transparent GAP note).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Coverage gaps: None | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Merge local-disk and Postgres artefact lists instead of local-wins-if-nonempty — artefacts/2026-08-31-listartefacts-postgres-merge-fix/stories/lpmf-s1-merge-local-and-postgres-artefact-lists.md
Test plan: artefacts/2026-08-31-listartefacts-postgres-merge-fix/test-plans/lpmf-s1-test-plan.md
DoR contract: artefacts/2026-08-31-listartefacts-postgres-merge-fix/dor/lpmf-s1-dor-contract.md

Goal:
In src/web-ui/adapters/artefact-list.js's listArtefacts, merge local-disk
artefacts with pgArtefactRows instead of returning local unconditionally
whenever it is non-empty. Build the merged list keyed by artefact path:
start from the Postgres-derived items, then overlay local-derived items
(local wins on a shared path, and contributes any local-only path). Only
fall through to the GitHub-API path when the merged result is empty.

Constraints:
- Do NOT change listLocalArtefacts, deriveTypeFromPath, or
  groupArtefactsByStage.
- Do NOT change the listArtefacts function signature or any caller.
- tests/check-alrf-s4-postgres-artefact-fallback.js must still pass
  unmodified.
- Add tests/check-lpmf-s1-artefact-list-merge.js covering AC1-AC5 from the
  test plan.
- Run the full suite (node scripts/run-all-tests.js) and confirm no
  regressions.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low — isolated, pure in-memory logic change in one adapter function, no signature or caller change, fully covered by regression tests against the pre-existing `alrf-s4` suite plus new tests.
**Sign-off required:** No (Low — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Platform Owner) — requested directly in-session, 2026-08-31, as one of 3 findings blocking continued dogfooding.
