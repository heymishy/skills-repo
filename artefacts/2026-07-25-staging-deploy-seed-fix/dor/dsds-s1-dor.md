## Definition of Ready: Install dependencies before the staging-deploy seed step

**Story reference:** artefacts/2026-07-25-staging-deploy-seed-fix/stories/dsds-s1-install-deps-before-seed-step.md
**Test plan reference:** artefacts/2026-07-25-staging-deploy-seed-fix/test-plans/dsds-s1-test-plan.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-25

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | |
| H2 | >=3 ACs | ⚠️ | 2 ACs -- accepted for a 2-line CI workflow fix mirroring an existing in-file pattern verbatim |
| H3 | Every AC has >=1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage named | ✅ | Direct operator-reported CI gap found while fixing the FLY_API_TOKEN incident |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH | ✅ | Short-track |
| H8 | No uncovered ACs | ✅ | |

**All hard blocks PASS** (H2 waived by complexity/scope -- see note).

## Coding Agent Instructions

```
Proceed: Yes
Story: dsds-s1 -- artefacts/2026-07-25-staging-deploy-seed-fix/stories/dsds-s1-install-deps-before-seed-step.md
Test plan: artefacts/2026-07-25-staging-deploy-seed-fix/test-plans/dsds-s1-test-plan.md

Add "Set up Node.js" (actions/setup-node@v4, node-version 20, cache npm) and
"Install dependencies" (npm ci) steps to the deploy-staging job in
.github/workflows/staging-deploy.yml, between "Deploy to wuce-staging" and
"Seed staging database" -- mirroring the smoke-test job's own identical
pattern in the same file verbatim.

Oversight level: Low -- two steps copied from an existing, working job in
the same file.
```

## Sign-off

**Oversight level:** Low
**Signed off by:** Hamish King, Founder/Operator, 2026-07-25 (short-track, operator-directed same session, found while fixing FLY_API_TOKEN)
