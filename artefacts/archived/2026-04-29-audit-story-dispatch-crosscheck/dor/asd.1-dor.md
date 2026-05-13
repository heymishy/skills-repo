# Definition of Ready: Audit gate story dispatch cross-check

**Story reference:** `artefacts/2026-04-29-audit-story-dispatch-crosscheck/stories/asd.1-audit-story-dispatch-crosscheck.md`
**Test plan reference:** `artefacts/2026-04-29-audit-story-dispatch-crosscheck/test-plans/asd.1-test-plan.md`
**Assessed by:** GitHub Copilot (/definition-of-ready — short-track)
**Date:** 2026-04-29

---

## Contract Proposal

**What will be built:**
Two new functions added to the existing `scripts/extract-pr-slug.js` module: `extractStorySlug(bodyText, featureSlug)` (returns the story ID from a `stories/` path in the PR body for the given feature, or `""`) and `buildDispatchNote(status, storyId, issueUrl?)` (returns the dispatch cross-check note string for the audit comment). The `Post governed artefact chain comment` step in `.github/workflows/assurance-gate.yml` is updated to call `extractStorySlug` after the feature slug is resolved, look up the resulting story ID in the `pipelineStories` array already loaded, and prepend the dispatch note to each story's AC section header using `buildDispatchNote`.

**What will NOT be built:**
- Any gate verdict change based on dispatch record absence — fail-open is preserved.
- A new script file — both functions are added to the existing `scripts/extract-pr-slug.js`.
- Changes to artefact hash computation, trace logic, or governance check evaluation.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1, T2 — unit tests on `extractStorySlug()` with stories/ paths | Unit |
| AC2 | T3, T4 — unit tests: no story path, wrong feature | Unit |
| AC3 | T5, T6 — unit tests: null and empty body | Unit |
| AC4 | T7 — unit test on `buildDispatchNote("verified", ...)` | Unit |
| AC5 | T8 — unit test on `buildDispatchNote("not-found", ...)` | Unit |
| AC6 | T9 — unit test on `buildDispatchNote("no-dispatch", ...)` | Unit |

**Assumptions:**
- Story file names always follow the pattern `<storyId>-<descriptive-slug>.md` (e.g. `p11.6-start-skill.md`, `sar.1-audit-record-slug-fix.md`). The story ID ends at the first `-`.
- Story IDs contain only alphanumeric characters and `.` (e.g. `p11.6`, `sar.1`, `caa.1`).
- `pipelineStories` is already populated in the workflow comment step from the resolved feature slug (existing code from sar.1).
- `github.event.pull_request.body` is available in the workflow (confirmed by existing sar.1 usage).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with named persona | ✅ | "As a platform operator reviewing a merged PR" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | T1–T9 cover AC1–AC6 |
| H4 | Out-of-scope section populated | ✅ | Explicit list of deferred/excluded behaviour |
| H5 | Benefit linkage references a named metric | ✅ | Pipeline governance integrity — short-track |
| H6 | Complexity rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings | ✅ | Short-track exemption — bounded scope, no HIGH-risk behaviour |
| H8 | Test plan has no uncovered ACs | ✅ | Two integration gaps acknowledged in gap table |
| H8-ext | Cross-story schema dependency check | ✅ | No new pipeline-state.schema.json fields required — functions are purely in-comment rendering |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | ADR-009 (no contents:write), zero-new-deps, fail-open — all stated |
| H-E2E | No CSS-layout-dependent ACs | ✅ | N/A — CLI/workflow only |
| H-NFR | NFR profile or explicit "None" | ✅ | Story declares "None identified" |
| H-NFR2 | No compliance NFR with unsigned regulatory clause | ✅ | N/A |
| H-NFR3 | Data classification not blank | ✅ | N/A — no data classification required |

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | N/A | |
| W2 | Scope stability declared | ✅ | Stable | |
| W3 | MEDIUM review findings acknowledged | ✅ | Short-track — no review run | |
| W4 | Verification script reviewed by domain expert | ⚠️ | Script not reviewed by a separate human before coding | Operator — 2026-04-29 |
| W5 | No UNCERTAIN gaps in test plan | ✅ | Both gaps are acknowledged integration gaps with manual verification plans | |

**W4 acknowledgement:** Short-track — operator reviewed verification script during this DoR run and accepts the risk.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Audit gate story dispatch cross-check — artefacts/2026-04-29-audit-story-dispatch-crosscheck/stories/asd.1-audit-story-dispatch-crosscheck.md
Test plan: artefacts/2026-04-29-audit-story-dispatch-crosscheck/test-plans/asd.1-test-plan.md

Goal:
Make every test in tests/check-asd1-story-crosscheck.js pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

File touchpoints (from DoR contract):
- MODIFY: scripts/extract-pr-slug.js — add extractStorySlug(bodyText, featureSlug) and buildDispatchNote(status, storyId, issueUrl?) and export them
- MODIFY: .github/workflows/assurance-gate.yml — in the "Post governed artefact chain comment" step, after slug and pipelineStories are resolved, call extractStorySlug and buildDispatchNote; prepend the dispatch note to each story's AC section header line
- The test file tests/check-asd1-story-crosscheck.js already exists as a failing stub — do not delete or rewrite it, make its tests pass

Constraints:
- No new npm dependencies
- No new files (both functions go into the existing scripts/extract-pr-slug.js)
- Fail-open: if extractStorySlug returns "" or pipeline-state lookup throws, skip the note silently
- Do not change the gate verdict logic
```
