---
name: definition
description: >
  Breaks an approved discovery + benefit-metric pair into epics and stories conforming to
  templates/epic.md and templates/story.md. Use when someone says "break this down", 
  "create stories", "define the work", "write the epics", or references moving past 
  benefit-metric. Requires approved discovery AND active benefit-metric artefact.
  Offers slicing strategy choice before decomposing — does not default to functional slicing.
  Does not produce test plans, specs, or API contracts.
triggers:
  - "break this down"
  - "create stories"
  - "write the epics"
  - "define the work"
  - "decompose this"
  - "what are the stories for"
---

# Definition Skill

## Entry condition check

**Before proceeding**, verify:

1. Discovery artefact exists at `.github/artefacts/[feature]/discovery.md` with status "Approved"
2. Benefit-metric artefact exists at `.github/artefacts/[feature]/benefit-metric.md`
3. Benefit-metric artefact contains at least one metric with a defined target

If either condition is not met, output:

> ❌ **Entry condition not met**  
> The definition skill requires both an approved discovery artefact AND an active 
> benefit-metric artefact.  
> [Specific issue: e.g. "Benefit-metric artefact not found. Run /benefit-metric first."]  
> Run `/workflow` to see the current pipeline state.

---

## Template references

All output must conform to:
- Epics → `.github/templates/epic.md`
- Stories → `.github/templates/story.md`

Do not invent alternative structures. Every field in the templates must be populated.
If a field cannot be populated, write the reason explicitly — do not leave it blank.

---

## Step 1: Slicing strategy selection

Before decomposing, present the four slicing options and ask the human to choose.
Do not default to functional/component slicing.

### Option 1: Vertical slice
Each story delivers a thin, complete slice through all layers (UI → logic → data).
Every story is independently demo-able. Best for: validating end-to-end behaviour early,
high uncertainty about what users actually want.

### Option 2: Walking skeleton
First story establishes the thinnest possible end-to-end path. Subsequent stories 
flesh it out. Best for: new architectures or integrations where the path needs proving 
before details are added.

### Option 3: User journey
Stories follow the user's chronological path through the feature.
Best for: workflow-heavy features where the sequence of interactions matters.

### Option 4: Risk-first
Highest-risk or highest-uncertainty stories first. Best for: features with significant 
technical unknowns where you want to de-risk before committing to the full scope.

Present as:
> "Before I decompose this, which slicing strategy should I use?
> [Brief one-line description of each option as it applies to this specific feature]
> The choice shapes how stories are sized and sequenced."

Record the chosen strategy in every epic artefact.

---

## Step 2: Epic structure

Group stories into epics. Each epic should represent a cohesive body of work that 
could be reviewed and understood independently.

For small features (under ~8 stories), a single epic may be appropriate.
For larger features, aim for epics of 3–8 stories each.

Save each epic to `.github/artefacts/[feature]/epics/[epic-slug].md`
conforming to `.github/templates/epic.md`.

---

## Step 3: Story decomposition

For each epic, write stories conforming to `.github/templates/story.md`.

Key discipline:
- Every story must name a persona from the benefit-metric artefact (not "a user")
- Every story's "So that..." must connect to a metric from the benefit-metric artefact
- Every story must have an explicit out-of-scope section (not "N/A")
- Minimum 3 ACs per story in Given/When/Then format
- ACs describe observable behaviour, not implementation approach

Save each story to `.github/artefacts/[feature]/stories/[story-slug].md`

---

## Step 4: Benefit coverage matrix

After all stories are written, populate the metric coverage matrix in the 
benefit-metric artefact.

For each metric, list which stories move it. Flag any metric with no covering story:

> ⚠️ **METRIC GAP:** [Metric name] has no stories that move it.  
> Options: (a) write a story, (b) descope this metric, (c) note it as post-MVP.  
> Human decision required before proceeding to /review.

Flag any story with no metric linkage:

> ⚠️ **STORY GAP:** [Story title] has no metric linkage.  
> Either connect it to a metric or consider whether it belongs in MVP scope.

---

## Scope guard

If a story is clearly needed but was not in the discovery MVP scope:

> ⚠️ **SCOPE NOTE:** [Story title] was not in the discovery MVP scope.  
> It appears necessary because [reason].  
> Options: (a) add to MVP scope — update discovery artefact, (b) defer to post-MVP,  
> (c) replace an existing MVP scope item. Human decision required.

---

## Quality checks before outputting

- Every epic records its slicing strategy — not implied, written explicitly
- Every story's "So that..." connects to a named metric, not just a feature preference
- Every story has a genuine out-of-scope section (not "N/A")
- Minimum 3 ACs per story in Given/When/Then format
- Benefit coverage matrix is complete — no metric is orphaned, no story is unlinked
- MVP scope from discovery is fully covered or explicitly deferred with reason
- Complexity and scope stability rated on every epic and story

## What this skill does NOT do

- Does not produce API contracts or technical implementation detail
- Does not write test cases — that is /test-plan
- Does not run the definition-of-ready check
- Does not assign stories to people, sprints, or milestones
- Does not modify the discovery or benefit-metric artefacts (only references them 
  and updates the coverage matrix)
