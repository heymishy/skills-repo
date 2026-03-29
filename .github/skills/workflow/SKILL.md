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

When a new request comes in, assess the complexity BEFORE presenting pipeline options:

**Complexity pre-assessment:**

> **Quick scope check before I route this:**
>
> 1. How many engineers will work on this? (1 / small team / multiple teams)
> 2. Is the problem clearly understood, or are there genuine unknowns?
> 3. Is this one coherent feature, or multiple features across multiple epics?
>
> Reply: answer briefly — or skip and I'll route based on what I can infer

**Routing outcomes from complexity assessment:**

| Signal | Route |
|--------|-------|
| 1 engineer, clear problem, single small story | **Micro-track:** /test-plan → /definition-of-ready → coding agent |
| Clear problem, standard scope, 1-3 stories | **Standard pipeline:** full step sequence |
| Multiple unknowns, large scope, or 4+ stories | **Complex track:** /spike for unknowns first, then /programme if multi-team |

**Pipeline health note:** When routing a feature, note any steps that are optional for this work type and make the skip explicit. Don't run a step out of habit — each step should have a clear reason to run for this specific feature.

**Micro-track:**
> Routing you to micro-track — single story, no discovery needed.
> Path: describe the change → /test-plan → /definition-of-ready → coding agent
> Reply: yes — or wait, I need to do proper discovery first

**Complex track signals:**
> This looks complex. Before routing, confirm:
> - Are there genuine unknowns that need /spike before any stories are written?
> - Is this multi-team work that needs /programme?
> Reply: spike first / programme / no, standard pipeline is fine

---

**Standard route selector:** ask when complexity assessment doesn't determine a clear path.

> **What type of work is this?**
>
> 1. New feature or user-facing scope — standard pipeline
> 2. Bug fix with a clear reproduction case — short track
> 3. Small bounded change, refactor, or dependency update — short track
> 4. We don't know enough to proceed on something — spike
> 5. Large initiative, programme, or migration (multi-team / multi-phase) — programme track
> 6. Organisation-level application/interface registry query or update — EA registry
> 7. Pipeline operating model, optimization, mapping, or scale design
>
> Reply: 1, 2, 3, 4, 5, 6, or 7

**If 1 — Standard pipeline:** route to /discovery unless a later stage is already active.

**If 2 or 3 — Short track:**

Before confirming short-track, verify it actually qualifies:

> **Confirm this is genuinely short-track. If in doubt, use standard routing.**
> - Is the change bounded to a single component or 1–2 files?
> - Are all ACs well understood right now — no unknowns?
> - Is there no risk of unintended downstream impact?
>
> Reply: yes — or wait, route me to standard pipeline

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

