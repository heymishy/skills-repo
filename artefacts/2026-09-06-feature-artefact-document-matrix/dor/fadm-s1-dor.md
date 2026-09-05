# Definition of Ready: Replace the multi-story artefact accordion with a compact feature-level table and document matrix

**Story reference:** artefacts/2026-09-06-feature-artefact-document-matrix/stories/fadm-s1-replace-artefact-accordion-with-document-matrix.md
**Test plan reference:** artefacts/2026-09-06-feature-artefact-document-matrix/test-plans/fadm-s1-test-plan.md
**Review artefact:** artefacts/2026-09-06-feature-artefact-document-matrix/review/fadm-s1-review-1.md
**Contract:** artefacts/2026-09-06-feature-artefact-document-matrix/dor/fadm-s1-dor-contract.md
**Track:** Short-track (test-plan → DoR → coding agent; discovery through review skipped per `CLAUDE.md`)
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-06

**Contract review:** ✅ Passed — the proposed implementation matches the interactively-approved design exactly (feature-level table + one clickable matrix, no separate per-story tables), and correctly identifies the one real column-derivation edge case (DoR vs DoR Contract) that needs dedicated handling.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Operator (persona from `product/mission.md`), named |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 7 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: 2, AC2: 4, AC3: 3, AC4: 2, AC5: 1, AC6: 1, AC7: 1 manual scenario |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 items |
| H5 | Benefit linkage field references a named metric | ✅ | References the operator-reported verbosity, validated interactively before implementation |
| H6 | Complexity is rated | ✅ | 2 (design pre-validated, one bounded edge case remains), Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | `/review` intentionally skipped (short-track) — 0 HIGH, honestly documented |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | AC1–AC6 fully covered; AC7 explicitly gap-typed as `Untestable-by-nature` with a manual verification scenario |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No "Dependencies" section — no upstream dependencies beyond already-shipped `bsgm-s1`/`sri-s1`/`adlr-s1` work, which this story explicitly builds on without modifying |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated, states the new column-derivation function's independence from the existing shared type-label mapping |
| H-E2E | CSS-layout-dependent AC + no E2E tooling + no RISK-ACCEPT → block | ✅ N/A | All ACs assert generated HTML structure via unit tests, no CSS layout/visual dependency |
| H-NFR | NFR profile exists | ✅ N/A | No NFRs — pure rendering-logic change, explicitly stated "None" in the test plan |
| H-NFR2 | Compliance NFR sign-off documented | ✅ N/A | No compliance NFR applies |
| H-NFR3 | Data classification field not blank | ✅ N/A | No NFR profile required |
| H-GOV | `## Approved By` in discovery has ≥1 non-blank, non-engineer-only entry | ✅ N/A | Short-track — no discovery artefact exists |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | No injectable adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | 0 MEDIUM (review skipped) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | The DoR-vs-DoR-Contract naming-convention assumption was verified against this session's own real artefacts, not independently domain-reviewed | Hamish King (Platform Owner) — same solo-operator rationale as this session's other RISK-ACCEPTs; logged in `decisions.md` |
| W5 | No UNCERTAIN items left unaddressed in gap table | ✅ | AC7's gap is explicitly typed and reasoned | — |

---

## Standards Injection

No `domain` field set on this story — pure UI-rendering change, no route/handler, security, or auth surface distinct enough to warrant a domain tag. Skipped silently per the DoR skill's own instruction.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Replace the multi-story artefact accordion with a compact feature-level table and document matrix — artefacts/2026-09-06-feature-artefact-document-matrix/stories/fadm-s1-replace-artefact-accordion-with-document-matrix.md
Test plan: artefacts/2026-09-06-feature-artefact-document-matrix/test-plans/fadm-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify. Do not build sorting,
filtering, or search into the matrix -- explicitly out of scope.

Constraints:
- In src/web-ui/routes/features.js, add _renderFeatureLevelTable (feature-
  level documents as one table), _deriveMatrixColumn (folder-based bucket,
  with dor/ further split by "-dor-contract" suffix vs plain "-dor"), and
  renderArtefactMatrix (one row per story, epic-divider rows with an inline
  link to the epic's own document when present, dynamic columns as the
  union of _deriveMatrixColumn results, checkmark links reusing the same
  _relativeArtefactPath/encodeURIComponent convention adlr-s1 established,
  dash for absent cells, resume-conversation affordance preserved per AC6).
- Update renderGroupedArtefactIndexHtml to use the new table + matrix for
  the multi-story path. Do NOT touch the single-story path
  (renderArtefactIndexHtml) at all -- AC5 requires it stay byte-identical.
- Do NOT change getFeatureStoryStructure or groupArtefactsByStory
  (feature-story-structure.js) -- reuse them exactly as sri-s1 left them.
- Update the one existing sw-epic-group/sw-story-row assertion in
  tests/check-fapg-s1-group-artefacts-by-story.js to assert the new matrix
  markup instead -- this is an intentional, in-place update to reflect
  this story's own supersession of that rendering, not a silent deletion.
- After confirming (via grep) that .sw-epic-group/.sw-story-row have no
  other consumer, remove that now-dead CSS block from html-shell.js.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low (no security/auth/data-model surface; the visual design was already interactively approved by the operator via a live mockup before this DoR was written, and the one real engineering risk — DoR/DoR-Contract column disambiguation — has a bounded, tested rule)
**Sign-off required:** No
**Signed off by:** Not required
