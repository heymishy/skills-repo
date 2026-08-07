# Definition of Ready: Don't show "could not be retrieved" for an artefact that simply doesn't exist yet

**Review artefact:** artefacts/2026-08-07-artefact-not-found-vs-fetch-failed/review/anvf-s1-review-1.md
**Story reference:** artefacts/2026-08-07-artefact-not-found-vs-fetch-failed/stories/anvf-s1-distinguish-not-found-from-fetch-failed.md
**Test plan reference:** artefacts/2026-08-07-artefact-not-found-vs-fetch-failed/test-plans/anvf-s1-test-plan.md
**Assessed by:** Copilot (Claude Code)
**Date:** 2026-08-07

---

## Contract Proposal

**What will be built:** In `src/web-ui/routes/journey.js`'s `handleGetJourneyStageView`, the `catch (_dasFetchErr)` block around the `fetchArtefact()` call is changed to check `_dasFetchErr instanceof require('../adapters/artefact-fetcher').ArtefactNotFoundError` — if true, leave `_dasFetchFailed = false` (falls through to the ordinary "No artefact content found" message); otherwise (any other error, including `ArtefactFetchError`), set `_dasFetchFailed = true` exactly as today.

**What will NOT be built:** Any change to `artefact-fetcher.js` itself, or to `handlePostGateConfirm`'s write path.

**How each AC will be verified:** Per the test plan — `artefactNotFound404_showsOrdinaryNotFoundMessage` (AC1), the existing `bothLocalAndGitMissing_honestErrorMessage` re-verified (AC2), `genericErrorResemblingNotFoundText_stillTreatedAsRealFailure` (AC3).

**Assumptions:** None beyond what's in the story.

**Estimated touch points:** `src/web-ui/routes/journey.js` (one catch block), `tests/check-das-s1-commit-artefact-git-fallback.js` (2 new tests added to the existing file, not a new file — this is a fix to that story's own code, extending its own test file is more appropriate than a new one).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: operator resuming a newly-created feature |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 3 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1, AC3 new tests; AC2 existing test re-verified |
| H4 | Out-of-scope section is populated | ✅ | 2 items named |
| H5 | Benefit linkage field references a named metric | ✅ N/A (short-track) | Direct defect-fix mechanism sentence present |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 1: 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gaps: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Reuse-existing-error-classes constraint named; Run 1: 0 HIGH |
| H-E2E | CSS-layout-dependent AC check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile or explicit "None" | ✅ | Story's NFR section: "None identified"/"Not applicable" across all 4 categories |
| H-GOV | `## Approved By` in discovery | ✅ N/A | Short-track, no discovery artefact |
| H-ADAPTER | D37 wiring check | ✅ N/A | No new adapter — reuses existing `ArtefactNotFoundError`/`ArtefactFetchError` classes |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script | Hamish King — solo-maintainer RISK-ACCEPT, consistent with this session's established pattern |

All other warnings: ✅ (NFRs identified, scope stable, 0 MEDIUM findings, no gap-table uncertainty).

---

## Oversight level

**Low** — Complexity 1, single catch-block fix reusing already-existing, already-tested error classes, no server/data/security surface change.

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight)

**Implementation note:** Per `decisions.md`'s GAP entry, this story is implemented directly by the orchestrating agent (not dispatched to a coding subagent) due to the account's agent-dispatch session limit being active at the time. Full TDD/verify-completion/branch-complete discipline still applies.
