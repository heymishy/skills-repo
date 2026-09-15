# Definition of Done: wsd-s3 — snapshot pipeline-state writer context at first-known-good

**Track:** Short-track
**PR:** https://github.com/heymishy/skills-repo/pull/890 | **Merged:** 2026-09-14 (merge commit `6332ed82`)
**Test plan:** artefacts/2026-09-15-web-ui-pipeline-state-durability/test-plans/wsd-s3-test-plan.md
**DoR artefact:** artefacts/2026-09-15-web-ui-pipeline-state-durability/dor/wsd-s3-dor.md
**Assessed by:** Claude Sonnet 5 (orchestrating session)
**Date:** 2026-09-15

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | 6 regression files re-run unchanged (68 checks) | automated test re-run | None |
| AC2 | ✅ | `check-wsd-s2-github-pipeline-state-writer.js` 24/24, unchanged | automated test re-run | None |
| AC3 | ⚠️ | Live-verified: production write STILL failed after this fix's own deploy, with the identical error message. This fix's own hypothesis (session-store staleness) was **not the actual root cause** — `wsd-s4` later isolated the real cause (a different code path, `dcuf-s1`, made this fix's `_dasOwnerRepo` snapshot unreachable in the common case). | Live production re-verification (Fly logs, `pipeline_state_write_failed` event) | RISK-ACCEPT: this story's own fix did not close the gap; superseded by `wsd-s4`. Kept as its own DoD (not silently dropped) because it genuinely shipped, passed CI, and — while insufficient alone — is not incorrect: the snapshot pattern remains harmless and the code path it touches is still exercised on the rare occasions `_dasOwnerRepo`'s block does run. |

**Confirmed in CI, not just locally:** all 8 required PR #890 checks passed before merge.

---

## Scope Deviations

**Major:** this story's fix did not resolve the underlying production issue. Root-caused and actually fixed by `wsd-s4` (PR #891), found via this story's own live re-verification step. This is the expected, correct outcome of the live-verification discipline this session established: a fix that looks correct by static analysis and passes all existing tests can still be wrong, and only real production traffic proves it. Logged honestly rather than retroactively rewriting this story's ACs to claim success it didn't have.

---

## Test Plan Coverage

**Tests from plan implemented:** T1-T8, all implemented
**Tests passing in CI:** all PR #890 checks green

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1-T6 | ✅ | ✅ | Existing regression suite, unchanged |
| T7 | ✅ | ✅ | wsd-s2's own suite, unchanged |
| T8 | ✅ | ⚠️ Failed live | Live verification ran, but the write still failed — this is the actual, correctly-recorded finding, not a false pass. |

**Gaps:** None in test execution; the gap was in the fix's own correctness, caught exactly as designed by T8.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|----------|
| None new | ✅ N/A | Pure refactor of an existing call site |

---

## Metric Signal

Did not close the benefit-metric gap on its own — see `wsd-s5`'s own DoD for the story that finally did.

---

## Outcome

**COMPLETE** (as a shipped, tested, merged fix — not as the story that closed the underlying gap, which `wsd-s4`/`wsd-s5` did)

**Follow-up actions:** None outstanding specific to this story — fully superseded by `wsd-s4`.

---

## DoD Observations

1. **A fix that passes every existing automated test and looks correct by static code re-reading can still be wrong in production.** This story's own hypothesis (session-store staleness between two reads) was plausible, defensible, and untestable without live traffic — and turned out not to be the actual mechanism at all. The real cause (`dcuf-s1`'s earlier code movement making the guarded block unreachable) was only found by re-running the exact same live-verification step this story itself had scheduled as AC3/AC4. This is strong evidence for the value of the live-verification discipline this session established across `asf-s1`, `pao-s1`, and now the whole `wsd` chain — a green CI badge and a clean re-read of the diff are not sufficient proof for a production behavioural claim.
2. **Honest DoD recording of a fix that didn't work, rather than silently rewriting history, keeps the trace record trustworthy.** This DoD documents AC3 as a genuine RISK-ACCEPT/failure, not a quiet reclassification — the next operator reading this artefact folder can see the real sequence of attempts and why each one happened.
