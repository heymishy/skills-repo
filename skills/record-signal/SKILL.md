---
name: record-signal
description: >
  Records a benefit metric signal outside of a /definition-of-done run.
  Use when you have measurement evidence for a metric — e.g. after running
  a real session, reviewing usage data, or receiving user feedback —
  and want to update the pipeline without running a full DoD.
  Asks which feature, which metric, what you observed, then writes signal,
  evidence, and lastMeasured to pipeline-state.json.
  Use when someone says "record a signal", "update a metric", "we got data",
  "the metric moved", "log a measurement", or "mark metric as on track".
triggers:
  - "record a signal"
  - "update a metric"
  - "we got data"
  - "the metric moved"
  - "log a measurement"
  - "mark metric as on track"
  - "mark metric as at risk"
  - "mark metric as off track"
---

# Record Signal Skill

## Purpose

Lightweight signal capture. Writes to `metrics[]` in `pipeline-state.json`
without requiring a full `/definition-of-done` run.

This is the right skill when:
- A real session has been run and the facilitator has observations
- Usage data is available after a feature shipped
- A metric that was `not-yet-measured` now has its first reading
- A previous signal needs to be updated (e.g. moved from at-risk to on-track)

---

## Step 1 — Identify the feature

Read `.github/pipeline-state.json`. List features that have a `metrics` array:

> Which feature has the metric you want to update?
> [numbered list of features with metrics]

If only one feature has metrics, skip this question and proceed.

---

## Step 2 — Identify the metric

List all metrics for the selected feature:

> Which metric are you recording a signal for?
> [numbered list: id — name — current signal]

---

## Step 3 — Collect the observation

Ask one question at a time:

1. > What did you observe? (Describe the result, number, or outcome.)

2. > When was this measured? (Date — defaults to today if blank.)

---

## Step 4 — Determine signal status

Based on the metric's `target` and the observation, propose a signal:

> Based on "[observation]" vs target "[target]":
> Proposed signal: **[on-track / at-risk / off-track]**
>
> - `on-track` — result is within acceptable range of the target
> - `at-risk` — partial progress but below the minimum validation signal
> - `off-track` — clearly not trending toward the target
>
> Does that look right? Or choose: on-track / at-risk / off-track / not-yet-measured

Wait for confirmation before writing.

---

## Step 5 — Write

Update `.github/pipeline-state.json` in the **project repository**:
- Find the feature by slug
- Find the metric by `id`
- Set `signal`, `evidence` (the observation text), `lastMeasured` (ISO 8601 date)

Confirm the write verbally:

> Signal recorded for **[metric name]** on feature **[feature name]**:
> - Signal: [on-track / at-risk / off-track / not-yet-measured]
> - Evidence: [observation]
> - Last measured: [date]
>
> Reload the pipeline visualiser to see the Outcomes view updated.

---

## What this skill does NOT do

- Does not re-baseline targets — use `/metric-review` for that
- Does not measure anything — it records what a human observed
- Does not create stories or tasks in response to signal findings
  (if the signal reveals a product problem, that is a new discovery — use `/discovery`)

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

Update `.github/pipeline-state.json` in the **project repository**:

- `features[slug].metrics[id].signal` ← `"on-track"` / `"at-risk"` / `"off-track"` / `"not-yet-measured"`
- `features[slug].metrics[id].evidence` ← observation text string
- `features[slug].metrics[id].lastMeasured` ← ISO 8601 date string
- `updatedAt` on the feature ← now
