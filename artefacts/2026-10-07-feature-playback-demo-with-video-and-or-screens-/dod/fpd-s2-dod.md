# Definition of Done: Add a Playwright-recorded video walkthrough with machine-generated captions and transcript

**PR:** https://github.com/heymishy/skills-repo/pull/995 | **Merged:** 2026-10-15
**Story:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s2-video-walkthrough-and-accessibility.md
**Test plan:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/test-plans/fpd-s2-test-plan.md
**DoR artefact:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/dor/fpd-s2-dor.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-10-16

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Playwright `recordVideo` captures the scripted sequence, saves `.webm` files to `artefacts/[feature-slug]/playback/video/` | ✅ (RISK-ACCEPT for live-execution evidence) | `AC1 (unit)` test passes: mocked browser context, correct `recordVideo.dir`/`size` options, correct output path. Real-recording E2E spec written, syntactically valid, not executed (no reachable Postgres, decisions.md D5). RISK-ACCEPT formally logged in decisions.md 2026-10-16 (UI-evidence gate) | `unit` (script logic); real-execution `not-verified`, RISK-ACCEPT per decisions.md | None — gap is execution-environment, not implementation |
| AC2 — Single combined video or several per-AC/per-flow clips both work via the same mechanism, engineer's own choice | ✅ | `AC2 (unit)` test passes: 1-clip input produces exactly 1 output file, 3-clip input produces exactly 3, same `captureVideoRecording` code path, no branching difference beyond clip count | `unit` | None |
| AC3 — A caption file and a standalone transcript exist alongside every video, marked human-reviewable | ✅ | `AC3 (unit)` test passes: `generateCaptionsForVideo` writes both files at the expected derived paths, returns `reviewed: false` | `unit` | None |
| AC4 — A silent (no-narration) recording still gets a real transcript, sourced from the interaction sequence | ✅ | `AC4 (unit)` test passes: using the real (not mocked) adapter implementation, a silent-recording fixture still produces a non-empty transcript traceable to its own interaction-sequence text | `unit` (exercises the real `realGenerateCaptionsAndTranscript`, not a mock) | None |
| AC5 — Package not complete while any video's captions/transcript remain unreviewed | ✅ | `AC5 (unit)` test passes: `isPackageComplete` returns `false` while a video entry has `reviewed: false` even when the top-level status claims `"complete"`; returns `true` only after `markPackageReviewed` confirms every video | `unit` | None |
| AC6 — D37 adapter (`generateCaptionsAndTranscript`): unwired throws the exact stub error; wired behaviour is traceably correct per input, not a reference-assignment check | ✅ | `AC6 (unit)` test passes: unwired call throws the exact mandated message. `AC6 (integration)` test passes: two different fixture inputs to the real, wired implementation produce two different, individually-traceable outputs (D37 behavioural-correctness shape, per the `tir-s1`/`tir-s7` precedent) | `unit` (unwired case); `integration-real-code` (wired behavioural case — exercises the real, unmocked `realGenerateCaptionsAndTranscript`) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

**Verification strength summary:** 5 unit, 1 unit (unwired D37 case), 1 integration-real-code, 0 live-verified, 0 production-observed.
**UI-evidence gate:** 1 AC (AC1) required it — closed via a formal RISK-ACCEPT in decisions.md (2026-10-16), the same pattern as `fpd-s1` AC3. Unlike `fpd-s1` AC3, this gap could not be partially closed via a Claude-in-Chrome live check — video recording is Playwright's own automation stack, not something the Chrome extension drives — so full closure genuinely requires the real E2E spec execution once a reachable Postgres/staging environment exists. A post-deployment smoke test is logged in `workspace/state.json` `pendingActions`.

---

## Scope Deviations

None. The merged PR implemented exactly the 6 declared ACs — no AI narration, no web-app viewer, no in-browser editing, no `ffmpeg`/MP4 encoding, and no caption-accuracy guarantee were introduced, matching the story's own Out of Scope section.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7
**Tests passing in CI:** 7 / 7 (full regression suite: 757 / 757 files, 0 failures)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (unit): recording script's own logic | ✅ | ✅ | Mocked browser context — see AC1 note above for the real-execution RISK-ACCEPT |
| AC2 (unit): single-file and multi-file shapes | ✅ | ✅ | |
| AC3 (unit): captions and transcript exist alongside every video | ✅ | ✅ | |
| AC4 (unit): silent recording still produces a transcript | ✅ | ✅ | |
| AC5 (unit): package incomplete while captions/transcript unreviewed | ✅ | ✅ | |
| AC6 (unit): unwired adapter throws the exact D37 stub error | ✅ | ✅ | |
| AC6 (integration): behavioural wiring, two different inputs | ✅ | ✅ | |

**Test gaps:** None. AC1's real-recording E2E spec is implemented (syntactically valid) but not executable in this sandbox — a RISK-ACCEPTed execution gap, not a missing test.

