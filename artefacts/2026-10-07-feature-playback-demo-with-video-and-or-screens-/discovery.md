# Discovery: Feature Playback Demo Package

**Status:** Approved
**Date:** 2026-10-07
**Feature slug:** 2026-10-07-feature-playback-demo-with-video-and-or-screens

---

## Problem statement

Once a feature reaches DoD-validated status, there is no consistent, governed practice for communicating that outcome to business sponsors or users. The current state is ad hoc: some teams share the DoD artefact, some demo the live system, some do nothing. This means sponsors have no reliable way to provide formal acceptance feedback, and the pipeline's traceability claims — which extend all the way to DoD — stop short of the stakeholder acceptance loop. Features that need iteration based on sponsor feedback have no structured re-entry path back into the outer loop.

---

## Who it affects

**Primary — Feature sponsors / business owners:** Executives, product owners, or end users who commissioned or will use the delivered feature. They need to see evidence that the delivered work meets the criteria and metrics they care about — not just that the engineering team considers it done.

**Primary — Feature engineers / delivery teams:** The people who built the feature and completed the DoD. They currently bear the burden of ad hoc demo preparation, with no consistent format or tooling support.

**Secondary — Platform operators / ways-of-working leads:** People responsible for ensuring the delivery pipeline produces consistent, auditable outcomes. The absence of a governed demo step is a gap in the pipeline's end-to-end traceability.

---

## Why now

The outer loop pipeline is now mature enough (discovery → DoD, multi-epic, multi-story delivery) that the absence of a governed acceptance loop is the next visible gap. Without it, DoD-validated features enter a black box from a sponsor perspective — there is no structured feedback signal, no acceptance record, and no governed re-entry path when changes are needed. As more features complete the full pipeline, this gap compounds.

---

## MVP scope

A governed **Feature Playback Package** skill that, given a DoD-validated feature, produces a structured demo artefact. The MVP output is:

1. A **structured walkthrough document** — framed around the feature's ACs and benefit metrics, not just "here's what we built." Each section maps to a specific AC or metric.
2. **Screenshots** — captured (assisted or automated via Playwright or equivalent) at the key, repeatable, stable UI states that demonstrate each AC being met — the best candidates for automation per the `best-practice-grounding-outcome.md` spike. Automated capture does not remove the engineer's own editorial review before the package is considered complete.
3. A **video recording** — a screen-capture walkthrough (generated or guided), narration optional rather than a forced choice; machine-generated (human-reviewable) captions and a text transcript are produced alongside every recording as a baseline MVP output, not a later enhancement — see the new Accessibility constraint below. **[Amended 2026-10-15, per `/clarify`]** Video output shape — one combined walkthrough covering the whole feature, or several shorter clips targeted at individual ACs/flows — is an engineer judgment call made per feature, not a fixed pipeline rule. The capture mechanism (Playwright's own `recordVideo`, one browser context per recording — see `spikes/video-capture-mechanism-outcome.md`) supports either shape identically, since each recorded context is independent and as short or long as the engineer scripts it. The walkthrough document (item 1) always maps section-by-section to ACs/metrics regardless of how many video files accompany it.
4. **[Added 2026-10-15, per `/clarify`] A web-app viewer** — a route/page in this app's own web UI (`src/web-ui/`) that lists a DoD-validated feature's playback package and lets an authenticated user view its screenshots and play its video(s) in-browser, served directly from the same files already stored under `artefacts/[feature-slug]/playback/` (no separate hosting/storage mechanism, no third-party video platform). Per ADR-027, this is ordinary application code, not a governed SKILL.md skill — any authenticated user can open it at any time, not only inside an agent-driven pipeline session. Playback-only: no in-browser editing, trimming, or annotation of the video (out of scope, see below).
   **[Amended 2026-10-15, per operator CX direction]** The viewer's own content hierarchy mirrors this platform's established outer-loop traceability chain — it is not a flat screenshot/video dump. For the feature, it opens with a scope-and-benefit summary reusing `discovery.md`'s own problem statement and `benefit-metric.md`'s own named metrics directly (not re-authored in a new format), then presents a per-story section — each showing that story's own ACs alongside the specific screenshot(s)/video clip(s) evidencing each one, reusing the DoD artefact's own AC Coverage table and evidence column as the structure, the same table the walkthrough document (item 1) is already scripted from. This gives item 3's video-granularity decision a concrete per-feature answer: a small, single-story feature naturally suits one combined walkthrough; a multi-epic/multi-story feature's own per-story AC sections naturally invite per-story or per-AC clips. Per ADR-028 (one canonical builder per derived structure), `/definition` must check whether a shared feature/epic/story/AC traversal already exists in this codebase (e.g. `/trace`'s own chain-walking logic, or `dashboards/pipeline-viz.html`'s own feature-card rendering) before writing a new one for this viewer.

The skill guides the engineer through what to capture, in what order, using the feature's own DoD artefact — specifically its AC Coverage table and Metric Signal section, not raw E2E test file content — as the script. It does not require the engineer to author the demo from scratch.

**Amended 2026-10-14, per `spikes/best-practice-grounding-outcome.md`:** the three changes above (stable-UI-state automation boundary, optional narration with auto-transcription as the baseline, DoD-sourced script over raw E2E content) resolve what was previously open assumption language into concrete MVP commitments, grounded in external best-practice sources.

The demo package becomes a governed artefact stored in `artefacts/[feature-slug]/playback/` alongside the DoD — this is the SAME file set the new web-app viewer (item 4) reads from; the viewer does not introduce a second copy or a different storage location.

**Format:** video ships as MP4 only (not multiple formats) — MP4/H.264 plays natively in every modern browser's own `<video>` element with no plugin, which is what the in-app viewer needs; screenshots ship as PNG (Playwright's own default). "Various formats" was considered and declined: a single, universally browser-playable format is simpler to build, store, and view than offering format choices with no identified consumer need for anything else.

