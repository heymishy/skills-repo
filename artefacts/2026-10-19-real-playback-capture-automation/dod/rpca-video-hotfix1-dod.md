# Definition of Done: rpca-video-hotfix1 — captureVideoForClip must not delete a successfully-recorded video on a downstream caption-generation failure

**PR:** https://github.com/heymishy/skills-repo/pull/1012 | **Merged:** 2026-10-20T05:23:22Z
**Type:** Short-track fix (CLAUDE.md "Short-track" process)
**Test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-video-hotfix1-test-plan.md
**DoR artefact:** artefacts/2026-10-19-real-playback-capture-automation/dor/rpca-video-hotfix1-dor.md
**Assessed by:** Claude Sonnet 5 (session)
**Date:** 2026-10-20

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | A failure during recording itself still deletes the partial file (unchanged regression) — `check-rpca-s3-video-capture-wired-for-real.js` AC3 re-run unchanged | regression | None |
| AC2 | ✅ | A successful recording followed by a caption-generation failure does not delete the video — `check-rpca-video-hotfix1-caption-failure-preserves-video.js` AC2 (synthetic fixture); independently re-confirmed with the real fix live, capturing a real video of `jcx-s3` AC1 against real `wuce-staging` with the caption step still unwired in that process — the video survived. A follow-up run with `realGenerateCaptionsAndTranscript` wired (per `rpca-s3`'s own documented one-line fix) produced a complete video+captions+transcript set, committed at `artefacts/2026-10-11-journey-cx-redesign/playback/jcx-s3/video/page@29803e1e85466b01083f5e5f380a9be8.*` | unit-synthetic + real-world manual confirmation | None |
| AC3 | ✅ | The thrown error carries the video's own path as `err.videoPath` — same file, AC3 | unit-synthetic | None |
| AC4 | ✅ | The happy path (recording + captions both succeed) is unchanged — `check-rpca-s3-video-capture-wired-for-real.js` AC2 re-run unchanged | regression | None |

---

## Scope Deviations

None. Touched exactly `scripts/playback-capture.js`'s own `captureVideoForClip` function, as named in the DoR contract.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4
**Tests passing in CI:** 4 / 4 at merge. PR #1012's own CI hit one real, pre-existing timing flake unrelated to this change (`a1-staging-auth-stub.spec.js`'s own NFR-Performance assertion — a real staging auth round-trip took 7198ms against a 5000ms budget) — confirmed unrelated by inspection (a timing threshold on an unrelated auth-stub spec, nothing this fix touches) and resolved by re-running; all 8 checks passed clean on the third run.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No new NFR surface; cleanup-boundary correction only, no signature change | ✅ | `captureVideoForClip`'s own public shape (inputs/outputs on success) is unchanged; only the failure-path behaviour for a downstream caption error changed |

---

## Metric Signal

N/A — internal correctness fix to the real-playback-capture-automation mechanism's own video-capture step, not a new metric-contributing story.

---

## Outcome

**COMPLETE**

This is the fourth real bug found this session by actually running the playback-capture mechanism end-to-end against real data/infrastructure rather than relying on isolated unit tests alone — distinct from the three `embedScreenshotPaths` bugs (hotfix1/2/3), this one lived in `captureVideoForClip` (built by `rpca-s3`). After this fix, the real mechanism was re-run against real `wuce-staging` a second time: the recording succeeded, the caption-generation step still failed (correctly: a standalone script never runs `server.js`'s own bootstrap, which is where the real `generateCaptionsAndTranscript` implementation normally gets wired), and the video was NOT deleted this time — the actual point of this fix, confirmed live.

A correction to an initial drafting error in this DoD: an earlier version of this section claimed wiring real captions was "a separate, future concern" never delivered by any merged story. That was wrong — `rpca-s3`'s own verification (`decisions.md`, "RESOLVED 2026-10-19, rpca-s3 AC1") had already documented the exact one-line fix (`setGenerateCaptionsAndTranscript(realGenerateCaptionsAndTranscript)`) for exactly this standalone-script situation. Re-running with that line added produced a complete, real capture — video, `.vtt` captions, and a transcript — committed at `artefacts/2026-10-11-journey-cx-redesign/playback/jcx-s3/video/page@29803e1e85466b01083f5e5f380a9be8.*` (superseding the earlier video-only commit, `717b2508`, which only proved this hotfix's own preservation behaviour).

**Follow-up actions:** None. The full mechanism — auth, record, caption, transcript — now works end-to-end against real infrastructure for a real multi-AC story.

---

## DoD Observations

1. **This is the fourth bug found in this session's own end-to-end verification effort, and the first outside `embedScreenshotPaths`.** Taken together with `rpca-embed-hotfix1/2/3`'s own DoDs, the pattern holds across two entirely different functions in the same module: code that had been unit-tested, reviewed, and merged — sometimes months apart (`rpca-s3` merged well before this session's end-to-end run) — had a real, user-impacting defect that only surfaced once the full mechanism was actually exercised against real infrastructure. This reinforces rather than introduces the `/improve` candidate already logged in `rpca-embed-hotfix3-dod.md`: a "run it for real" integration pass should be a standard exit gate for shared capture/document-generation tooling, not something discovered by accident during an unrelated demo request.
2. **A destructive cleanup path (delete-on-error) is a specific risk shape worth naming generally**: any function that deletes a file as part of error recovery must verify the error actually originated from the operation that produced that file, not from any later, unrelated step sharing the same try block. `/improve` candidate: when reviewing new injectable-adapter wiring (D37) near existing cleanup/rollback logic, explicitly check whether the adapter's own correct "not wired" throw could be caught by a cleanup block upstream that was written before the adapter existed.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for rpca-video-hotfix1 (captureVideoForClip must not delete a successfully-recorded video on a downstream caption-generation failure).
Check:
1. Does every AC row have a concrete evidence reference, including the real-world re-confirmation claimed for AC2?
2. Is the CI timing-flake explanation for the first two failed runs on PR #1012 adequately justified as unrelated, rather than hand-waved?
3. Does the self-correction in the Outcome section (an earlier drafting error wrongly claimed captions were never delivered) match what `rpca-s3`'s own decisions.md entry and the committed `page@29803e1e85466b01083f5e5f380a9be8.*` files actually show?
4. Is the DoD Observations' generalisation about destructive cleanup paths and D37 adapters a reasonable lesson, or does it overreach?
Report findings as HIGH / MEDIUM / LOW.
```
