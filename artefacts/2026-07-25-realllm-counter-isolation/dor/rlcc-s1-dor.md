## Definition of Ready: Staging smoke-test job worker isolation (rlcc-s1)

**Story reference:** artefacts/2026-07-25-realllm-counter-isolation/stories/rlcc-s1-smoke-test-worker-isolation.md
**Test plan reference:** artefacts/2026-07-25-realllm-counter-isolation/test-plans/rlcc-s1-test-plan.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-25

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | |
| H2 | >=3 ACs | ✅ | 3 ACs |
| H3 | Every AC has >=1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage named | ✅ | dss-s1 post-merge live verification finding |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH | ✅ | Short-track |
| H8 | No uncovered ACs | ✅ | |

**All hard blocks PASS.**

## Coding Agent Instructions

```
Proceed: Yes
Story: rlcc-s1 -- artefacts/2026-07-25-realllm-counter-isolation/stories/rlcc-s1-smoke-test-worker-isolation.md
Test plan: artefacts/2026-07-25-realllm-counter-isolation/test-plans/rlcc-s1-test-plan.md

In .github/workflows/staging-deploy.yml's smoke-test job, add --workers=1
to the "Run @mocked suite against staging" step's run: line
(npx playwright test --grep "@mocked" --workers=1), following the exact
same precedented, narrowly-scoped pattern as e2e.yml's a2ccf-s1 fix (a
comment there explains the rationale for a structurally similar
concurrency-on-shared-resource problem). Add a code comment above the line
explaining why (real-LLM-call counter race across concurrent workers hitting
the same shared staging server). Do not touch playwright.config.js. Add a
new tests/check-rlcc-s1-smoke-test-worker-isolation.js covering the test
plan's 3 ACs.

Oversight level: Low -- one CI workflow line, fully precedented pattern,
zero production code change.
```

## Sign-off

**Oversight level:** Low
**Signed off by:** Hamish King, Founder/Operator, 2026-07-25 (short-track, operator-directed, part of capture-log review batch)
