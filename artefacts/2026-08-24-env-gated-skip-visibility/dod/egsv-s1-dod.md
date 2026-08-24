# Definition of Done: Report environment-gated skips separately from passes in the test suite

**PR:** https://github.com/heymishy/skills-repo/pull/765 | **Merged:** 2026-08-24
**Story:** artefacts/2026-08-24-env-gated-skip-visibility/stories/egsv-s1-report-environment-gated-skips-separately-from-passes.md
**Test plan:** artefacts/2026-08-24-env-gated-skip-visibility/test-plans/egsv-s1-test-plan.md
**DoR:** artefacts/2026-08-24-env-gated-skip-visibility/dor/egsv-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-24

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — `check-p3.5-validate-trace.js`'s two pwsh-unavailable skips increment `skipped`, not `passed`; summary reports skip count | ✅ | `p35SkipsAreTrackedSeparately` + `p35SummaryReportsSkipCount`, re-run fresh against merged master | Automated content-assertion test | None |
| AC2 — `check-p4-enf-second-line.js`'s T6 bash-unavailable skip increments `skipped`, not `passed`; summary reports skip count | ✅ | `enfSecondLineT6TrackedSeparately` + `enfSecondLineSummaryReportsSkipCount` | Automated content-assertion test | None |
| AC3 — `check-vtp-s1-validate-trace-consolidation.js`'s two bash/python3-unavailable skips increment `skipped`, not `passed`; summary reports skip count | ✅ | `vtpS1BlockSkipsTrackedSeparately` + `vtpS1SummaryReportsSkipCount` | Automated content-assertion test | None |
| AC4 — behaviour unchanged when the required binary IS available | ✅ | `passIncrementSitesUnrelatedToSkipUnchanged` — non-skip assertion sites confirmed untouched | Automated content-assertion test | None |
| AC5 — suite exit code unchanged; skips still never fail the suite | ✅ | `exitCodeLogicUnchangedAcrossAllThree` + direct exit-code check (`0` for both `check-p4-enf-second-line.js` and `check-vtp-s1-validate-trace-consolidation.js` when their skip paths fired live on the build machine) | Automated test + direct manual run | None |

**All 5 ACs satisfied.** 8/8 tests re-run fresh against merged master (commit `c937e124`), 0 failures.

---

## Scope Deviations

None. The merged diff (`tests/check-p3.5-validate-trace.js`, `tests/check-p4-enf-second-line.js`, `tests/check-vtp-s1-validate-trace-consolidation.js`, the new test file, 3 new artefacts, `.github/pipeline-state.json`) maps directly to the story. No `check-skill-contracts.js` entry was added or needed — that script is scoped to `SKILL.md` files only, and none were touched here.

---

## Test Plan Coverage

**Tests passing:** 8/8, re-run fresh 2026-08-24 against merged master (commit `c937e124`) — `tests/check-egsv-s1-env-gated-skip-visibility.js`.

**Gaps:** None per the test plan's own stated scope — actually spawning the 3 files under a fabricated bash/pwsh-unavailable environment was explicitly out of scope (content-assertion against source is sufficient; simulating binary absence via PATH manipulation risks destabilising the rest of the suite's own use of bash/pwsh mid-run).

**Real-world validation beyond the test plan itself:** this fix was proven against a live instance of the exact bug it closes, on the same machine, in the same session. Before the fix, `check-vtp-s1-validate-trace-consolidation.js`'s `ENV_OK` check evaluated false in this environment (bash/python3 not fully usable via this shell), so the file silently reported `1 passed, 0 failed` for zero actual assertions run. After the fix, the same run honestly reports `0 passed, 0 failed, 1 skipped (bash/python3 unavailable)`. Separately, `check-p4-enf-second-line.js`'s T6 skip path also fired live on this machine, reporting `21 passed, 0 failed, 1 skipped (bash unavailable)` post-fix instead of folding that skip into the passed count. `check-p3.5-validate-trace.js`'s pwsh-gated skip paths did not fire on this machine (pwsh's `hasPwsh()` pre-check returns true here), so those two paths were verified by content-assertion only, per the test plan's stated scope — a separate, pre-existing flake in that file's real-execution path (`ps1-exits-0-on-valid-repo-with-ci-flag`, a Windows `pwsh`/WindowsApps-alias permission quirk) was independently confirmed unrelated to this change by running the file's committed pre-edit version and observing the identical failure.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ N/A | Reporting-only change to existing counters; no added runtime |
| Security / Accessibility / Data-residency / Availability | ✅ N/A | Test-harness-internal change, no new code surface (per story's own NFR framing) |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track feature (per the story's own Benefit Linkage field). This story closes item #5 of the 7-item ranked backlog surfaced during the 2026-08-24 capture-log sweep — the last of the "3, 4 then 5" sequence explicitly requested by the operator, following `s3fw-s1` (#3) and `vtc-s1` (#4).

---

## Outcome

**COMPLETE**

No deviations, no test gaps, no NFR gaps.

---

## DoD Observations

1. **Deliberately bounded scope, confirmed correct in hindsight**: the story explicitly excluded the broader `check-p4-dist-*.js`/`check-p4-nta-*.js`/`check-p4-spike-*.js` family, which share the identical `passed++`-on-skip shape but for API-shape reasons (not platform-availability). That boundary held throughout implementation with no scope creep — a good candidate for a follow-up story if the same false-confidence concern is judged to extend to that family.
2. **Merge-order note**: this PR merged cleanly with no conflict against `s3fw-s1`'s prior merge, despite both touching `.github/pipeline-state.json` — the two additions landed on different array positions and git's line-based merge resolved them without collision, unlike the earlier `evcg-s1`↔`psms-s1` false-conflict this session.
3. Closes item #5 of the 7-item ranked backlog from the 2026-08-24 capture-log sweep ("Windows-gated `.sh` tests give false local confidence") — the last of the explicit "3, 4 then 5" sequence.
