---
name: benefit-metric
description: >
  Defines measurable outcomes for an approved discovery artefact. Produces a
  benefit-metric artefact conforming to templates/benefit-metric.md. Use when
  discovery is approved and someone says "define the metrics", "what does success
  look like", "how will we measure this", or proceeds past discovery.
  Detects meta-benefit situations (pilot, tooling test, process experiment) and
  separates them from product metrics. Does not write stories â€” that is /definition.
triggers:
  - "define the metrics"
  - "what does success look like"
  - "how will we measure this"
  - "benefit metric"
  - "metrics for"
  - after discovery approval
---

# Benefit Metric Skill

## Entry condition check

Before asking anything, verify:

1. Discovery artefact exists at `.github/artefacts/[feature]/discovery.md`
2. Status field reads "Approved" â€” not "Draft"
3. Discovery contains problem statement, MVP scope, and directional success indicators

Also check for reference materials at `.github/artefacts/[feature]/reference/`.
If present, scan for:
- Business case documents (benefits realisation plans, investment proposals)
- Outcome or OKR documents
- Stakeholder or sponsor expectations

If found, note it before starting:

> **Reference materials found:** [list files]
> I'll use these to validate and strengthen the metrics we define.
> If a target or baseline figure appears in the source documents, I'll surface
> it rather than asking you to provide it from memory.

If not met (entry condition):

> âŒ **Entry condition not met**
> [Specific issue â€” e.g. "Discovery status is still 'Draft'. A human needs to
> approve it before metrics can be defined."]
>
> Run /workflow to see the current pipeline state.

---

## Step 1 â€” Meta-benefit check

Read the discovery artefact. Check for signals that this initiative is also
testing a hypothesis about tooling, process, or team capability:
- "We want to learn if agents can do X"
- "This is a pilot to validate the approach"
- "We're also testing [new tool / workflow / team structure]"

If detected:

> **Meta-benefit detected â€” confirm before proceeding.**
>
> This initiative appears to be testing [tooling / process / capability] as well
> as delivering user value. That means two types of metrics:
>
> - **Product metrics** â€” user outcomes (conversion, time saved, error rate)
> - **Meta metrics** â€” what we learn about [the pilot / tool / approach]
>
> If meta-learning is the primary goal, product metrics may not be hit â€” and that
> needs to be explicit before stories are written.
>
> Is this a meta-benefit situation?
> 1. Yes â€” define both product and meta metrics separately
> 2. No â€” standard product metrics only
>
> Reply: 1 or 2

---

## Step 2 â€” Confirm the directional indicators to build from

State what was found:

> **Directional success indicators from discovery:**
> - [indicator 1]
> - [indicator 2]
> - [indicator 3]
>
> I'll turn each of these into a measurable metric with baseline, target, and
> feedback loop. Any you want to add, remove, or reframe before I start?
>
> Reply: looks good â€” or adjust [indicator]

---

## Step 3 â€” Work through each metric

For each directional indicator, ask:

> **[Indicator] â€” let's define the metric.**
>
> 1. What specifically are we measuring?
>    (Not a proxy â€” the actual thing. E.g. "time from application start to first
>    decision" not "speed")
>
> Reply: name the metric

Then:

> 2. What is the baseline today?
>    (If unknown: how will we establish it and by when?)
>
> Reply: state the baseline â€” or "unknown, will measure in first [n] weeks"

Then:

> 3. What is the target?
>    (Specific and directional â€” "under 15 minutes" not "faster")
>
> Reply: state the target

Then:

> 4. What is the minimum validation signal?
>    (The threshold below which we stop or pivot â€” lower than the full target)
>
> Reply: state the minimum signal

Then:

> 5. How will we measure it, who measures it, and how often?
>
> Reply: describe the measurement approach

---

## Baseline discipline

If a baseline is unknown, never invent one. Use:

```
Baseline: Not yet established. Will measure current state in the first [n] weeks
of deployment before assessing progress toward target.
```

A well-defined unknown is more useful than a fabricated number.

---

## Metric quality check

Before finalising each metric, apply this test silently:

- Could you measure this today without building anything?
  (If yes, it might be a baseline, not a metric.)
- Could two people measure this and get the same answer?
  (If no, it's too subjective â€” tighten the definition.)
- Is the target specific enough that there's no debate about whether you hit it?
  (If no, tighten it.)

If a metric fails any check, raise it before finalising:

> **[Metric] may be too [subjective / broad / output-oriented].**
> [Specific concern]
>
> Suggested adjustment: [concrete alternative]
>
> Use my suggestion, or adjust yourself?
> Reply: use suggestion â€” or [adjusted version]

---

## Output

Save to `.github/artefacts/[feature]/benefit-metric.md` using
`.github/templates/benefit-metric.md`. Every field must be populated or explicitly
explained as unknown.

---

## Completion output

> **Benefit metric artefact complete âœ…**
>
> Metrics defined: [n product] [+ n meta if applicable]
> Baselines established: [n of n / n TBD]
>
> Before proceeding to /definition:
> Confirm these metrics and targets are agreed with relevant stakeholders â€”
> these are the contract the pipeline is accountable to. Stories must trace
> to these metrics, and /definition-of-done checks against them.
>
> Ready to run /definition?
> Reply: yes â€” or I need to confirm metrics first

---

## Quality checks before outputting

- Every metric has a baseline or an explicit plan to establish one
- Every target is specific and directional â€” not "faster", "better", "more"
- Minimum validation signal is lower than the full target
- Feedback loop names who measures, when, and what happens if signal not met
- Meta benefits and product benefits separated if both present
- No metric is feature delivery ("metric: export button built") â€” outcomes not outputs

---

## What this skill does NOT do

- Does not write stories or epics â€” that is /definition
- Does not define acceptance criteria â€” those live on stories
- Does not replace a full OKR or KPI framework
- Does not update the discovery artefact

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

When the benefit-metric artefact is saved and marked active, update `.github/pipeline-state.json` in the **project repository**:

- Set `stage: "benefit-metric"`, `health: "green"`, `updatedAt: [now]`

**Human review note:** If a human approves or modifies the benefit-metric artefact outside a skill session, run `/workflow` to reconcile.
