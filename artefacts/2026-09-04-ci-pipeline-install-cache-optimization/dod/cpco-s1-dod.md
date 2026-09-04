# Definition of Done: CI jobs skip unneeded Playwright browser downloads and cache the browsers they do need

**PR:** https://github.com/heymishy/skills-repo/pull/830 | **Merged:** 2026-09-04 (commit `7e76deed`)
**Story:** artefacts/2026-09-04-ci-pipeline-install-cache-optimization/stories/cpco-s1-skip-unneeded-playwright-downloads-and-cache-browsers.md
**Test plan:** artefacts/2026-09-04-ci-pipeline-install-cache-optimization/test-plans/cpco-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-04-ci-pipeline-install-cache-optimization/dor/cpco-s1-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-04

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-cpco-s1-playwright-download-skip-and-cache.js` T1: all 9 npm-ci call sites set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` | automated test | None |
| AC2 | ✅ | Same test T2: all 6 Chromium-installing jobs have a cache step first | automated test | None |
| AC3 | ✅ | Same test T3: `cache: 'npm'` present on all 9 setup-node call sites | automated test | None |
| AC4 (real-world) | ✅ | PR #830's own CI run: "Cross-tenant isolation spec" 1m11s (was 7m43s), "Lint, typecheck, test, build" 3m24s (was 7m30s), Scenario A E2E 9m3s, Scenario B E2E 3m24s -- all Chromium-needing jobs passed | Direct observation, real CI run | None |
| AC5 (regression guard) | ✅ | `check-bri-s2.5`/`check-bri-s2.6`/`check-sdsb-s1` all pass unmodified | automated test | None |
| AC6 (observable improvement) | ✅ | Same real-world evidence as AC4 -- non-Playwright job (`Lint, typecheck, test, build`) install-adjacent total time dropped from 7m30s to 3m24s (roughly 54% faster end-to-end for that job) | Direct observation, real CI run | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

One recorded, non-blocking item -- a benign CI-infrastructure interaction discovered and resolved transparently, not silently absorbed:

1. **`Scenario B E2E (staging)` was cancelled once during PR #830's own CI run**, with the reason "Canceling since a higher priority waiting request for deploy-group exists" -- purely a `concurrency: deploy-group` contention artifact from running this PR's own E2E jobs in parallel with `stcs-s1`'s (PR #831) sibling E2E jobs, both sharing the same concurrency group by design (`cif-s1`'s own deliberate cold-app/cold-DB race guard). Not a defect in this story's own changes. Confirmed by re-running the specific cancelled job once the concurrency slot was free -- it passed cleanly (3m24s) with no other change needed.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7 (T1-T7)
**Tests passing in CI:** 6 / 7 automated (T1-T5 plus the regression suites); T7 (manual duration-comparison verification) confirmed via direct real-world observation on PR #830's own CI run, not a separately-scripted manual push -- a stronger form of evidence than originally planned, matching the same pattern already used for `sdsb-s1`'s own DoD

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD on all 9 npm-ci sites | ✅ | ✅ | |
| T2 cache step before all 6 Chromium installs | ✅ | ✅ | |
| T3 cache: 'npm' on all 9 setup-node sites | ✅ | ✅ | |
| T4 bri-s2.5 regression suite | ✅ | ✅ | 7/7, unmodified |
| T5 bri-s2.6 regression suite | ✅ | ✅ | 10/10, unmodified |
| T6 sdsb-s1 regression suite | ✅ | ✅ | 2/2, unmodified |
| T7 manual duration verification | ✅ (script written) | ✅ (real-world, not scripted) | Confirmed directly via PR #830's own CI run durations |

**TDD verification performed (RED confirmed, not assumed):** before committing, all 5 workflow-file changes were temporarily stashed (`git stash push -u`, reapplied and dropped by SHA per this repo's worktree stash-safety convention) and the new test file re-run against pre-fix content -- all 3 tests (T1-T3) failed with 12 total per-file mismatches exactly as expected, then restored.

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No unintended skip of real code changes | ✅ | This story's own merge commit (touching real workflow YAML, not bookkeeping) correctly triggered a full new staging-deploy run, confirmed via `sdsb-s1`'s own AC3 real-world check |
| No disruption to existing governance tests | ✅ | 3 related regression suites (19 tests total) all pass unmodified |
| Measured, not assumed, performance improvement | ✅ | Real before/after durations captured directly from GitHub Actions run history, not estimated |

`nfr-profile.md` status: not created for this story -- no performance/security/residency/availability/compliance NFRs beyond the measured-improvement one above, fully covered in the AC table.

---

## Metric Signal

Not applicable — short-track story, no formal benefit-metric artefact (per CLAUDE.md's short-track path). Benefit linkage was stated directly in the story and is now empirically confirmed, not just estimated: real CI run durations dropped roughly 75-85% for the two heaviest install-bound jobs measured (`Cross-tenant isolation spec`: 7m43s -> 1m11s; `Lint, typecheck, test, build`: 7m30s -> 3m24s).

---

## Outcome

**COMPLETE**

Every AC has concrete, real-world evidence -- unusually strong for a short-track story, since the deep-dive that scoped this story also produced the exact before/after measurements needed to confirm it worked, not just that it shipped. One benign CI-concurrency deviation recorded transparently. Zero regressions across 19 existing governance tests plus the 7 new ones.

**Follow-up actions:**
1. **Watch the next several real staging-deploy runs** (post-merge, on master) to confirm the same install-time savings hold outside the PR-check context too -- the deep-dive's own original baseline measurements (`deploy-staging`'s 7m01s install step) were taken from `staging-deploy.yml`, not just PR checks, so this is the natural closing confirmation.
2. **Sibling story `stcs-s1`** (PR #831, staging cold-start correctness gap) remains open, from the same deep-dive -- merge and DoD separately once the operator is ready.

---

## DoD Observations

1. **This is the first story this session whose own benefit was empirically measured, not just estimated, before DoD was even written** -- the deep-dive's original before/after numbers and this PR's own real CI run durations line up directly, giving unusually strong confidence this story actually delivers what it claims, not just that its tests pass.
2. **The `deploy-group` concurrency cancellation is a real, recurring shared-infrastructure interaction between this repo's own parallel E2E jobs (`cif-s1`'s design) and simultaneous operator/agent activity across multiple PRs** -- worth naming as a standing awareness item (not a new story): running two feature branches' E2E-touching PRs at the same time will predictably cause one to have its Scenario B (or similar) job queued out and require a manual re-run once the other's finishes. Not a defect, but worth remembering next time multiple PRs are in flight together, as happened today with `cpco-s1` and `stcs-s1`.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "CI jobs skip unneeded Playwright browser downloads and cache the browsers they do need" (cpco-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is the AC4/AC6 real-world evidence (measured before/after durations) convincing, or should a further post-merge staging-deploy.yml observation be treated as a blocking follow-up rather than optional?
3. Is the Scenario B cancellation deviation correctly classified as benign CI-infrastructure noise, not a real defect?
4. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
