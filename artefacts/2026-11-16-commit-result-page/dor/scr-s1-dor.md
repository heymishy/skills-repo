## Definition of Ready: Show the "Committed" result page after a skill session commit, instead of a server error

**Story reference:** artefacts/2026-11-16-commit-result-page/stories/scr-s1-commit-result-page.md
**Test plan reference:** artefacts/2026-11-16-commit-result-page/test-plans/scr-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Track:** short

## Contract Proposal
See `artefacts/2026-11-16-commit-result-page/dor/scr-s1-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** Two source files and one new test file; all 7 acceptance criteria (AC) map to a named test or a named live scenario. The contract's exclusion list (`adapters/skills.js`, `views/commit-view.js`, the preview handler, `handleCommitArtefact`, pull request URL, new store, dependencies) has zero test assertions against it, and the touched files are exactly the ones the tests need (B1/D1 check: `server.js` is a required touchpoint for T1 and T3 and is not in the exclusion list). T6 asserts the unwired stub of `adapters/skills.js` without changing it.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied, as for the earlier short-track stories in this repo.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "a person who has just committed a skill session's artefact" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 7 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1, AC2 T2, AC3 T3, AC4 T4, AC5 T5, AC6 T6, AC7 live scenario 9 |
| H4 | Out of scope populated | ✅ | 4 exclusions |
| H5 | Benefit linkage | ✅ (short-track) | A successful commit stops ending on an error page |
| H6 | Complexity rated | ✅ | 1, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | No review ran |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC7 live-only, acknowledged |
| H9 | Architecture Constraints populated | ✅ | Names ADR-011, ADR-012, ADR-025 and the D37 rule |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | No AC depends on CSS layout; the existing view is not changed |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | Security, reliability, performance in the story |
| H-ADAPTER | Injectable adapter (D37) | ✅ | Stub keeps throwing (T6); wiring is its own named change in the contract; AC1 and AC3 assert behaviour, not assignment; two sessions give two results |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (N/A) | No UI markup changes; `hasDesignSystemTrack` not set |

**Hard blocks: 19/19 passed** (2 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W1, W2, W3 | ✅ | |
| W4 | ⚠️ Pending operator | Scenario 9 (live) needs a signed-in production session and a real commit, after the ecf-s1 live check |
| W5 | ⚠️ Accepted | `committedAt` lives on the session; if the session store does not persist it across a restart, the result page of an already-committed session answers 404 after that restart |
| W6 | ⚠️ Accepted | The result lookup is by session id with no owner check, exactly as `getCommitPreview` already is; the id is unguessable and the data is only the path already shown at preview; owner checks across the skills routes are a separate story |
| W7 | ⚠️ Operator hold | Do not merge or deploy before the ecf-s1 live check is done: this route is currently its only trigger for a real 5xx |

## Standards injection
Domain tags `[web-ui]`: matched `.github/standards/web-ui/web-ui-patterns.md`. The agent must read it first.

## Oversight level
**Low** - one read-only page and one in-memory stamp; no data writes beyond the stamp. No named sign-off required.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-16-commit-result-page/stories/scr-s1-commit-result-page.md
Test plan: artefacts/2026-11-16-commit-result-page/test-plans/scr-s1-test-plan.md
Contract: artefacts/2026-11-16-commit-result-page/dor/scr-s1-dor-contract.md
Goal: write tests/check-scr-s1-commit-result-page.js (T1 to T7) first and confirm T1, T3 and T5 FAIL for the right reason (Adapter not wired / 500); then add htmlGetCommitResult and the committedAt stamp to routes/skills.js and the wiring to server.js (separate change from the handler). No scope beyond the 7 ACs.
Constraints:
- Do not change adapters/skills.js or views/commit-view.js. The stub must keep throwing.
- Not committed (unknown, no committedAt, no path) answers 404 "Commit result not found"; never show "Committed." for it.
- Wiring tests assert behaviour: two different sessions give two different, correct results.
- Read .github/standards/web-ui/web-ui-patterns.md and .github/architecture-guardrails.md first. No new npm dependencies.
- Stage only the files you changed (never `git add -A` on artefacts/ after a full-suite run: the suite writes stub files there).
- Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges, and not before the ecf-s1 live check; no production deploy.
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No; W4 to W7 advisory.
