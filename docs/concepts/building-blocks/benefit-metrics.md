# Benefit Metrics

## What it is

Benefit metrics are the measurable outcomes defined for an approved discovery artefact. They answer the question: how will we know this feature delivered value? Each benefit metric has a baseline (current state), a target (desired state), and a signal (how the movement will be detected).

Benefit metrics are produced by the `/benefit-metric` skill after discovery is approved and before story definition begins. They are living documents: `/metric-review` re-baselines them at phase gates or on demand.

## Why it exists

Without defined metrics, feature delivery has no success criteria beyond "it shipped". Teams cannot distinguish between features that moved outcomes and features that were implemented but had no effect. Over time, this makes it impossible to know whether the platform is delivering business value or just producing code.

Benefit metrics make the value hypothesis explicit before coding starts, when it can still influence scope decisions. If the metric reveals that the proposed feature is addressing the wrong problem, it is better to know that at discovery than after implementation.

## How it works

The `/benefit-metric` skill produces a benefit-metric artefact at `artefacts/[feature-slug]/benefit-metric.md`. The artefact includes:

- The metric name and description
- The current baseline measurement
- The target state
- The signal: how movement will be detected (e.g. a specific counter, a user survey result, a query result)
- The evidence section where actual measurements are recorded as the feature is delivered

At `/definition-of-done`, the DoD artefact records whether the metric signal was triggered — connecting individual story delivery to the higher-level outcome.

The platform distinguishes product metrics (feature outcomes) from meta-metrics (platform performance, e.g. delivery cycle time). Both are tracked; the meta-metrics feed the platform improvement cycle.

## What you do with it

Define benefit metrics before decomposing into stories — run `/benefit-metric` after `/discovery` is approved. Do not proceed to `/definition` without active metrics, because the metrics should influence how you decompose the feature.

At `/definition-of-done`, record the metric signal: did the feature move the metric? If yes, note the evidence. If no, note why — was the metric wrong, or was the implementation incomplete?

At phase gates and quarterly checkpoints, run `/metric-review` to re-baseline metrics that have drifted from their original targets. Metrics that are no longer meaningful should be retired with a reason.

## How it relates to

- [Definition of Done](definition-of-done.md) — the DoD records the metric signal for each delivered story
- [Governance traces](governance-traces.md) — metric signals are recorded in the trace chain
- [Self-improving harness](../principles/self-improving-harness.md) — meta-metrics feed the platform's own improvement cycle
