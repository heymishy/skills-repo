---
name: trace
description: >
  Validates the full traceability chain across all pipeline artefacts for a feature.
  Surfaces broken links, orphaned artefacts, scope deviations, and metric gaps.
  Use on-demand ("trace this feature", "chain check", "traceability report") or
  automatically on PR open as a CI trigger. Read-only — reports findings for humans
  to action, does not fix anything.
triggers:
  - "trace this feature"
  - "chain check"
  - "traceability report"
  - "are all stories linked"
  - "pipeline health"
  - on PR open (CI trigger)
---

# Trace Skill

## Entry condition

None. Can run at any pipeline stage — running on an incomplete pipeline surfaces
gaps, which is valid and useful.

---

## Step 1 — Confirm scope

State what was found:

> **Feature artefacts found:**
> - discovery.md: ✅ / ❌ missing
> - benefit-metric.md: ✅ / ❌ missing
> - epics: [n]
> - stories: [n]
> - test plans: [n of n stories]
> - DoR artefacts: [n of n stories]
> - DoD artefacts: [n of n merged stories]
> - Open spikes: [n]
>
> Trace the full feature, or a specific story?
> Reply: full feature — or name the story

---

## Chain structure

A healthy chain for each story:

```
Shipped code (PR)
  → test results (CI)
  → ACs (story)
  → story (definition artefact)
  → epic (definition artefact)
  → benefit metrics (benefit-metric artefact)
  → discovery artefact
  → original problem statement
```

A link is broken if:
- A reference is missing or points to a non-existent artefact
- A reference exists but the content doesn't match (e.g. metric referenced in story
  doesn't exist in benefit-metric artefact)
- An artefact exists but is not linked to anything upstream or downstream

---

## Chain walk — per story

For each story, walk upstream and downstream:

**Upstream (story → discovery):**
- Story references parent epic? ✓/✗
- Story references benefit-metric? ✓/✗
- Story's metric reference exists in benefit-metric artefact? ✓/✗
- Benefit-metric references discovery? ✓/✗
- Discovery exists and is approved? ✓/✗

**Downstream (story → shipped code):**
- Story has a test plan? ✓/✗
- Story has a DoR artefact showing PROCEED? ✓/✗
- Story has a DoD artefact? ✓/✗ (if PR is merged)
- DoD shows COMPLETE or COMPLETE WITH DEVIATIONS? ✓/✗

---

## Additional checks

**Metric orphan check:**
For each metric in the benefit-metric artefact:
- At least one story references it? ✓/✗
- At least one DoD records metric signal status? ✓/✗

**Scope deviation summary:**
Collect all scope deviations from DoD artefacts. These are where shipped code
drifted from the plan.

**AC coverage gaps:**
List any ACs not covered by the test plan. List test plan gaps acknowledged
but not mitigated.

**Open spikes:**
List any spikes with no outcome artefact — these represent known unknowns
still unresolved.

**Architecture compliance check:**
If `.github/architecture-guardrails.md` exists:
- Each story's Architecture Constraints field references applicable ADRs or
  states "None identified — checked"? ✓/✗
- No DoD artefact records a scope deviation that crosses a named guardrail
  or mandatory constraint? ✓/✗
- All repo-level ADRs referenced in story Architecture Constraints fields are
  still listed as Active (not Superseded or Deprecated)? ✓/✗

Flag any violation as a finding. Superseded ADR references should trigger a
story update before the next story in the same feature proceeds.

If `.github/architecture-guardrails.md` does not exist:
> ⚠️ No `architecture-guardrails.md` found — architecture compliance check skipped.

---

## Output format

Conforms to `.github/templates/trace-report.md`.
Save to `.github/artefacts/[feature]/trace/[date]-trace.md`.

---

## CI usage

When triggered on PR open, post a condensed comment:

> **Trace check**
> Chain: ✅ Healthy / ⚠️ [n] warnings / ❌ [n] broken links
> [If issues:] Full report: `.github/artefacts/[feature]/trace/[date]-trace.md`

---

## Completion output

**If healthy:**

> ✅ **Trace: HEALTHY**
> [n] stories — full chain intact, no orphaned metrics, no unresolved deviations.
>
> Ready to proceed — or want the full report saved?
> Reply: save report — or done

**If issues found:**

> ⚠️ / ❌ **Trace: [n] issue(s) found**
>
> Most critical: [finding description]
>
> Want me to walk through each finding with the specific fix?
> Reply: yes — or I'll fix them myself

---

## What this skill does NOT do

- Does not fix broken links — reports for human or skill action
- Does not make scope decisions — records deviations, humans decide
- Does not update any artefact — read-only
- Does not replace code review

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

/trace is read-only and does not update artefacts, but it does update `.github/pipeline-state.json` in the **project repository** to surface findings:

- For any story where a broken chain link is found: set `health: "amber"` (missing artefact) or `"red"` (broken traceability)
- Set `stage: "trace"` for stories that have completed the full chain
- Set `updatedAt: [now]` on the feature record

This allows the visualiser to surface traceability gaps as amber/red health.
