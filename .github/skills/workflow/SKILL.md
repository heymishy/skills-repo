---
name: workflow
description: >
  Pipeline navigator and diagnostic. Checks the state of all artefacts for the
  current feature, tells you exactly which skill to run next, and diagnoses why
  a feature is stuck when nothing has moved. Detects stalled features, identifies
  the specific blocking item, and tells you who or what can resolve it.
  Use when starting a session, saying "what's next", "where are we", "start a new
  feature", "continue working on [feature]", "why is this stuck", or "pipeline status".
  Routes to short-track for simple tasks. Routes to /spike for genuine unknowns.
  Always safe to run — no prerequisites.
triggers:
  - "what's next"
  - "where are we in the pipeline"
  - "start a new feature"
  - "session start"
  - "continue working on"
  - "what should I work on"
  - "pipeline status"
  - "why is this stuck"
  - "what's blocking"
  - "pipeline health"
---

# Workflow Skill — Pipeline Navigator and Diagnostic

## Entry condition

None. Always safe to run at any point.

---

## Session start behaviour

When invoked without a specific feature, output the status table immediately —
no preamble. Then ask a single focused question.

```
## Pipeline Status — [date]

| Feature | Stage | Status | Next action |
|---------|-------|--------|-------------|
| [title] | [stage] | ✅ Moving | /[skill] |
| [title] | [stage] | ⚠️ Stalled [n days] | See diagnosis below |
| [title] | [stage] | 🔴 Blocked [n days] | See diagnosis below |
```

**Status:**
- ✅ Moving — progressed since last session
- ⚠️ Stalled — no progress for 2+ sessions, no clear cause in artefacts
- 🔴 Blocked — no progress, cause identified

Then ask:

> **Which feature do you want to work on?**
>
> Reply: type the feature name or number

---

## Route selection — ask before routing

When a new request comes in, assess it before routing.
Ask this before presenting any pipeline guidance:

> **What type of work is this?**
>
> 1. New feature or user-facing scope — full pipeline
> 2. Bug fix with a clear reproduction case — short track
> 3. Small bounded change, refactor, or dependency update — short track
> 4. We don't know enough to proceed on something — spike
>
> Reply: 1, 2, 3, or 4

**If 1 — Standard pipeline:** route to /discovery unless a later stage is already active.

**If 2 or 3 — Short track:**
> **Short-track confirmed.**
> Path: /test-plan → /definition-of-ready → coding agent
>
> The ACs for this track are the bug reproduction steps + fix criteria.
> Ready to run /test-plan? Reply: yes, or describe the bug/change first.

**If 4 — Spike route:**
> **Spike route confirmed.**
> Path: /spike → [blocked stage]
>
> /spike will ask you to define the specific question and timebox before any
> investigation starts. Ready to run /spike? Reply: yes

---

## Standard pipeline reference

```
Step  Skill                  Entry condition                   Exit condition
────────────────────────────────────────────────────────────────────────────
1     /discovery             Raw idea or problem exists        Artefact approved
2     /benefit-metric        Discovery approved                Metrics defined + active
3     /definition            Benefit-metric active             Epics + stories written
4     /review                Stories exist                     No HIGH findings remain
4a    /spike                 Genuine unknown blocking          Outcome: PROCEED/REDESIGN/DEFER
5     /test-plan             Review passed (per story)         Tests written, failing
6     /definition-of-ready   Tests exist, review passed        Sign-off complete
7     [coding agent]         DoR sign-off                      PR opened
8     /definition-of-done    PR merged                         AC coverage confirmed
9     /trace                 On-demand or CI trigger           Chain health reported
```

---

## Standard output — per feature

```
## Feature: [title]

Current stage: [step N — skill name]
State: [specific state within that stage — e.g. "3 of 4 stories reviewed, 1 has HIGH findings"]
Status: ✅ Moving / ⚠️ Stalled / 🔴 Blocked

Next action: /[skill]
Input needed: [exactly what to provide]
What it will ask: [first question the skill raises — so you can prepare]
Open spikes: [None / spike title + status]
```

