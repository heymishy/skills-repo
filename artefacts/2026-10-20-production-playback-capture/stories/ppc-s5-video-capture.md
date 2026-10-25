# Story: Self-service video capture, combined across ACs where possible

**Epic reference:** artefacts/2026-10-20-production-playback-capture/epics/ppc-self-service-capture.md
**Discovery reference:** artefacts/2026-10-20-production-playback-capture/discovery.md
**Benefit-metric reference:** artefacts/2026-10-20-production-playback-capture/benefit-metric.md
**Domain:** [web-ui]

---

## Background

Discovery's own MVP Scope named video capture as the deferred-but-planned next step once screenshot-only capture was proven: *"Video capture — `captureVideoForClip` already exists; natural next step once screenshot-only is proven."* `ppc-s1` through `ppc-s4` proved and shipped screenshot-only capture, now live in production.

Direct code inspection (this story's own `/definition` session) confirmed the real mechanism: `scripts/playback-capture.js` exports both `captureVideoRecording` (plain Playwright `recordVideo` capture) and `captureVideoForClip` (the same recording, with caption/transcript generation bundled on). Per `decisions.md`'s 2026-10-25 DESIGN entry, this story reuses `captureVideoRecording` only — captions/transcript are explicitly deferred further, since bundling them would pull in a separate D37 adapter (`generateCaptionsAndTranscript`) and its own wiring/cost/latency questions, expanding scope beyond "video functionality." Also confirmed: **neither function currently lives under `src/`** — both are in `scripts/`, excluded from the deployed Docker image, the same gap `ppc-s1`'s own Task 0 found and fixed for `captureAcScreenshots`.

**Correction (2026-10-26, pre-implementation):** the operator asked whether a single video could cover multiple ACs' verification/demo needs rather than strictly one video per AC. `feature-playback-demo`'s own `fpd-s2` AC2 already resolved this exact design question for the sibling playback feature: *"the skill supports either a single combined walkthrough file or several files targeted at individual ACs/flows, with no difference in the underlying capture mechanism — this is an engineer judgment call per feature, not a skill-enforced rule."* This story adopts the same approach: `handlePostCaptureAll`'s existing multi-AC loop records ONE combined video spanning every video-enabled AC captured in that run (one Playwright recording context for the whole run, not one per AC) — reducing capture-time overhead as a side effect, directly helping the Performance NFR below. The single-AC trigger path (`handlePostCaptureTrigger`) is unaffected in spirit — it is simply a group of one. Per-AC timestamp seeking within a combined video (so a viewer jumps straight to their AC's own moment) is a named, planned fast-follow, not built now (operator confirmed: "1 as long as we could add 2 as fast follow later") — see Out of Scope.

## User Story

As a **tenant Product Owner**,
I want to **capture a video of an AC's behaviour alongside its screenshot — combined into one shared recording with other ACs captured in the same run, where possible**,
So that **I can confirm a feature does what was promised by watching it happen, not just viewing a single static frame — closing the "trust in captured evidence" gap `benefit-metric.md`'s own Metric 3 feedback loop already names as a risk to adoption — without waiting through N separate recording sessions for a feature with many ACs**.

## Benefit Linkage

**Metric moved:** m1 (Self-service DoD validation adoption) and m3 (Engineer manual-demo load removed).
**How:** Richer, more convincing evidence (video, not just a static screenshot) directly addresses Metric 3's own named feedback-loop risk — "the gap is either trust in the captured evidence or a UX/discoverability problem for the PO" — reducing the chance a PO still asks an engineer to demo it live despite self-service capture existing.

## Architecture Constraints

