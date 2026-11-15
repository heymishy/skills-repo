## Definition of Ready: Make the coha-s7 structural tests pass in a Windows checkout with CRLF line endings

**Story reference:** artefacts/2026-11-15-coha-s7-test-crlf-fix/stories/cwt-s1-make-the-coha-s7-test-line-ending-safe.md
**Test plan reference:** artefacts/2026-11-15-coha-s7-test-crlf-fix/test-plans/cwt-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-15
**Track:** short

## Contract Proposal
See `artefacts/2026-11-15-coha-s7-test-crlf-fix/dor/cwt-s1-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** One test file, one normalised read and two tests; all 3 ACs map to a test or a named run. The exclusion list (no workflow, script, library or git-attributes change) has zero test assertions against it.

## Short-track entry-condition note
Short-track (CLAUDE.md: `/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV are vacuously satisfied, as for `sff-s1` and `dsrf-s1`.

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "a developer working in a Windows checkout" |
| H2 | At least 3 ACs Given / When / Then | ✅ | 3 ACs |
| H3 | Every AC has a test | ✅ | AC1 UT1 plus run, AC2 CI, AC3 UT2 |
| H4 | Out of scope populated | ✅ | 3 exclusions |
| H5 | Benefit linkage | ✅ (short-track) | Removes two false failures W3 and W5 |
| H6 | Complexity rated | ✅ | 1, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | No review ran |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []` |
| H9 | Architecture Constraints populated | ✅ | Names ADR-011 |
| H-E2E, H-NFR, H-NFR2, H-NFR3, H-GOV, H-ADAPTER, H-INF, H-MIG, H-DESIGN | N/A or vacuous | ✅ | Test file only; NFRs "None" with the correctness note |

**Hard blocks: 19/19 passed** (2 vacuous).

## Warnings
| # | Status | Note |
|---|--------|------|
| W1, W2, W3, W5 | ✅ | NFRs stated; stability Stable; no review; no uncertain gaps |
| W4 | ⚠️ Pending operator | Verification script not yet walked by a human; low risk (three one-line checks) |

## Standards injection
Domain tags: `[pipeline-tooling, tests]`. `testing` standards may apply: `.github/standards/testing/` files are listed in `.github/standards/index.yml` under `testing`; the agent should read them. Tag `tests` itself is not an index key; `pipeline-tooling` is not either: no further standards injected.

## Oversight level
**Low** - a test-only change; no runtime path.

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: artefacts/2026-11-15-coha-s7-test-crlf-fix/stories/cwt-s1-make-the-coha-s7-test-line-ending-safe.md
Test plan: artefacts/2026-11-15-coha-s7-test-crlf-fix/test-plans/cwt-s1-test-plan.md

Goal:
In tests/check-coha-s7-error-issue-incident.js normalise CRLF to LF where the workflow text is read (line ~732), and add UT1 and UT2. Write UT1 and UT2 first. Run the file in the main Windows checkout before and after: before = W3 and W5 fail (42 passed, 2 failed); after = 46 passed, 0 failed. Note that in an LF worktree UT1 already passes; to see the real red state, run the file against a CRLF copy of the workflow via the main checkout (the worktree checkout may also have CRLF through autocrlf: check with a CR count).

Constraints:
- Test file only. Do NOT change the workflow, scripts, library, .gitattributes or git config.
- Do not loosen, remove or reword any existing pin. Only the one read changes plus two new tests.
- ASCII only; verify non-ASCII count (learnings D60). Use Edit with plain text.
- Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree.
- Open a draft PR when tests pass - do not mark ready for review. The operator merges.

Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No; W4 advisory.