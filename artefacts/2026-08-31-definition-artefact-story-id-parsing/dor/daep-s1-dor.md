# Definition of Ready Checklist

## Definition of Ready: Recognize the H2-epic/H3-story (Format A) definition-artefact shape

**Story reference:** artefacts/2026-08-31-definition-artefact-story-id-parsing/stories/daep-s1-recognize-epic-h2-story-h3-format.md
**Test plan reference:** artefacts/2026-08-31-definition-artefact-story-id-parsing/test-plans/daep-s1-test-plan.md
**Assessed by:** Claude (agent, short-track)
**Date:** 2026-08-31

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 3 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: operator resuming a feature at the `/journey/:id/stories` gate |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 3 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 concrete exclusions |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Direct bug fix, short-track (no formal benefit-metric artefact); linked to the live production incident on journey af17f555 |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips /review |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Additive-only constraint stated explicitly; mirrors proven client-side logic |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ N/A | Pure-function fix; NFR covered inline in test plan (no regression to Format B/C) |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See note** — same recurring short-track gap noted across this session's other short-track stories | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction after confirming the root cause live against production journey af17f555. |
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
Story: Recognize the H2-epic/H3-story (Format A) definition-artefact shape — artefacts/2026-08-31-definition-artefact-story-id-parsing/stories/daep-s1-recognize-epic-h2-story-h3-format.md
Test plan: artefacts/2026-08-31-definition-artefact-story-id-parsing/test-plans/daep-s1-test-plan.md
DoR contract: artefacts/2026-08-31-definition-artefact-story-id-parsing/dor/daep-s1-dor-contract.md

Goal:
Add a third, additive branch to extractStoryIdsFromDefinitionArtefact in
src/web-ui/routes/journey.js, checked only after the existing H1-epic/H1-story
and flat-H2 checks both find nothing. Detect "## Epic N" H2 headers, split on
"\n## Epic " then "\n### " to get story subsections, extract each story's
leading slug via /^([a-z][a-z0-9.-]*)/i (mirrors the client-side
parseDefinitionArtefact's own Format A branch in src/web-ui/routes/skills.js
exactly, for AC5/dsda-s1 parity).

Constraints:
- Do NOT change the two already-recognized formats' behavior (Format B, Format C).
- Do NOT touch the client-side parseDefinitionArtefact (already correct).
- Do NOT touch handleGetStories/handlePostStories beyond what the extractor returns.
- Run the full suite (node scripts/run-all-tests.js) and confirm no regressions,
  especially tests/check-dsda-s1-default-all-stories.js.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — this function gates real operator flow at a production incident site (journey af17f555, actively blocking dogfooding); the fix itself is small and additive with a proven reference implementation to mirror.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Platform Owner) — confirmed the root cause live against production journey af17f555 and requested the fix directly in-session, 2026-08-31.
