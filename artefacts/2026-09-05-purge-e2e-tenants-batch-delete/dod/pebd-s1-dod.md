# Definition of Done: purge-e2e-tenants uses batched deletes instead of per-tenant sequential loops

**PR:** https://github.com/heymishy/skills-repo/pull/835 | **Merged:** 2026-09-04 (commit `40c597b6ca4d08bda21ff8a2f67511ddf482da38`)
**Story:** artefacts/2026-09-05-purge-e2e-tenants-batch-delete/stories/pebd-s1-batch-delete-purge-e2e-tenants.md
**Test plan:** artefacts/2026-09-05-purge-e2e-tenants-batch-delete/test-plans/pebd-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-05-purge-e2e-tenants-batch-delete/dor/pebd-s1-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-05

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-pebd-s1-purge-e2e-tenants-batch-delete.js` T1/T2: `purgeTenantsBatch` issues exactly 11 queries (one per table) for a batch, each with one array param, removes only targeted tenants | automated test | None |
| AC2 | ✅ | Same suite T3/T4: `purgeE2eTenants` chunks a 450-tenant list into 200/200/50 at `BATCH_SIZE=200`; return shape unchanged | automated test | None |
| AC3 (regression guard) | ✅ | Same suite T5: `purgeTenant` (single-tenant) unchanged, still exported, still correct | automated test | None |
| AC4 (regression guard) | ✅ | `tests/check-alrf-s11-purge-e2e-tenants.js` 11/11 passing | automated test | Fixture required extension to recognise the new batched query shape (documented below — a DoR-unanticipated but necessary fix, not a scope change) |
| AC5 (regression guard) | ✅ | `tests/check-stcs-s1-purge-e2e-tenants-cold-start-and-schedule.js` 7/7 passing, unmodified | automated test | None |
| AC6 (real-world, RISK-ACCEPTed) | ✅ **CONFIRMED WORKING** | See "Live verification" below | Direct read of the PR's own real CI job log against real staging Neon | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by `/trace`.

---

## Live verification (the load-bearing check this story exists to produce)

AC6's own bar was: confirmed via the real log's own success message (`Purged N e2e-test- tenant(s)`) rather than another timeout, against the real, currently-existing backlog. That confirmation was obtained directly from PR #835's own CI run, before merge, against the real staging Neon database — the strongest available evidence, since it is the actual production-scale backlog reacting to the actual fix, not a simulation.

Job `101194945345` (run `33926134334`, Scenario A E2E staging, PR #835), fetched via `gh api repos/heymishy/skills-repo/actions/jobs/101194945345/logs`:
```
Run node scripts/purge-e2e-tenants.js
...
Purged 2261 e2e-test- tenant(s): e2e-test-a3-ac1-...@example.test, [...]
```
Step started `2026-09-04T22:38:53Z`, completed `2026-09-04T22:39:29Z` — **36 seconds** to clear 2261 tenants, against the old approach's routine 90-second timeout that never finished. This is the same real backlog documented in this story's own Problem section (2260 tenants at `ptvs-s1`'s merge, growing to 2261 by the time this PR's own CI ran) — fully cleared, not a smaller or synthetic sample.

No new PR-triggered CI run has occurred against master since the merge (no new PRs opened as of this DoD), so there is no second, independent post-merge purge log yet. The daily scheduled backstop (`purge-e2e-tenants-scheduled.yml`, 03:30 UTC) will provide the next independent confirmation; if it fails or times out, that would be a new regression to investigate, not evidence against this DoD's own conclusion — the pre-merge run above already used the real batched code path against the real database.

---

## Scope Deviations

**One deviation, found and fixed within this story, not the DoR's own anticipated scope:** `tests/check-alrf-s11-purge-e2e-tenants.js`'s own fake-DB fixture only recognised the old single-tenant `= $1` query shape. Once `purgeE2eTenants` started routing through `purgeTenantsBatch`'s `= ANY($1::text[])` shape, every batched DELETE silently fell through to the fixture's no-op catch-all, breaking AC3a/AC3b (both call `purgeE2eTenants`, not `purgeTenant` directly — AC2's own direct `purgeTenant` calls were unaffected). Found via the full regression-suite run required before commit, not anticipated by this story's own DoR contract. Fixed by extending the fixture with two new regex branches recognising the batched shape — documented inline in the fixture itself — not worked around. All 11 tests pass after the fix.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8 (T1-T8)
**Tests passing:** 8 / 8 — T1-T7 automated, T8 (the real-world post-fix confirmation) performed directly via the PR's own real CI log and confirmed passing

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 `purgeTenantsBatch` issues 11 queries, not 33, for a 3-tenant batch | ✅ | ✅ | |
| T2 `purgeTenantsBatch` removes only batched tenants | ✅ | ✅ | |
| T3 `purgeE2eTenants` chunks 450 tenants into 200/200/50 | ✅ | ✅ | |
| T4 `purgeE2eTenants` return shape unchanged at any scale | ✅ | ✅ | |
| T5 `purgeTenant` (single-tenant) regression check | ✅ | ✅ | |
| T6 `check-alrf-s11` regression suite | ✅ | ✅ | 11/11, required a fixture extension — see Scope Deviations |
| T7 `check-stcs-s1` regression suite | ✅ | ✅ | 7/7, unmodified |
| T8 real-world post-fix confirmation | ✅ | ✅ | Confirmed via PR #835's own real Scenario A CI log — 2261 tenants purged in 36s, see Live verification |

**TDD verification performed (RED confirmed, not assumed):** `scripts/purge-e2e-tenants.js`'s own change was stashed via `git stash push -u -m "pebd-s1-tdd-verify-check"` (worktree stash-safety convention — re-found and restored by tag, not `stash pop`), the new test file re-run against pre-fix content — T1-T3 (the genuinely new behaviour) failed exactly as expected; T4/T5 (regression-shape checks) correctly still passed either way; stash restored and dropped.

**Full suite run before commit:** 615 files, 1 pre-existing failure (`tests/check-p3.5-validate-trace.js`, confirmed present on master before this branch existed — same known baseline as every prior story this session), 0 new failures after the `check-alrf-s11` fixture fix above.

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No regression to `purgeTenant`'s own single-tenant path or to `stcs-s1`'s retry/timeout/scheduling logic | ✅ | AC3/AC5, both regression suites pass unmodified in behaviour |
| The fix actually clears the real, growing production backlog, not just a synthetic one in CI | ✅ | Live verification section, real 2261-tenant backlog cleared in 36s on the PR's own CI run against real staging |
| Round-trip count bounded regardless of backlog size | ✅ | AC2/T3 — chunking at `BATCH_SIZE=200` keeps round-trips at ~11 per chunk regardless of total tenant count |

`nfr-profile.md` status: not created for this story — covered fully by the AC table (short-track, consistent with `ptvs-s1`).

---

## Metric Signal

Not applicable — short-track story, no formal benefit-metric artefact (per CLAUDE.md's short-track path). Benefit linkage is now empirically confirmed: the real, actively-growing 2260+ tenant backlog documented in this story's own Problem section was fully cleared in a single 36-second run, and the architectural bottleneck (sequential per-tenant loop) that caused the growth is removed.

---

## Outcome

**COMPLETE**

Every AC has concrete evidence, including AC6 — the one this story exists to satisfy. Unlike `ptvs-s1`'s live check (performed after promotion, in the same session), this story's AC6 evidence was captured pre-merge, directly from the PR's own CI run against the real staging database — a stronger form of evidence than originally planned in the DoR (which anticipated only a post-merge check), since it used the real batched code path against the real, full-size backlog before the PR was even merged. The one DoR-unanticipated deviation (the `check-alrf-s11` fixture gap) was found via the mandatory full-suite run and fixed within the same story, not deferred.

**Follow-up actions:**
None outstanding from this story's own scope. The daily scheduled backstop (`purge-e2e-tenants-scheduled.yml`) will provide ongoing independent confirmation that the backlog stays cleared; no action required unless it reports a failure.

---

## DoD Observations

1. **Pre-merge CI evidence can satisfy a RISK-ACCEPTed "post-merge only" AC when the CI run genuinely exercises the real production-scale data.** This story's DoR anticipated AC6 could only be confirmed after merge, but PR #835's own Scenario A job ran the real batched purge against the real staging Neon database (the same backlog documented in the story) before merge — that evidence is not weaker just because it arrived pre-merge. Worth recognising as a pattern for future urgent-fix stories: check whether the PR's own CI already provides the real-world confirmation before assuming a separate post-merge step is required.
2. **This is the second consecutive urgent, evidence-driven short-track story this session (`ptvs-s1`, `pebd-s1`) where the AC6-equivalent real-world check was actually performed and documented at DoD time, not deferred or assumed.** Continues the standing convention established across `stcs-s1`/`dcfx-s1`/`ptvs-s1`.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "purge-e2e-tenants uses batched deletes instead of per-tenant sequential loops" (pebd-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is the "Live verification" section specific enough to trust it was a real check (real job ID, real log excerpt, real tenant count and timing)?
3. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
