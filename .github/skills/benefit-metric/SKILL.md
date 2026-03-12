---
name: benefit-metric
description: >
  Defines measurable outcomes for an approved discovery artefact. Produces a benefit-metric
  artefact conforming to templates/benefit-metric.md. Use when discovery has been approved 
  and someone says "define the metrics", "what does success look like", "how will we measure this",
  or proceeds past discovery. Requires an approved discovery artefact as input.
  Does not write stories — that is /definition.
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

**Before proceeding**, verify:

1. A discovery artefact exists at `.github/artefacts/[feature]/discovery.md`
2. The discovery artefact status field reads "Approved" (not "Draft")
3. The discovery artefact contains at least: problem statement, MVP scope, and directional 
   success indicators

If any condition is not met, output:

> ❌ **Entry condition not met**  
> The benefit-metric skill requires an approved discovery artefact.  
> [Specific issue: e.g. "Discovery status is still 'Draft' — a human needs to review 
> and approve it before metrics can be defined."]  
> Run `/workflow` to see the current pipeline state.

---

## Purpose

Translate the directional success indicators from discovery into specific, measurable metrics
with baselines, targets, and feedback loops. This artefact is the contract the rest of the 
pipeline is accountable to — stories must trace to these metrics, and definition-of-done 
checks against them.

---

## Template

Produce output conforming to `.github/templates/benefit-metric.md`.
Do not invent a different structure — use the template and populate every field.
If a field cannot be populated, write the reason, not a placeholder.

---

## Process

### 1. Meta-benefit detection

Read the discovery artefact carefully. Ask: is this initiative also testing a hypothesis 
about tooling, process, or team capability — not just delivering user value?

Common signals:
- "We want to learn if agents can do X"
- "This is a pilot to validate the approach"
- "We're also testing [new tool / workflow / team structure]"

If detected, flag it explicitly per the template and define Tier 2 meta metrics separately.
Confirm with the human that the tradeoff is understood — product metrics may not be hit 
if meta-learning is the real goal, and that needs to be explicit before stories are written.

### 2. For each directional indicator from discovery

Work through these questions:
- What specifically are we measuring? (Not a proxy — the actual thing)
- What is the baseline today? (If unknown, how will we establish it and by when?)
- What is the target? (Specific and directional — "under 15 minutes", not "faster")
- What is the minimum validation signal? (If we don't hit this, we stop or pivot)
- How will we measure it, who measures it, and how often?
- What happens if the signal isn't met — who decides, what are the options?

### 3. Baseline discipline

If a baseline is unknown, do not invent one. Instead:
> "Baseline: Not yet established. Will measure current state in the first 2 weeks 
> of deployment before assessing progress toward target."

A well-defined unknown is more useful than a fabricated number.

### 4. Metric quality check

Before finalising each metric, apply this test:
- Could you measure this today, without building anything? (If yes, it might be a baseline, not a metric)
- Could two different people measure this and get the same answer? (If no, it's too subjective)
- Is the target specific enough that there's no debate about whether you hit it? 
  (If no, tighten it)

---

## Output

Save artefact to `.github/artefacts/[feature]/benefit-metric.md` using the template at 
`.github/templates/benefit-metric.md`.

After producing, state:

> "Benefit metric artefact created. The metric coverage matrix will be populated by 
> the /definition skill once stories are written. Before proceeding to /definition, 
> confirm the metrics and targets are agreed with the relevant stakeholders — 
> these are the contract the pipeline is accountable to."

---

## Quality checks before outputting

- Every metric has a baseline (or an explicit plan to establish one)
- Every target is specific and directional — not "faster", "better", "more"
- Every minimum validation signal is lower than the full target (threshold, not success)
- Feedback loop names who measures, when, and what happens if not met
- Meta benefits and product benefits are separated if both are present
- No metric is defined as feature delivery ("metric: export button built") — 
  metrics measure outcomes, not outputs

## What this skill does NOT do

- Does not write stories or epics — that is /definition
- Does not define acceptance criteria — those live on stories
- Does not decide slicing strategy — /definition
- Does not replace a full OKR or KPI framework
- Does not update the discovery artefact
