---
name: workflow
description: >
  Pipeline navigator. Checks the state of all artefacts for the current feature and 
  tells you exactly which skill to run next, with what input, and what it will ask of you.
  Use when starting a session, saying "what's next", "where are we", "start a new feature",
  or "continue working on [feature]". Also use at the start of every session as a status check.
  Routes to short-track for simple tasks (bugs, small fixes, bounded refactors).
triggers:
  - "what's next"
  - "where are we in the pipeline"
  - "start a new feature"
  - "session start"
  - "continue working on"
  - "what should I work on"
  - "pipeline status"
---

# Workflow Skill — Pipeline Navigator

## Entry condition

None. This skill has no prerequisites — it is always safe to run.

---

## What this skill does

Reads the current state of artefacts and pipeline labels for a feature (or all active features),
then tells you exactly what to do next. It does not run other skills — it tells you which one to
run and with what input.

---

## Session start behaviour

When invoked at the start of a session without a specific feature in mind, output a pipeline
status table for all active features, then ask which to work on:

```
## Pipeline Status

| Feature | Current stage | Next action | Blockers |
|---------|--------------|-------------|---------|
| [title] | [stage] | /[next-skill] | [any] |
| [title] | [stage] | /[next-skill] | [none] |

Which feature do you want to work on?
```

---

## Route selection

Before routing to the standard pipeline, assess the incoming request:

### Short-track assessment

If the work is any of the following, route to the **short-track**:
- A bug fix with a clear reproduction case
- A small bounded change (single component, single behaviour)
- A refactor with no scope expansion
- A dependency update with no behaviour change
- A copy or content change

**Short-track pipeline:**
```
/test-plan (write tests for the bug/fix) 
  → /definition-of-ready (abbreviated — ACs are the bug reproduction + fix criteria)
  → coding agent
```

Output when routing to short-track:
> **Short-track route:** This looks like a [bug fix / small fix / refactor]. 
> Running the full discovery → definition pipeline would be overhead.
> Recommended path: /test-plan → /definition-of-ready → coding agent.
> Confirm this routing, or say "full pipeline" to use the standard flow.

### Standard pipeline

For new features, epics, or anything with user-facing scope:

```
Step  Skill                 Entry condition                        Exit condition
──────────────────────────────────────────────────────────────────────────────
1     /discovery            Raw idea or problem exists             Issue approved
2     /benefit-metric       Discovery approved                     Metrics defined + active
3     /definition           Benefit-metric active                  Epics + stories written
4     /review               Stories exist                          No HIGH findings remain
5     /test-plan            Review passed (per story)              Tests written (failing)
6     /definition-of-ready  Tests exist, review passed             Sign-off complete
7     [coding agent]        DoR sign-off                           PR opened
8     /definition-of-done   PR merged                              AC coverage confirmed
9     /trace                On-demand or CI trigger                Chain health reported
```

---

## For each feature, output:

1. **Current stage** — which step the feature is at, based on artefacts present
2. **Next action** — exact skill to run, with the input it needs
3. **What that skill will ask** — so you can prepare before running it
4. **Any blockers** — prerequisites that are missing or incomplete

### Example output format:

> **Feature: [title]**
> **Current stage:** Definition complete — 4 stories written, review not yet run
> **Next action:** Run `/review` 
> **Input needed:** The story artefacts at `.github/artefacts/[feature]/stories/`
> **What review will ask:** To confirm which review categories apply (A/B/C/D)
> **Blockers:** None

---

## What this skill does NOT do

- Does not run other skills — it routes, you invoke
- Does not make scope or priority decisions
- Does not skip pipeline steps — if an entry condition is not met, it says so clearly
- Does not auto-approve artefacts
- Does not update artefact files — that is for the human or the invoked skill

## Tone

Clear and directive. You should finish reading the output knowing exactly what to do next,
with what input, and what the skill will ask. No ambiguity, no options menus unless a genuine
routing choice exists (standard vs short-track).
