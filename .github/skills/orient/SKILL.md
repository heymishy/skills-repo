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

# Orient Skill ÔÇö Pipeline Orientation Concierge

## Purpose

`/orient` reads the current repository's artefact state and routes the operator to the correct next skill. It is the first command any new or returning consumer should run when they are unsure where they are in the pipeline.

**Distinct from `/start`:** `/start` is for greenfield, brand-new repositories only ÔÇö a single-use bootstrap. Use `/orient` when a repo already has some history or artefacts.

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

Produce a single structured output: **Current state ÔåÆ Next skill ÔåÆ One-sentence rationale ÔåÆ Exact command**.

---

## Routing rules

Work through these states **in order**. Stop at the first match.

---

## Entry A ÔÇö Brownfield: Existing story artefacts, no discovery

**Detection condition:** Story artefacts matching `[story-id]-*.md` are present under `artefacts/[feature]/stories/` ÔÇö **AND** no `discovery.md` file exists anywhere under `artefacts/` (presence of `discovery.md`, even if unapproved or incomplete, disqualifies Entry A ÔÇö standard discovery-in-progress routing takes precedence).

**Detection signal (name what you found):**
Before routing, state what was found ÔÇö for example:
> "Found: story artefacts under `artefacts/[feature]/stories/` (e.g. `s1.1-feature-name.md`); no `discovery.md` found. This looks like **Entry A ÔÇö story-first brownfield**."

Use confirmatory language. Present the classification as something to confirm, not an assertion: say "This looks like Entry A" not "This is Entry A". Invite the operator to correct the classification if it does not match their situation.

**Routing output:**

> **Current state:** Entry A ÔÇö story-first brownfield. Story artefacts detected; no discovery artefact found.
>
> **What this means:** Your repository has existing story artefacts that were written outside the governed pipeline. These stories can be adopted ÔÇö you do not need to re-derive or discard them. A discovery artefact is needed to provide the business context and approval anchor; your existing story artefacts become its input scope.
>
> **Inner loop entry point:** `/tdd` ÔÇö your existing story artefacts can be attached directly to a TDD cycle without re-deriving them from scratch.
>
> **Outer loop anchor:** `/discovery` ÔÇö run `/discovery` to create a lightweight discovery that captures the intent behind your existing stories. Reference your existing story artefacts as the scope input.
>
> **Next skill:** `/discovery`
>
> **Run:** `/discovery` (reference existing stories as input scope)

---

## Entry B ÔÇö Brownfield: Existing application code, no pipeline artefacts

**Summary path:** `/reverse-engineer` ÔåÆ `/discovery` ÔåÆ `/benefit-metric` ÔåÆ `/definition`

**Detection condition:** Application logic files (`.js`, `.ts`, `.py`, `.java`, `.rb`, `.go`, `.cs`, `.cpp`, `.rs`, `.swift`, `.kt`) are present under `src/`, `app/`, or `lib/` directories ÔÇö **AND** no `artefacts/` folder exists or it is empty (contains no `.md` files).

**Priority rule:** Entry A takes precedence ÔÇö if story artefacts are present under `artefacts/[feature]/stories/`, Entry A routing applies, not Entry B. Entry B requires the complete absence of any pipeline artefacts (no story artefacts, no discovery, no artefacts directory with content).

**Boundary:** Repositories containing only configuration or infrastructure files (`.yml`, `.json`, `Dockerfile`, `.tf`, Makefile, `k8s/`, `terraform/`) do **not** trigger Entry B ÔÇö these are config-only repos and fall through to Entry C (no pipeline history). Entry B requires genuine application logic files with one of the listed extensions in a recognised source directory.

**Detection signal (name what you found):**
Before routing, state what was found ÔÇö for example:
> "Found: `src/` directory with application logic files (e.g. `.ts`, `.py`); no `artefacts/` directory. This looks like **Entry B ÔÇö code-first brownfield**."

Use confirmatory language. Present the classification as something to confirm, not an assertion: say "This looks like Entry B" not "This is Entry B". Invite the operator to correct the classification if it does not match their situation.

