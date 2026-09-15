# Definition of Ready Checklist

## Definition of Ready: Fix currentStoryId field mismatch (wsap-s2)

**Story reference:** artefacts/2026-08-31-webui-story-artefact-path-fix/stories/wsap-s2-fix-currentstoryid-field-mismatch.md
**Test plan reference:** artefacts/2026-08-31-webui-story-artefact-path-fix/test-plans/wsap-s2-test-plan.md
**Track:** Short-track (severe live production bug, found during a direct operator report + log investigation)
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-15

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: an operator running any multi-story feature through the web UI |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test/verification method | ✅ | AC1 (corrected existing test), AC2 (new behavioural test), AC3 (17-file regression), AC4 (live verification) |
| H4 | Out-of-scope section is populated | ✅ | 2 items |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track bug fix, no formal benefit-metric artefact for this feature folder |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips review |
| H8 | Test plan has no uncovered ACs | ✅ | All 4 ACs covered |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ N/A | Single-field correction, no new architecture surface |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapter |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track, no discovery stage |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | AC4 is not automatable, live-verification-only | ✅ Acknowledged | Same live-verification pattern used repeatedly this session; the exact production feature affected (`new-feature-2b74a292`) is available to verify against directly. | Claude Sonnet 5 (orchestrating agent) |
| W2 | 12 of `new-feature-2b74a292`'s 13 stories already lost their review/test-plan/DoR content to the pre-fix flat-file collapse | ✅ Acknowledged | Explicitly out of scope for this story (data recovery is a separate, manual task) — noted for the operator as a real, known consequence, not silently dropped. | Claude Sonnet 5 (orchestrating agent) |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Fix currentStoryId field mismatch
       -- artefacts/2026-08-31-webui-story-artefact-path-fix/stories/wsap-s2-fix-currentstoryid-field-mismatch.md
Test plan: artefacts/2026-08-31-webui-story-artefact-path-fix/test-plans/wsap-s2-test-plan.md

Goal:
In src/web-ui/routes/skills.js's linkSessionToJourney(), change the field
checked from journey.stories (never populated anywhere in this codebase)
to journey.storyList (the field setStoryList/advanceToNextStory/
getCurrentStory in journey-store.js actually populate). storyList entries
are plain ID strings, not objects -- index directly, no .id/.slug
unwrapping needed.

Constraints:
- Correct tests/check-wsap-s1-story-scoped-artefact-paths.js's AC1 to use
  setStoryList() (the real production entry point) instead of setting
  journey.stories directly via setJourneyFields -- the original test's
  mock shape is exactly why this bug shipped undetected.
- New tests/check-wsap-s2-per-story-routing-uses-storylist.js driving a
  full multi-story cycle through the real production entry points.
- Re-run the 17-file regression suite named in the test plan -- all must
  pass unchanged.
- This is a governed src/ change (CLAUDE.md Artefact-first rule) -- route
  through the normal worktree -> PR -> merge path, open a draft PR, then
  mark it ready immediately per established practice.
- After merge and production deploy, live-verify AC4 directly against
  new-feature-2b74a292, the real feature that surfaced this bug.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No further sign-off — found and fixed within the same session that received the live operator bug report, per the operator's own in-conversation direction to fix now.
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-15 — operator approval: heymishy, 2026-09-15 (in-conversation, "Fix now (short-track)")

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
