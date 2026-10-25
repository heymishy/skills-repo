# Story: Self-service video capture per AC

**Epic reference:** artefacts/2026-10-20-production-playback-capture/epics/ppc-self-service-capture.md
**Discovery reference:** artefacts/2026-10-20-production-playback-capture/discovery.md
**Benefit-metric reference:** artefacts/2026-10-20-production-playback-capture/benefit-metric.md
**Domain:** [web-ui]

---

## Background

Discovery's own MVP Scope named video capture as the deferred-but-planned next step once screenshot-only capture was proven: *"Video capture — `captureVideoForClip` already exists; natural next step once screenshot-only is proven."* `ppc-s1` through `ppc-s4` proved and shipped screenshot-only capture, now live in production.

Direct code inspection (this story's own `/definition` session) confirmed the real mechanism: `scripts/playback-capture.js` exports both `captureVideoRecording` (plain Playwright `recordVideo` capture) and `captureVideoForClip` (the same recording, with caption/transcript generation bundled on). Per `decisions.md`'s 2026-10-25 DESIGN entry, this story reuses `captureVideoRecording` only — captions/transcript are explicitly deferred further, since bundling them would pull in a separate D37 adapter (`generateCaptionsAndTranscript`) and its own wiring/cost/latency questions, expanding scope beyond "video functionality." Also confirmed: **neither function currently lives under `src/`** — both are in `scripts/`, excluded from the deployed Docker image, the same gap `ppc-s1`'s own Task 0 found and fixed for `captureAcScreenshots`.

## User Story

As a **tenant Product Owner**,
I want to **capture a short video clip of an AC's behaviour alongside its screenshot**,
So that **I can confirm a feature does what was promised by watching it happen, not just viewing a single static frame — closing the "trust in captured evidence" gap `benefit-metric.md`'s own Metric 3 feedback loop already names as a risk to adoption**.

## Benefit Linkage

**Metric moved:** m1 (Self-service DoD validation adoption) and m3 (Engineer manual-demo load removed).
**How:** Richer, more convincing evidence (video, not just a static screenshot) directly addresses Metric 3's own named feedback-loop risk — "the gap is either trust in the captured evidence or a UX/discoverability problem for the PO" — reducing the chance a PO still asks an engineer to demo it live despite self-service capture existing.

## Architecture Constraints

- ADR-018: Playwright is the only E2E/browser-automation framework; devDependency only; the `NODE_ENV=test` auth bypass boundary must not be touched by this story (video capture uses the same session-reuse mechanism `ppc-s1`'s `_captureOneAc` already established, not a new auth path).
- ADR-025: tenant/product scoping must hold identically to screenshot capture — video is committed to the same tenant-connected repo via the same `commitArtefact`/`_resolveOwnerRepo` path.
- D37: `captureVideoRecording` must be extracted into `src/` the same way `captureAcScreenshots` was (`ppc-s1` Task 0) before this route can call it — `scripts/` is never deployed.
- See `decisions.md` 2026-10-25 DESIGN entry: this story ships video-only, no captions/transcript.

## Dependencies

- **Upstream:** `ppc-s1`, `ppc-s2` (the existing single-AC and capture-all mechanics this story extends) — both DoD-complete.
- **Downstream:** None. Captions/transcript and redaction remain fast-follow, not blocked on this story.

## Acceptance Criteria

**AC1:** Given a tenant PO has a capture target set for an AC, When they trigger capture (single-AC or capture-all), Then a short video clip is recorded of the same interaction (navigate to the target URL) alongside the existing screenshot, using an extracted, `src/`-deployed version of `captureVideoRecording`.

**AC2:** Given a video has been captured and committed for an AC, When the PO views the playback-evidence page, Then a native `<video controls>` element renders the clip inline, served through a new tenant-scoped route mirroring `handleGetCaptureScreenshot`'s own existing tenant+product+ACID_RE-guarded serving pattern — never the existing untenanted `/playback-media/` route.

**AC3:** Given the existing session-reuse security model (the same PO's own live session drives the headless browser, per `discovery.md`'s resolved Q1/Q3), When video is captured, Then the exposure bound is identical to screenshot capture today — the headless browser can only ever record what that PO could already see by using the product themselves.

**AC4:** Given `handlePostCaptureAll`'s existing sequential loop and per-AC duration/failure tracking (`ppc-s2`), When it runs for a feature with video-enabled ACs, Then video recording is included in the same loop, and a video-recording failure for one AC is tracked via the existing `captureAllFailed` per-AC mechanism — it does not abort the whole run and does not delete a screenshot that already succeeded for the same AC.

**AC5:** Given video recording fails partway through (e.g. the scripted interaction throws), When the capture route handles the error, Then no partial/corrupt video file is left committed to the tenant's repo — mirroring `captureVideoForClip`'s own established cleanup behaviour (delete the partial recording) even though this story reuses the simpler `captureVideoRecording`, not `captureVideoForClip` itself.

**AC6:** Given a tenant's repo has no video for a given AC yet (not yet captured), When the PO views the playback-evidence page, Then that AC shows its existing screenshot-only state (or "not captured" state) with no broken `<video>` element and no console error — video is additive, never required.

**AC7:** Given a feature with multiple video-enabled ACs renders on one page, When the page loads, Then every `<video>` element uses `preload="none"` with a `poster` thumbnail and explicit `width`/`height` attributes — so videos are not eagerly downloaded on page load (bounding the Performance NFR's own named risk) and the page has no layout shift while they load.

## Out of Scope

- Captions and a standalone transcript for the captured video — explicitly deferred (see `decisions.md` 2026-10-25 DESIGN entry); `fpd`'s own `generateCaptionsAndTranscript` D37 adapter is not wired or called by this story.
- Automated redaction/PII handling — unchanged from the epic's own existing fast-follow scope; video capture here carries the same session-bounded exposure as screenshots (AC3), not a new redaction requirement.
- Presentation polish (ffmpeg zoom/annotation) — unchanged fast-follow.
- A combined single walkthrough video spanning multiple ACs — this story captures one short clip per AC, matching the existing per-AC screenshot model; a combined-video option (like `fpd`'s own AC2) is not built here.

## NFRs

- **Performance:** Video recording adds meaningfully more time than a screenshot per AC. `ppc-s2`'s existing `checkTimingThreshold`/30-60s threshold was sized for screenshot-only capture — this story must measure real video-inclusive capture-all duration and confirm whether that threshold still holds, or needs its own video-aware value, as part of implementation (not assumed either way up front). Page-render performance (as opposed to capture-time performance) is bounded by AC7 — lazy-loaded video prevents a feature with many video-enabled ACs from eagerly downloading every clip on page load.
- **Security:** No new exposure surface — see AC3 and `discovery.md`'s own resolved Q1/Q3. Video files follow the same tenant-scoped commit/serve path as screenshots (ADR-025).
- **Accessibility:** The captured video has no audio narration (an automated UI interaction, not a human-narrated walkthrough) — not subject to WCAG's audio-caption requirement for this specific use case. A transcript remains a deferred fast-follow (see Out of Scope), not a silently-dropped requirement.
- **Audit:** No new audit requirement beyond what `ppc-s1`/`ppc-s2` already log.

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
