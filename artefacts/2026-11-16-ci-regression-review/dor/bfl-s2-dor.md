## Definition of Ready: Fix the three test files that really fail in CI, then empty the baseline

**Story reference:** artefacts/2026-11-16-ci-regression-review/stories/bfl-s2-fix-the-three-real-ci-failures.md
**Test plan reference:** artefacts/2026-11-16-ci-regression-review/test-plans/bfl-s2-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Track:** short

## Contract Proposal
See `artefacts/2026-11-16-ci-regression-review/dor/bfl-s2-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** Nine files; all 6 acceptance criteria (AC) map to a named test or the PR's own CI run. The exclusion list (product code, the regress-back spec, the baseline mechanism, other checks, dependencies) has zero test assertions against it, and every file the tests touch (the integrity script, the schema, the state file, `ci-audit-comment.js`, the baseline and the two edited test files) is in the build list (B1/D1 check).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "the operator" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 6 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1 to T4, AC2 T5, AC3 T6 and T7, AC4 T8, AC5 T9 and the edited baseline tests, AC6 CI |
| H4 | Out of scope populated | ✅ | |
| H5 | Benefit linkage | ✅ (short-track) | Empties the tolerated-failures list without falsifying any record |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC6 live-only (CI) |
| H9 | Architecture Constraints populated | ✅ | ADR-011 named |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | No UI |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | Security (guard not weakened), honesty (no record edited to pass) |
| H-ADAPTER | Injectable adapter (D37) | ✅ (N/A) | None introduced |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (N/A) | No UI |

**Hard blocks: 19/19 passed** (several vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | ⚠️ Accepted | The `tfhc-s1` data (`testPlan.knownFailing` 1 and its reason) is written on master with `bin/skills advance` before the PR, because the story is epic-nested and a branch-side state edit can be silently lost at merge (CLAUDE.md, cdg.6/B2). The current checker ignores the field, so master is unchanged in behaviour until the PR merges |
| W2 | ⚠️ Accepted | The regress-back product bug stays unfixed and unguarded in CI; recorded as the follow-up `rgs-s1` |
| W3 | ⚠️ Pending | AC6 needs the PR's Linux CI run |

## Standards injection
Domain tags `[ci, tests]`: no matching standards file beyond `.github/architecture-guardrails.md`; the agent must read it first.

## Oversight level
**Low** - checker and guard tests with CI as the final proof; no production runtime path changes (`ci-audit-comment.js` runs in CI only). No named sign-off required.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-16-ci-regression-review/stories/bfl-s2-fix-the-three-real-ci-failures.md
Test plan: artefacts/2026-11-16-ci-regression-review/test-plans/bfl-s2-test-plan.md
Contract: artefacts/2026-11-16-ci-regression-review/dor/bfl-s2-dor-contract.md
Goal: write tests/check-bfl-s2-real-ci-failures.js (T1 to T9) first and confirm T1, T2, T5, T6, T7 and T9 FAIL for the right reason; then implement the C3 carve-out, the schema fields, the tfhc-s1 data, the isInsideRepo helper and sourceIntegrity change, update gpa T3 and the bfl-s1 tests, and empty the baseline.
Constraints:
- NEVER set tfhc-s1 testPlan.passing to 5: one test genuinely fails. The honest record is passing 4 plus knownFailing 1 with a written reason.
- The carve-out must refuse: knownFailing without a reason, a shortfall (passing + knownFailing < totalTests), and an over-count.
- The guard must reject all six vectors under both path.posix and path.win32 and must not reject valid in-repo paths; keep a startsWith(repoRoot + sep) containment test and the guard-before-readFileSync ordering.
- Do not touch ep3-s1-regression.spec.js, journey.js or other product code.
- Read .github/architecture-guardrails.md first. No new npm dependencies.
- Commit before running the full suite in the worktree (a test fires a stray git commit that can sweep up staged work); stage only the files you changed; discard the junk the suite leaves (artefacts/<date>-discovery, artefacts/stis-s1-test-slug, workspace/test-tmp-*, the artefacts/test-slug/ideate.md edit).
- Do NOT edit workspace/state.json. Draft PR only; the operator merges.
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No.
