# Spike Output: [title]

<!--
  USAGE: Produced by the /spike skill to capture the structured output of an
  investigation, including the handoff back to the parent discovery artefact.
  This is the companion to spike-outcome.md — outcome records what was found;
  output records what changes as a result.
  
  Save to: artefacts/[feature]/spikes/[spike-slug]-output.md
  
  To evolve: update templates/spike-output.md and open a PR.
-->

**Spike:** [spike-slug]
**Parent feature:** [feature-slug]
**Discovery artefact:** `artefacts/[feature-slug]/discovery.md`
**Outcome:** PROCEED / REDESIGN / DEFER
**Output date:** [YYYY-MM-DD]

---

## Uncertainty addressed

> State the original question the spike was opened to answer.

[The spike question as defined in the spike brief]

---

## Options evaluated

| Option | Description | Pros | Cons | Verdict |
|--------|-------------|------|------|---------|
| 1 | | | | ✓ Recommended / ✗ Ruled out |
| 2 | | | | ✓ Recommended / ✗ Ruled out |
| 3 | | | | ✓ Recommended / ✗ Ruled out |

---

## Recommendation

[What should happen next — unambiguous. One paragraph.]

---

## Constraints confirmed

| Constraint | Source | Implication |
|------------|--------|-------------|
| | | |

*If no new constraints were identified, state: "No new constraints identified."*

---

## Discovery fields resolved

> Map findings back to the parent discovery artefact.
> Tick each field that the spike result changes, clarifies, or validates.

| Discovery field | Changed? | Updated value / clarification |
|-----------------|----------|-------------------------------|
| Problem statement | Yes / No | |
| Target users | Yes / No | |
| MVP scope | Yes / No | |
| Out of scope | Yes / No | |
| Assumptions | Yes / No | |
| Known risks | Yes / No | |
| Success criteria | Yes / No | |
| Technical constraints | Yes / No | |

**Discovery re-run needed?**
- [ ] No — findings clarify details within the existing framing
- [ ] Yes — spike changes the problem framing significantly → re-run /discovery before proceeding

---

## Remaining unknowns

[Honest accounting of what is still unresolved after this spike.
If nothing material is unknown at close, state: "Nothing material unknown at time of close."]

---

## Decision log reference

[Link to /decisions entry recording this spike's outcome]
[Artefact: `artefacts/[feature]/decisions.md`]