---

## Out of scope

1. **Sponsor feedback collection tooling** — how sponsors submit feedback (form, email, GitHub issue) is out of scope for this feature. The demo package is the output; the feedback intake mechanism is a separate concern. Applies to the viewer too: it is read-only playback, no comment/feedback form attached.
2. **Automated video narration / AI voiceover** — the MVP is a screen recording, not a fully synthesised presentation. AI narration is a future enhancement.
3. **Live presentation tooling** — the package is a self-contained async artefact. Running a live Zoom/Teams demo session is not in scope.
4. **Non-DoD features** — the playback skill is only invoked for DoD-validated features. It is not a general-purpose demo tool.
5. **[Added 2026-10-15, per `/clarify`] In-browser video editing/trimming/annotation** — the web-app viewer (MVP scope item 4) is playback-only. Any correction to a recording happens by re-generating it via the skill, not by editing it in the viewer.
6. **[Added 2026-10-15, per `/clarify`] Multiple output video/image formats** — MP4 (video) and PNG (screenshots) only. No format-selection UI, no alternate-format exports.
7. **[Added 2026-10-15, per operator CX direction] Redesigning or replacing the existing governance dashboard** (`dashboards/pipeline-viz.html`) — the playback viewer is a narrower, DoD-outcome-focused review surface for sponsors, reusing the same underlying `pipeline-state.json`/artefact content the dashboard already reads, not a replacement for it. The dashboard remains the operator-facing governance view; the playback viewer is the sponsor-facing acceptance view.

---

## Assumptions and risks

[RESOLVED 2026-10-14, per spike] Playwright (already a devDependency for E2E tests) can be used to drive screenshot capture against the live or staging environment — confirmed as established best practice (BrowserStack, Playwright MCP), scoped specifically to AC-mapped, stable, repeatable UI states; `/clarify` should still confirm staging's own reliable accessibility for this purpose, but the mechanism itself is no longer an open assumption.

