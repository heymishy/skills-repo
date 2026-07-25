## Definition of Ready: Deploy config safety net

**Story reference:** artefacts/2026-07-25-deploy-safety-net/stories/dsn-s1-deploy-config-safety-net.md
**Test plan reference:** artefacts/2026-07-25-deploy-safety-net/test-plans/dsn-s1-test-plan.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-25

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | |
| H2 | >=3 ACs | ✅ | 6 ACs |
| H3 | Every AC has >=1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage named | ✅ | Recurring incident (twice in one day, 2026-07-24), found via capture-log review |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH | ✅ | Short-track |
| H8 | No uncovered ACs | ✅ | |

**All hard blocks PASS.**

## Coding Agent Instructions

```
Proceed: Yes
Story: dsn-s1 -- artefacts/2026-07-25-deploy-safety-net/stories/dsn-s1-deploy-config-safety-net.md
Test plan: artefacts/2026-07-25-deploy-safety-net/test-plans/dsn-s1-test-plan.md

Create scripts/deploy-staging.js: an injectable-command-runner (D37-style)
wrapper that runs `flyctl deploy --remote-only --config fly.staging.toml
--app wuce-staging` (hardcoded, not configurable), then `flyctl config show
--app wuce-staging --json` and asserts MOCK_LLM_GATEWAY === "true" in the
result, exiting non-zero with a clear error if not. Update
.github/workflows/staging-deploy.yml's deploy-staging job to run
`node scripts/deploy-staging.js` instead of the raw flyctl deploy line.
Add "deploy:staging": "node scripts/deploy-staging.js" to package.json.

Oversight level: Low -- a thin wrapper around two existing CLI commands.
```

## Sign-off

**Oversight level:** Low
**Signed off by:** Hamish King, Founder/Operator, 2026-07-25 (short-track, operator-directed, part of capture-log review batch)