**If 5 — Programme track:**
> Before confirming the programme track, let's check the overhead is justified.
> Answer these quickly:
>
> - **How many teams** are doing the delivery work?
> - Are there **hard dependencies** between teams (one team blocked on another's output)?
> - Are there **formal phase gates** (stakeholder sign-off, regulatory approval)?
> - Does this involve **consumer migration** (replacing a shared library/service with downstream adopters)?
>
> If the answer to all of these is "one team / no / no / no" — the standard pipeline
> with multiple epics is simpler and sufficient. Reply: standard pipeline
>
> If any signal applies — programme track is confirmed. /programme will ask these
> questions in detail during setup and record the qualifying signals.
>
> Check for an existing programme artefact at
> `artefacts/[programme-slug]/programme.md`.
>
> - Found: run /programme → health view
> - Not found: run /programme → setup (Step 0 qualification → workstream registration)
>
> Each workstream then runs the **full standard pipeline independently** — including
> the inner coding loop per story. /programme sits above them for cross-workstream
> health, dependency tracking, and phase gates. Use /metric-review at each phase gate.
>
> Ready to run /programme? Reply: yes

**If 6 — EA registry route:**
> **EA registry route confirmed.**
> Path: /ea-registry
>
> Use this when you need organisation-level architecture context:
> - application portfolio inventory
> - interface inventory and dependency graph
> - blast radius for replacing a system
> - registry contribution or audit
>
> Ready to run /ea-registry? Reply: yes

**If 7 — Pipeline evolution route:**
> **Pipeline evolution route confirmed.**
>
> Choose the focus:
> 1. Two-loop model + swappable inner loop — `/loop-design`
> 2. Token/model usage optimization — `/token-optimization`
> 3. Org language + governance mapping — `/org-mapping`
> 4. Multi-team scale operating model for the whole skills system — `/scale-pipeline`
>
> Reply: 1, 2, 3, or 4

Notes:
- `/loop-design`, `/token-optimization`, and `/scale-pipeline` are meta-level design skills for evolving the skill library
- `/token-optimization` and `/org-mapping` also act as policy overlays consumed
  by core skills (`/implementation-plan`, `/subagent-execution`, `/review`,
  `/definition-of-ready`, `/verify-completion`, `/release`)

---

## Standard pipeline reference

```
Step  Skill                  Entry condition                   Exit condition
────────────────────────────────────────────────────────────────────────────
1     /discovery             Raw idea or problem exists        Artefact approved
1a    /clarify               Discovery draft exists            Discovery sharpened + approved
2     /benefit-metric        Discovery approved                Metrics defined + active
3     /definition            Benefit-metric active             Epics + stories written
4     /review                Stories exist                     No HIGH findings remain
4a    /spike                 Genuine unknown blocking          Outcome: PROCEED/REDESIGN/DEFER
5     /test-plan             Review passed (per story)         Tests written, failing
6     /definition-of-ready   Tests exist, review passed        Sign-off complete
7     Inner coding loop      DoR sign-off                      Draft PR opened
  7a  /branch-setup          DoR Proceed: Yes                  Isolated worktree + clean baseline
  7b  /implementation-plan   Worktree ready                    Task plan saved
  7c  /subagent-execution    Plan exists (or /tdd per task)    All tasks complete
  7d  /verify-completion     Tasks done                        All ACs verified, 0 failures
  7e  /branch-complete       Verified                          Draft PR opened
8     /definition-of-done    PR merged                         AC coverage confirmed
9     /trace                 On-demand or CI trigger           Chain health reported
```

**Note:** `/clarify` is optional but recommended when a discovery artefact is vague,
scope is unclear, or the team disagrees on MVP boundary. Safe to run multiple times.
Runs within Step 1 — does not advance the pipeline stage on its own.

**Support skills available throughout the inner loop:**
`/tdd` — RED-GREEN-REFACTOR enforcement per task
`/systematic-debugging` — 4-phase root cause process when a task is stuck
`/implementation-review` — spec + quality review between task batches

**Cross-cutting architecture support:**
`/ea-registry` — organisation-level application/interface registry queries,
contributions, audits, and dependency context feeds

**Programme track** (runs above the standard pipeline per workstream):

```
Step  Skill                  When to use
────────────────────────────────────────────────────────────────────────────
P0    /programme             Set up programme structure, workstreams, dependencies
P1    /programme             Session start for cross-workstream or phase gate work
P2    /metric-review         At each phase gate, quarterly, or when targets are questioned
      [standard pipeline]    Per workstream — runs independently after /programme setup
```

**Migration story variant** (within any workstream definition step):
When a workstream contains data migration, cutover, or consumer migration stories,
/definition will offer `migration-story.md` as the template for those specific
stories. Standard user-facing stories in the same workstream continue to use
`story.md`.

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

Check `artefacts/[feature]/spikes/` for briefs without outcome files.

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
- Does not resolve blockers — identifies them precisely so a human or skill can

---

## State file reconciliation

`/workflow` is the designated reconciler of `.github/pipeline-state.json`.
Run this process on every invocation — it is fast and non-destructive.

> **Repository scope:** All state file reads and writes target `.github/pipeline-state.json`
> in the **current project repository** (the repo the user is working in), never
> the skills repo. When a skill says "update `.github/pipeline-state.json`", it
> means the project repo's copy.

### When to reconcile

- Session start (always)
- When a human says "reconcile", "sync state", or "update the state file"
- Before displaying the status table
- After any human confirms they have made changes to artefacts outside a skill session

### Reconciliation process

For each feature in `pipeline-state.json`:

1. **Check for new artefacts not yet reflected in state:**
   - If `discovery.md` exists but feature `stage` is earlier → advance to `discovery`
   - If `benefit-metric.md` exists → advance to `benefit-metric`
   - If story files exist in `stories/` → ensure all are present in `epics[].stories[]`
   - If `review/` artefacts exist → check `reviewStatus` and `highFindings` — update if artefact shows different state
   - If `test-plans/` artefact exists → set `testPlan.status: "written"` if not already
   - If any story in this feature is at `test-plan` stage or beyond AND `coverageMapPath`
     is not set on the feature → add to next action: "🗺️ `/coverage-map` not yet run —
     run it for coverage visibility across all stories in this feature"
   - If `dor/` artefact exists → set `dorStatus: "signed-off"` if it contains "Proceed: Yes"
   - If PR is merged (check `dod/` artefact exists) → set `prStatus: "merged"`, `dodStatus: "complete"`

2. **Check for stalled features:**
   - If `updatedAt` is more than 3 days ago and stage has not advanced → set `health: "amber"`, note "Stalled [n] days"
   - If `updatedAt` is more than 7 days ago → set `health: "red"`, note "Stalled [n] days — needs attention"

3. **Scan for features not yet in state (active scan — do not skip):**
   - List ALL subdirectories of `artefacts/` in the project repository — each is a potential feature slug
   - Skip `.gitkeep` and any non-directory entries
   - For each subdirectory slug, check if a matching `slug` entry exists in `features[]`
   - If NO entry exists:
     - Check which artefacts are present (`discovery.md`, `benefit-metric.md`, `stories/`, `test-plans/`, `dor/`, `plans/`, `dod/`)
     - Infer the most advanced stage from the deepest artefact present
     - Extract the feature name from the `# [Title]` line of `discovery.md` if available, otherwise use the slug
     - Add a new `features[]` entry: `{ "slug": "[slug]", "name": "[name]", "stage": "[inferred]", "health": "green", "updatedAt": "[now]", "epics": [] }`
     - Note in reconciliation output: "[slug] — new feature detected, added at stage [stage]"

4. **Do not overwrite human-set fields without evidence:**
   - Do not change `health: "red"` to `"green"` unless the artefact evidence supports it
   - Do not remove `blocker` text unless the blocking condition is resolved in artefacts

5. **After reconciliation:**
   - Update `updated` timestamp to now
   - Save the file
   - Note in the status table output: "State reconciled — [n] updates made" or "State up to date"

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

`/workflow` does not advance pipeline stages itself — it reads artefacts and reconciles `.github/pipeline-state.json` in the **project repository**. See the State file reconciliation section above for the full reconciliation logic.

After each reconciliation run, update the top-level `updated` timestamp to now.

---

## Tone

Every output ends with a clear action and a Reply prompt.
Never leave the human guessing what to type next.
