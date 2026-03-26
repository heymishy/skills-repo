---
name: benefit-metric
description: >
  Defines measurable outcomes for an approved discovery artefact. Produces a
  benefit-metric artefact conforming to templates/benefit-metric.md. Use when
  discovery is approved and someone says "define the metrics", "what does success
  look like", "how will we measure this", or proceeds past discovery.
  Detects meta-benefit situations (pilot, tooling test, process experiment) and
  separates them from product metrics. Does not write stories - that is /definition.
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
2. Status field reads "Approved" - not "Draft"
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

> ❌ **Entry condition not met**
> [Specific issue - e.g. "Discovery status is still 'Draft'. A human needs to
> approve it before metrics can be defined."]
>
> Run /workflow to see the current pipeline state.

---

## Step 1 Meta-benefit check

Read the discovery artefact. Check for signals that this initiative is also
testing a hypothesis about tooling, process, or team capability:
- "We want to learn if agents can do X"
- "This is a pilot to validate the approach"
- "We're also testing [new tool / workflow / team structure]"

If detected:

> **Meta-benefit detected  confirm before proceeding.**
>
> This initiative appears to be testing [tooling / process / capability] as well
> as delivering user value. That means two types of metrics:
>
> - **Product metrics** - user outcomes (conversion, time saved, error rate)
> - **Meta metrics** - what we learn about [the pilot / tool / approach]
>
> If meta-learning is the primary goal, product metrics may not be hit - and that
> needs to be explicit before stories are written.
>
> Is this a meta-benefit situation?
> 1. Yes - define both product and meta metrics separately
> 2. No - standard product metrics only
>
> Reply: 1 or 2

---

## Step 2 - Confirm the directional indicators to build from

State what was found:

> **Directional success indicators from discovery:**
> - [indicator 1]
> - [indicator 2]
> - [indicator 3]
>
> I'll turn each of these into a measurable metric with baseline, target, and
> feedback loop. Any you want to add, remove, or reframe before I start?
>
> Reply: looks good - or adjust [indicator]

---

## Step 3 - Work through each metric

For each directional indicator, ask:

> **[Indicator] - let's define the metric.**
>
> 1. What specifically are we measuring?
>    (Not a proxy - the actual thing. E.g. "time from application start to first
>    decision" not "speed")
>
> Reply: name the metric

Then:

> 2. What is the baseline today?
>    (If unknown: how will we establish it and by when?)
>
> Reply: state the baseline - or "unknown, will measure in first [n] weeks"

Then:

> 3. What is the target?
>    (Specific and directional - "under 15 minutes" not "faster")
>
> Reply: state the target

Then:

> 4. What is the minimum validation signal?
>    (The threshold below which we stop or pivot - lower than the full target)
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
  (If no, it's too subjective - tighten the definition.)
- Is the target specific enough that there's no debate about whether you hit it?
  (If no, tighten it.)

If a metric fails any check, raise it before finalising:

> **[Metric] may be too [subjective / broad / output-oriented].**
> [Specific concern]
>
> Suggested adjustment: [concrete alternative]
>
> Use my suggestion, or adjust yourself?
> Reply: use suggestion - or [adjusted version]

---

## Output

Save to `.github/artefacts/[feature]/benefit-metric.md` using
`.github/templates/benefit-metric.md`. Every field must be populated or explicitly
explained as unknown.

---

## Completion output

> **Benefit metric artefact complete ✅**
>
> Metrics defined: [n product] [+ n meta if applicable]
> Baselines established: [n of n / n TBD]
>
> Before proceeding to /definition:
> Confirm these metrics and targets are agreed with relevant stakeholders -
> these are the contract the pipeline is accountable to. Stories must trace
> to these metrics, and /definition-of-done checks against them.
>
> Ready to run /definition?
> Reply: yes - or I need to confirm metrics first

---

## Quality checks before outputting

- Every metric has a baseline or an explicit plan to establish one
- Every target is specific and directional - not "faster", "better", "more"
- Minimum validation signal is lower than the full target
- Feedback loop names who measures, when, and what happens if signal not met
- Meta benefits and product benefits separated if both present
- No metric is feature delivery ("metric: export button built") - outcomes not outputs

---

## What this skill does NOT do

- Does not write stories or epics - that is /definition
- Does not define acceptance criteria - those live on stories
- Does not replace a full OKR or KPI framework
- Does not update the discovery artefact

---

## State update - mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

When the benefit-metric artefact is saved and marked active, update `.github/pipeline-state.json` in the **project repository**:

- Set `stage: "benefit-metric"`, `health: "green"`, `updatedAt: [now]`
- Seed a `metrics` array on the feature with every metric defined in this session. Each entry must conform to:
  ```json
  {
    "id": "m1",
    "name": "[metric name from artefact]",
    "target": "[target value]",
    "baseline": "[baseline value - '0%' if new feature]",
    "signal": "not-yet-measured",
    "lastMeasured": null,
    "evidence": null,
    "contributingStories": []
  }
  ```
  - `signal` is always `"not-yet-measured"` at this point - measurement happens post-implementation in `/definition-of-done`.
  - `contributingStories` is populated at `/definition` time when story slugs are known.
  - If the feature already has a `metrics` array (re-run scenario), merge: add new entries, preserve any existing entries that already have a `signal` set (do not overwrite real measurements).

**Human review note:** If a human approves or modifies the benefit-metric artefact outside a skill session, run `/workflow` to reconcile.
