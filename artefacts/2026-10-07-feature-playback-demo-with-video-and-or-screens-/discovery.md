# Discovery: Feature Playback Demo Package

**Status:** Clarified — pending approval
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
3. A **video recording** — a screen-capture walkthrough (generated or guided), narration optional rather than a forced choice; machine-generated (human-reviewable) captions and a text transcript are produced alongside every recording as a baseline MVP output, not a later enhancement — see the new Accessibility constraint below.

The skill guides the engineer through what to capture, in what order, using the feature's own DoD artefact — specifically its AC Coverage table and Metric Signal section, not raw E2E test file content — as the script. It does not require the engineer to author the demo from scratch.

**Amended 2026-10-14, per `spikes/best-practice-grounding-outcome.md`:** the three changes above (stable-UI-state automation boundary, optional narration with auto-transcription as the baseline, DoD-sourced script over raw E2E content) resolve what was previously open assumption language into concrete MVP commitments, grounded in external best-practice sources.

The demo package becomes a governed artefact stored in `artefacts/[feature-slug]/playback/` alongside the DoD.

---

## Out of scope

1. **Sponsor feedback collection tooling** — how sponsors submit feedback (form, email, GitHub issue) is out of scope for this feature. The demo package is the output; the feedback intake mechanism is a separate concern.
2. **Automated video narration / AI voiceover** — the MVP is a screen recording, not a fully synthesised presentation. AI narration is a future enhancement.
3. **Live presentation tooling** — the package is a self-contained async artefact. Running a live Zoom/Teams demo session is not in scope.
4. **Non-DoD features** — the playback skill is only invoked for DoD-validated features. It is not a general-purpose demo tool.

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
- The playback artefact must be stored in the standard artefact directory structure (`artefacts/[feature-slug]/playback/`) — not in an external service or platform.
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

## Attribution

**Contributors:**
- Hamish King — Operator / Platform Owner — 2026-10-07

**Reviewers:**
- Pending

**Approved By:**
- Pending

---
*Status: Clarified. Update to "Approved" with approver name and date before proceeding to /benefit-metric.*