- ADR-018: Playwright is the only E2E/browser-automation framework; devDependency only; the `NODE_ENV=test` auth bypass boundary must not be touched by this story (video capture uses the same session-reuse mechanism `ppc-s1`'s `_captureOneAc` already established, not a new auth path).
- ADR-025: tenant/product scoping must hold identically to screenshot capture — video is committed to the same tenant-connected repo via the same `commitArtefact`/`_resolveOwnerRepo` path.
- `captureVideoRecording` must be extracted into `src/` the same way `captureAcScreenshots` was extracted to `src/utils/capture-screenshots.js` (`ppc-s1` Task 0) before this route can call it — `scripts/` is never deployed. **Correction (2026-10-26, `/definition-of-ready`):** confirmed by reading `src/utils/capture-screenshots.js` directly — that extraction is a plain function, not a D37 injectable adapter with its own `setX`/stub-throws wiring. The real D37 boundary this story reuses is `src/web-ui/adapters/session-page-adapter.js`'s already-wired `setSessionPageAdapter` (from `ppc-s1`'s own AC8) — tests mock the fake `page`/`browser`/`video()` objects that adapter returns, exactly as `check-ppc-s1-playback-evidence-route.js` already does for screenshots. This story introduces no new adapter and requires no new `server.js` wiring.
- **Combined-capture grouping (2026-10-26 correction):** video capture is a single shared step run ONCE per capture-trigger request (whether single-AC or capture-all), after the existing screenshot loop completes — not embedded per-AC inside `_captureOneAc`. It records one combined video spanning every AC successfully screenshotted in that request (a group of one for the single-AC trigger path), then associates the SAME resulting video path with every AC in that group. This keeps `_captureOneAc` itself screenshot-only, unchanged from `ppc-s1`/`ppc-s2`'s own existing shape.
- See `decisions.md` 2026-10-25 DESIGN entry: this story ships video-only, no captions/transcript.
- `DESIGN.md` (`hasDesignSystemTrack: true`): the `<video>` element's inline sizing/attributes (AC2, AC7) must match the existing `<img>` screenshot's own current inline-style convention (`playback-evidence.js`'s `style="max-width:480px;display:block;margin-top:8px"`) exactly — not a new, differently-styled treatment. Neither element currently uses `DESIGN.md`'s card/component pattern; fixing that for both is explicitly out of scope here (see `decisions.md` 2026-10-26 RISK-ACCEPT entry) — this story's job is consistency with the existing precedent, not correcting it unilaterally.

## Dependencies

- **Upstream:** `ppc-s1`, `ppc-s2` (the existing single-AC and capture-all mechanics this story extends) — both DoD-complete.
- **Downstream:** None. Captions/transcript, redaction, and per-AC timestamp seeking within a combined video all remain fast-follow, not blocked on this story.

## Acceptance Criteria

**AC1:** Given a tenant PO triggers single-AC capture for an AC, When the screenshot succeeds, Then one video clip of that AC's own interaction (navigate to the target URL) is recorded and committed alongside the screenshot, using an extracted, `src/`-deployed version of `captureVideoRecording`.

**AC1-combined:** Given a tenant PO triggers "Capture all evidence" for a feature with 2 or more video-enabled ACs, When the screenshot loop completes, Then ONE combined video is recorded in a single Playwright recording context spanning every AC that was successfully screenshotted in that run (navigating to each AC's own target URL in sequence within the same recording) — not one recording context per AC — and that same combined video path is associated with every AC in the group.

**AC2:** Given a video has been captured and committed for an AC (single or combined), When the PO views the playback-evidence page, Then a native `<video controls>` element renders the clip inline, served through a new tenant-scoped route mirroring `handleGetCaptureScreenshot`'s own existing tenant+product+ACID_RE-guarded serving pattern — never the existing untenanted `/playback-media/` route. If the video is a combined recording shared with other ACs, the section also shows a plain-language note naming which other ACs it covers (e.g. "This video also covers: AC2, AC3").

**AC3:** Given the existing session-reuse security model (the same PO's own live session drives the headless browser, per `discovery.md`'s resolved Q1/Q3), When video is captured (single or combined), Then the exposure bound is identical to screenshot capture today — the headless browser can only ever record what that PO could already see by using the product themselves.

**AC4:** Given `handlePostCaptureAll`'s existing sequential screenshot loop and per-AC duration/failure tracking (`ppc-s2`), When the combined video recording for the whole run fails (AC1-combined), Then that failure is tracked via the existing `captureAllFailed` mechanism for EVERY AC that was meant to be included in the combined video — it does not abort or retroactively undo the screenshot loop, and does not delete any AC's already-succeeded screenshot. A combined recording's failure is all-or-nothing for the video group; an AC's own screenshot success is never contingent on the group's video outcome.

**AC5:** Given video recording (single or combined) fails partway through (e.g. the scripted interaction throws), When the capture route handles the error, Then no partial/corrupt video file is left committed to the tenant's repo — mirroring `captureVideoForClip`'s own established cleanup behaviour (delete the partial recording) even though this story reuses the simpler `captureVideoRecording`, not `captureVideoForClip` itself.

**AC6:** Given a tenant's repo has no video for a given AC yet (not yet captured), When the PO views the playback-evidence page, Then that AC shows its existing screenshot-only state (or "not captured" state) with no broken `<video>` element and no console error — video is additive, never required.

**AC7:** Given a feature with multiple video-enabled ACs renders on one page, When the page loads, Then every `<video>` element uses `preload="none"` with a `poster` thumbnail and explicit `width`/`height` attributes — so videos are not eagerly downloaded on page load (bounding the Performance NFR's own named risk) and the page has no layout shift while they load.

## Out of Scope

- Captions and a standalone transcript for the captured video — explicitly deferred (see `decisions.md` 2026-10-25 DESIGN entry); `fpd`'s own `generateCaptionsAndTranscript` D37 adapter is not wired or called by this story.
- Automated redaction/PII handling — unchanged from the epic's own existing fast-follow scope; video capture here carries the same session-bounded exposure as screenshots (AC3), not a new redaction requirement.
- Presentation polish (ffmpeg zoom/annotation) — unchanged fast-follow.
- **Per-AC timestamp seeking within a combined video** — named, planned fast-follow (operator decision, 2026-10-26: "1 as long as we could add 2 as fast follow later"). This story's combined video (AC1-combined) plays from the start only; it does not capture or expose per-AC timestamp markers, and the viewer does not jump to a specific AC's own moment within a shared recording. A future story would add timestamp capture during recording plus seek-to-time UI.
- Operator/PO control over grouping — which ACs get combined into one video is determined entirely by which ACs are captured together in one "Capture all evidence" run (AC1-combined); there is no separate UI to manually choose a custom grouping independent of the trigger action itself.

## NFRs

- **Performance:** Video recording adds meaningfully more time than a screenshot per AC — but combining the capture-all run into ONE recording context (AC1-combined) rather than N bounds this cost to roughly one video-recording session per run, not one per AC, which is a deliberate mitigation of this exact risk, not just a UX preference. `ppc-s2`'s existing `checkTimingThreshold`/30-60s threshold was sized for screenshot-only capture — this story must measure real video-inclusive capture-all duration and confirm whether that threshold still holds, or needs its own video-aware value, as part of implementation (not assumed either way up front). Page-render performance (as opposed to capture-time performance) is bounded by AC7 — lazy-loaded video prevents a feature with many video-enabled ACs from eagerly downloading the same (possibly shared) clip multiple times on page load.
- **Security:** No new exposure surface — see AC3 and `discovery.md`'s own resolved Q1/Q3. Video files follow the same tenant-scoped commit/serve path as screenshots (ADR-025).
- **Accessibility:** The captured video has no audio narration (an automated UI interaction, not a human-narrated walkthrough) — not subject to WCAG's audio-caption requirement for this specific use case. A transcript remains a deferred fast-follow (see Out of Scope), not a silently-dropped requirement.
- **Audit:** No new audit requirement beyond what `ppc-s1`/`ppc-s2` already log.
- **Design system:** Tagged `hasDesignSystemTrack: true` — `scripts/check-design-tokens.js` scans this story's touched files for non-token colors at `/definition-of-ready` (H-DESIGN). No new inline colors are introduced (the `<video>` element reuses the existing `<img>`'s own sizing attributes, not a new style block).

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
