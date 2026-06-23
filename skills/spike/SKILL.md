---
name: spike
description: >
  Handles unknowns that are blocking pipeline progress. Accepts a specific question,
  defines a scope limit and done condition before any investigation begins, then produces
  a structured outcome artefact — PROCEED, REDESIGN, or DEFER — that feeds back into
  /decisions and unblocks the pipeline. Use when /review, /definition, or
  /definition-of-ready hits a genuine unknown, or when someone says "spike this",
  "we don't know enough to proceed", "timebox this", or "feasibility check".
  Not for open-ended research — the question must be specific and answerable.
triggers:
  - "spike this"
  - "we need to investigate first"
  - "we don't know enough to proceed"
  - "timebox this"
  - "technical investigation"
  - "proof of concept"
  - "feasibility check"
  - "we need to answer this before"
---

# Spike Skill

## Step 0 — Read the parent discovery artefact

Before accepting the spike question, read the parent feature's discovery artefact:

```
artefacts/[feature-slug]/discovery.md
```

If it does not exist yet — note this and continue. The spike is exploratory.

If it does exist, extract and state:
- **Problem statement** (one sentence)
- **Assumptions** that this spike is testing
- **Known risks** that this spike may resolve or confirm
- **Open questions** the discovery author flagged

> "I've read the discovery for [feature]. The following uncertainties are already
> flagged and relevant to this spike: [list]. I'll map findings back to these fields
> when producing the output."

This ensures the spike question is grounded in the discovery framing, not invented
in isolation.

---

## Step 1 — Establish the spike question

Ask this first. Do not proceed until answered.

> **What is the specific question this spike must answer?**
>
> A good spike question is answerable with PROCEED, REDESIGN, or DEFER.
> Example: "Can [configured platform / vendor] handle [requirement] natively, or does it require custom code?"
> Not: "We need to understand the fraud engine better."
>
> Reply: state the question in one sentence

---

## Step 2 — Identify what is blocked

> **Which pipeline stage or story is waiting on this answer?**
>
> Reply: name the stage or story (e.g. "/review on story-slug", "/definition for epic-name")

---

## Step 3 — Choose the spike type

> **What kind of spike is this?**
>
> 1. Technical feasibility — can the system or platform do X?
> 2. Regulatory interpretation — what does the regulation actually require here?
> 3. Design decision — which of two or more approaches should we take?
> 4. Data or integration — what does the real data or API actually look like?
> 5. Knowledge gap — who knows how this works, and what do they say?
>
> Reply: 1, 2, 3, 4, or 5

**Type 2 — Regulatory interpretation** requires named human sign-off before the
outcome can be set. The agent's interpretation alone is never sufficient.
Produce DEFER immediately and note who needs to be consulted and what the
specific question is for that conversation.

**Type 5 — Knowledge gap** means the answer lives in a person's head, not in
any source the agent can reach. Produce DEFER immediately and specify who to
consult and what to ask them.

---

## Step 4 — Set the investigation scope

> **How broad does this investigation need to be?**
>
> 1. Narrow — a single targeted source, test, or check (up to 3 steps)
> 2. Standard — multiple sources, or a small prototype required (up to 6 steps)
> 3. Thorough — several approaches compared, or multiple integrations tested (up to 10 steps)
>
> If the done condition is met before the limit — stop. Do not expand to fill the scope.
> If the limit is reached without the done condition met — stop and produce DEFER.
>
> Reply: 1, 2, or 3

---

## Step 5 — Define the done condition

This is the most important step. The done condition must be defined before
investigation begins — not after.

> **What will you have at the end of the timebox that lets you make the
> PROCEED / REDESIGN / DEFER call?**
>
> Examples:
> - "A working prototype that confirms the API accepts our payload format"
> - "Written confirmation from compliance citing the specific clause"
> - "Options assessed against latency, cost, and maintainability — recommendation written up"
> - "A captured sample payload from the test environment"
> - "Notes from the interview with [name] confirming the legacy behaviour"
>
> Reply: describe your done condition

---

## Step 6 — Define what is out of scope

> **What is this spike explicitly NOT investigating?**
>
> This is important — spikes expand without a boundary.
> Example: "Not investigating the full fraud engine API — only the partial-auth response format."
>
> Reply: state what is out of scope, or reply "none needed" if the question is already tight

---

## Step 7 — Produce the spike brief

Confirm everything before saving:

> **Spike brief summary — confirm before I save:**
>
> Question: [stated question]
> Type: [type name]
> Blocking: [blocked stage]
> Scope: [narrow / standard / thorough — max N steps]
> Done condition: [done condition]
> Out of scope: [out of scope]
>
> Outcome options:
> - PROCEED: [what proceed means for the blocked stage]
> - REDESIGN: [what would change]
> - DEFER: [what deferring means]
>
> Reply: confirm — or tell me what to adjust

