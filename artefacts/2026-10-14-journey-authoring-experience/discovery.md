# Discovery: Journey authoring experience — guided creation, smarter defaults, templates

**Status:** Clarified
**Created:** 2026-10-14
**Approved by:** [Pending]
**Author:** Claude (session), drafted from existing spike research, confirmed section-by-section with Hamish King (Platform Owner) via /clarify

---

## Problem Statement

Building a customer journey map today is a manual, blank-slate, one-field-at-a-time process. An operator starts from nothing: add a stage (just a name), then separately open an 8-field editor and fill in description, customer actions, touchpoints, channel, emotion, pain points, and opportunities — one field at a time, with no suggested starting content, no template, and no guidance on what a complete stage even looks like. `jcx-s6`/`jcx-hotfix3`/`jcx-hotfix4`/`jcx-s7` fixed the *rendering* of a finished map (swimlane grid, save-feedback correctness, empty-state styling) and the *mechanics* of editing a single field — but none of that touches the experience of going from zero to a first usable map. The `cx-interaction-design-polish` spike's own Part 3 research (autosave-on-blur is the right save MECHANISM, but 8 undifferentiated fields in one flat panel is a cognitive-load problem per Miller's Law) and the operator's own direct framing — "the journey of making a journey," wanting something bigger than incremental polish — both point at this same deeper gap: the authoring MODEL itself, not just its mechanics or its rendering, has never been designed.
[Grounded in: spikes/cjm-best-practice-outcome.md, spikes/post-release-cx-visual-gap-outcome.md, spikes/cx-interaction-design-polish-outcome.md]

## Who It Affects

The outer loop practitioner (PO / SME / discovery lead) — the same persona the parent `2026-10-11-journey-cx-redesign` feature was built for. They use the journey feature to build a shared, stakeholder-facing understanding of a customer's experience, and (per that feature's own MVP) to seed new outer-loop work directly from a journey stage via the placeholder-feature trigger. Today, starting a NEW journey map from scratch is itself the highest-friction moment in that whole workflow — before any of the downstream value (triggering a placeholder feature, presenting to a room, matching the reference bar) is even reachable.

## Why Now

The parent epic (`2026-10-11-journey-cx-redesign`) just closed its own structural and functional gaps: the swimlane grid exists and renders correctly (`jcx-s6`), a confirmed Add-stage visibility bug is fixed (`jcx-hotfix4`), and a real save-feedback correctness bug plus a standards violation are both closed (`jcx-s7`). That is the natural checkpoint to ask the next question — the operator did, directly: "I thought we did more than a few UX tidy-ups... what I want is the bigger UX and CX upgrade." With the rendering/mechanics layer now solid, the remaining gap (the authoring model itself) is now the highest-leverage thing left, and is no longer obscured by bugs in the layer beneath it.

## MVP Scope

**Confirmed via /clarify, 2026-10-14:**

- **Guided stage creation (confirmed scope, not the bigger inline-in-grid redesign):** when a new stage is added, immediately prompt for its name AND open the edit panel in the same action (collapsing today's two-step "add name, separately find Edit stage, separately fill 7 fields" into one guided flow). The existing side-panel editing model stays as-is — this MVP does not replace it with direct in-grid cell editing (the bigger, deliberately-deferred idea from the `cx-interaction-design-polish` spike's own "Not recommended" section; confirmed still deferred via `/clarify`, not reconsidered here).
- **Smarter field defaults — deterministic scan first, confirmed as MVP, with AI generation as an explicit fast-follow (not an open "maybe"):** `jcx-s4`'s persona editor already scans `artefacts/[feature_slug]/discovery.md`'s "Who It Affects" sections to pre-populate persona suggestions (a deterministic, non-AI mechanism). This MVP extends the same scan-and-suggest pattern to stage-level fields where it plausibly applies (e.g., `customer_actions`/`pain_points` suggestions drawn from a linked feature's own discovery artefact, where one exists). Confirmed via `/clarify`: this ships FIRST as its own bounded MVP slice, with a real LLM-based generation mechanism (using this app's existing LLM-gateway adapter infrastructure) explicitly planned as a separate, named fast-follow story — not a vague "maybe later."
- **A single default starting template (confirmed, not a library):** when creating a brand-new journey with zero stages, offer to seed it with one standard 4-6 stage skeleton this app's own 3 reference examples and the `cjm-best-practice` spike's own research converge on (e.g. Evaluate → Discover → Purchase → Onboard → Retain, or similar), with empty fields — not pre-filled content. Confirmed via `/clarify`: exactly one built-in skeleton, no selection UI or multi-template library for this MVP.