**Coverage gap audit (real-browser-dependent, same class as CLAUDE.md's CSS-layout-dependent B2 rule):**
- Was it RISK-ACCEPTed in /decisions before coding started? **No** — named in `fpd-s2-test-plan.md` prose at test-plan time and the PR description before merge, but the dedicated `decisions.md` entry was not logged until this `/definition-of-done` pass. This is the second consecutive story in this feature with this exact timing gap (`fpd-s1` AC3 had the same issue) — see DoD Observations below for the `/improve` candidate this confirms.
- Was the manual verification scenario executed during pre-code sign-off or post-merge smoke test? **Not yet** — added to `workspace/state.json` `pendingActions`.
- No recording/capture bug has shipped as a result — the gap is purely an unexecuted check, not an observed defect.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — demo preparation time (M3, applies to `fpd-s1`/`fpd-s2`) | ⚠️ Not yet measured | Automation shipped (Playwright `recordVideo` + automated caption/transcript generation replaces manual screen-recording and narration-authoring), but no instrumented timing session has been run yet — ties to M3's own `not-yet-measured` signal below |
| Security — video captures only what is already visible in the normal authenticated UI (applies to `fpd-s1`/`fpd-s2`) | ✅ | Code review: `captureVideoRecording` and `generateCaptionsForVideo` take an already-authenticated `browser`/`page` object injected by the caller — no new fetch, query, or data-access path introduced |
| **Accessibility — WCAG AA baseline, captions + transcript on every video, non-optional (this story's own primary NFR, AC3–AC5)** | ✅ | AC3 (captions+transcript exist), AC4 (silent recordings aren't exempt), AC5 (package blocked until reviewed) all pass — together constitute this NFR's own test coverage, per the test plan's own stated approach |
| Audit — none, read-only (applies to all 4 stories) | ✅ | Confirmed by code review: the only side effects are writing local video/caption/transcript files under `artefacts/[feature-slug]/playback/` — no mutating action against any existing system |

**Guardrail citation correction (found during this DoD, not fixed — documentation-only, see DoD Observations):** the story's own Architecture Constraints cite "MC-A11Y-01/MC-A11Y-02" as the accessibility guardrails this NFR aligns with. Checked against the actual guardrail registry: `MC-A11Y-01` = "Interactive elements keyboard-accessible", `MC-A11Y-02` = "Colour not sole indicator of gate status (icons/labels present)" — both are platform-UI guardrails unrelated to video captions/transcripts, and `fpd-s2` introduces no interactive UI elements at all (backend-only story). Left both guardrail entries at `not-assessed` rather than incorrectly marking them `met` for a story that doesn't actually exercise them.

**Feature-level `nfr-profile.md` status:** remains `Active` — `fpd-s3`/`fpd-s4`'s own NFRs (viewer auth/authz, response time) are not yet addressed and will be assessed at their own DoD runs.

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Acceptance loop closure rate (Tier 1, Metric 1: % of DoD-validated features producing a complete playback package within 5 business days) | ✅ (0%, confirmed) | Not yet — `fpd-s2` completes the doc+screenshots+video trio, but the package isn't genuinely shareable/reviewable until `fpd-s3`/`fpd-s4` (the viewer) ship | `not-yet-measured`, not a gap — expected at this point in the walking skeleton |
| M3 — Demo preparation time (Tier 1, Metric 3: engineer active input time per package) | ✅ (ad hoc estimate, 2–4h) | Not yet — needs a real, representative timed run across the whole `fpd-s1` + `fpd-s2` pipeline, not yet attempted | `not-yet-measured`, not a gap |

M2 (Sponsor feedback re-entry rate) has no `contributingStories` entry for `fpd-s2` and is not assessed here — it belongs to `fpd-s3`/`fpd-s4`.

---

## Outcome: COMPLETE ✅

ACs satisfied: 6/6 (AC1 via RISK-ACCEPT for live-execution evidence, formally logged)
Scope deviations: None
Test gaps: None (one execution-only RISK-ACCEPT, not a missing test)

**Follow-up actions:**
1. Run the post-deployment smoke test for AC1 (`tests/e2e/fpd-s2-video-capture.spec.js`) once a reachable Postgres/staging environment is available — logged in `workspace/state.json` `pendingActions`. Note: unlike `fpd-s1` AC3, this cannot be partially closed via a Claude-in-Chrome live check (different automation stack) — full closure requires the real spec execution.
2. Proceed to `fpd-s3` (viewer route + traceability structure) — the next story in the walking-skeleton sequence, and the first one that makes any of this package browsable in the web app.
3. **`/improve` candidate (confirmed pattern, not acted on here):** two consecutive stories in this feature (`fpd-s1` AC3, `fpd-s2` AC1) each had their own browser-dependent RISK-ACCEPT named correctly in test-plan/PR prose but not logged as a dedicated `decisions.md` entry until DoD's own UI-evidence gate caught it. Worth making `/definition-of-ready`'s own B2 classification step write the `decisions.md` entry inline at the point it classifies a gap as RISK-ACCEPT, rather than relying on `/definition-of-done` to catch a missed one after the fact every time.

---

## DoD Observations

1. **Process-timing gap, recurring (2nd instance, /improve candidate):** see Follow-up action 3 above — this is now a confirmed pattern across two stories, not a one-off.
2. **Guardrail miscitation, found and left honest (not silently corrected):** the story's Architecture Constraints cite `MC-A11Y-01`/`MC-A11Y-02` as the relevant accessibility guardrails, but those are platform-UI guardrails (keyboard access, colour-as-sole-indicator) unrelated to video captions/transcripts — `fpd-s2` has no UI at all. Neither guardrail entry was updated (both remain `not-assessed`), since doing so would have been a traceability defect of exactly the kind this repo's own standards warn against elsewhere. No dedicated accessibility guardrail exists in the registry for "machine-generated captions/transcript on video content" specifically — worth adding one in a future `/improve` pass if this pattern recurs for `fpd-s4` (which will actually render video in the UI).
3. **Real bug caught during TDD, not shipped:** an unawaited async test block would have let `process.exit()` fire before its own assertions ran, silently passing while skipping AC1's real checks entirely. Caught by comparing the reported pass-count against the number of test blocks written, not by trusting the exit code. Fixed before any commit; logged in `workspace/capture-log.md` and `workspace/learnings.md` as a reusable pattern for this repo's own plain `check-*.js` test convention.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Add a Playwright-recorded video walkthrough with machine-generated captions and transcript" (fpd-s2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
