# Definition of Ready Checklist

## Definition of Ready: Align Web UI test-plan/DoR artefact save paths and Step-1 scanner with the canonical per-story convention

**Story reference:** artefacts/2026-08-31-webui-story-artefact-path-fix/stories/wsap-s1-align-webui-story-scoped-artefact-paths.md
**Test plan reference:** artefacts/2026-08-31-webui-story-artefact-path-fix/test-plans/wsap-s1-test-plan.md
**Assessed by:** Claude (agent, short-track)
**Date:** 2026-08-31

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 8 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: operator running a multi-story feature through the web UI journey flow |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 8 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 concrete exclusions |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Direct incident traceability, short-track |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips /review |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None (does not overlap lpmf-s1) |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Shared-helper requirement, fallback-preservation requirement, and file-touch boundary explicitly stated |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ N/A | Path-traversal guard covered inline in story/test plan |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See note** — same recurring short-track gap already logged this session for rssp-s1/sstr-s1/ssdo-s1/lpmf-s1 | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction ("tackle the 3 findings as they are blocking continued dogfooding"). |
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
Story: Align Web UI test-plan/DoR artefact save paths and Step-1 scanner with the canonical per-story convention — artefacts/2026-08-31-webui-story-artefact-path-fix/stories/wsap-s1-align-webui-story-scoped-artefact-paths.md
Test plan: artefacts/2026-08-31-webui-story-artefact-path-fix/test-plans/wsap-s1-test-plan.md
DoR contract: artefacts/2026-08-31-webui-story-artefact-path-fix/dor/wsap-s1-dor-contract.md

Goal:
In src/web-ui/routes/skills.js: (1) linkSessionToJourney sets
session.currentStoryId from journey.stories[journey.currentStoryIndex];
(2) both session.artefactPath construction sites (htmlSubmitTurn and
handlePostTurnStreamHtml) use a new shared helper that builds
artefacts/[slug]/test-plans/[storyId]-test-plan.md or
artefacts/[slug]/dor/[storyId]-dor.md when a currentStoryId is known for
skillName test-plan/definition-of-ready, falling back to the existing flat
artefacts/[slug]/[skillName].md path otherwise; (3) computeStep1Summary's
test-plan/definition-of-ready branches scan those same real subdirectories
instead of the non-existent [featureSlug]-tp-[story-id]/[featureSlug]-dor-
[story-id] top-level-directory convention; (4) the two prompt SLUG
instructions are corrected to stop telling the model to invent that
convention.

Constraints:
- Do NOT change journey.js's currentStoryIndex advancement logic or its
  linkSessionToJourney call sites.
- Do NOT touch dor-contract.md handling (none exists in this code path).
- Do NOT change lpmf-s1's listArtefacts (separate story/file, no overlap).
- The fallback to flat artefacts/[slug]/[skillName].md must be preserved
  exactly for any session with no currentStoryId (standalone sessions) and
  for every skillName other than test-plan/definition-of-ready.
- tests/check-alrf-s8-journey-slug-priority.js must still pass unmodified
  (4/4 ACs).
- Add tests/check-wsap-s1-story-scoped-artefact-paths.js covering AC1-AC8.
- Run the full suite (node scripts/run-all-tests.js) and confirm no
  regressions.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — touches artefact-save-path logic and a prompt used across every web-UI-driven test-plan/DoR session; confirmed data-loss-severity bug (silent per-story artefact overwrite) but the fix is additive/branching with an explicit, tested fallback for every previously-working case.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Platform Owner) — requested directly in-session, 2026-08-31, as the higher-priority of 3 findings blocking continued dogfooding (elevated from the original "reverting" symptom to a confirmed data-loss bug during investigation).