**Routing output:**

> **Current state:** Entry B ÔÇö code-first brownfield. Application code detected; no pipeline artefacts found.
>
> **What this means:** Your repository has existing application code but no governed delivery artefacts. Before continuing with the pipeline, extract the existing system's business rules and design using `/reverse-engineer`. This builds the artefact foundation that makes `/discovery` meaningful and grounded in the actual system behaviour.
>
> **Suggested path:**
> 1. `/reverse-engineer` ÔÇö extract business rules, data contracts, and interface behaviour from the existing codebase
> 2. `/discovery` ÔÇö structure the extracted knowledge into a discovery artefact
> 3. `/benefit-metric` ÔÇö define measurable targets for the feature or migration
> 4. `/definition` ÔÇö break the discovery into stories ready for delivery
>
> **Next skill:** `/reverse-engineer`
>
> **Run:** `/reverse-engineer`

---


## Entry C ÔÇö Brownfield: No-history or ops-only repo (no pipeline artefacts, no application logic)

**Detection signal:** Repository has git history, configuration files, or ops/infrastructure files (`.github/`, `Dockerfile`, CI configs, `scripts/`, `docs/`) but no application logic files triggering Entry B (no `src/`, `app/`, or `lib/` with code files) and no pipeline artefacts (no `artefacts/` directory or empty). Entry B is not applicable because no application logic files were found under `src/`, `app/`, or `lib/`. Greenfield (new empty repo with no commits or history) is handled earlier in the routing chain before Entry C is reached.

> **This looks like Entry C** ÔÇö a no-history brownfield repo: the project exists and has been operated, but no delivery pipeline artefacts or application logic exist to route through Entry A or Entry B. Use `.github/templates/retrospective-story.md` to document any work already delivered before the pipeline was adopted.

**Why Entry C (not Entry B):** No application logic files found under `src/`, `app/`, or `lib/`. Entry B requires code to reverse-engineer. Entry C covers the case where only ops/config/history signals are present.

**Priority in the routing chain:** Entry A (story artefacts) ÔåÆ Entry B (application code) ÔåÆ Entry C (brownfield fallback). A truly empty new repo never reaches Entry C ÔÇö it routes through the greenfield States 1ÔÇô8 detected earlier in this skill.

**Adoption path ÔÇö retrospective discovery:**
The right first step is a retrospective `/discovery` run to document what was built, why, and for whom. This is not a greenfield discovery ÔÇö it is retrospective discovery of existing work.

1. Use the `.github/templates/retrospective-story.md` template to create retroactive story artefacts for any work already delivered.
2. Run `/discovery` with a retrospective framing ÔÇö describe the system as it exists today, not as a future vision.
3. Follow the standard pipeline from `/discovery` forward: `/benefit-metric` ÔåÆ `/definition` ÔåÆ test plan ÔåÆ DoR.

**Detection signals found:** Git history or ops/configuration files present; no `artefacts/` pipeline artefacts; no application logic in `src/`, `app/`, or `lib/`.

**Confirmatory language:** This looks like Entry C ÔÇö no-history brownfield.

**Next skill:** `/discovery` (retrospective)

> **Run:** `/discovery`
> Note: This is a retrospective discovery session. Describe the system as it exists, reference the `retrospective-story.md` template for any completed work, and anchor on what value has already been delivered.

---



### State 1 ÔÇö New repository (AC1)

**Condition:** `artefacts/` does not exist or is empty, AND `pipeline-state.json` does not exist.

**Output:**
> **Current state:** No artefacts found ÔÇö this is a new repository (or a clean slate).
>
> **Next skill:** `/discovery`
>
> **Why:** `/discovery` structures your idea or problem into the first discovery artefact, which is the entry point for the entire governed delivery pipeline.
>
> **Run:** `/discovery`

---

### State 2 ÔÇö Incomplete discovery exists (AC2a)

**Condition:** A `discovery.md` file exists under `artefacts/` but contains `[FILL IN]` markers or is missing required sections (Problem Statement, Personas, Out of Scope, or Approved By).

