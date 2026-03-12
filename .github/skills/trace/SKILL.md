---
name: trace
description: >
  Validates the full chain of traceability across all pipeline artefacts for a feature.
  Surfaces broken links, orphaned artefacts, scope deviations, and metric gaps.
  Use on-demand ("trace this feature", "chain check", "traceability report") or 
  automatically in CI on PR open. Does not fix issues — reports them for human action.
triggers:
  - "trace this feature"
  - "chain check"
  - "traceability report"
  - "are all stories linked"
  - "pipeline health"
  - on PR open (CI trigger)
---

# Trace Skill

## Entry condition check

No hard prerequisites — this skill can run at any pipeline stage to report 
what is and isn't linked. Running it on an incomplete pipeline will surface gaps,
which is valid and useful.

---

## Purpose

The trace skill answers: "Can we follow a continuous chain from every line of shipped 
code back to a user problem and a measurable outcome?" 

If the answer is yes for every story, the pipeline is healthy.
If any link is broken, it surfaces as a finding.

---

## Chain structure

A healthy chain looks like this for each story:

```
Shipped code (PR) 
  → test results (CI) 
  → ACs (story artefact)
  → story (definition artefact)
  → epic (definition artefact)
  → benefit metrics (benefit-metric artefact)
  → discovery (discovery artefact)
  → original problem statement
```

Every link must be present and navigable. A link is broken if:
- A reference is missing (artefact doesn't exist or link is dead)
- A reference is present but the content doesn't match 
  (e.g. story references a metric that isn't in the benefit-metric artefact)
- An artefact exists but was never linked to anything upstream or downstream

---

## Process

### 1. Artefact inventory

List all artefacts present in `.github/artefacts/[feature]/`:
- discovery.md
- benefit-metric.md
- epics/*.md
- stories/*.md
- test-plans/*.md
- dor/*.md
- dod/*.md

Flag any expected artefact that is missing given the current pipeline stage.

### 2. Chain walk — per story

For each story artefact, walk the chain in both directions:

**Upstream (story → discovery):**
- Story references an epic? ✓/✗
- Story references benefit-metric? ✓/✗
- Story's metric reference exists in benefit-metric artefact? ✓/✗
- Benefit-metric references discovery? ✓/✗
- Discovery exists and is approved? ✓/✗

**Downstream (story → shipped code):**
- Story has a test plan? ✓/✗
- Story has a DoR artefact showing PROCEED? ✓/✗
- Story has a DoD artefact? ✓/✗ (only if PR is merged)
- DoD shows COMPLETE or COMPLETE WITH DEVIATIONS? ✓/✗

### 3. Metric orphan check

For each metric in the benefit-metric artefact:
- At least one story references it? ✓/✗
- At least one story's DoD records metric signal status? ✓/✗

Flag orphaned metrics (defined but no stories move them).

### 4. Scope deviation summary

Collect all scope deviation records from DoD artefacts.
Report as a table — these are the places where shipped code drifted from the plan.

### 5. Coverage gaps

List any ACs from any story that are not covered by the test plan.
List any test plan gaps that were acknowledged but not mitigated.

---

## Output format

```markdown
# Trace Report: [Feature Name]
**Date:** [date]
**Pipeline stage:** [current stage]
**Overall health:** ✅ HEALTHY / ⚠️ WARNINGS / ❌ BROKEN LINKS

## Chain Status by Story

| Story | Upstream chain | Downstream chain | Issues |
|-------|---------------|-----------------|--------|
| [title] | ✅ Complete | ✅ Complete | None |
| [title] | ✅ Complete | ⚠️ DoD missing | DoD not yet run |
| [title] | ❌ Metric ref broken | — | Metric "X" not in benefit-metric artefact |

## Metric Coverage

| Metric | Stories covering it | DoD signal recorded |
|--------|--------------------|--------------------|
| [name] | [n stories] | ✅ / ⚠️ Not yet |

## Scope Deviations (from DoD artefacts)
[None / table of deviations with story and PR reference]

## AC Coverage Gaps
[None / list]

## Findings requiring action
[None / list with severity]
```

---

## CI usage

When triggered automatically on PR open, post a condensed version as a PR comment:

> **🔗 Trace check**  
> Chain: ✅ Healthy / ⚠️ [n] warnings / ❌ [n] broken links  
> [If issues:] See full trace report at `.github/artefacts/[feature]/trace/[date]-trace.md`

---

## What this skill does NOT do

- Does not fix broken links — reports them for human or skill action
- Does not make scope decisions — it records deviations, humans decide what to do
- Does not update any other artefact — it is read-only
- Does not replace code review — it validates the artefact chain, not the code quality
