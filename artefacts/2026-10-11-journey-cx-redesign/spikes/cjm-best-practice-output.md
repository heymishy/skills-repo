# Spike Output: Journey-map CX/UX best practice vs. canvas+CX-tab convergence

**Spike:** cjm-best-practice
**Parent feature:** 2026-10-11-journey-cx-redesign
**Discovery artefact:** `artefacts/2026-10-11-journey-cx-redesign/discovery.md` (not yet saved — this spike's own output should inform its Section 1)
**Outcome:** REDESIGN
**Output date:** 2026-10-11

---

## Uncertainty addressed

What does CX/UX best practice say about journey-map structure and visual design, and how should that inform converging the free-form canvas (`ic-s1`–`ic-s4`) and the existing Customer experience tab toward a single, more polished journey-map format?

---

## Options evaluated

| Option | Description | Pros | Cons | Verdict |
|--------|-------------|------|------|---------|
| 1 | Restyle the free-form canvas itself to visually match the 3 reference examples (emotion curve, persona framing, illustration layered onto the node-and-connector view) | Single surface to maintain; reuses `ic-s1`–`ic-s4`'s already-shipped work directly | Fights the canvas's own structural category — journey maps and flow diagrams are different artefact types by established UX definition (NN/g, Six Sigma); no precedent found for forcing both into one merged visual, even in mature tools | ✗ Ruled out |
| 2 | Redesign the Customer experience tab into a standards-compliant journey map (emotion curve + persona card); separately reframe the canvas's own purpose as a stage-structure/flow view, not a second journey-map attempt | Highest leverage — uses data the app already captures; each view does the job it's structurally suited for; matches how mature tools (Miro) actually combine swimlane + flow views (distinct, linked, not merged) | Requires explicit operator confirmation that reframing the canvas's own stated purpose (not its code) is acceptable scope; two workstreams instead of one | ✓ Recommended |
| 3 | Build a brand-new third view (neither canvas nor CX tab) purpose-built to match the references exactly | Could match the references most literally | No reuse of existing shipped work or existing data-rendering code; not supported by any finding — nothing in the research suggests the existing two views are inadequate as a foundation, only that they need the right content, not a third surface | ✗ Ruled out |

---

## Recommendation

Redesign the Customer experience tab into the app's real, standards-compliant journey map — adding a connected emotion curve (using the already-captured `emotion` field) and a persona card as the two highest-leverage, best-practice-confirmed additions, with per-stage illustration as a lower-priority supplementary addition. Separately, reframe (not rebuild) the free-form canvas's own stated purpose as a stage-structure/flow editing view, distinct from the journey-map job — this matches established UX guidance that journey maps and flow diagrams are different artefact categories, and matches how mature tools (e.g. Miro) keep swimlane and flow views distinct rather than merged. This should be confirmed explicitly with the operator before `/discovery`'s problem statement is finalized, since it changes the originally-assumed "converge into one format" framing into two related workstreams.

---

## Constraints confirmed

| Constraint | Source | Implication |
|------------|--------|-------------|
| Journey maps are typically scoped to one persona, one primary goal | UXPressia, Smaply | The persona-card addition to the CX tab should default to single-persona framing unless a specific multi-persona need is named |
| A journey map's core elements (emotion curve, persona) are near-universal; illustration/storyboard is supplementary | uxcel, Smaply | MVP scope for the redesign should prioritize emotion curve + persona over illustration |

---

## Discovery fields resolved

| Discovery field | Changed? | Updated value / clarification |
|-----------------|----------|-------------------------------|
| Problem statement | Yes | See spike-outcome.md's "If REDESIGN" section — narrowed from single-convergence framing to two related workstreams |
| Target users | No | Still the outer-loop practitioner (PO/SME/discovery lead) persona already established by `ic-s1`–`ic-s4` |
| MVP scope | Yes | Emotion curve + persona card on the CX tab, not canvas restyling |
| Out of scope | Yes | Forcing the canvas and CX tab into one merged visual is now explicitly out of scope, not just undecided |
| Assumptions | Yes | The 3 references are journey maps, not flow diagrams, by established definition |
| Known risks | Yes | Reframing the canvas's own stated purpose needs explicit operator sign-off, not just engineering scoping |
| Success criteria | No | Not yet defined — pending `/benefit-metric` |
| Technical constraints | No | No new technical constraints found |

**Discovery re-run needed?**
- [x] Yes — spike changes the problem framing significantly → re-run `/discovery` before proceeding

---

## Remaining unknowns

Whether the operator wants the build-order-callout element (from the Hustle Badger reference) included at all, given it's a deliberate departure from generic CJM best practice specific to this tool's own engineering-delivery audience — not resolved by this spike, worth asking directly during discovery's MVP-scope section.

---

## Decision log reference

Logged: `artefacts/2026-10-11-journey-cx-redesign/decisions.md`, 2026-10-11, DESIGN entry — confirmed by Hamish King (Platform Owner).
