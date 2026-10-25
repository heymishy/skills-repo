# Spike Outcome: CX/UX pattern for self-service DoD evidence review

**Opened:** 2026-10-26 | **Scope:** Standard, extended to Thorough mid-investigation at operator's explicit request ("lots of research, take as much time as you need") | **Steps taken:** 9 research passes (web search), plus direct comparison against `ppc-s5`/`ppc-s6` ACs
**Done condition met:** Yes
**Artefact path:** `artefacts/2026-10-20-production-playback-capture/spikes/cx-ux-playback-pattern-outcome.md`

---

## Outcome: REDESIGN (bounded — two specific AC changes, not a rework)

### What was found

Research covered nine angles: (1) SaaS evidence-review/sign-off UX generally — thin, mostly vendor opinion; (2) progressive disclosure (NN/G) — summary-first, defer detail on request, confirmed as the standard framing even though the primary NN/G article text itself wasn't retrievable; (3) visual-regression review tools (Percy/Chromatic/Applitools) — diff-review dashboards, baseline approval workflows, AI-noise-filtering, little on page-layout specifics; (4) Playwright trace viewer / Cypress — timeline + screenshot + video combined per failed step, HTML report linking thumbnail → full trace; (5) approval-workflow UX — per-approver identity, decision tied to exact evidence version, audit trail; (6) annotated-screenshot/bug-report tools (Marker.io, BugHerd) — screenshot+annotation as baseline, video as enrichment, blur sensitive data before sharing; (7) changelog/release-notes UX — benefit-first wording, visuals reserved for consequential changes, text-only for minor ones; (8) UAT sign-off process — checklist-based, per-approver identifiable, explicit "what was not tested" scoping, conditional sign-off with named caveats; (9) SOC2/audit evidence portals — role-scoped browsable evidence with visual coverage-gap indicators; (10) empty-state design — name the specific cause, not generic "no data," one primary next step; (11) WCAG video accessibility — native `<video>` element avoids the keyboard-trap failure mode common to custom players; captions (WCAG 1.2.2) apply only to prerecorded *audio*, so a silent automated-interaction recording is genuinely outside that requirement; (12) video lazy-loading — `preload="none"` + `poster` + explicit width/height is the standard pattern to avoid eager-downloading every clip and avoid layout shift, with Intersection-Observer-triggered load as the enhancement layer; (13) GitHub PR review UX — per-item "viewed" progress tracking, collapsible reviewed items; (14) agile sprint review / DoD walkthrough — "achievement framing" over "activity framing," and a recurring finding that sign-off/dialogue is explicitly *not* the same thing as a demo.

Compared against `ppc-s5`/`ppc-s6`'s existing ACs:
- **Already matching best practice, no change needed:** progressive disclosure (ppc-s6 AC1/AC2/AC3 — shell → summary → coverage line → detail, in that order), text-distinct (not colour-only) coverage states (AC3, already satisfied by reused `renderCoverageSummaryHtml`), native `<video controls>` over a custom player (ppc-s5 AC2 — avoids the keyboard-trap failure mode), caption deferral being accessibility-safe rather than a compliance gap (ppc-s5's own NFR — confirmed correct: WCAG 1.2.2 doesn't apply to a narration-free recording), flat (non-grouped) AC list (ppc-s6 Out of Scope — a deliberate, justified choice matching the existing data model, not a gap), screenshot-as-baseline/video-as-enrichment (ppc-s5 AC6 "video is additive, never required" — matches the changelog-pattern finding that visuals should be used where they add the most value, not uniformly).
- **Real, bounded gaps found:**
  1. **ppc-s5 has no AC governing video loading behaviour.** A feature with many ACs could render many `<video>` elements on one page at once. Without `preload="none"` + `poster` + explicit dimensions, every video downloads eagerly on page load — directly working against the story's own flagged-but-unmeasured Performance NFR, and risking layout shift. This is a known, named pattern (not a style opinion) with no AC currently covering it.
  2. **ppc-s6 AC4's "not available" state is underspecified.** It currently requires only "a clear 'not available' state," not that the state name *which* artefact is missing. Empty-state best practice (and the UAT-portal "state what was not tested" pattern) both converge on the same point: a generic "not available" message is a worse CX outcome than one that names the specific cause, even when there's no actionable next step for the viewer to take.
- **Named but explicitly NOT a change to either story — a scope observation for the Platform Owner:** no story anywhere in this epic (`ppc-s1`–`ppc-s6`) builds an actual decision-recording/sign-off action. Every approval-workflow and UAT source converged on the same structural element — a recorded decision tied to a named approver and an exact evidence version — as a first-class part of "sign-off," yet the epic's own goal statement ("evidence viewed, sign-off decision made") is satisfied today purely by the PO viewing evidence and deciding off-platform. This may be entirely intentional (sign-off could legitimately happen outside the tool, e.g. verbally or in a ticket system) — it is not something research can resolve on its own, so it is logged as a decision for the Platform Owner, not folded into `ppc-s5`/`ppc-s6` as new scope.

### Reasoning

Both concrete gaps are small, targeted AC additions/tightenings fully within `ppc-s5`/`ppc-s6`'s existing architecture and complexity rating — neither requires new infrastructure, new adapters, or a new story. That's a REDESIGN, not a DEFER (nothing here needs a human judgment call research can't inform) and not a plain PROCEED (the current AC wording would ship something measurably short of best practice on two specific, nameable points). The sign-off-recording observation is deliberately kept out of the REDESIGN scope — it's a materially larger feature (decision storage, approver identity, audit trail) that neither story's benefit linkage calls for, and discovery never scoped it; surfacing it as a named open question respects the spike's own "not an open-ended UX redesign" boundary.

---

## If REDESIGN

**What needs to change:**
1. `ppc-s5-video-capture.md` — add one AC for video-loading performance (`preload="none"` + `poster` + explicit dimensions on every rendered `<video>`).
2. `ppc-s6-dashboard-shell-parity.md` — tighten AC4's wording so the "not available" state names the specific missing artefact (`discovery.md` or `benefit-metric.md`), not a generic message.

**Suggested direction:** Both applied directly to the story files as part of closing this spike (see `decisions.md` 2026-10-26 DESIGN entry) — no further design exploration needed.
**Return to:** `/review` on both stories, now with the updated ACs.

---

## What remains unknown

Whether the epic's goal of "sign-off decision made" is meant to be satisfied in-app (a recorded approve/reject action) or off-platform (the PO decides and acts elsewhere, e.g. Slack/ticket) was not resolved by this spike — it's a product-scope question, not a CX pattern question, and is logged as an open question in `decisions.md` rather than guessed at.

---

## Discovery fields resolved

| Discovery field | Changed? | Updated value / clarification |
|-----------------|----------|-------------------------------|
| Problem statement | No | Unchanged — the spike validates HOW evidence is presented, not WHAT problem is being solved |
| MVP scope | No | `ppc-s5`/`ppc-s6` were already fast-follow, not MVP; this spike only refines their own ACs |
| Assumptions | No | — |
| Known risks | No | The sign-off-recording observation is a new *scope question*, not a risk to an existing assumption — logged in `decisions.md`, not here |
| Technical constraints | No | — |

**Discovery re-run needed?**
- [x] No — findings clarify details within the existing framing
- [ ] Yes — spike changes the problem framing significantly → re-run /discovery before proceeding

---

## Decision log reference

See `artefacts/2026-10-20-production-playback-capture/decisions.md`, 2026-10-26 entries (DESIGN: the two AC changes; SCOPE: the sign-off-recording open question).
