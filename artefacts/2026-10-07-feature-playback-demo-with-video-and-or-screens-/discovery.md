# Discovery: Feature Playback Demo Package

**Status:** Draft — pending approval
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
2. **Screenshots** — captured (assisted or automated via Playwright or equivalent) at the key UI states that demonstrate each AC being met.
3. A **video recording** — a screen-capture walkthrough (generated or guided) narrated against the AC/metric frame.

The skill guides the engineer through what to capture, in what order, using the feature's existing DoD artefacts, test plans, and benefit metrics as the script. It does not require the engineer to author the demo from scratch.

The demo package becomes a governed artefact stored in `artefacts/[feature-slug]/playback/` alongside the DoD.

---

## Out of scope

1. **Sponsor feedback collection tooling** — how sponsors submit feedback (form, email, GitHub issue) is out of scope for this feature. The demo package is the output; the feedback intake mechanism is a separate concern.
2. **Automated video narration / AI voiceover** — the MVP is a screen recording, not a fully synthesised presentation. AI narration is a future enhancement.
3. **Live presentation tooling** — the package is a self-contained async artefact. Running a live Zoom/Teams demo session is not in scope.
4. **Non-DoD features** — the playback skill is only invoked for DoD-validated features. It is not a general-purpose demo tool.

---

## Assumptions and risks

[ASSUMPTION] Playwright (already a devDependency for E2E tests) can be used to drive screenshot capture against the live or staging environment — unconfirmed, requires /clarify to determine whether the staging environment is reliably accessible for this purpose.

[ASSUMPTION] The feature's E2E test suite (or a subset of it) can serve as the "script" for the video walkthrough — unconfirmed; some features may have E2E tests that are too low-level or too terse to work as a sponsor-facing narrative.

[ASSUMPTION] Chrome's built-in screen recording (or a Node.js equivalent like `puppeteer-screen-recorder`) is an acceptable video capture mechanism — unconfirmed; regulated environments may restrict screen recording tooling.

[ASSUMPTION] Engineers are willing to narrate or annotate a screen recording, rather than the package being fully silent — unconfirmed; silent video with on-screen annotations may be the only viable option for teams operating in restricted audio environments.

The primary risk is that the "generated or assisted" spectrum is wide — a fully automated package (Playwright drives everything, no engineer input) and a guided-manual package (engineer does the recording, skill tells them what to capture) have very different implementation paths. The MVP must commit to one end of this spectrum or define the boundary clearly.

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

---

## /clarify recommendation

This discovery contains 4 unconfirmed assumptions that affect scope and implementation path. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- [ASSUMPTION] Playwright can be used to drive screenshot capture against the live or staging environment — unconfirmed, requires /clarify to determine whether the staging environment is reliably accessible for this purpose.
- [ASSUMPTION] The feature's E2E test suite can serve as the "script" for the video walkthrough — unconfirmed; some features may have E2E tests that are too low-level or too terse to work as a sponsor-facing narrative.
- [ASSUMPTION] Chrome's built-in screen recording or a Node.js equivalent is an acceptable video capture mechanism — unconfirmed; regulated environments may restrict screen recording tooling.
- [ASSUMPTION] Engineers are willing to narrate or annotate a screen recording — unconfirmed; silent video with on-screen annotations may be the only viable option.

The most critical clarification is the first: if the staging environment is not reliably accessible, the automated screenshot/video path is not viable and the MVP must be guided-manual rather than generated.

---

## Attribution

**Contributors:**
- Hamish King — Operator / Platform Owner — 2026-10-07

**Reviewers:**
- Pending

**Approved By:**
- Pending

---
*Status: Draft. Update to "Approved" with approver name and date before proceeding to /benefit-metric.*