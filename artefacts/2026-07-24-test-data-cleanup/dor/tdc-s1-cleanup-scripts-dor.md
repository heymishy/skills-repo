## Definition of Ready: Cleanup scripts for local disk and staging-DB test-generated data

**Story reference:** artefacts/2026-07-24-test-data-cleanup/stories/tdc-s1-cleanup-scripts.md
**Test plan reference:** artefacts/2026-07-24-test-data-cleanup/test-plans/tdc-s1-cleanup-scripts-test-plan.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-24

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | |
| H2 | >=3 ACs | ✅ | 5 ACs |
| H3 | Every AC has >=1 test | ✅ | AC3/AC4 mocked-DB integration + operator's own manual staging run |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage named | ✅ | Removes real, growing disk + DB clutter |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH | ✅ | Short-track |
| H8 | No uncovered ACs | ✅ | |

**All hard blocks PASS.**

## Warnings

| # | Check | Status | Notes |
|---|-------|--------|-------|
| W1 | Destructive-action safety | ✅ | Both scripts dry-run by default; staging script never accepts a wildcard delete; operator runs the staging deletion themselves, per their own explicit choice this session |

## Coding Agent Instructions

```
Proceed: Yes
Story: tdc-s1 -- artefacts/2026-07-24-test-data-cleanup/stories/tdc-s1-cleanup-scripts.md
Test plan: artefacts/2026-07-24-test-data-cleanup/test-plans/tdc-s1-cleanup-scripts-test-plan.md

Build two scripts:
1. scripts/clean-local-test-artefacts.js -- dry-run by default, --delete to act.
   Only matches artefacts/*/ directories whose only file is a bare discovery.md
   (or a known test-slug pattern), and workspace/test-tmp-* directories.
2. scripts/clean-e2e-staging-data.js -- dry-run by default, --confirm to act.
   Reads DATABASE_URL from the environment (never hardcode, never log the full
   value). Matches ONLY journeys where tenant_id LIKE 'e2e-test-%' OR owner_id
   LIKE 'e2e-test-%'. Deletes artefacts rows (by journey_id) before journeys
   rows, respecting the FK. Exits with a clear error if DATABASE_URL is unset.

Do NOT run scripts/clean-e2e-staging-data.js against the real staging database
yourself -- the operator has explicitly chosen to run it themselves. Building
and testing it (with a mocked pg.Pool) is in scope; invoking it for real is not.

Oversight level: Medium -- staging script touches a real, shared external database.
```

## Sign-off

**Oversight level:** Medium
**Signed off by:** Hamish King, Founder/Operator, 2026-07-24 (short-track, operator-directed same session)