---

## Stall diagnosis

When a feature is ⚠️ Stalled or 🔴 Blocked, run through this checklist in order
and stop at the first match. Output the diagnosis block immediately below the
status output — not buried at the end.

### 1. Open HIGH findings

Check the most recent review report for unresolved HIGH findings.

> 🔴 **BLOCKED — unresolved review finding**
> Finding: [ID] — [description]
> Open since: run [N] ([date])
> Resolves when: [specific edit to story artefact] + /review re-run passes
>
> **Action:** [exact field or AC to fix] → re-run /review
> Reply: ready — and I'll walk through the finding in detail

### 2. Open spike with no outcome

Check `.github/artefacts/[feature]/spikes/` for briefs without outcome files.

> 🔴 **BLOCKED — spike in progress**
> Spike: [title]
> Opened: [date] | Timebox: [n days] | Expires: [date]
> Blocking: [stage]
>
> **Action:** complete the spike investigation and produce the outcome artefact
> Reply: ready — and I'll load the spike brief

If a spike outcome exists with REDESIGN:

> 🔴 **BLOCKED — spike closed REDESIGN, change not yet applied**
> Spike: [title] | Closed: [date]
> Required change: [specific update]
>
> **Action:** update [artefact] → re-run /[skill]
> Reply: ready — and I'll show the redesign direction

If a spike outcome exists with DEFER:

> ⚠️ **DEFERRED — spike closed, human decision required**
> Spike: [title] | Closed: [date]
> Reason: [summary]
>
> **What do you want to do?**
> 1. Proceed with the unknown acknowledged as a named risk (log in /decisions)
> 2. Defer the blocked work to post-MVP
>
> Reply: 1 or 2

### 3. Pending decision

Check the decisions log for entries flagged as requiring human resolution.

> ⚠️ **STALLED — decision required**
> Decision: [description]
> Required from: [role or name]
> Blocking: [stage]
>
> **Action:** resolve, then log in /decisions → return to /[skill]
> Reply: ready to log the decision — and I'll open /decisions

### 4. Missing sign-off

Check DoR artefacts for Medium/High oversight stories without recorded sign-off.

> 🔴 **BLOCKED — sign-off not recorded**
> Story: [title] | Oversight level: [Medium/High]
> DoR outcome: PROCEED — sign-off not yet recorded
>
> **Action:** obtain sign-off from [role], record name + date in DoR artefact
> Reply: done — and I'll update the artefact

### 5. Missing artefact

Check whether expected artefacts exist given the current stage.

> ⚠️ **STALLED — expected artefact missing**
> Missing: [artefact path]
> Required before: /[skill] can run
>
> **Action:** run /[preceding skill] to produce it
> Reply: ready — and I'll run /[skill] now

### 6. No diagnosis found

> ⚠️ **STALLED — no blocker identified in artefacts**
> Last artefact activity: [date]
>
> **What's actually blocking this?**
> 1. Context switch — picking this back up now
> 2. Waiting on someone external
> 3. Work is in progress but no artefact updated yet
> 4. Something else
>
> Reply: 1, 2, 3, or 4 — and I'll help log it or route accordingly

---

## Multi-feature view — priority prompt

When multiple features are active, after the status table:

> **Where do you want to focus?**
> 1. [Feature A] — 🔴 Blocked — unblock this first
> 2. [Feature B] — ✅ Moving — maintain momentum here
> 3. [Feature C] — ⚠️ Stalled — diagnose this
>
> Reply: 1, 2, or 3

---

## What this skill does NOT do

- Does not run other skills — it routes, you invoke
- Does not make scope or priority decisions — surfaces them for human judgment
- Does not skip pipeline steps
- Does not auto-approve artefacts
- Does not update artefact files
- Does not resolve blockers — identifies them precisely so a human or skill can

## Tone

Every output ends with a clear action and a Reply prompt.
Never leave the human guessing what to type next.
