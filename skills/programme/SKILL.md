---
name: programme
description: >
  Programme-level navigator for large, multi-team, or multi-year initiatives.
  Wraps multiple feature workstreams under a single programme artefact. Tracks
  cross-workstream dependencies, phase gates, consumer registries (for library
  rewrites), and programme health. Use when setting up a large initiative, asking
  for "programme health", "phase gate review", "cross-team dependencies", or
  "where are we across all workstreams". Each workstream runs the standard
  pipeline independently; this skill manages what sits above them.
triggers:
  - "set up the programme"
  - "programme health"
  - "phase gate"
  - "cross-team dependencies"
  - "multi-workstream status"
  - "programme status"
  - "large initiative"
  - "where are we across all workstreams"
  - "programme track"
---

# Programme Skill

## Entry condition

None. Can run at any point.

On invocation:

1. If a programme artefact **already exists** at `artefacts/[programme-slug]/programme.md` → go directly to [Programme health view](#programme-health-view)
2. If arriving from `/workflow` route 5 and qualification has already been confirmed → go directly to [Programme setup](#programme-setup)
3. Otherwise → run [Step 0 — Qualification](#step-0--qualification) first

---

## Step 0 — Qualification

Before setting up a programme, confirm the overhead is justified. Ask the following questions **one at a time**. Stop and redirect to the standard pipeline if the answers don't clear the threshold.

> **Q1 — Teams**
> How many separate teams will be doing the delivery work?
> (A team = a group with its own delivery cadence, backlog, and ownership boundary)
>
> Reply: number of teams

If the answer is **1 team**:
> The standard pipeline with multiple epics handles single-team work well.
> Programme overhead (workstream coordination, dependency mapping, phase gates) is
> unlikely to add value here.
>
> **Recommend:** use the standard pipeline. Run /discovery to begin.
> If you still want programme structure for governance reasons, reply: proceed anyway

If the answer is **2 or more teams**, continue.

> **Q2 — Cross-team dependencies**
> Are there hard dependencies between teams — where one team cannot start or
> complete a stage until another team has delivered a specific artefact, API
> contract, or piece of infrastructure?
>
> Reply: yes / no / not yet known

> **Q3 — Phase gates**
> Are there formal checkpoints where the programme is assessed by stakeholders,
> a risk forum, or a regulatory body before proceeding?
> (e.g. pilot sign-off, limited rollout approval, regulatory submission)
>
> Reply: yes / no

> **Q4 — Consumer migration**
> Does this work involve replacing a shared service or library that other teams
> depend on, requiring them to migrate to the new version?
>
> Reply: yes / no

**Scoring — programme track is justified if any of the following are true:**

| Signal | Threshold |
|--------|----------|
| Multiple teams | 2 or more |
| Cross-team hard dependencies | At least 1 identified or anticipated |
| Formal phase gates | Required by stakeholder, governance, or regulatory process |
| Consumer migration | Any downstream consumers who must absorb breaking changes |
| Timeline | Multi-phase delivery spanning more than one quarter |

If **none** of these apply:
> This looks like a single-team feature with multiple epics — the standard pipeline
> is the right fit. Programme overhead would add coordination cost with no benefit.
>
> **Recommend:** use the standard pipeline. `/definition` handles multiple epics natively.
> Reply: standard pipeline — or: proceed with programme anyway

If **one or more** apply:
> ✅ Programme track confirmed. The coordination overhead is justified by [signal(s)].
> Proceeding to programme setup.

Record the qualifying signals in the programme artefact.

---

## Programme setup

---

## Programme setup

### Step 1 — Basic identity

> **What is the name of this programme?**
> (This becomes the programme slug and is used across all artefacts.)
>
> Reply: programme name

Then:

> **What type of initiative is this?**
>
> 1. **Legacy migration** — moving from one system/platform to another
>    (e.g. cards issuing platform migration, mainframe decommission)
> 2. **Service or library rewrite** — replacing an existing service with a
>    modern framework while keeping the same contract or evolving it
>    (e.g. payments library, shared auth service)
> 3. **New platform build** — net-new capability at programme scale
>    (e.g. new digital channel, new product line)
> 4. **Regulatory or compliance programme** — driven by a regulatory deadline
>    or audit requirement
> 5. **Mixed** — describe it
>
> Reply: 1, 2, 3, 4, or 5

Record type. Type affects which optional extensions are activated:
- Types 1 and 2: surface migration story templates and consumer registry
- Types 1 and 4: surface compliance bundle option in /release
- All types: enable /metric-review at phase gates

---

### Step 2 — Timeline and phases

> **What is the overall timeline?**
> (Approximate start date, target end date, and natural phase breaks if known)
>
> Reply: describe the timeline

Then:

> **What are the phase gates?**
> A phase gate is a formal checkpoint where the programme is assessed before
> proceeding — typically: Pilot, Limited rollout, Full rollout, Cutover,
> Decommission (for migrations).
>
> Name your phases and their target dates. These become the points at which
> /metric-review is triggered.
>
> Reply: list phases with target dates — or type "not yet defined"

---

### Step 3 — Workstream registration

> **What are the workstreams in this programme?**
> Each workstream is an independently shippable body of work run by one team
> following the standard pipeline. It gets its own feature slug.
>
> Example:
> - `cards-account-api` — Account management API (Team Alpha)
> - `cards-auth-service` — Authentication and session (Team Beta)
> - `cards-statements` — Statement generation (Team Gamma)
>
> Reply: list workstreams with team names

For each workstream, confirm the feature slug and create a placeholder artefact
path at `artefacts/[workstream-slug]/` if it doesn't exist.

Record each workstream in the programme artefact with:
- Slug
- Team
- Status (Not started / In progress / Complete)
- Current pipeline stage
- Target completion phase

---

### Step 4 — Cross-workstream dependencies

> **Are there dependencies between workstreams?**
> A dependency exists when Workstream B cannot start (or complete) until
> Workstream A delivers something specific.
>
> Example: `cards-statements` cannot proceed past /definition until
> `cards-account-api` has a signed-off API contract.
>
> Reply: list dependencies — or type "none identified yet"

For each dependency, record:
- **Upstream:** workstream + what it must produce
- **Downstream:** workstream + what it is blocked on
- **Gate:** the pipeline stage or artefact that unblocks the downstream

This dependency map is checked during programme health view.

---

### Step 5 — Consumer registry (types 2 — service/library rewrite only)

If programme type is a service or library rewrite:

> **Who are the downstream consumers of the service or library being replaced?**
> I'll create a consumer registry to track migration status across each consumer.
>
> For each consumer, I need: team name, system name, and whether they have
> breaking changes to absorb.
>
> Reply: list consumers — or type "unknown, will identify during discovery"

Create `artefacts/[programme-slug]/consumer-registry.md` from
`.github/templates/consumer-registry.md`.

---

### Step 6 — Programme artefact

Conforms to `.github/templates/programme.md`.
Save to `artefacts/[programme-slug]/programme.md`.

Output completion:

> ✅ **Programme artefact created**
>
> [n] workstreams registered
> [n] dependencies mapped
> Next step: run /discovery for each workstream independently
>
> Suggested order (based on dependencies):
> 1. [workstream] — no upstream dependencies, start here
> 2. [workstream] — depends on [workstream] Stage [n]
>
> Run /workflow to navigate individual workstreams.
> Run /programme at any time for cross-workstream health.

---

## Programme health view

Run this when the programme artefact already exists, or when asked for a status
update. Update the Health snapshot section of `templates/programme.md` with
current workstream stages and dependency status, then present the table
conversationally.

Then ask:

> **Which workstream do you want to focus on?**
> Reply: workstream name — or "phase gate review" — or "dependency unblock [workstream]"

---

## Phase gate review

Triggered when a phase target date is approaching or explicitly requested.

Steps:
1. List all workstreams and their completion status for this phase
2. Check /metric-review has been run since the last phase gate
3. List any open HIGH findings, unresolved spikes, or unrecorded sign-offs

Output:

> **Phase gate: [phase name] — [date]**
>
> Ready: [n] workstreams meeting exit criteria
> At risk: [n] workstreams — [brief blockers]
> Blocked: [n] workstreams — [specific issues]
>
> Metric review: ✅ Run [date] / ⚠️ Not run since last gate — run /metric-review
>
> **Recommendation: [PROCEED / HOLD — reason]**
>
> Proceed means all complete workstreams move to [next phase].
> At-risk workstreams need a decision: parallel-proceed or hold.
>
> Reply: proceed — or hold [workstream] — or review [workstream]

---

## What this skill does NOT do

- Does not run individual workstream pipeline steps — use the standard skills for those
- Does not make proceed/hold decisions — surfaces the data, humans decide
- Does not replace /workflow for individual workstreams — use /workflow per workstream

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

Update `.github/pipeline-state.json` in the **project repository** when programme state changes:

- When a programme is created: add an entry to `programmes[]` with `slug`, `name`, `phase`, `health: "green"`, `workstreams: [array of feature slugs]`, `updatedAt: [now]`
- When workstreams are added or removed: update the `workstreams` array to reflect the current set of feature slugs belonging to this programme
- When a phase gate review runs: update `phase` to the current phase name, update `health` based on workstream readiness:
  - All workstreams meeting exit criteria → `health: "green"`
  - One or more at risk → `health: "amber"`, `blocker: "[workstream] at risk — [reason]"`
  - One or more blocked → `health: "red"`, `blocker: "[workstream] blocked — [reason]"`
- **On PROCEED:** advance `phase` to the next phase name, set `health: "green"`, clear `blocker`, `updatedAt: [now]`
- **On HOLD:** set `health: "amber"` or `"red"` depending on severity, record reason in `blocker`, `updatedAt: [now]`
- Each workstream is a separate feature entry in `features[]` — update those entries using the standard skill state updates as work progresses
- Set `programme: "[programme-slug]"` on each workstream feature entry so the governance view can resolve programme membership in both directions
