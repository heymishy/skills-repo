## Story: /branch-complete's freshness check must not be invalidated by /verify-completion's own bookkeeping commit

**Track:** short
**Discovered during:** `/definition-of-done` for `ilce-s2` (2026-11-06), feature `2026-11-04-inner-loop-cycle-efficiency`

## User Story

As an **operator running the inner loop**,
I want **`/branch-complete`'s freshness check to only count commits that touch real code/content, not a skill's own pipeline-state.json/pipeline-timings.jsonl bookkeeping commit, as "a commit since"**,
So that **the skip condition `ilce-s2` built can actually trigger in real usage, instead of never firing because `/verify-completion`'s own closing commit always counts against itself**.

## Bug

`scripts/lib/branch-complete-freshness.js`'s `isFresh(record, context)` compares `record.timestamp` (the `/verify-completion`-stage timing record) against `context.lastCommitTimestamp`. `skills/branch-complete/SKILL.md`'s Step 1 never specifies how `lastCommitTimestamp` should be computed, so every orchestrating session (confirmed directly this session, for both `ilce-s3` and `ilce-s4`) computes it via `git log -1 --format=%cI` — the most recent commit of any kind.

But `/verify-completion`'s own "State update — mandatory final step" always appends the timing record and then commits `pipeline-state.json` as its closing action, within the same skill run. That commit's timestamp is always later than the record it just wrote — by seconds, but always later. So by the time `/branch-complete` checks freshness, "the most recent commit" is *always* `/verify-completion`'s own bookkeeping commit, which always postdates its own record. `isFresh` therefore always returns `false` (not fresh) in real sequential operation, regardless of whether any actual code changed — the skip path can never fire as currently specified.

This was never caught by `ilce-s2`'s own unit tests because they pass a synthetic `lastCommitTimestamp` directly, bypassing the real git-commit-sequencing behavior that only shows up in live usage.

## Acceptance Criteria

**AC1:** Given `/verify-completion` ran a full test suite successfully and its own closing commit is the only commit that happened since the timing record was appended, When `/branch-complete`'s Step 1 computes freshness, Then that bookkeeping-only commit does not count as "a commit since" — the freshness check still reports fresh.

**AC2:** Given a real code commit (touching any file other than `.github/pipeline-state.json` or `.github/pipeline-timings.jsonl`) happened after the timing record, When `/branch-complete`'s Step 1 computes freshness, Then it correctly reports not-fresh — this AC must not be weakened by the AC1 fix.

**AC3:** The fix must be a pure, unit-testable function (not inline shell-command prose only) so the behavior from AC1/AC2 is directly verifiable without depending on real git state in CI.

## Out of Scope

- Any change to `isFresh`'s own record-vs-commit-timestamp comparison logic, or to `decideSkipOrRun`'s shape — both are correct given a correctly-computed `lastCommitTimestamp`; only the computation of that input is being fixed.
- Any change to `/verify-completion`'s own commit behavior (it is correct to commit its own state write; the fix is on the reading side, not the writing side).

## NFRs

- **Performance:** The corrected git-log invocation (with pathspec exclusions) must remain well under 1 second, same budget as the original story.
- **Security:** None.
- **Accessibility:** N/A.
- **Audit:** No change to the existing skip/ran timing-log audit trail.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
