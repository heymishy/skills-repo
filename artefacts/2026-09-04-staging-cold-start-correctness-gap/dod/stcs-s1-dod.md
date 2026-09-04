# Definition of Done: purge-e2e-tenants tolerates Neon cold-start and gets a scheduled backstop

**PR:** https://github.com/heymishy/skills-repo/pull/831 | **Merged:** 2026-09-04 (commit `033decc4`)
**Story:** artefacts/2026-09-04-staging-cold-start-correctness-gap/stories/stcs-s1-purge-e2e-tenants-cold-start-retry-and-scheduled-backstop.md
**Test plan:** artefacts/2026-09-04-staging-cold-start-correctness-gap/test-plans/stcs-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-04-staging-cold-start-correctness-gap/dor/stcs-s1-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-04

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-stcs-s1-purge-e2e-tenants-cold-start-and-schedule.js` T1/T2: `connectWithRetry` retries and falls through gracefully | automated test | See note below (design correction) |
| AC2 | ✅ | Same suite T3/T4: default 90000ms, configurable via `PURGE_E2E_TENANTS_TIMEOUT_MS` | automated test | None |
| AC3 | ✅ | Same suite T5/T6: `formatPurgeFailureMessage` distinguishes found-count states | automated test | None |
| AC4 | ✅ | Same suite T7: `purge-e2e-tenants-scheduled.yml` exists, cron-triggered, correct secret wiring | automated test | None |
| AC5 (regression guard) | ✅ | `check-alrf-s11-purge-e2e-tenants.js` 11/11 passing, unmodified | automated test | None |
| AC6 (regression guard) | ✅ | Direct diff review: existing CI wiring in `staging-deploy.yml`/`e2e.yml` byte-for-byte unchanged | direct inspection | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

**Deviation note (AC1):** the first implementation pass made the connection retry a hard pre-flight gate (abort if all 3 attempts failed). Running the existing `check-alrf-s11-purge-e2e-tenants.js` regression suite before committing caught that this broke the script's own pre-existing tolerant behaviour (graceful `[dry-run]`/`Purged` degradation even against a completely unreachable `DATABASE_URL`). Corrected before commit — the retry is now best-effort only, falling through to the exact pre-existing behaviour on exhaustion. Logged in this feature's own `decisions.md` as a design correction, not silently absorbed.

---

## Scope Deviations

One recorded, non-blocking item, plus one recorded merge-conflict resolution:

1. **The AC1 design correction described above** -- caught and fixed within the same implementation pass, before any commit, via the established practice of running related regression suites before considering a task complete.
2. **A real merge conflict in `.github/pipeline-state.json` had to be resolved before this PR could merge**, caused by this branch (`feature/stcs-s1`) and `cpco-s1`'s own branch (`feature/cpco-s1`, merged first as PR #830) both appending a new top-level `features[]` entry at the same array position from different base commits -- git's own diff algorithm treated the two independent additions as competing edits to one entry. Resolved by reconstructing both complete feature objects as separate array elements, verified against each branch's own pre-merge disk state (not guessed), confirmed via `check-pipeline-state-integrity.js` (0 fail) and a full test-suite run (611 files, 1 pre-existing failure, 0 new) before pushing the resolution.

---

## Test Plan Coverage

**Tests from plan implemented:** 10 / 10 (T1-T10)
**Tests passing in CI:** 8 / 10 automated (T1-T8); T9 (manual diff review) and T10 (manual scheduled-run confirmation) are the two non-automated items

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1-T2 connectWithRetry succeeds/rejects gracefully | ✅ | ✅ | |
| T3-T4 configurable timeout default/override | ✅ | ✅ | |
| T5-T6 formatPurgeFailureMessage found-count states | ✅ | ✅ | |
| T7 scheduled workflow shape | ✅ | ✅ | |
| T8 alrf-s11 regression suite | ✅ | ✅ | 11/11, unmodified |
| T9 existing CI wiring diff review | ✅ (manual) | ✅ | Confirmed via direct diff, not automated |
| T10 first scheduled run confirmation | Script written | Pending | Cron fires daily at 03:30 UTC -- first real firing not yet observed |

**TDD verification performed (RED confirmed, not assumed):** before committing, the `purge-e2e-tenants.js` and new workflow-file changes were stashed (`git stash push -u`, reapplied and dropped by SHA per this repo's worktree stash-safety convention) and the new test file re-run against pre-fix code -- all 7 tests failed exactly as expected (missing exports, missing workflow file), then restored.

**Gaps (tests not implemented):**
None -- T10's own gap (first scheduled run not yet observed) is explicitly named as a follow-up action below, not silently absorbed.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No regression to existing tolerant-failure behaviour | ✅ | AC1's own design-correction cycle, directly caught by the existing regression suite before commit |
| Timeout budget does not race the CI step's own external kill | ✅ | 90000ms default deliberately kept below the CI step's own `timeout-minutes: 2` (120000ms) |
| Durable backstop independent of any single CI job's timeout | ✅ | New scheduled workflow, cron-triggered, no `needs:` dependency on any deploy/test job |

`nfr-profile.md` status: not created for this story -- no performance/security/residency/availability/compliance NFRs beyond the three above, fully covered in the AC table.

---

## Metric Signal

Not applicable — short-track story, no formal benefit-metric artefact (per CLAUDE.md's short-track path). Benefit linkage was stated directly in the story: closing a real, evidenced correctness gap (unbounded orphaned E2E test-data accumulation in staging hiding behind what first looked like a pure performance issue).

---

## Outcome

**COMPLETE**

Every AC has concrete evidence. One real implementation course-correction (the retry-gate design flaw) was caught and fixed transparently via this repo's own established "run the regression suite before committing" practice, not discovered after merge. One real merge conflict was resolved carefully, with both branches' pre-merge state directly verified rather than guessed, and confirmed via integrity check plus a full test-suite run before pushing. The one genuine gap (first real scheduled-workflow firing not yet observed) is explicitly named as a follow-up, not glossed over.

**Follow-up actions:**
1. **Watch for the first real `purge-e2e-tenants-scheduled.yml` firing** (daily, 03:30 UTC) via `gh run list --workflow purge-e2e-tenants-scheduled.yml` to close out T10, or trigger it manually via `workflow_dispatch` sooner if earlier confirmation is wanted.
2. **This story's own root-cause hypothesis (Neon serverless cold-start)** remains plausible but not independently proven the same way `daga-s1`'s own root cause was -- if the sharper `formatPurgeFailureMessage` output (AC3) shows a future timeout occurring AFTER tenants were already found (not before), that would be stronger evidence pointing away from a pure connection-level cold start and toward something else (e.g. a slow per-tenant DELETE sequence) -- worth re-reading the next real timeout's own log message with that in mind.

---

## DoD Observations

1. **The AC1 design-correction is the sixth occurrence this session of "run the regression suite before committing" catching a real defect that a narrower, story-scoped test alone would have missed** -- this pattern (`ppg-s1`, `fal-s1`, `prlf-s1`, `daga-s1` x2, now `stcs-s1`) continues to be the single highest-value habit established this session, not a coincidence worth treating as one-off anymore.
2. **This is the first real merge conflict of the session**, caused directly by running two sibling short-track stories from the same investigation in parallel worktrees against a moving master. Resolved correctly by treating it as seriously as any other code change -- reconstructing from each branch's own verified pre-merge state, not guessing, and re-running the full suite before pushing the resolution -- rather than as routine housekeeping.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "purge-e2e-tenants tolerates Neon cold-start and gets a scheduled backstop" (stcs-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is the AC1 design-correction deviation (retry made non-fatal) reasonable, and is it clear why the original approach was wrong?
3. Is the merge-conflict resolution described in enough detail to trust it was done carefully, not guessed?
4. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows, given T10 (first scheduled run) is still pending?
Report findings as HIGH / MEDIUM / LOW.
```
