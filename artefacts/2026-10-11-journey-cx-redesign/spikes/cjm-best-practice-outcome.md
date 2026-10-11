# Spike Outcome: Journey-map CX/UX best practice vs. canvas+CX-tab convergence

**Opened:** 2026-10-11 | **Scope:** Standard | **Steps taken:** 5 (5 web searches; done condition met before the 6-step limit)
**Done condition met:** Yes
**Artefact path:** `artefacts/2026-10-11-journey-cx-redesign/spikes/cjm-best-practice-outcome.md`

---

## Outcome: REDESIGN

### What was found

1. **Standard CJM structure** has two axes: horizontal = timeline (stages → steps), vertical = swimlanes, each a distinct data type (actions, thoughts/feelings, touchpoints, pain points, opportunities). Swimlane order follows most-relevant-first (actions, then emotional state, then touchpoints, then supporting data lower down). (Custellence, Smaply)

2. **An emotion curve is near-universal in journey maps, not optional** — the single most consistently-cited structural element across sources, used specifically to build empathy by showing emotional state change across the timeline. (uxcel)

3. **A journey map and a flow/process diagram are different tool categories with different purposes — this is the load-bearing finding.** A journey map captures *what the user experiences* (emotions, pain points, motivations) as a research/empathy/stakeholder-alignment artefact. A user flow or process diagram captures *what the system does* (steps, decision points, task sequence) as a design/dev artefact. Nielsen Norman Group frames this explicitly as journey-vs-flow; the Six Sigma literature frames the equivalent industrial distinction as journey-map-vs-process-map. (NN/g, overflow.io, Six Sigma DSI)

4. **Element hierarchy:** persona is core/essential — guidance explicitly recommends scoping a journey map to *one persona, one primary goal* (multi-persona support exists in tools like UXPressia but is presented as an extension, not the default). Storyboard/illustration is a supplementary empathy aid — common, but not structurally required. (UXPressia, Smaply)

5. **Swimlane and flowchart/canvas views do coexist in real tools (e.g. Miro), but as distinct, linked views or zoom-levels — not forced into one merged visual.** Swimlane's documented advantage is clarity/predictability for stakeholder communication (clear role/stage association); free-form canvas's advantage is flexibility for arbitrary relationships, which a journey — inherently linear and stage-ordered — doesn't structurally need. (Miro, 6sigma.us)

### Reasoning

The 3 reference examples the operator cited (Spotify flow, supermarket shopping map, Hustle Badger template) are all, by finding 3's own definition, **journey maps** — empathy/stakeholder artefacts. The existing free-form canvas (`ic-s1`–`ic-s4`, drawflow.js nodes + user-defined connections) is, by the same definition, structurally a **flow/process diagram** — regardless of how it's restyled. Finding 3 and finding 5 together mean: trying to make the canvas itself *become* the journey map (by restyling it toward the references) works against its own structural category, and forcing one single merged visual contradicts how mature tools actually handle this (distinct, linked views, not a hybrid). The better-supported path is to let each view do the job it's structurally suited for: the Customer experience tab becomes the real, standards-compliant journey map (closing the emotion-curve/persona gap — finding 2 and 4 — using data the app already captures), and the canvas is explicitly reframed as a stage-structure/flow editing view, not a second attempt at the journey-map job.

---

## If REDESIGN

**What needs to change:** The problem framing for the new `2026-10-11-journey-cx-redesign` discovery should not assume "converge canvas + CX tab into one format." It should instead scope two related but distinct workstreams: (a) redesign the Customer experience tab into a standards-compliant journey map (emotion curve + persona card, using existing data — highest leverage, closes most of the gap to the references), and (b) reframe (not rebuild) the canvas's own stated purpose as a stage-structure/flow view, distinct from the journey-map job.

**Suggested direction:**
- Priority 1: Customer experience tab — add a connected emotion curve across stages (the `emotion` field already exists per stage), add a persona card, light per-stage visual treatment.
- Priority 2 (lower, optional): per-stage illustration/storyboard — supplementary per finding 4, not foundational.
- Lower priority still, and specific to this tool rather than generic best practice: Hustle-Badger-style build-order callouts — reasonable given this app's own engineering-delivery audience, but a deliberate departure from generic CJM guidance, not something best practice itself calls for.
- Canvas: no structural rework — reframe its documented purpose (stage order/connections), not its visual style, as the journey-map answer.

**Return to:** `/discovery` for `2026-10-11-journey-cx-redesign`, with the problem statement re-scoped per the above before Section 1 is finalized.

---

## What remains unknown

Generic best practice assumes journey maps are built by/for CX researchers — it doesn't directly address this tool's own engineering-delivery framing (build-order callouts, feature-mapping data overlaid on a journey). Treating that as a deliberate, scoped extension to standard practice (not a gap in the research) is itself an assumption that should be confirmed with the operator, not treated as settled by this spike alone. Nothing else material is unknown at time of close.

---

## Discovery fields resolved

| Discovery field | Changed? | Updated value / clarification |
|-----------------|----------|-------------------------------|
| Problem statement | Yes | Narrow from "converge canvas + CX tab into one format" to "redesign the Customer experience tab into a standards-compliant journey map; separately reframe the canvas's own stated purpose as a stage-structure/flow view" |
| MVP scope | Yes | Emotion curve + persona card on the CX tab is the highest-leverage MVP slice (uses existing data) |
| Assumptions | Yes | The 3 reference examples are journey maps, not flow diagrams, by established UX definition — the canvas was never going to be the right vehicle for matching them directly |
| Known risks | Yes | Reframing (not rebuilding) `ic-s1`–`ic-s4`'s already-shipped canvas work needs explicit operator confirmation before scoping stories — it changes the canvas's own stated purpose, not just its appearance |
| Technical constraints | No | No new technical constraints found |

**Discovery re-run needed?**
- [x] Yes — spike changes the problem framing significantly → re-run `/discovery` before proceeding

---

## Decision log reference

Logged: `artefacts/2026-10-11-journey-cx-redesign/decisions.md`, 2026-10-11, DESIGN entry — confirmed by Hamish King (Platform Owner).
