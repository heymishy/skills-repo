## Definition of Ready: Completing /definition moves straight into /review

**Story reference:** artefacts/2026-07-24-definition-to-review-autostart/stories/dtra-s1-auto-start-review-after-definition.md
**Test plan reference:** artefacts/2026-07-24-definition-to-review-autostart/test-plans/dtra-s1-auto-start-review-after-definition-test-plan.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-24

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | |
| H2 | >=3 ACs | ✅ | 4 ACs |
| H3 | Every AC has >=1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage named | ✅ | Friction reduction, extends dsda-s1 |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH | ✅ | Short-track, no /review step |
| H8 | No uncovered ACs | ✅ | |

**All hard blocks PASS.**

## Coding Agent Instructions

```
Proceed: Yes
Story: dtra-s1 -- artefacts/2026-07-24-definition-to-review-autostart/stories/dtra-s1-auto-start-review-after-definition.md
Test plan: artefacts/2026-07-24-definition-to-review-autostart/test-plans/dtra-s1-auto-start-review-after-definition-test-plan.md

Fix location: src/web-ui/routes/journey.js, handlePostGateConfirm, the
`else if (nextStage === 'review')` branch (~line 1975). Reuse
extractStoryIdsFromDefinitionArtefact (already defined lower in the same
file) against the just-completed definition stage's artefact content. If
extraction yields 1+ IDs: call journeyStore.setStoryList with the full list,
then start a review session directly (reuse the same session-creation
pattern already used 2 other places in this file -- extract a small shared
helper rather than a 3rd copy). If extraction yields 0 IDs: keep today's
redirect to /journey/:id/stories unchanged.

Oversight level: Low -- mechanical reuse of existing, already-tested logic.
```

## Sign-off

**Oversight level:** Low
**Signed off by:** Hamish King, Founder/Operator, 2026-07-24 (short-track, operator-directed same session)
