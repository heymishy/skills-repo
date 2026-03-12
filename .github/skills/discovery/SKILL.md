---
name: discovery
description: >
  Structures a raw idea, problem statement, or opportunity into a formal discovery
  artefact. Use when someone says "I have an idea", "we should build",
  "there's a problem with", "can we explore", or pastes a rough Jira description.
  Produces a discovery artefact that, once approved, unlocks /benefit-metric.
  Does not produce metrics, stories, or technical design — those are downstream skills.
  Asks clarifying questions one at a time — never presents a form to fill in.
triggers:
  - "I have an idea"
  - "we should build"
  - "there's a problem with"
  - "can we explore"
  - "new feature"
  - "new initiative"
  - "discovery"
---

# Discovery Skill

## Entry condition

No prerequisites. First step in the pipeline.

If no input has been provided, ask this first:

> **What's the problem or opportunity you want to explore?**
> A sentence or two is enough to start.
>
> Reply: describe it

---

## Purpose

Transform a rough idea into a structured artefact that answers:
*What problem are we solving, for whom, why now, and what does success look like at the edges?*

This is a scoping and clarity exercise — not a solution definition.
The discovery artefact does not specify how to build anything.

---

## Conversational process

Work through sections one at a time. Ask one question, wait for the answer, write
the section, then move to the next. Never present the full structure as a form.

When you have enough to write a section confidently, write it and confirm:
> "I've written the [section] section as: [summary]. Does that capture it?
> Reply: yes — or correct me"

### Section 1 — Problem statement

Ask:
> **What's actually happening now that shouldn't be — or not happening that should?**
> (Not the solution — the problem. Who experiences it, when, how often, what does
> it cost them when it's unresolved?)
>
> Reply: describe the problem

### Section 2 — Who it affects

Ask:
> **Who specifically experiences this problem?**
> I need named personas, not generic "users". What are they trying to accomplish
> when they hit this?
>
> Reply: describe the people

### Section 3 — Why now

Ask:
> **What's changed that makes this worth addressing now?**
> (Regulatory change, volume threshold, competitive pressure, strategic initiative,
> accumulated pain reaching a tipping point, something else?)
>
> Reply: describe the trigger

### Section 4 — MVP scope

Ask:
> **What's the smallest thing that could validate this is worth building?**
> What must be true for the first person who uses it to find it useful?
>
> Reply: describe the MVP

### Section 5 — Out of scope (mandatory)

Ask:
> **What's explicitly NOT part of this initiative?**
> Minimum 2 items — naming what's out of scope is as important as what's in.
> It's what /review will validate stories against.
>
> Reply: list at least 2 items

If the answer is vague or "nothing is out of scope":
> What's something related that might seem obvious to include, but you want to defer?
> Even one example helps — it signals where the boundary is.
>
> Reply: give an example

### Section 6 — Assumptions and risks

Ask:
> **What are we assuming is true that we haven't validated yet?**
> And what could make this not worth building?
>
> Reply: list assumptions and risks

### Section 7 — Directional success indicators

Ask:
> **What would you see, hear, or measure that would tell you this worked?**
> These don't need to be precise metrics yet — that's /benefit-metric's job.
> Directional signals are fine here.
>
> Reply: describe what success looks like

### Section 8 — Constraints

Ask:
> **Any constraints I should know about?**
> (Time, budget, regulatory, technical dependencies, team capability)
>
> Reply: list constraints — or type "none identified"

---

## Output artefact

Conforms to `.github/templates/discovery.md`.
Save to `.github/artefacts/[feature-slug]/discovery.md`.

---

## Approval gate

After producing the artefact:

> **Discovery draft complete ✅**
>
> Before moving to /benefit-metric, a human should review and approve this —
> particularly the MVP scope and out-of-scope sections.
>
> When approved: update the Status field to "Approved" and note who approved
> it and when. The /benefit-metric skill checks for this before proceeding.
>
> Ready to review it now, or come back to it?
> Reply: review now — or done for this session

---

## Quality checks before outputting

- Problem statement describes a problem, not a solution
- MVP scope is bounded — not "everything" or "phase 1 of a platform"
- Out of scope has at least 2 explicit items with reasons
- Success indicators are observable, not "users like it"
- Assumptions are genuine uncertainties — not facts dressed as assumptions
- No implementation detail has crept in

---

## What this skill does NOT do

- Does not define metrics — that is /benefit-metric
- Does not write stories or ACs — that is /definition
- Does not make build/buy/defer decisions
- Does not update Jira tickets