[RESOLVED 2026-10-14, per spike] The walkthrough script is sourced from the feature's own DoD artefact — its AC Coverage table and Metric Signal section — not from raw E2E test file content, which the original risk correctly flagged as often too low-level or terse for a sponsor-facing narrative.

[RESOLVED 2026-10-15, per `/clarify` + `spikes/video-capture-mechanism-outcome.md`] The capture mechanism is Playwright's own built-in `recordVideo` browser-context option — not a human manually using Chrome's own screen-record UI, and not `puppeteer-screen-recorder`/`puppeteer-capture`. Zero new npm dependency (Playwright is already a devDependency, ADR-018); reuses the exact tool already proven in this repo's own E2E suite (ADR-026). Playwright writes `.webm`; an `ffmpeg` encoding step (a new tool-availability requirement, not an npm dependency — `/definition` must confirm it's available wherever this skill runs) converts to MP4 per the Constraints section's own format requirement. The regulated-environment screen-recording-restriction concern is independently closed by the Accessibility constraint's own silent-recording-plus-transcript default (see below) — a fully automated, programmatic capture is not the same restricted category as a human operating OS-level screen-recording software, but this distinction should still be confirmed with compliance before a regulated tenant adopts this skill.

[RESOLVED 2026-10-14, per spike] Engineers are not required to narrate — narration is optional by default, with auto-transcription (not a forced human-narration decision) as the MVP's own baseline mechanism for turning a recording into structured, searchable documentation. This also closes the regulated/restricted-audio-environment concern: a silent recording with an auto-generated transcript is already the MVP's own default path, not a fallback.

The primary risk is that the "generated or assisted" spectrum is wide — a fully automated package (Playwright drives everything, no engineer input) and a guided-manual package (engineer does the recording, skill tells them what to capture) have very different implementation paths. Per the spike, the MVP commits to: automated capture at AC-mapped stable states, DoD-sourced script, optional narration with auto-transcription as baseline — human editorial review remains mandatory before a package ships, which is the one point not fully automated by design.

