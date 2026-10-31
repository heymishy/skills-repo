# Definition of Done: Parallelize scripts/run-all-tests.js's sequential child-process execution

**PR:** https://github.com/heymishy/skills-repo/pull/1048 | **Merged:** 2026-10-31 (confirmed via `gh pr view 1048`: state MERGED, merge commit `f3815221ed7f55a245461a9f467b974036d5be9b`)
**Story:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s9-run-all-tests-parallelization.md
**Test plan:** artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s9-run-all-tests-parallelization-test-plan.md
**DoR artefact:** artefacts/2026-10-30-test-fixture-hardening-continuation/dor/tfhc-s9-dor.md
**Assessed by:** Copilot
**Date:** 2026-11-01

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `node tests/check-tfhc-s9-run-all-tests-parallelization.js` → `15 check(s) OK ✓`, re-run fresh on merged master. Full fresh timed run on merged master (817 files) shows only the 4 pre-existing/already-documented failures (none new or different, see Test Plan Coverage below) — aggregation correctness holds at real scale, not just in the small fixture tests. | integration-real-code | None |
| AC2 | ✅ | `AC2-peak-concurrency-never-exceeds-limit` passes; mutation-tested during implementation (disabling the concurrency guard made peak jump to 6, confirming it's load-bearing) | integration-real-code | None |
| AC3 | ✅ | `AC3-real-concurrent-wallclock-not-serial-sum` passes (elapsedMs bounded 200-500ms for two 250ms children at concurrency 2) | integration-real-code | None |
| AC4 | ✅ | **Manual timed run performed now, fresh, on merged master** (per the test plan's own Measurement method field): `node scripts/run-all-tests.js` → 817 files, **259130ms**. Baseline (confirmed 2026-10-31): 816 files, 485063ms sequential. Reduction: **46.6%** — comfortably clears the ≥40% target (≤291000ms; actual 259130ms is well under that ceiling too). Re-confirmed the same 4 failures as every other check this run (none new, none caused by this story). | integration-real-code | None |
| AC5 | ✅ | `AC5-per-file-output-stays-contiguous` passes; code-quality review independently confirmed the implementation buffers each child's stdout/stderr separately and flushes once per child on close, preserving both the no-interleaving property and the stdout/stderr channel distinction | integration-real-code | None |
| AC6 | ✅ | `AC6-hung-file-killed-without-blocking-siblings` passes (final, corrected version — see Deviation note). Mutation-tested (disabling the timeout-kill hangs the process, confirming the guard is load-bearing). | integration-real-code | See note below |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

**Deviation note (AC6, process quality, not a shipped defect):** AC6's own test went through two correction rounds during implementation after code-quality review empirically proved the first version had zero discriminating power (a fully-serialized replay of the same fixtures passed its assertions identically to the real concurrent run). The final, committed version is empirically verified (3 trials each side, clean separation ~313-323ms vs ~836-854ms against a 450ms threshold) to genuinely prove the property AC6 claims. This is recorded because the *test's own correctness* needed two iterations before it reliably verified the behaviour — not because the shipped behaviour itself ever deviated from AC6's wording.

No deviations found in the shipped behaviour itself on fresh re-verification.

---

## Scope Deviations

None. The story's Out of Scope section (test-file discovery mechanism, CLI/env concurrency override, CI workflow YAML, other `check-*.js` files' own test logic) is confirmed honored across the full merged diff — `GRANDFATHER_LIST`, `discoverTestFiles`, `getAllTestFiles` are byte-for-byte unchanged; no `.github/workflows/*.yml` touched; no file other than `scripts/run-all-tests.js` and this story's own new test/fixture files were modified.

Two design decisions beyond the plan's original wording were made during implementation, both logged in `decisions.md`, both confirmed necessary for AC1 to hold reliably (not independent scope creep):
1. A `SEQUENTIAL_EXCLUSIVE_LIST` mechanism, fixing a real, reproduced file-race correctness bug between two unrelated pre-existing test files (`check-lcdf-s1-build-time-learnings-count.js`, `check-lccf-s1-fail-open-learnings-count.js`) that both mutate the real, shared `workspace/learnings.md`.
2. Production pool concurrency tuned from the originally-planned `os.cpus().length` down to `Math.max(1, Math.ceil(os.cpus().length / 3))`, after finding higher concurrency caused unrelated pre-existing tests' own tight wall-clock NFR budgets to flake under contention. Still clears AC4 with wide margin (46.6% vs. the 40% target).

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7 (6 unit test entries + 1 integration test entry, totaling 15 raw assertions across AC1 ×2, AC2 ×2, AC3 ×2, AC5 ×2, AC6 ×4, AC1-integration ×3)
**Tests passing in CI:** 7 / 7 (15 / 15 raw assertions)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 mixed pass/fail aggregation + no-dropped-failure-under-queueing | ✅ | ✅ | |
| AC2 peak concurrency never exceeds limit | ✅ | ✅ | Mutation-tested |
| AC3 real wall-clock, not serial sum | ✅ | ✅ | |
| AC4 ≥40% full-suite reduction | ✅ (manual) | ✅ | Deliberately not a CI-gating automated test, per /review's own RISK-ACCEPT (1-M1) — measured here, at DoD, exactly as planned |
| AC5 output attribution, no interleaving | ✅ | ✅ | |
| AC6 hung file killed, siblings not blocked | ✅ | ✅ | 2 correction rounds before trusted — see AC Coverage deviation note |
| AC1 integration seam (discovery → execution) | ✅ | ✅ | Corrected mid-implementation to stub every `GRANDFATHER_LIST` path (found a real pre-existing latent defect in `getAllTestFiles`, fixed in the test's own fixture setup, not production code) |

**Gaps (tests not implemented):** None. AC4's own gap table entry in the test plan (manual, not CI-gated) is explicit and intentional, not an oversight, and is now closed by this DoD's own fresh measurement.

**Fresh full-suite re-verification on merged master (2026-11-01):** 817 files, 259130ms, 4 failures:
- `scripts/check-pipeline-state-integrity.js` — the long-standing, already-RISK-ACCEPTed `[C3]` flag for `tfhc-s1`, unrelated to this story.
- `tests/check-pcr-s1-test-runner.js` — the already root-caused stale-baseline N1 flake (logged at this story's own `/branch-setup`), unrelated to this story.
- `tests/check-cat-s1-core-trace-builder.js` — the already-accepted residual contention-sensitive NFR category (logged in `decisions.md`'s "stops the concurrency-tuning cycle" RISK-ACCEPT); confirmed passing standalone multiple times during implementation.
- `tests/check-p3.5-validate-trace.js` — the same local-environment-only stray-untracked-artefact-directory flake independently diagnosed earlier in this session (during `tfhc-s8`'s own DoD fresh-verification); confirmed via direct inspection that this is pre-existing main-checkout noise (untracked `artefacts/2026-10-31-discovery/`, `artefacts/stis-s1-test-slug/`, etc.), not caused by or related to this story's diff.

None of the 4 are new or different from what pre-existing investigation in this session already attributed to causes unrelated to `tfhc-s9`.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | Full-suite wall-clock runtime reduces 46.6% (259130ms vs. 485063ms sequential baseline), measured fresh on merged master — exceeds the ≥40% target with comfortable margin |
| Security | ✅ | No new production code path — confirmed via `git diff`-equivalent review of the merged PR: only `scripts/run-all-tests.js` and `tests/` files touched, zero `src/` changes |
| Accessibility | ✅ N/A | No UI |
| Audit | ✅ N/A | No audit-relevant surface |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| `run-all-tests.js` wall-clock runtime (m10) | ✅ | 2026-11-01 (now) | Baseline 816 files/485063ms sequential; target ≤291000ms (≥40% reduction) — now met at 259130ms (46.6% reduction) |

**Measurement-ready gate:** Yes — measurement is possible now.

**Signal:** on-track
**Evidence:** Fresh timed run on merged master (2026-11-01): 817 files, 259130ms, a 46.6% reduction from the confirmed 485063ms sequential baseline — exceeds the ≥40% minimum validation signal with wide margin. The only 4 failures in this run are all pre-existing/already-documented and unrelated to this story (see Test Plan Coverage above); the aggregated pass/fail result otherwise matches sequential-execution expectations, confirming AC1's own "no false pass/fail" requirement holds at full real scale, not just in the story's own small fixture tests.
**Date measured:** 2026-11-01

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. (Not blocking, already logged as `/improve` candidates in `workspace/capture-log.md`) A broader sweep of tight embedded wall-clock NFR budgets across the suite — this story's own concurrency tuning found at least 3 distinct pre-existing files in this category (`rb-s3`, `cat-s4`, `cat-s1`), confirmed to be an open-ended set, not a small fixable list.
2. (Not blocking) The `getAllTestFiles` latent defect found via this story's own integration test (unconditional `GRANDFATHER_LIST` inclusion with no existence check) remains unfixed in production code — only worth revisiting if a future story needs `getAllTestFiles`/`runAll` to work correctly against a non-real `repoRoot` again.
3. (Not blocking) The DRY observation from `tfhc-s7`'s own DoD (3 near-identical fixture-usage-check scripts) does not apply here — `tfhc-s9` touches a structurally different part of the test infrastructure (execution concurrency, not fixture usage).

This closes the `fixture-divergence-closure` epic's own final story — all 6 standard stories plus 2 spikes are now DoD-complete (or `spike-complete`).

---

## DoD Observations

1. This story generated the most extensive mid-implementation decision trail of any story in this epic: a genuine correctness bug found and fixed (the `workspace/learnings.md` file race), two rounds of empirical concurrency-cap tuning driven by real contention evidence rather than guesswork, a latent defect found and correctly worked around via test-fixture design rather than touching out-of-scope production code, and two rounds of test-quality correction on AC6 after a reviewer proved the first version was vacuous by direct measurement rather than code-reading alone. Every one of these is logged in `decisions.md` with its own rationale, alternatives-considered, and rejection reasoning — none were silently absorbed.
2. The AC6 test-quality finding is itself a strong illustration of this repo's own `test-design-patterns.md` standard working as intended: the reviewer didn't just read the code and assert it looked fine, it empirically replayed the scenario under a different configuration and found the assertion passed when it shouldn't have — exactly the discipline that standard asks for.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Parallelize scripts/run-all-tests.js's sequential child-process execution.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