Save to `artefacts/[feature]/spikes/[spike-slug]-brief.md` on confirmation.

---

## Investigation

State each step before taking it:

> "Step [n]: [what I'm doing and what I expect to find]"

After each step:

> "Step [n] complete. Found: [result].
> This [confirms / rules out / is inconclusive about] [aspect of the question].
>
> Continue to step [n+1], or is the done condition already met?
> Reply: continue — or done if you have enough"

If the done condition is met before the scope limit is reached — stop. Do not expand scope.

If the scope limit is reached without the done condition being met — stop and produce
the outcome artefact with DEFER and an honest accounting of what remains unknown.

---

## Outcome artefact

Conforms to `.github/templates/spike-outcome.md`.
Save to `artefacts/[feature]/spikes/[spike-slug]-outcome.md`.

After the discovery handoff step (below), also save the structured output to
`artefacts/[feature]/spikes/[spike-slug]-output.md` using `.github/templates/spike-output.md`.

---

## After the outcome is produced

Always present the outcome as a choice, not a statement:

**If PROCEED:**

> **Spike closed: PROCEED ✅**
> [One sentence summary of what was confirmed]
>
> Ready to return to [blocked stage]?
> Reply: yes — and I'll open /[skill] with the spike finding as context

**If REDESIGN:**

> **Spike closed: REDESIGN 🔄**
> What needs to change: [specific change]
>
> Ready to update [artefact] and re-run /[skill]?
> Reply: yes — and I'll walk through the required changes

**If DEFER:**

> **Spike closed: DEFER ⏸**
> [One sentence on why]
>
> **What do you want to do with the blocked work?**
> 1. Proceed with the unknown acknowledged as a named risk (log in /decisions)
> 2. Defer the blocked story/feature to post-MVP
>
> Reply: 1 or 2

**Always after outcome — invoke /decisions:**

> **Log this in /decisions?**
> Category: [ARCH / DESIGN / RISK-ACCEPT / SCOPE — pre-suggested by outcome type]

---

## Discovery handoff

After the outcome is produced, map findings back to the parent discovery artefact.

> **Discovery handoff — review before saving spike-output:**
>
> Parent discovery: `artefacts/[feature-slug]/discovery.md`
>
> For each discovery field below, state whether the spike changes it:
>
> | Field | Changed? | New value / clarification |
> |-------|----------|---------------------------|
> | Problem statement | | |
> | MVP scope | | |
> | Assumptions | | |
> | Known risks | | |
> | Technical constraints | | |
>
> Reply: confirm the table — or correct any row

Save the completed output to `artefacts/[feature]/spikes/[spike-slug]-output.md`
using `.github/templates/spike-output.md`.

**If any discovery field changed:**

> **This spike changes the problem framing — re-run /discovery?**
>
> The following fields in the discovery artefact need updating:
> - [list changed fields]
>
> 1. Yes — re-open /discovery now, using spike findings as new inputs
> 2. No — continue with current discovery, log the delta in /decisions only
>
> Reply: 1 or 2
> References: [spike outcome artefact path]
>
> Reply: yes to log — or skip if you'll do it separately

---

## Quality checks before closing

- Scope limit was defined before investigation — not after
- Done condition was defined before investigation — not after
- Outcome is PROCEED, REDESIGN, or DEFER — not "it depends"
- What remains unknown is stated honestly — even for PROCEED
- Type 2 and Type 5 spikes produce DEFER with named consultation required — not an agent-generated answer
- /decisions has been invoked or explicitly skipped
- Both brief and outcome artefacts are saved

---

## What this skill does NOT do

- Does not run open-ended research without a specific question and done condition
- Does not make regulatory interpretations without named human sign-off
- Does not expand scope once the brief is agreed
- Does not produce PROCEED if done condition was not met — uses DEFER instead
- Does not continue past the scope limit

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

Update `.github/pipeline-state.json` in the **project repository** at each phase:

- When the spike begins: set the affected feature or story `stage: "spike"`, `health: "green"`, `updatedAt: [now]`
- **On PROCEED:** restore the feature/story to the stage it was blocked from (e.g. `stage: "definition"`), set `health: "green"`, clear `blocker`, `updatedAt: [now]`
- **On REDESIGN:** set `health: "amber"`, `blocker: "Spike REDESIGN — [what needs to change]"`, return stage to the pipeline step that needs rework (e.g. `stage: "definition"`), `updatedAt: [now]`
- **On DEFER:** set `health: "red"`, `blocker: "Spike DEFER — [reason]"`, `stage: "spike"`, `updatedAt: [now]`
- Save the spike outcome artefact to `artefacts/[feature]/spikes/[spike-slug]-outcome.md`
