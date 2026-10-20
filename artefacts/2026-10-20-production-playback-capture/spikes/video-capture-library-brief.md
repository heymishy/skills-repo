# Spike Brief: video-capture-library

**Date:** 2026-10-20
**Parent feature:** `2026-10-20-production-playback-capture` (discovery in progress — not yet saved; this spike runs ahead of it per `skills/spike/SKILL.md` Step 0's explicit allowance for an exploratory spike with no parent discovery yet)

---

## Question

Can an existing (off-the-shelf or low-maintenance) video-processing library both (a) reliably detect and blur/redact PII and financial data in a screen-recorded browser session, and (b) provide demo-quality presentation features (zoom/focus on a region, highlights, annotations/callouts) — well enough to replace the current fragile, hand-rolled DOM-injection approach (CSS `transform`, injected banner elements via `page.evaluate`) and to make production video capture safe to build as a follow-on story?

## Type

Technical feasibility (1) + Design decision (3) — the core gating question is whether a viable library exists at all; a secondary design-decision dimension picks among viable candidates if more than one qualifies.

## Blocking

1. The in-progress `/discovery` for `2026-10-20-production-playback-capture` — whether "video capture against production" stays permanently Out of Scope or becomes a follow-on story.
2. More broadly, how future demo-video capture is implemented at all (staging included) — whether it keeps using ad hoc DOM-injection per script (the approach that became a fragile, effort-intensive distraction during `2026-10-11-journey-cx-redesign`'s own editorial review this session — see `workspace/capture-log.md`, 2026-10-20 entry), or adopts a proper library.

## Scope

Standard — up to 6 investigation steps.

## Done condition

At least one viable candidate library identified for each dimension (redaction, demo-presentation — possibly the same library for both), each assessed against:
- Reliability/accuracy track record for redaction specifically (not just marketing claims)
- Maintenance health (recent releases, open issues)
- License compatibility
- Integration shape — does it post-process the already-recorded `.webm` file, or does it need to hook into the live Playwright page? This determines whether it can cleanly replace the current DOM-injection approach.

Written recommendation: which library (if any) to adopt, and whether production video capture should be PROCEED, REDESIGN (different approach needed), or DEFER (no viable option found).

## Out of scope

- Actually integrating or wiring any chosen library into `scripts/playback-capture.js` or any production code — this spike identifies a candidate, it does not implement it.
- Testing redaction accuracy against real production data — no production capture tenant exists yet (that's part of the parent feature's own MVP), so this spike tests against synthetic/local fixtures only.
- Evaluating OCR-based or ML-model-based redaction requiring its own hosted inference service — per `product/constraints.md` #11 ("No persistent agent runtime dependency"), candidates must run as a library call within existing CI/CD infra, not a new managed service.
- Final relaxation of the "no new npm dependencies" constraint (`product/constraints.md` #15's own spirit, and the original `2026-10-19-real-playback-capture-automation` discovery's own Constraints section) — that is a `/decisions` call after this spike's own recommendation, not assumed going in.

## Outcome options

- **PROCEED:** a viable library is found for redaction (demo-presentation can piggyback on the same finding, or a separate viable library covers that alone) — production video becomes a scoped follow-on story to the parent MVP; `/decisions` logs the npm-dependency exception.
- **REDESIGN:** a viable approach exists but needs reframing (e.g. redaction needs a different technique than library-based blurring) — rework before resolving.
- **DEFER:** no viable redaction candidate found — production video stays Out of Scope indefinitely, with a revisit trigger. Note: a demo-presentation-only finding (with no viable redaction candidate) could still improve *staging* capture quality even under a DEFER verdict for production video specifically — called out separately in the outcome artefact if it applies.

---

**Confirmed by:** Hamish King (Platform Owner), via direct chat reply, 2026-10-20.
