---
name: metric-review
description: >
  Re-baselines benefit metrics at programme phase gates, quarterly checkpoints,
  or on demand. Reads the current benefit-metric artefact, collects actual
  performance data, assesses whether targets and baselines still reflect reality,
  and produces an updated or supplementary metric artefact. Use when approaching
  a phase gate, saying "review the metrics", "re-baseline", "are we on track",
  or "metrics checkpoint". Distinct from /benefit-metric which only runs once at
  discovery approval - this skill is the ongoing health check.
triggers:
  - "review the metrics"
  - "re-baseline"
  - "are we on track"
  - "metrics checkpoint"
  - "phase gate metrics"
  - "metric review"
  - "how are the metrics doing"
---

# Metric Review Skill

## Entry condition check

Before asking anything, verify:

1. Benefit-metric artefact exists at `artefacts/[feature]/benefit-metric.md`
2. At least one story has reached DoD-complete state (otherwise there's nothing to measure)

If not met:

> ❌ **Entry condition not met**
> [Specific issue - e.g. "No DoD-complete stories yet - nothing to measure against targets."]

---

## When to run this skill

- **Programme track:** at every phase gate (check `/programme` for the schedule)
- **Standard track:** if benefit-metric artefact is more than 3 months old and
  stories are still shipping
- **Ad hoc:** when stakeholders raise concern about whether original targets
  are still valid

---

## Step 1 - Confirm scope and review period

State what was found:

> **Current benefit-metric artefact:**
> Last updated: [date]
> Metrics: [n]
> Last metric review: [date / never reviewed]
>
> **Review period:** [start date → end date]
>
> Are all metrics in scope for this review, or focusing on specific ones?
> Reply: all - or name specific metrics

---

## Step 2 - Collect actual data

For each metric in scope, ask:

> **[Metric name]**
> Target: [target from artefact]
> Baseline: [baseline from artefact]
> Minimum signal: [minimum from artefact]
>
> What is the actual measurement for this review period?
> (If not yet measured: how will you establish it and by when?)
>
> Reply: state the actual figure - or "not yet measured, will capture by [date]"

---

## Step 3 - Assess each metric

For each metric with actual data, apply:

**On track:** actual is within range of target trajectory
**At risk:** actual is below the minimum signal threshold
**Off track:** actual shows no movement or negative movement since baseline
**Target needs revision:** original target no longer reflects reality
  (changed conditions, rescoped initiative, wrong baseline)

Surface issues immediately:

> ⚠️ **[Metric] is [at risk / off track]**
> Actual: [value] | Minimum signal: [value] | Target: [value]
>
> This needs a response. Options:
> 1. Adjust approach - confirm what will change to recover this metric
> 2. Revise target - original target was set under different conditions
>    (document rationale in /decisions before revising)
> 3. Accept the miss - acknowledge the metric won't be hit and record why
>
> Reply: 1, 2, or 3 - and I'll record the response in the artefact

**Baseline discipline:** if a metric that was "unknown, will measure" still has
no baseline after 2+ review cycles:

> ⚠️ **[Metric] still has no baseline after [n] review cycles.**
> Without a baseline, this metric cannot be assessed.
> Who is responsible for establishing it, and when?
>
> Reply: name + date, or "removing this metric - not measurable"

---

## Step 4 - Target revision check

If any targets are proposed for revision:

> **Revising a target needs a rationale strong enough to survive scrutiny.**
> Answer these three questions:
>
> 1. What changed since the original target was set?
> 2. Is this a genuine change in conditions, or are we lowering the bar?
> 3. Who needs to approve this revision?
>
> Reply: answer all three

Log the revision decision via `/decisions` (ARCH or ASSUMPTION category) before
writing it to the artefact.

---

## Output

Conforms to `.github/templates/metric-review.md`.
Save to `artefacts/[feature]/benefit-metric-review-[YYYY-MM].md`.

---

## Completion output

> ✅ **Metric review complete - [period]**
>
> On track: [n]
> At risk: [n] - responses recorded
> Off track: [n] - responses recorded
> Targets revised: [n] (rationale logged in /decisions)
>
> [If programme track:]
> Update the programme artefact phase gate table to mark this review as complete.
>
> [If any metric at risk or off track:]
> Consider surfacing this at the next phase gate before proceeding.

---

## State update - mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

Update `.github/pipeline-state.json` in the **project repository** when the metric review is saved:

- For the feature: set `benefitMetricStatus` to reflect the review outcome:
  - All metrics on track → `"active"`
  - One or more at risk -> `"at-risk"`, set feature `health: "amber"` if not already worse, note in `blocker: "Metric at risk - [metric name]"`
  - One or more off track -> `"off-track"`, set feature `health: "red"`, `blocker: "Metric off track - [metric name] - [response]"`
  - Targets revised this cycle → `"revised"` (append, do not replace existing status)
- Set feature `updatedAt: [now]`
- If programme track: also update the programme entry `health` if the metric status warrants it
