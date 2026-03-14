---
name: discovery
description: >
  Structures a raw idea, problem statement, or opportunity into a formal discovery
  artefact. Use when someone says "I have an idea", "we should build",
  "there's a problem with", "can we explore", or pastes a rough Jira description.
  Produces a discovery artefact that, once approved, unlocks /benefit-metric.
  Does not produce metrics, stories, or technical design â€” those are downstream skills.
  Asks clarifying questions one at a time â€” never presents a form to fill in.
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

---

## Step 0 â€” Check for reference materials

Before asking any questions, check whether a reference folder exists for this
feature at `.github/artefacts/[feature-slug]/reference/`.

If the folder exists and contains files, list them:

> **Reference materials found:**
> - [filename] â€” [brief description from reference-index.md if present]
>
> I'll use these to pre-populate sections where they contain relevant context.
> You can still correct or override anything I extract.
>
> Do you want me to read these documents before we start?
> Reply: yes â€” or skip, I'll describe the context directly

If the user says yes, read the available documents and summarise what you found
before proceeding:

> **From the reference materials:**
> - Problem / opportunity: [extracted summary]
> - Stakeholders / personas mentioned: [list]
> - Scope or boundaries mentioned: [summary]
> - Success indicators or targets mentioned: [summary]
> - Constraints mentioned: [summary]
>
> I'll use this as a starting point. Confirm or correct each section as we go.

If no reference folder exists, proceed directly to the conversational process.

> **Tip for large or multi-team initiatives:** Drop scoping documents, business
> cases, or other source materials into
> `.github/artefacts/[feature-slug]/reference/` and create a
> `reference-index.md` there (template at `.github/templates/reference-index.md`).
> Discovery, /benefit-metric, and /definition will read them automatically.

If no input has been provided, ask this first:

> **What's the problem or opportunity you want to explore?**
> A sentence or two is enough to start â€” or point me to the reference folder
> if you've already uploaded source documents.
>
> Reply: describe it

---

## Purpose

Transform a rough idea into a structured artefact that answers:
*What problem are we solving, for whom, why now, and what does success look like at the edges?*

This is a scoping and clarity exercise â€” not a solution definition.
The discovery artefact does not specify how to build anything.

---

## Conversational process

Work through sections one at a time. Ask one question, wait for the answer, write
the section, then move to the next. Never present the full structure as a form.

When you have enough to write a section confidently, write it and confirm:
> "I've written the [section] section as: [summary]. Does that capture it?
> Reply: yes â€” or correct me"

### Section 1 â€” Problem statement

Ask:
> **What's actually happening now that shouldn't be â€” or not happening that should?**
> (Not the solution â€” the problem. Who experiences it, when, how often, what does
> it cost them when it's unresolved?)
>
> Reply: describe the problem

### Section 2 â€” Who it affects

Ask:
> **Who specifically experiences this problem?**
> I need named personas, not generic "users". What are they trying to accomplish
> when they hit this?
>
> Reply: describe the people

### Section 3 â€” Why now

Ask:
> **What's changed that makes this worth addressing now?**
> (Regulatory change, volume threshold, competitive pressure, strategic initiative,
> accumulated pain reaching a tipping point, something else?)
>
> Reply: describe the trigger

### Section 4 â€” MVP scope

Ask:
> **What's the smallest thing that could validate this is worth building?**
> What must be true for the first person who uses it to find it useful?
>
> Reply: describe the MVP

### Section 5 â€” Out of scope (mandatory)

Ask:
> **What's explicitly NOT part of this initiative?**
> Minimum 2 items â€” naming what's out of scope is as important as what's in.
> It's what /review will validate stories against.
>
> Reply: list at least 2 items

If the answer is vague or "nothing is out of scope":
> What's something related that might seem obvious to include, but you want to defer?
> Even one example helps â€” it signals where the boundary is.
>
> Reply: give an example

### Section 6 â€” Assumptions and risks

Ask:
> **What are we assuming is true that we haven't validated yet?**
> And what could make this not worth building?
>
> Reply: list assumptions and risks

### Section 7 â€” Directional success indicators

Ask:
> **What would you see, hear, or measure that would tell you this worked?**
> These don't need to be precise metrics yet â€” that's /benefit-metric's job.
> Directional signals are fine here.
>
> Reply: describe what success looks like

### Section 8 â€” Constraints

Ask:
> **Any constraints I should know about?**
> (Time, budget, regulatory, technical dependencies, team capability)
>
> Reply: list constraints â€” or type "none identified"

---

## Output artefact

Conforms to `.github/templates/discovery.md`.
Save to `.github/artefacts/[feature-slug]/discovery.md`.

---

## Approval gate

After producing the artefact:

> **Discovery draft complete âœ…**
>
> Before moving to /benefit-metric, a human should review and approve this â€”
> particularly the MVP scope and out-of-scope sections.
>
> When approved: update the Status field to "Approved" and note who approved
> it and when. The /benefit-metric skill checks for this before proceeding.
>
> Ready to review it now, or come back to it?
> Reply: review now â€” or done for this session

---

## Quality checks before outputting

- Problem statement describes a problem, not a solution
- MVP scope is bounded â€” not "everything" or "phase 1 of a platform"
- Out of scope has at least 2 explicit items with reasons
- Success indicators are observable, not "users like it"
- Assumptions are genuine uncertainties â€” not facts dressed as assumptions
- No implementation detail has crept in

---

## What this skill does NOT do

- Does not define metrics â€” that is /benefit-metric
- Does not write stories or ACs â€” that is /definition
- Does not make build/buy/defer decisions
- Does not update Jira tickets

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

When the discovery artefact is saved and approved, update `.github/pipeline-state.json` in the **project repository**:

- If the feature does not exist in `features[]`: add a new entry with `stage: "discovery"`, `health: "green"`, `updatedAt: [now]`
- If it exists: set `stage: "discovery"`, `health: "green"`, `updatedAt: [now]`

**Human review note:** If a human approves the discovery outside of a skill session, run `/workflow` â€” it will reconcile the state file with the artefacts.
