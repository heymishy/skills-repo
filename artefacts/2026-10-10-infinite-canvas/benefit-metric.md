## Benefit Metric: Infinite Canvas — Reusable Free-Form Spatial Canvas Primitive

**Discovery reference:** artefacts/2026-10-10-infinite-canvas/discovery.md
**Date defined:** 2026-10-10
**Metric owner:** Hamish King — Platform Owner
**Reviewers:** Pending — confirm before `/definition-of-ready` (H-GOV hard block applies at DoR if left empty)

**Product context read:** `product/mission.md` — primary personas include the outer loop practitioner and tech lead, both named as this feature's own personas. `product/roadmap.md` — Phase 5 ("Harness infrastructure, spec integrity, platform intelligence, and distribution completion") is active, with "the web-UI layer... the primary Phase 5 delivery to date" — this feature extends that same web-UI layer, consistent with current strategic priority, matching the prior `customer-journey-as-first-class` feature's own alignment framing.

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No — this delivers a real capability for the platform's own named operators (outer loop practitioner, tech lead), not a tooling/process/team-capability pilot. The qualitative judgment in Metric 2 below is standard product validation, not a meta-benefit hypothesis test.

Discovery's own third directional indicator ("zero-build integration holds") is **not** carried forward as an ongoing benefit metric — it was a go/no-go technical feasibility gate, not an outcome metric, and it is already resolved: `artefacts/2026-10-10-infinite-canvas/spikes/zero-build-canvas-library-outcome.md` confirmed PROCEED with drawflow.js. Only the two genuinely outcome-level indicators are carried into Tier 1 below.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Spatial layout actually used

| Field | Value |
|-------|-------|
| **What we measure** | Whether a journey stage node is manually repositioned away from its default/auto-placed position, on the real journey this feature ships against |
| **Baseline** | 0 — the capability doesn't exist today (the current journey canvas is a linear list with no free positioning) |
| **Target** | ≥1 journey stage node repositioned and the new position persisted across a session, within 2 weeks of release |
| **Minimum validation signal** | The canvas drag interaction is engaged with at all within 2 weeks (a drag gesture initiated), even if the resulting position isn't ultimately kept — lower than full persistence, since even an abandoned attempt signals real engagement with the spatial surface vs. the capability going entirely unused or undiscovered |
| **Measurement method** | Compare persisted `position_x`/`position_y` coordinates on `customer_journey_stages` against their initial auto-layout coordinates. Checked weekly by the metric owner for the first 2 weeks post-release. |
| **Feedback loop** | If the minimum signal isn't hit: investigate whether the canvas is discoverable in the UI, or whether a small (3-stage) journey simply doesn't benefit enough from spatial positioning to motivate using it — decided by the metric owner. Does not automatically trigger a revert; informs whether to invest further. |

### Metric 2: Operator CX judgment vs. the list view it replaced

| Field | Value |
|-------|-------|
| **What we measure** | A direct, recorded qualitative judgment on whether the canvas is genuinely better than the linear list for journey mapping — not inferred from usage counts |
| **Baseline** | N/A — qualitative judgment metric, no numeric baseline; nothing to compare against before real use |
| **Target** | The operator explicitly judges the canvas as better — not merely "fine" or "different" — after a defined period of real use (2–4 weeks post-release) |
| **Minimum validation signal** | The operator does not judge the canvas worse than the list it replaced — the floor is "no regression in practice," distinct from the target's genuine-improvement bar |
| **Measurement method** | A direct, recorded judgment in `decisions.md` or a short retro note after 2–4 weeks of real use — not an inferred adoption-rate proxy. This platform has one primary practitioner, so an honest qualitative call is the right-sized instrument here (same reasoning already applied in discovery's own Directional Success Indicators). |
| **Feedback loop** | If the operator judges the canvas "no better" or "worse": pause further investment in replacing the other named-but-deferred surfaces (`definition-canvas`'s story map, the mermaid diagrams) — per discovery's own explicit gate — and consider either reverting the journey canvas to the list view or iterating on the design before reattempting. Decided by the metric owner. |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Metric 1 — Spatial layout actually used | ic-s1 (foundation), ic-s2 (direct mechanism), ic-s4 (keyboard-input path to the same mechanism) | Covered |
| Metric 2 — Operator CX judgment vs. the list view | ic-s1, ic-s2, ic-s3, ic-s4 (all four stories together constitute the real artefact the judgment is formed against) | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts, written at `/definition`
- Implementation approach (drawflow.js integration details, route structure) — already captured in `decisions.md` ADR-001 and the spike outcome artefact; `/definition` turns it into concrete stories
- Sprint targets or velocity — these metrics are outcome-based, not output-based
