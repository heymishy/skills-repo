# Definition of Ready: /branch-complete's freshness check must not be invalidated by /verify-completion's own bookkeeping commit

**Story reference:** artefacts/2026-11-06-bcfx-s1/stories/bcfx-s1-freshness-bookkeeping-commit-fix.md
**Test plan reference:** artefacts/2026-11-06-bcfx-s1/test-plans/bcfx-s1-test-plan.md
**Track:** short (skips discovery/benefit-metric/definition/review per CLAUDE.md's short-track path)
**Assessed by:** Claude (Sonnet 5)
**Date:** 2026-11-06

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | Operator running the inner loop |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 3 ACs |
| H3 | Every AC has ≥1 test | ✅ | 4 tests covering 3 ACs |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H6 | Complexity rated | ✅ | 1 |
| H9 | Architecture Constraints / no scope creep into unrelated logic | ✅ | Fix is isolated to how `lastCommitTimestamp` is computed; `isFresh`'s own comparison and `decideSkipOrRun`'s shape are explicitly out of scope |

**All hard blocks pass.**

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: /branch-complete's freshness check must not be invalidated by /verify-completion's own bookkeeping commit — artefacts/2026-11-06-bcfx-s1/stories/bcfx-s1-freshness-bookkeeping-commit-fix.md
Test plan: artefacts/2026-11-06-bcfx-s1/test-plans/bcfx-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js CommonJS only, matching scripts/lib/branch-complete-freshness.js's
  existing style (same file as ilce-s2 shipped -- extend it, do not replace it)
- Add a new function getLastCodeCommitTimestamp(execGitLog) to
  scripts/lib/branch-complete-freshness.js. It must accept an injectable
  executor function (defaulting to a real execSync-based git-log call using
  a pathspec exclusion for .github/pipeline-state.json and
  .github/pipeline-timings.jsonl), consistent with the DI pattern already
  used by scripts/lib/dod-handoff-reconciliation.js's execGhPrList parameter
  in this same repo.
- Do NOT modify isFresh's own comparison logic or decideSkipOrRun's return
  shape -- only add the new helper function and update
  skills/branch-complete/SKILL.md's Step 1 prose to call it instead of a
  raw, unspecified git log -1 command.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech lead awareness (no formal sign-off) — solo repo
**Signed off by:** Hamish King, 2026-11-06 (via explicit "Fix now, short-track" confirmation)
