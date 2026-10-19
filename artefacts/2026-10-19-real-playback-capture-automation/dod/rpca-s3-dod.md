# Definition of Done: Video capture wired for real, reusing the existing caption/transcript adapter

**PR:** https://github.com/heymishy/skills-repo/pull/1006 | **Merged:** 2026-10-19T04:52:46Z
**Story:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s3-video-capture-wired-for-real.md
**Test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-s3-test-plan.md
**DoR artefact:** artefacts/2026-10-19-real-playback-capture-automation/dor/rpca-s3-dor.md
**Assessed by:** Claude Sonnet 5 (session)
**Date:** 2026-10-19

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification strength | Deviation |
|----|-----------|----------|------------------------|-----------|
| AC1 — a real `.webm` file is produced via Playwright's own `recordVideo` | ✅ | Real post-merge run: `rpca-s3-manual-verify.js` against real `wuce-staging`, producing a real 411022-byte `.webm`, committed as durable proof evidence | `live-verified` | None, after one adapter-wiring fix in the verification script itself (see DoD Observations — not a product bug) |
| AC2 — `generateCaptionsForVideo` is invoked, output marked `reviewed: false` | ✅ | Unit test (mocked adapter) + the same real run above, confirmed by directly reading the real `.vtt`/`.transcript.txt` file contents, not just trusting the script's own printed success message | `live-verified` | None |
| AC3 — no partial/corrupt file left on a mid-capture failure | ✅ | Unit test: mocked Playwright context throwing mid-recording, confirms the original error propagates unmasked and the partial file is deleted | `integration-real-code` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

None of the 3 ACs describe browser-observable UI behaviour in the sense the UI-evidence gate targets (this is CLI/file-output behaviour, verified by direct file inspection, not a browser render check) — the gate does not apply.

---

## Scope Deviations

None. The merged PR's 2 task commits + 2 state-bookkeeping commits all map to the locked touch points (`scripts/playback-capture.js`, one new test file). The post-merge AC1 verification added one new artefact-only file (`verification-scripts/rpca-s3-manual-verify.js`) and committed the real proof evidence — both are pipeline bookkeeping/evidence, not scope changes to the story's own touch points.

---

## Test Plan Coverage

**Tests from plan implemented:** 2 / 2 automated (AC2, AC3); AC1's own manual scenario executed post-merge
**Tests passing in CI:** 2 / 2; full regression suite 765/765 at merge

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC2 (unit): success path wires captions, marked unreviewed | ✅ | ✅ | Reconfirmed for real by the post-merge manual run |
| AC3 (unit): failure-cleanup leaves no partial file | ✅ | ✅ | |
| AC1 (manual): a real `.webm` is produced | ✅ | ✅ | Executed post-merge, 2026-10-19, after merge — see DoD Observations |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ (N/A) | No new NFR beyond `rpca-s1`'s own established posture |
| Security | ✅ (N/A) | No new NFR beyond `rpca-s1`'s own established posture; no new credential surface |
| Accessibility | ✅ | Captions/transcript requirement `fpd-s2` established is now real, confirmed by this story's own real run |
| Audit | ✅ (N/A) | Read-only |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Real capture coverage on new DoD-complete features | ✅ (0%, confirmed) | Not yet | Closes the video half of the mechanism `rpca-s1`/`rpca-s2` proved for screenshots — same reasoning as those stories: this is a deliberate proof exercise against `journey-cx-redesign`, not a new feature's own natural DoD workflow. |
| M2 — Manual capture time per feature | ⚠️ Not yet fully measured | Not yet | Same reasoning. |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None remaining — AC1 is resolved for real, not deferred.

---

## DoD Observations

1. **A real, found-and-fixed gap in the verification tooling itself, not the shipped code.** The first AC1 run failed with `Adapter not wired: generateCaptionsAndTranscript` — the D37 adapter correctly refusing to run unwired, exactly as designed (CLAUDE.md's Injectable adapter rule: stub defaults MUST throw, never silently fake output). Root cause: the standalone manual-verify script never ran `src/web-ui/server.js`'s own bootstrap sequence, which is where `setGenerateCaptionsAndTranscript(realGenerateCaptionsAndTranscript)` normally happens — `captureVideoForClip` itself has no bug. Fixed by wiring the same real implementation directly in the verification script (one line). This is the correct D37 behaviour working exactly as intended — surfacing a genuine gap in a one-off verification script, not masking it with a convenient fake. **`/improve` candidate:** future manual-verification scripts for any story touching a D37-adapted function should wire the real implementation explicitly in a documented setup step, rather than discovering the missing wiring at run time.
2. The real post-merge run also reconfirmed AC2 (captions/transcript correctness) beyond what the unit test's mocked adapter alone could show — the real `realGenerateCaptionsAndTranscript` implementation was exercised against a real interaction-sequence string, and its output was read directly from disk, not just asserted by the test.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for rpca-s3 (Video capture wired for real).
Check:
1. Does every AC row have a concrete evidence reference, including the verification-strength tag?
2. Is the AC1 adapter-wiring gap in the verification script described accurately as tooling, not a product defect?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