**[Added 2026-10-14, per spike] Known risk — accessibility gap:** shipping video content with no caption/transcript mechanism would be a real, avoidable WCAG AA gap, inconsistent with how every other feature in this platform has been built this cycle (every story's own DoR carries an explicit Accessibility NFR, checked against the MC-A11Y-01/MC-A11Y-02 guardrails). Closed by the new Accessibility constraint above — not fully mitigated until `/definition` actually specifies the caption-generation mechanism.

---

## Directional success indicators

**Acceptance loop closure rate:** Baseline: ~0% of DoD-validated features have a governed acceptance record with sponsor sign-off today. Target: ≥80% of DoD-validated features have a playback package produced and shared with sponsors within 5 business days of DoD. Measured via: `artefacts/[feature-slug]/playback/` existence check in the pipeline state, cross-referenced against DoD date.

**Sponsor feedback re-entry rate:** Baseline: [UNKNOWN BASELINE] — no current data on how often sponsor feedback triggers a new outer loop cycle. Target: all sponsor feedback that meets a "change requested" threshold is formalised as a new discovery artefact within 10 business days. Measured via: discovery artefacts with `triggeredBy: playback-feedback` tag in pipeline state.

**Demo preparation time:** Baseline: ad hoc, estimated 2–4 hours of engineer time per feature with no consistent output. Target: ≤45 minutes of engineer input time to produce a complete playback package. Measured via: session timing signal from the playback skill (if instrumented).

---

## Constraints

- Must use tooling already available in the pipeline (Playwright is a confirmed devDependency; no new npm dependencies without a story artefact per ADR-011).
- The playback artefact must be stored in the standard artefact directory structure (`artefacts/[feature-slug]/playback/`) — not in an external service or platform. **[Clarified 2026-10-15]** This excludes third-party hosting (no YouTube/Loom/S3-equivalent); it does not exclude a first-party, in-app viewer (MVP scope item 4) that reads and serves these same files — the viewer is additive, not a second storage location.
- Video format must be compatible with async sharing (MP4 or equivalent) — no proprietary format that requires specific player software.
- The skill must work for features delivered via the git-native surface type (Phase 1 MVP); multi-surface playback is out of scope.
- **[Added 2026-10-14, per spike] Accessibility:** every generated video must ship with machine-generated, human-reviewable captions and a standalone text transcript — WCAG AA baseline, consistent with this platform's own established MC-A11Y accessibility practice enforced on every other story. Not an optional enhancement.

---

## /clarify recommendation

**[Resolved 2026-10-15, via `/clarify`]** All 4 original assumptions are now resolved — see Assumptions and risks above and the Clarification log below. Ready to proceed to `/benefit-metric`.

---

## Clarification log

[2026-10-15] Clarified via `/clarify`:
- Q: Video capture mechanism for the playback package's screen recording — which should the MVP use?  A: Operator asked for real research rather than a snap pick, flagging that "Chrome's built-in recording" conflated manual and programmatic capture and asking which gives the best result — routed to `/spike` per `/clarify`'s own convention. Spike (`spikes/video-capture-mechanism-outcome.md`) found Playwright's own built-in `recordVideo` is the established, zero-new-dependency path (reuses the exact tool already proven in this repo's E2E suite, ADR-026), with no independent evidence that `puppeteer-screen-recorder`/`puppeteer-capture` produces a better result — only a competing tool's own self-interested comparison. `ffmpeg` is needed as a new tool-availability requirement (not an npm dependency) to encode Playwright's `.webm` output to the MP4 format the Constraints section already requires.
- Q: Is this repo's own staging environment reliably accessible for Playwright-driven screenshot capture, or is that itself unconfirmed?  A: Confirmed accessible — this session's own E2E specs are already written against a local/staging webServer target, proving the mechanism; a separate, already-logged sandbox-specific Postgres-reachability gap (`decisions.md` D5, this session) is an execution-environment limitation, not a staging-access problem.

[2026-10-15] Clarified via direct operator question (before approval sign-off):
- Q: Will this allow screenshots and targeted demo videos, saved in various formats, and be able to be played and reviewed in a web app?  A: Prompted a real gap check against the drafted MVP. Screenshots: already in scope. Targeted videos: only a single combined walkthrough was scoped — amended (MVP scope item 3) so video output shape (one walkthrough vs. several per-AC/per-flow clips) is an engineer judgment call per feature, not a fixed rule; the capture mechanism supports either shape identically. Various formats: declined — MP4 (video) + PNG (screenshots) only, since MP4 plays natively in-browser with no plugin, which the new viewer requirement needs. Played/reviewed in a web app: this was a genuine, material gap — the drafted MVP only wrote files to the repo, with no viewer anywhere in scope. Operator confirmed: add one (MVP scope item 4, a new `src/web-ui/` route, ordinary application code per ADR-027, playback-only, reading directly from the same `artefacts/[feature-slug]/playback/` files — no second storage location, no third-party platform).
- Q: Can the review's own CX be framed around feature scope, benefits, and story ACs — this framework's own outer-loop traceability — rather than a flat screenshot/video dump?  A: Yes, and this directly resolves item 3's "either, depending on the flow" answer into something concrete. MVP scope item 4 amended: the viewer opens with a scope/benefit summary reusing `discovery.md`/`benefit-metric.md` directly, then a per-story section showing each story's own ACs with its specific evidencing screenshot(s)/clip(s), reusing the DoD's own AC Coverage table as the structure. Added Out of Scope item 7 (not a replacement for the existing governance dashboard) to keep this bounded, and an ADR-028 check (reuse `/trace`'s or the dashboard's own feature/epic/story/AC traversal before writing a new one) for `/definition` to resolve.

## Attribution

**Contributors:**
- Hamish King — Operator / Platform Owner — 2026-10-07

**Reviewers:**
- Pending

**Approved By:**
- Hamish King — Platform Owner — 2026-10-15

---
*Status: Approved. Proceeding to /benefit-metric.*