**Output:**
> **Current state:** Discovery artefact found but incomplete ÔÇö [name the specific gap, e.g. "the Problem Statement section contains a `[FILL IN]` placeholder" or "the Personas section is missing"].
>
> **Next skill:** `/clarify`
>
> **Why:** `/clarify` asks the highest-value questions to sharpen the discovery before you seek approval.
>
> **Run:** `/clarify`

**Important:** Name the specific incompleteness ÔÇö do not produce a generic message. Identify which section is incomplete or which specific gap exists.

---

### State 3 ÔÇö Complete but unapproved discovery (AC2b)

**Condition:** A `discovery.md` file exists with all required sections populated and no `[FILL IN]` markers, but the `Status` field is not `Approved`.

**Output:**
> **Current state:** Discovery artefact exists and appears complete ÔÇö approval is the remaining step.
>
> **Next skill:** `/discovery`
>
> **Why:** The discovery needs to be reviewed and approved before benefit metrics can be defined. Mark `Status: Approved` in the artefact or run `/discovery` to initiate the approval conversation.
>
> **Run:** `/discovery`

**Important:** Do NOT route to `/clarify` ÔÇö the discovery is complete; it just needs approval.

---

### State 4 ÔÇö Discovery approved, no benefit-metric (AC3)

**Condition:** Discovery `Status: Approved` is present, but no `benefit-metric.md` artefact exists under `artefacts/[feature]/`.

**Output:**
> **Current state:** Discovery approved ÔÇö benefit metrics not yet defined.
>
> **Next skill:** `/benefit-metric`
>
> **Why:** `/benefit-metric` defines the measurable targets that make it possible to evaluate whether the feature delivered value.
>
> **Run:** `/benefit-metric`

---

### State 5 ÔÇö Benefit-metric active, no stories (AC4)

**Condition:** A benefit-metric artefact exists and is active, but no story artefacts exist under `artefacts/[feature]/stories/`.

**Output:**
> **Current state:** Benefit metrics defined ÔÇö no stories written yet.
>
> **Next skill:** `/definition`
>
> **Why:** `/definition` breaks the approved discovery and benefit metrics into epics and stories ready for delivery.
>
> **Run:** `/definition`

---

### State 6 ÔÇö Stories exist, missing test plan (AC5)

**Condition:** Story artefacts exist under `artefacts/[feature]/stories/`, but one or more stories do not have a corresponding test plan under `artefacts/[feature]/test-plans/`.

**Output:**
> **Current state:** Stories exist ÔÇö [name the specific story without a test plan, e.g. "story `i1.1-orient-skill`"] is missing a test plan.
>
> **Next skill:** `/test-plan`
>
> **Why:** Every story needs a test plan before it can pass the Definition of Ready (DoR) gate.
>
> **Run:** `/test-plan` for story [story slug]

**Important:** Name the specific story without a test plan. Check each story artefact and report the first one missing a test plan.

---

### State 7 ÔÇö DoR signed-off, branch exists (AC6a)

**Condition:** `pipeline-state.json` contains a story with `dorStatus: signed-off` and no merged PR, AND a branch or worktree named `feature/[story-slug]` exists (check `git branch --list feature/*` or look in `.worktrees/`).

**Output:**
> **Current state:** Story `[story-slug]` is DoR signed-off and a branch `feature/[story-slug]` exists ÔÇö implementation is in progress.
>
> **Next skill:** `/verify-completion`
>
> **Why:** A branch exists, which means implementation has started. Run `/verify-completion` to confirm all ACs are satisfied before opening a draft PR.
>
> **Run:** `/verify-completion`

---

### State 8 ÔÇö DoR signed-off, no branch (AC6b)

**Condition:** `pipeline-state.json` contains a story with `dorStatus: signed-off` and no merged PR, AND no branch or worktree for that story is found.

**Output:**
> **Current state:** Story `[story-slug]` is DoR signed-off ÔÇö no implementation branch found.
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

Do not produce vague responses. Every pipeline state has an explicit routing rule above ÔÇö use them.
