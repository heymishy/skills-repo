---
name: orient
description: >
  Guided orientation concierge for new or returning consumers, including non-technical
  outer loop participants. Reads the current repo's artefact state and tells the operator
  exactly which skill to run next and why. Distinct from /start (greenfield only,
  single-use bootstrap) and /workflow (pipeline diagnostic for experienced operators).
  Use when unsure where you are in the pipeline or which skill to run next.
triggers:
  - "orient"
  - "/orient"
  - "where am I"
  - "what should I do next"
  - "I don't know where to start"
  - "which skill do I run"
  - "what's my next step"
  - "onboard me"
  - "guide me"
---

# Orient Skill — Pipeline Orientation Concierge

## Purpose

`/orient` reads the current repository's artefact state and routes the operator to the correct next skill. It is the first command any new or returning consumer should run when they are unsure where they are in the pipeline.

**Distinct from `/start`:** `/start` is for greenfield, brand-new repositories only — a single-use bootstrap. Use `/orient` when a repo already has some history or artefacts.

**Distinct from `/workflow`:** `/workflow` is a diagnostic tool for experienced operators who understand the pipeline and want to inspect why something is stuck. Use `/orient` when you just want to be told what to do next.

---

## Entry condition

None. Always safe to run. No prerequisites.

---

## How to read pipeline state

Before routing, silently read:

1. Check whether `artefacts/` directory exists and contains any files.
2. Check whether `.github/pipeline-state.json` exists.
3. If `pipeline-state.json` exists, read it to find the active feature and check:
   - Discovery status (`Approved` or not)
   - Whether a benefit-metric artefact exists under `artefacts/`
   - Whether stories exist under `artefacts/[feature]/stories/`
   - Whether test plans exist for each story
   - The `dorStatus` field on any story (value: `signed-off` = ready for implementation)
4. Check whether a worktree or branch named `feature/[story-slug]` exists (branch detection: run `git branch --list feature/*` or check `.worktrees/` directory).

Produce a single structured output: **Current state → Next skill → One-sentence rationale → Exact command**.

---

## Routing rules

Work through these states **in order**. Stop at the first match.

---

### State 1 — New repository (AC1)

**Condition:** `artefacts/` does not exist or is empty, AND `pipeline-state.json` does not exist.

**Output:**
> **Current state:** No artefacts found — this is a new repository (or a clean slate).
>
> **Next skill:** `/discovery`
>
> **Why:** `/discovery` structures your idea or problem into the first discovery artefact, which is the entry point for the entire governed delivery pipeline.
>
> **Run:** `/discovery`

---

### State 2 — Incomplete discovery exists (AC2a)

**Condition:** A `discovery.md` file exists under `artefacts/` but contains `[FILL IN]` markers or is missing required sections (Problem Statement, Personas, Out of Scope, or Approved By).

**Output:**
> **Current state:** Discovery artefact found but incomplete — [name the specific gap, e.g. "the Problem Statement section contains a `[FILL IN]` placeholder" or "the Personas section is missing"].
>
> **Next skill:** `/clarify`
>
> **Why:** `/clarify` asks the highest-value questions to sharpen the discovery before you seek approval.
>
> **Run:** `/clarify`

**Important:** Name the specific incompleteness — do not produce a generic message. Identify which section is incomplete or which specific gap exists.

---

### State 3 — Complete but unapproved discovery (AC2b)

**Condition:** A `discovery.md` file exists with all required sections populated and no `[FILL IN]` markers, but the `Status` field is not `Approved`.

**Output:**
> **Current state:** Discovery artefact exists and appears complete — approval is the remaining step.
>
> **Next skill:** `/discovery`
>
> **Why:** The discovery needs to be reviewed and approved before benefit metrics can be defined. Mark `Status: Approved` in the artefact or run `/discovery` to initiate the approval conversation.
>
> **Run:** `/discovery`

**Important:** Do NOT route to `/clarify` — the discovery is complete; it just needs approval.

---

### State 4 — Discovery approved, no benefit-metric (AC3)

