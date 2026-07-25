## Definition of Ready: Local pipeline-state schema checks (C10-C14)

**Story reference:** artefacts/2026-07-25-pipeline-state-schema-validation/stories/pss-s1-schema-required-field-checks.md
**Test plan reference:** artefacts/2026-07-25-pipeline-state-schema-validation/test-plans/pss-s1-test-plan.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-25

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | |
| H2 | >=3 ACs | ✅ | 6 ACs |
| H3 | Every AC has >=1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage named | ✅ | 5 real capture-log incidents named |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH | ✅ | Short-track |
| H8 | No uncovered ACs | ✅ | |

**All hard blocks PASS.**

## Coding Agent Instructions

```
Proceed: Yes
Story: pss-s1 -- artefacts/2026-07-25-pipeline-state-schema-validation/stories/pss-s1-schema-required-field-checks.md
Test plan: artefacts/2026-07-25-pipeline-state-schema-validation/test-plans/pss-s1-test-plan.md

Add five new checks (C10-C14) to scripts/check-pipeline-state-integrity.js,
following the exact { code, level, message } shape and self-test convention
already used by C1-C9 in the same file:
  C10 - flat feature.stories[] entry missing required 'id' field
  C11 - feature missing required 'track' field
  C12 - dodStatus null or not in ['not-started','complete'] (check both flat
        stories[] and epic-nested epics[].stories[])
  C13 - prStatus present but not in ['none','draft','open','merged'] (both
        flat and epic-nested; skip when prStatus is absent)
  C14 - acVerified present but not an integer (both flat and epic-nested;
        skip when acVerified is absent)
All FAIL-level (matching C2/C3/C4/C6/C7/C8's severity, not C5's WARN).
Add self-tests for each (fire + non-regression no-fire cases) mirroring the
existing T-numbered self-test blocks. Do not modify C1-C9's logic.

Oversight level: Low -- additive checks only, no write-path change, exit
code semantics for existing checks unchanged.
```

## Sign-off

**Oversight level:** Low
**Signed off by:** Hamish King, Founder/Operator, 2026-07-25 (short-track, operator-directed, part of capture-log review batch)
