# Spike Outcome: [title]

<!--
  USAGE: Produced by the /spike skill when a scoped investigation concludes.
  Outcome must be PROCEED, REDESIGN, or DEFER — not "it depends".
  
  Save to: artefacts/[feature]/spikes/[spike-slug]-outcome.md
  
  To evolve: update templates/spike-outcome.md and open a PR.
-->

**Opened:** [YYYY-MM-DD] | **Scope:** [narrow / standard / thorough] | **Steps taken:** [n]
**Done condition met:** Yes / Partially / No — [explain if not fully met]
**Artefact path:** `artefacts/[feature]/spikes/[spike-slug]-outcome.md`

---

## Outcome: PROCEED / REDESIGN / DEFER

### What was found

[Factual — what was observed, measured, confirmed, or heard. No interpretation yet.]

### Reasoning

[How the findings lead to the outcome. Explicit — do not assume the connection is obvious.]

---

## If PROCEED

**Unblocked stage:** [which stage can now continue]
**Conditions:** [any constraints that must hold for PROCEED to remain valid — or "None"]

---

## If REDESIGN

**What needs to change:** [specific — which story, AC, or approach]
**Suggested direction:** [options if known]
**Return to:** [which pipeline stage to re-enter]

---

## If DEFER

**Reason:** [why this cannot be answered now]
**Impact:** [what remains uncertain and what risk that creates]
**Trigger to re-open:** [what would need to change before re-opening the spike]
**Blocked work:** [can it proceed with acknowledged risk, or must it defer too?]

---

## What remains unknown

[Honest accounting — even for PROCEED outcomes.
If nothing material is unknown at close, state: "Nothing material unknown at time of close."]

---

## Discovery fields resolved

> Map findings back to the parent discovery artefact.
> Tick each field the spike result changes, clarifies, or validates.

| Discovery field | Changed? | Updated value / clarification |
|-----------------|----------|-------------------------------|
| Problem statement | Yes / No | |
| MVP scope | Yes / No | |
| Assumptions | Yes / No | |
| Known risks | Yes / No | |
| Technical constraints | Yes / No | |

**Discovery re-run needed?**
- [ ] No — findings clarify details within the existing framing
- [ ] Yes — spike changes the problem framing significantly → re-run /discovery before proceeding

---

## Decision log reference

[Link to /decisions entry recording this spike's outcome]
[Artefact: `artefacts/[feature]/decisions.md`]
