## Definition of Ready: Loud story-creation warning in `skills advance`

**Story reference:** artefacts/2026-07-25-advance-cli-visibility/stories/acv-s1-loud-story-creation-warning.md
**Test plan reference:** artefacts/2026-07-25-advance-cli-visibility/test-plans/acv-s1-test-plan.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-25

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | |
| H2 | >=3 ACs | ✅ | 4 ACs |
| H3 | Every AC has >=1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage named | ✅ | Affected every kanban story branch this session (2026-07-24); found via capture-log review |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH | ✅ | Short-track |
| H8 | No uncovered ACs | ✅ | |

**All hard blocks PASS.**

## Coding Agent Instructions

```
Proceed: Yes
Story: acv-s1 -- artefacts/2026-07-25-advance-cli-visibility/stories/acv-s1-loud-story-creation-warning.md
Test plan: artefacts/2026-07-25-advance-cli-visibility/test-plans/acv-s1-test-plan.md

In src/enforcement/cli-advance.js's story-lookup block (~lines 166-190),
track whether the resolved story was found vs newly created. Leave
creation behaviour itself unchanged (still permitted per CLAUDE.md cdg.6).
When newly created: append a clearly-labelled warning to stderr (feature
slug + story-id that didn't match) and prefix stdout's success message
differently from the plain "Advanced: " message used for a real update.
exitCode stays 0 in both cases. No change when only feature-scoped fields
are present (no story lookup happens at all in that branch already).

Oversight level: Low -- messaging-only change, no write-path behaviour
change, exit code unchanged.
```

## Sign-off

**Oversight level:** Low
**Signed off by:** Hamish King, Founder/Operator, 2026-07-25 (short-track, operator-directed, part of capture-log review batch)