**Condition:** Discovery `Status: Approved` is present, but no `benefit-metric.md` artefact exists under `artefacts/[feature]/`.

**Output:**
> **Current state:** Discovery approved — benefit metrics not yet defined.
>
> **Next skill:** `/benefit-metric`
>
> **Why:** `/benefit-metric` defines the measurable targets that make it possible to evaluate whether the feature delivered value.
>
> **Run:** `/benefit-metric`

---

### State 5 — Benefit-metric active, no stories (AC4)

**Condition:** A benefit-metric artefact exists and is active, but no story artefacts exist under `artefacts/[feature]/stories/`.

**Output:**
> **Current state:** Benefit metrics defined — no stories written yet.
>
> **Next skill:** `/definition`
>
> **Why:** `/definition` breaks the approved discovery and benefit metrics into epics and stories ready for delivery.
>
> **Run:** `/definition`

---

### State 6 — Stories exist, missing test plan (AC5)

**Condition:** Story artefacts exist under `artefacts/[feature]/stories/`, but one or more stories do not have a corresponding test plan under `artefacts/[feature]/test-plans/`.

**Output:**
> **Current state:** Stories exist — [name the specific story without a test plan, e.g. "story `i1.1-orient-skill`"] is missing a test plan.
>
> **Next skill:** `/test-plan`
>
> **Why:** Every story needs a test plan before it can pass the Definition of Ready (DoR) gate.
>
> **Run:** `/test-plan` for story [story slug]

**Important:** Name the specific story without a test plan. Check each story artefact and report the first one missing a test plan.

---

### State 7 — DoR signed-off, branch exists (AC6a)

**Condition:** `pipeline-state.json` contains a story with `dorStatus: signed-off` and no merged PR, AND a branch or worktree named `feature/[story-slug]` exists (check `git branch --list feature/*` or look in `.worktrees/`).

**Output:**
> **Current state:** Story `[story-slug]` is DoR signed-off and a branch `feature/[story-slug]` exists — implementation is in progress.
>
> **Next skill:** `/verify-completion`
>
> **Why:** A branch exists, which means implementation has started. Run `/verify-completion` to confirm all ACs are satisfied before opening a draft PR.
>
> **Run:** `/verify-completion`

---

### State 8 — DoR signed-off, no branch (AC6b)

**Condition:** `pipeline-state.json` contains a story with `dorStatus: signed-off` and no merged PR, AND no branch or worktree for that story is found.

**Output:**
> **Current state:** Story `[story-slug]` is DoR signed-off — no implementation branch found.
>
> **Next skill:** `/branch-setup`
>
> **Why:** The story is ready to code but no isolated branch exists. Run `/branch-setup` to create the worktree and confirm a clean baseline before writing any code.
>
> **Run:** `/branch-setup`

---

## State detection reference

| What to check | Where to look | Key field |
|---------------|---------------|-----------|
| `artefacts/` present | File system | Directory exists |
| Discovery complete | `artefacts/[feature]/discovery.md` | No `[FILL IN]` markers; required sections present |
| Discovery approved | `artefacts/[feature]/discovery.md` | `Status: Approved` line |
| Benefit-metric active | `artefacts/[feature]/benefit-metric.md` | File exists |
| Stories exist | `artefacts/[feature]/stories/` | Directory contains `.md` files |
| Test plan for story | `artefacts/[feature]/test-plans/[story-slug]-test-plan.md` | File exists |
| DoR signed-off | `pipeline-state.json` | `dorStatus: "signed-off"` on the story object |
| Branch exists | Shell: `git branch --list feature/*` | Branch name matches story slug |
| Worktree exists | `.worktrees/[story-slug]/` | Directory exists |

---

## Output format

Every `/orient` response must include all four parts:

1. **Current state:** One sentence describing what was detected.
2. **Next skill:** The exact skill name (e.g. `/discovery`, `/benefit-metric`).
3. **Why:** One sentence explaining what that skill does and why it is the right next step.
4. **Run:** The exact command string to invoke.

Do not produce vague responses. Every pipeline state has an explicit routing rule above — use them.
