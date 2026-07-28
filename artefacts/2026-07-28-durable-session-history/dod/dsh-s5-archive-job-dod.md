# Definition of Done: Archive turns older than 60 days out of the hot table

**PR:** https://github.com/heymishy/skills-repo/pull/629 | **Merged:** 2026-07-28
**Story:** artefacts/2026-07-28-durable-session-history/stories/dsh-s5-archive-job.md
**Test plan:** artefacts/2026-07-28-durable-session-history/test-plans/dsh-s5-archive-job-test-plan.md
**DoR artefact:** artefacts/2026-07-28-durable-session-history/dor/dsh-s5-archive-job-dor.md
**Assessed by:** Copilot (Claude)
**Date:** 2026-07-28

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | "archiveOldTurns moves the 61-day-old row, identical content, and deletes it from the hot table" | automated unit test | None |
| AC2 | ✅ | "archiveOldTurns leaves the 30-day-old row in place, nothing added to the archive" | automated unit test | None |
| AC3 | ✅ | "node scripts/archive-session-turns.js exits 0 and does not hang, even when the DB is unreachable" — real child process spawned via `execFileSync` | automated CLI-spawn test | None |
| AC4 | ✅ | "the failing row is logged as an error; the other two rows archive successfully" | automated unit test | None |
| AC5 | ✅ | "0 rows archived" logged explicitly for both an empty table and a table with only ineligible rows | automated unit test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found.

---

## Scope Deviations

None. 3 commits on the branch: baseline confirmation (RISK-ACCEPT) plus the 2 planned tasks (script + table + unit tests; CLI-spawn test + scheduled workflow). Confirmed against Out of Scope: no rehydration logic, no per-tenant-configurable threshold, and no permanent deletion of archived data were introduced.

One judgment call made during implementation, not a deviation: the archive table deliberately does NOT carry the hot table's `UNIQUE(journey_id, skill_name)` constraint, since the archive is an append-only historical log and a re-completed stage that's later archived a second time must be able to produce a second, coexisting archive row rather than colliding with the first — directly serving the story's own "never permanently losing conversation history" goal.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5
**Tests passing in CI:** 7 / 7 (5 planned + an AC5b edge case + the AC3 CLI-spawn test, both additive)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: old rows moved to archive, deleted from hot | ✅ | ✅ | |
| AC2: recent rows untouched | ✅ | ✅ | |
| AC3: job exits cleanly, no persistent process | ✅ | ✅ | Real child process, unreachable DB |
| AC4: per-row error doesn't abort the batch | ✅ | ✅ | |
| AC5: zero-eligible-rows run completes cleanly | ✅ | ✅ | Both empty-table and no-eligible-rows sub-cases |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no long-running locks, batched moves | ✅ | Chunked in batches of 100 rows; no formal timing measurement taken (matching this story's own NFR test plan section, which confirmed with the story owner that this is observed operationally via CI job duration, not unit-tested). |
| Security — archived data retains tenant-scoping | ✅ | `archiveRow` copies `tenant_id` verbatim, no stripping or alteration; confirmed by AC1's test asserting identical row content. |
| Accessibility — none identified | ✅ | Backend-only scheduled job, no UI surface. |
| Audit — summary logged on every run | ✅ | "Archived N row(s), M error(s)" (or "0 rows archived") logged unconditionally. |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| m3 — Turn storage stays bounded | ✅ (baseline: no growth control today, turns deleted at completion pre-dsh-s1) | Not yet — requires at least one real scheduled run plus dsh-s6 (rehydration) to also ship before the metric's own target ("100% archived; rehydration succeeds") can be assessed | The job is merged and deployed (daily cron), but hasn't had a real production run yet. |

m1/m2 are unaffected by this story — dsh-s5 does not contribute to either per `benefit-metric.md`'s Metric Coverage Matrix.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. dsh-s6 (archive rehydration) is the last remaining story in the dsh-e1 epic — DoR-signed-off but unimplemented.
2. Once the scheduled workflow has had its first real run (next 03:17 UTC after merge), confirm it actually archived eligible rows in production (or logged "0 rows archived" if none were eligible yet, which is expected initially since `session_turns` only started accumulating rows as of dsh-s1's merge on 2026-07-28 — no row will be 60 days old for two months).
3. Once dsh-s6 ships, m3 can be properly assessed against its full target.

---

## DoD Observations

1. **Fourth recurrence of the CI/staging-deploy-collision pattern** was observed on this story's own PR (both Scenario A and Scenario B failed simultaneously this time, with different symptoms — a timing budget failure and a homepage-redirect failure — both resolved cleanly on retry with zero code changes). This continues to confirm it as a structural, repo-wide issue rather than a one-off flake; already logged in `workspace/capture-log.md`, no new entry needed, but this is now the fourth confirmed occurrence across dsh-s2/s3/s4/s5's PRs.
2. **Feature-level guardrails again left at their DoR-time assessment** (5 of 6 stories now merged) — same judgment call as dsh-s1 through dsh-s4's DoD artefacts. This should genuinely be revisited once dsh-s6 (the final story) merges.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Archive turns older than 60 days out of the hot table (dsh-s5).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
