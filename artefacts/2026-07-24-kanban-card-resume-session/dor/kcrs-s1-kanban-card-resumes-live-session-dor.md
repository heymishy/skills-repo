## Definition of Ready: Clicking a kanban card resumes the journey's live session

**Story reference:** artefacts/2026-07-24-kanban-card-resume-session/stories/kcrs-s1-kanban-card-resumes-live-session.md
**Test plan reference:** artefacts/2026-07-24-kanban-card-resume-session/test-plans/kcrs-s1-kanban-card-resumes-live-session-test-plan.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-24

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | |
| H2 | >=3 ACs | ✅ | 5 ACs |
| H3 | Every AC has >=1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage named | ✅ | Direct operator-reported UX gap in S3.4's own delivered behaviour |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH | ✅ | Short-track |
| H8 | No uncovered ACs | ✅ | |

**All hard blocks PASS.**

## Coding Agent Instructions

```
Proceed: Yes
Story: kcrs-s1 -- artefacts/2026-07-24-kanban-card-resume-session/stories/kcrs-s1-kanban-card-resumes-live-session.md
Test plan: artefacts/2026-07-24-kanban-card-resume-session/test-plans/kcrs-s1-kanban-card-resumes-live-session-test-plan.md

Change handleGetJourneyById (journey.js) to redirect (303) into the existing
handleGetJourneyResume flow (via journey.featureSlug) instead of rendering
its own static summary page, when a session can meaningfully be resumed.
Export _isSafeBoardBackLink from journey.js; reuse it (do not reimplement)
in skills.js's handleGetChatHtml to render a "Back to board" link when a
safe ?from= value is present. Fall back to /features/:slug when no active
session exists at all (AC3). Preserve the existing tenant-ownership guard
and viewer-registration side effect.

Oversight level: Low -- reuses existing, already-proven mechanisms end to end.
```

## Sign-off

**Oversight level:** Low
**Signed off by:** Hamish King, Founder/Operator, 2026-07-24 (short-track, operator-directed same session, found via live usage)
