---
name: clarify
description: >
  Discovery clarification assistant. Identifies the highest-value open questions
  blocking a discovery from moving forward, then asks them one at a time to
  strengthen the artefact before /benefit-metric runs. Reads product context and
  existing discovery artefact, identifies gaps in 4 categories, presents max 3-5
  questions per session, updates the discovery artefact, and produces a summary
  of what changed. Use when a discovery feels vague, when scoping is unclear,
  when the team disagrees on MVP scope, or when someone says "clarify this",
  "the discovery needs more detail", "I'm not sure what we're actually building",
  or "help me sharpen the discovery". Runs between /discovery and /benefit-metric.
  Safe to run multiple times until the discovery is sharp enough to approve.
triggers:
  - "clarify this"
  - "the discovery needs more detail"
  - "I'm not sure what we're actually building"
  - "help me sharpen the discovery"
  - "sharpen the scope"
  - "discovery needs work"
  - "too vague to proceed"
  - "clarify before metrics"
---

# Clarify Skill

## Entry condition check

Verify that a discovery artefact exists:

1. Discovery artefact exists at `artefacts/[feature]/discovery.md`

If not found:

> ❌ **No discovery artefact found.**
> Run /discovery first to create a structured artefact.
> Reply: go — and I'll start /discovery now.

---

## Step 1 — Read product context

Check whether `.github/product/` exists. If it does, read:
- `mission.md` — product purpose, target users, success outcomes
- `constraints.md` — hard limits
- `tech-stack.md` — current technology decisions

Extract and hold, but do not surface yet:
- Who the named target users are
- What hard constraints the feature must respect
- Any technology choices that narrow implementation options

---

## Step 2 — Read the discovery artefact

Read `artefacts/[feature]/discovery.md` in full.

Extract the current state of each section:

| Section | Status | Quality signal |
|---------|--------|----------------|
| Problem statement | Present / Missing | Specific / Vague |
| Who it affects | Present / Missing | Named / Generic |
| Why now | Present / Missing | Clear trigger / Unclear |
| MVP scope | Present / Missing | Bounded / Open-ended |
| Out of scope | Present / Missing | Explicit / Empty |
| Success indicators | Present / Missing | Observable / "Users like it" |
| Assumptions | Present / Missing | Genuine uncertainties / Facts dressed as assumptions |
| Constraints | Present / Missing | Named / Empty |

Surface the assessment:

> **Discovery quality check — [feature]:**
>
> [For each section that is Missing or Vague/Generic/Open-ended:]
> - [section]: [issue — e.g. "MVP scope is open-ended — no clear boundary"]
>
> I've identified [n] gaps. I'll ask you about the most important ones, max [3-5].
>
> Reply: go — or tell me which sections matter most

---

## Step 3 — Identify gaps in 4 categories

Assess the discovery for gaps in these categories:

### SCOPE (most important)
- Is the MVP boundary concrete and defensible?
- Are there explicit out-of-scope items? At least 2?
- Could two engineers independently agree on what "done" looks like?

### INTEGRATION
- What system behaviours, APIs, or data states are assumed to exist?
- Are there upstream or downstream dependencies not named in the discovery?
- What happens if an assumed integration is unavailable or behaves differently?

### CONSTRAINTS
- Are there regulatory, security, or data classification constraints that apply?
- Are performance or availability constraints stated?
- Are the constraints from `constraints.md` reflected in the discovery?

### USER JOURNEY
- Are target users named personas or generic "users"?
- How do users reach this feature — what state are they in when they encounter it?
- What does the problem cost them when unresolved?

---

## Step 4 — Present questions (max 3-5)

Rank the gaps by impact on downstream pipeline steps:
- Scope gaps block /definition (can't decompose without bounds)
- User gaps reduce /test-plan quality (no persona for E2E scenarios)
- Constraint gaps cause rework in /review Category A and /definition-of-ready

Ask up to 5 questions, one at a time, most impactful first.

For each question:
1. State the question
2. Explain why it is blocking — which downstream step is at risk if it isn't answered
3. Offer 2-3 likely answer options to accelerate the response

Example format:
> **Q: [question]**
> Blocking because: [which downstream step and why]
> Options:
> A. [option 1]
> B. [option 2]
> C. [option 3 — or describe your own below]

After each answer, update the relevant section of the discovery artefact before
asking the next question.

Confirm before moving on:

> **I've updated the [section] section as:**
> [updated text]
>
> Does that capture it?
> Reply: yes — or correct me

---

## Step 5 — Update the discovery artefact

After all questions are answered:

1. Write all updates to `artefacts/[feature]/discovery.md`
2. Update the Status field to `Clarified` if it was `Draft`
3. Append a `## Clarification log` section to the discovery artefact recording each Q&A:

```markdown
## Clarification log
[YYYY-MM-DD] Clarified via /clarify:
- Q: [question]  A: [answer given]
- Q: [question]  A: [answer given]
```

---

## Completion output

If any question remains unresolved after all rounds:

> ❌ **BLOCKED — [specific unresolved question]**
>
> Do not proceed to /benefit-metric until this question is resolved.
> Reply: answer the question above — or run /clarify again in a new session

If all questions are resolved:

> ✅ **Clarification complete. [N] questions resolved. discovery.md updated. Ready for /benefit-metric.**
>
> Sections updated: [list]
> Status: Clarified
>
> Reply: approve and proceed to /benefit-metric

---

## What this skill does NOT do

- Does not generate a new discovery from scratch — that is /discovery
- Does not write benefit metrics — that is /benefit-metric
- Does not write stories — that is /definition
- Does not run a spike — if a clarification requires investigation, route to /spike

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill without completing this write. Confirm the write in your closing message: "Pipeline state updated ✅."

Update `.github/pipeline-state.json` for the relevant feature:

- Set `stage: "discovery"` (clarify runs within, not after, discovery)
- Set `discoveryStatus: "clarified"` (or "draft" if still incomplete)
- Set `updatedAt: [now]`
