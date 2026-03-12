---
name: discovery
description: >
  Structures a raw idea, problem statement, or opportunity into a formal discovery artefact.
  Use when someone says "I have an idea", "we should build", "there's a problem with",
  "can we explore", or pastes a rough Jira description or brief. 
  Produces a discovery artefact that, once approved, unlocks the benefit-metric skill.
  Does not produce metrics, stories, or technical design — those are downstream skills.
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

## Entry condition check

**This skill has no prerequisites** — it is the first step in the pipeline.

However, before proceeding, confirm:
- You have some form of raw input (idea, problem statement, Jira ticket, conversation notes)
- If no input is provided, ask: "What's the problem or opportunity you want to explore? 
  A sentence or two is enough to start."

---

## Purpose

Transform a rough idea into a structured artefact that answers: 
*What problem are we solving, for whom, why now, and what does success look like at the edges?*

This is a scoping and clarity exercise, not a solution definition exercise. 
The discovery artefact does not specify how to build anything.

---

## Process

Work through these sections in conversation. Ask clarifying questions one at a time — 
do not present the entire structure as a form to fill in. When you have enough to write 
a section confidently, write it and move on.

### 1. Problem statement

What is the actual problem? Not the solution. Ask "what's happening now that shouldn't be, 
or what isn't happening that should be?" Probe for specifics — who experiences this, 
when, how often, what is the cost of the problem going unresolved.

### 2. Who it affects

Named personas, not generic "users". What do these people care about? 
What are they trying to accomplish when they hit this problem?

### 3. Why now

What has changed that makes this worth addressing now? 
(Regulatory change, volume threshold, competitive pressure, team capability, 
strategic initiative, accumulated pain reaching a tipping point.)

### 4. MVP scope

The smallest thing that could validate the hypothesis. 
What must be true for this to be useful to the first person who uses it?
Be specific and bounded.

### 5. Out of scope (MANDATORY)

What adjacent problems or features are explicitly NOT part of this initiative?
Minimum 2 items. This prevents scope creep downstream and gives /review 
something concrete to validate stories against.

If the human says "everything is in scope", push back:
> "Explicitly naming what's out of scope is as important as defining what's in.
> What's something that might seem related but you want to defer?"

### 6. Assumptions and risks

What are we assuming is true that we haven't validated? 
What could make this not worth building?

### 7. Success indicators (directional)

Not full metrics — those come in the benefit-metric skill. 
But what would you see / hear / measure that would tell you this worked?
These become the starting point for benefit-metric.

### 8. Constraints

Time, budget, regulatory, technical, team capability, dependencies on other initiatives.

---

## Output format

Produce a markdown artefact saved to `.github/artefacts/[feature-slug]/discovery.md`.

```markdown
# Discovery: [Feature Name]

**Status:** Draft — awaiting approval  
**Created:** [date]  
**Author:** [session participant]

## Problem Statement
[Structured problem, not solution]

## Who It Affects
[Named personas with context]

## Why Now
[Specific trigger or rationale]

## MVP Scope
[Bounded, specific list]

## Out of Scope
- [Item 1 — and why excluded]
- [Item 2 — and why excluded]
[minimum 2, no maximum]

## Assumptions and Risks
[What we're assuming, what could invalidate this]

## Directional Success Indicators
[Early signals that will feed into benefit-metric]

## Constraints
[Time, regulatory, technical, team, dependencies]

---
**Next step:** Human review and approval → then /benefit-metric
```

---

## Approval gate

After producing the artefact, explicitly state:

> "This is a draft discovery artefact. Before moving to /benefit-metric, 
> a human should review and approve it — particularly the MVP scope and out-of-scope sections.
> When approved, update the status field to 'Approved' and note who approved it and when.
> The /benefit-metric skill will check for this approval before proceeding."

---

## Quality checks before outputting

- Problem statement describes a problem, not a solution
- MVP scope is bounded — not "everything" or "phase 1 of a platform"
- Out of scope has at least 2 explicit items, each with a reason
- Success indicators are observable, not "users like it"
- Assumptions are genuine uncertainties, not facts dressed as assumptions
- No implementation detail has crept in — this is not a spec

## What this skill does NOT do

- Does not define metrics — that is /benefit-metric
- Does not write stories or acceptance criteria — that is /definition
- Does not make build/buy/defer decisions — those are human decisions informed by discovery
- Does not update Jira tickets — it produces a local artefact for human to sync if needed