Deferred from this MVP (see Out of Scope): the AI-generation fast-follow itself (named, planned, not yet scoped as its own story), multi-template libraries, cross-journey template reuse, and inline-in-grid editing.

## Out of Scope

- **LLM/AI-generated field content — explicitly a fast-follow, not an open question.** Confirmed via `/clarify`: the deterministic discovery-artefact-scan ships as this MVP; real LLM-based generation (using this app's own existing LLM-gateway adapter infrastructure) is a separate, named next story once the deterministic mechanism's real coverage is known from usage — sequenced, not deferred indefinitely.
- **Multiple, customizable journey-map templates** — confirmed via `/clarify`: exactly one default starting skeleton for this MVP, not a template library with selection/customization UI.
- **Cross-journey template reuse / "save this journey as a template"** — no mechanism for an operator to turn one journey's own structure into a reusable template for future journeys; this MVP only ships one built-in default skeleton, not operator-authored ones.
- **Inline-in-grid editing (replacing the side panel)** — confirmed via `/clarify`: this MVP keeps the existing side-panel editing model and only collapses the two-step add-then-find-edit-panel flow into one guided action. The bigger redesign (editing fields directly in the swimlane grid cells, matching Splice/QuestionPro/Figr's own convention, named but deliberately deferred in the `cx-interaction-design-polish` spike) stays deferred.
- **Any change to the swimlane grid's own rendering, the save-feedback mechanism, or the empty-state/spacing treatment** — `jcx-s6`/`jcx-s7` already closed these; this discovery is scoped entirely to the pre-first-save authoring experience, not the already-fixed display/mechanics layer.

## Assumptions and Risks

**Confirmed (was [ASSUMPTION], resolved via `/clarify` 2026-10-14):** A deterministic discovery-artefact-scan (extending `jcx-s4`'s own existing pattern) ships as MVP; real LLM generation is an explicit, named fast-follow rather than something this MVP needs to prove sufficient on its own.

**Confirmed (was [ASSUMPTION], resolved via `/clarify` 2026-10-14):** A single default starting-skeleton template (not a customizable library) is sufficient for MVP.

**Confirmed (was [ASSUMPTION], resolved via `/clarify` 2026-10-14):** "Guided stage creation" (name + fields in one flow, same side-panel model) is the confirmed scope — not the bigger inline-in-grid editing redesign, which stays deliberately deferred.

**Risk:** the discovery-artefact-scan suggestion mechanism only has useful source material when a journey stage is already linked to a real feature with its own `discovery.md` — for a brand-new journey map starting from nothing (this MVP's own primary use case per the parent feature's discovery), there is often no linked feature yet, so this mechanism may have limited actual coverage on day one. This needs validating, not assumed.

**Risk:** "guided creation" and "a starting template" both touch the SAME stage-creation entry point `jcx-hotfix4`/`jcx-s7` already modified twice this session (the Add-stage click handler and its DOM-patch success path) — real risk of this becoming a third consecutive change to the same small piece of code; worth being deliberate about sequencing rather than layering a third rewrite on top of two recent ones without re-reading the current state carefully first.

**What could make this not worth building:** if operators overwhelmingly start journeys FROM an existing linked feature (where the discovery-scan has real material to draw on) rather than from a blank journey (where it doesn't) — the relative value of "guided creation + template" vs. "smarter suggestions" would flip, and this MVP's own priority order would need revisiting. This is itself an open question, not yet checked against real usage data.

## Directional Success Indicators

**Time-to-first-complete stage:** Baseline: `[UNKNOWN BASELINE]` — not currently measured; today's flow requires at minimum opening the edit panel separately from naming the stage, so the true baseline time is likely to include that discovery/switching cost, not just typing time. Target: `[UNKNOWN — needs operator input: what feels "fast enough"?]`. Measured via: a session-timing instrument on the stage-creation-to-first-save sequence, parallel to this epic's own prior M1 measurement approach (direct operator observation, not yet automated).

**Fields populated without manual prompting:** Baseline: `[UNKNOWN BASELINE]` — current per-field population rate across existing journey stages has never been queried (the parent feature's own discovery.md names this same gap for the `emotion` field specifically, unresolved). Target: `[UNKNOWN — needs a baseline query before a target can be set meaningfully]`. Measured via: a direct database query across `customer_journey_stages`, run once before MVP ships (establishing the real baseline) and again after a defined usage window.

**Operator CX judgment vs. reference bar, applied to the AUTHORING experience specifically (not the finished map):** Baseline: the operator's own direct framing this session ("I thought we did more than a few tidy-ups... what I want is the bigger UX and CX upgrade") is itself the baseline signal — a stated gap, not yet numerically anchored. Target: operator judges the stage-creation flow itself (not just the finished, already-populated map `jcx-s6`'s own M1 already measures) as no longer "clunky." Measured via: direct operator review once shipped, same mechanism as the parent feature's own M1.

## Constraints

**Accessibility (WCAG 2.1 AA, hard floor)** — `product/constraints.md` #9, carried forward from the parent feature's own discovery. Guided creation and any template-seeding UI must be keyboard-accessible and screen-reader-friendly from the start.

**No new npm dependency unless justified by direct comparison** — carried forward from the parent feature's own discovery and `ic-s1`'s own precedent; a starting-template mechanism and a discovery-scan extension are both expected to need zero new dependencies (pure server-side logic + existing markup patterns), but this must be confirmed at `/definition`, not assumed.

**Design artefacts are referenced, not generated by this platform** (`product/constraints.md` #10) — once this reaches `/design`, expect the guided-creation flow and template skeleton to be referenced from a produced design artefact, not fabricated inline.

**Multi-tenancy / data isolation** — any new mutating surface (template application, guided-creation's own stage+field creation) must follow the same tenant-scoping and ownership-check-before-mutation pattern already established across this app (ADR-025), consistent with `jcx-s5`'s own dedicated authorization-hardening precedent in the parent feature.

**LLM-gateway usage, if ever proposed later** — this app's own existing mock-gateway/real-gateway adapter pattern (seen in this repo's own test infrastructure) would govern any future LLM-based suggestion mechanism; explicitly not needed for this MVP's own deterministic-scan proposal, named here only so a future discovery revisiting the deferred AI-generation idea knows where to start.

## Contributors

- Hamish King — Platform Owner
- Claude (session) — drafted from existing spike research

## Reviewers

- [Pending]

## Approved By

[Pending]

---

## Clarification log

[2026-10-14] Clarified via /clarify:
- Q: Will a deterministic discovery-artefact-scan produce useful field suggestions, or does this need real AI/LLM generation from the start?  A: Both, scoped separately — deterministic scan ships as MVP, AI generation is an explicit, named fast-follow story, not an open "maybe."
- Q: Is a single default starting-skeleton template enough for MVP, or should there be a small template library from day one?  A: One default skeleton — validate the mechanism before investing in a library/selection UI.
- Q: Is "guided creation" (collapse name+fields into one flow, same side-panel model) the right fix, or should this go further toward inline-in-grid editing?  A: Guided creation only — keep the existing side-panel model; the bigger inline-in-grid redesign stays deliberately deferred.

---

**Next step:** Human review and approval → /benefit-metric
