---
name: definition
description: >
  Breaks an approved discovery + benefit-metric pair into epics and stories
  conforming to templates/epic.md and templates/story.md. Offers slicing strategy
  choice before decomposing. Runs a scope accumulator at the end - compares total
  story scope against the original discovery MVP to surface scope drift across the
  full set, not just individual stories. Does not produce test plans or API contracts.
  Requires approved discovery AND active benefit-metric artefact.
triggers:
  - "break this down"
  - "create stories"
  - "write the epics"
  - "define the work"
  - "decompose this"
  - "what are the stories for"
---

# Definition Skill

## Entry condition check

Before asking anything, verify:

1. Discovery artefact exists at `artefacts/[feature]/discovery.md` - status "Approved"
2. Benefit-metric artefact exists at `artefacts/[feature]/benefit-metric.md`
3. Benefit-metric artefact contains at least one metric with a defined target

Also check for reference materials at `artefacts/[feature]/reference/`.
If present, scan for technical designs, scoping documents, or programme-level
constraints that should shape story decomposition and are not yet reflected in
the discovery or benefit-metric artefacts. Surface any that are relevant before
choosing a slicing strategy.

If not met (entry condition):

> ❌ **Entry condition not met**
> [Specific issue - e.g. "Benefit-metric artefact not found. Run /benefit-metric first."]
>
> Run /workflow to see the current pipeline state.

---

## Step 1 - Confirm the feature scope

State what was found first:

> **Discovery loaded:** [feature name]
> **MVP scope items found:** [n]
> **Benefit metrics found:** [n metrics with targets]
> **Personas identified:** [list]
>
> Ready to decompose this into epics and stories?
> Reply: yes - or name a specific scope item to focus on first

---

## Step 1.5 - Architecture constraints scan

Before choosing a slicing strategy, check for constraints that should shape
how stories are written.

Read `.github/architecture-guardrails.md` if it exists.

If found, surface relevant constraints before decomposing:

> **Architecture constraints relevant to this feature:**
> - [e.g. ADR-002: all data access must go via the API layer - no direct DB calls from UI]
> - [e.g. Mandatory constraint: all user inputs must be validated server-side]
> - [e.g. Pattern library: use `<DataTable>` component for all tabular data display]
>
> These constraints must appear in the Architecture Constraints field of any
> story whose implementation path is affected. They will be checked by
> /review Category E and /definition-of-ready H9.
>
> Any of these a blocker before decomposing?
> Reply: no - proceed / yes - [describe the issue]

If not found:

> ⚠️ No `architecture-guardrails.md` found - proceeding without guardrail check.
> Consider running `/bootstrap` or creating `.github/architecture-guardrails.md`
> from the template at `.github/templates/architecture-guardrails.md` to enable
> this check in future.

Record whether guardrails were available or absent in the epic artefact.

---

## Step 2 - Choose a slicing strategy

Ask this before any decomposition. Do not default.

> **Which slicing strategy should I use for this feature?**
>
> 1. **Vertical slice** — each story is a thin complete slice through all layers.
>    Every story independently demo-able.
>    Best for: high uncertainty, validating end-to-end behaviour early.
>
> 2. **Walking skeleton** — first story establishes the thinnest possible end-to-end
>    path, subsequent stories flesh it out.
>    Best for: new architectures or integrations needing proof before detail.
>
> 3. **User journey** — stories follow the user's chronological path through the feature.
>    Best for: workflow-heavy features where sequence of interactions matters.
>
> 4. **Risk-first** — highest-risk or highest-uncertainty stories first.
>    Best for: significant technical unknowns, de-risk before committing to full scope.
>
> Reply: 1, 2, 3, or 4

Record the chosen strategy in every epic artefact — not implied, written explicitly.

---

## Step 3 — Epic structure

Group stories into epics. Each epic is a cohesive body of work reviewable
independently.

- Under ~8 stories: a single epic is fine
- Larger features: aim for 3–8 stories per epic

Present the proposed epic grouping before writing:

> **Proposed epic structure:**
> - Epic 1: [title] — [n stories] — [rationale for grouping]
> - Epic 2: [title] — [n stories] — [rationale for grouping]
>
> Does this grouping make sense, or do you want to reorganise?
> Reply: looks good — or describe how to reorganise

Save each epic to `artefacts/[feature]/epics/[epic-slug].md`
conforming to `.github/templates/epic.md`.

---

## Step 4 — Story decomposition

For each epic, write stories conforming to `.github/templates/story.md`.

**Discipline:**
- Every story names a persona from the benefit-metric artefact — not "a user"
- Every story's "So that..." connects to a named metric — not a feature preference
- Every story has a genuine out-of-scope section — not "N/A"
- Minimum 3 ACs per story in Given/When/Then format
- ACs describe observable behaviour, not implementation approach

**Testability filter (D2 — advisory, applied to each AC as written):**

When writing an AC, apply a testability check. Flag any AC that:
- (a) uses "should" or "would" instead of asserting current-state observable behaviour
- (b) describes internal system state not visible to a test runner or human reviewer
- (c) cannot be evaluated independently without first running a prior AC

Surface flagged ACs as:

> "AC[N] may not be independently testable — [reason]. Revise the AC or accept as-is?"

If the operator accepts the AC as-is, story writing continues without removing or altering the AC. Annotate the accepted AC with `[Testability: accepted by operator on <date>]`.

**This filter is advisory only** — do not halt story creation or block story progression for testability warnings.

**Scope guard — per story:**
If a story is necessary but was not in the discovery MVP scope, surface it
immediately rather than silently writing it:

> ⚠️ **SCOPE NOTE: [Story title] was not in the discovery MVP scope.**
>
> It appears necessary because: [reason]
>
> How do you want to handle it?
> 1. Add to MVP scope — I'll update the discovery artefact

**Migration story detection:**
If a story is identified as a data migration, cutover, parallel-run, or consumer
migration story (not user-facing, driven by data rules or traffic switching):

> ⚠️ **This story type doesn't fit the standard story format.**
> It looks like a [data migration / cutover / parallel-run / consumer migration] story.
>
> Use `migration-story.md` template instead of `story.md` for this story?
> 1. Yes — use migration-story.md (appropriate for this type)
> 2. No — keep standard story.md format and I'll adapt the ACs
>
> Reply: 1 or 2

If migration story template confirmed: write the story using
`.github/templates/migration-story.md`.
> 2. Defer to post-MVP
> 3. Replace an existing MVP scope item — which one?
>
> Reply: 1, 2, or 3

Save each story to `artefacts/[feature]/stories/[story-slug].md`

**Dependency chain validation (D1 — run after saving each story):**

After writing and saving a story's Dependencies block, check whether each named upstream story slug resolves to an existing artefact path (`artefacts/[feature]/stories/[slug].md`). If any slug does not resolve, surface a prompt before proceeding to the next story:

> "Upstream story [slug] not found at expected path. Options: (1) add the missing story, (2) confirm this is an external dependency, (3) remove the reference."

If the operator selects option 2 (external dependency) and provides a description, record the following annotation in the story's Dependencies block and do not re-surface the warning for that slug in the same session:

> `[External: <description> — confirmed by operator on <date>]`

---

## Step 5 — Benefit coverage matrix

After all stories are written, populate the metric coverage matrix in the
benefit-metric artefact.

For each metric — list which stories move it.

**Metric gap — surface immediately:**

> ⚠️ **METRIC GAP: [Metric name] has no stories that move it.**
>
> Options:
> 1. Write a story for it
> 2. Descope this metric
> 3. Mark as post-MVP
>
> Reply: 1, 2, or 3

**Story gap — surface immediately:**

> ⚠️ **STORY GAP: [Story title] has no metric linkage.**
>
> Either connect it to a metric or consider whether it belongs in MVP scope.
>
> Which metric does this story move, or should it be removed?
> Reply: [metric name] — or remove

---

## Step 6 — Scope accumulator

This step runs after all stories are written. It compares the total story scope
against the original discovery MVP scope to detect drift that individual story
guards may miss.

Individual stories can each be fine while the set together represents significant
scope expansion. This step catches that.

**Calculate:**
- MVP scope item count from discovery artefact: [n]
- Total stories written: [n]
- Stories with scope notes (additions beyond MVP): [n]
- Stories explicitly deferred to post-MVP: [n]
- Stories with no metric linkage: [n]

**Scope ratio check:**
For each discovery MVP scope item, confirm at least one story covers it.
For each story, confirm it traces to at least one MVP scope item (or has an
approved scope note).

**Present the summary:**

> **Scope accumulator — [feature name]**
>
> Discovery MVP scope items: [n]
> Stories written: [n]
> Coverage: [n of n MVP items covered]
> Scope additions (approved via scope note): [n]
> Scope ratio: [stories / MVP items] — [commentary]
>
> [If ratio > 1.5 and additions not approved:]
> ⚠️ **SCOPE DRIFT DETECTED**
> The total story scope is [x]x the original discovery MVP.
> Scope additions: [list with their scope notes]
>
> Is this intentional growth, or has scope crept?
> 1. Intentional — update the discovery artefact to reflect the expanded scope
> 2. Scope crept — I'll identify which stories to defer or remove
> 3. Correct — some stories cover multiple MVP items, ratio is misleading
>
> Reply: 1, 2, or 3

[If all stories trace cleanly to MVP scope:]
> ✅ **Scope check passed** — [n] stories covering [n] MVP items.
> No unexplained scope additions detected.

---

## Step 7 — NFR profile generation

After scope accumulator, generate the feature-level NFR profile.

Read from:
1. `artefacts/[feature]/discovery.md` — Constraints section
2. `product/constraints.md` — hard product constraints (if exists)
3. Each story's NFR section — aggregate all story-level NFRs

Consolidate into a feature-level NFR profile:

> **NFR profile — [feature]:**
>
> Performance targets identified: [list or "None defined"]
> Security requirements: [list or "None defined"]
> Data classification: [Public / Internal / Confidential / Restricted]
> Data residency: [requirement or "Not applicable"]
> Availability SLA: [target or "Not defined"]
> Compliance frameworks: [list or "None"]
>
> Any NFRs with named regulatory clauses require human sign-off before DoR.
>
> Confirm this profile, or add/correct anything?
> Reply: confirm — or update [field] to [value]

Save to `artefacts/[feature]/nfr-profile.md` conforming to
`.github/templates/nfr-profile.md`.

If no NFRs are identified, state this explicitly in the profile:
`Status: Active — No NFRs identified at definition. Reviewed at [date].`

---

## Quality checks before completing

- Every epic records its slicing strategy — written explicitly, not implied
- Every story's "So that..." connects to a named metric
- Every story has a genuine out-of-scope section (not "N/A")
- Minimum 3 ACs per story in Given/When/Then format
- Benefit coverage matrix complete — no orphaned metric, no unlinked story
- Scope accumulator run — ratio reviewed and any drift acknowledged
- All scope notes recorded in /decisions
- NFR profile generated and saved to `artefacts/[feature]/nfr-profile.md`

---

## Completion output

> **Definition complete ✅**
>
> Epics: [n] at `artefacts/[feature]/epics/`
> Stories: [n] at `artefacts/[feature]/stories/`
> Slicing strategy: [chosen strategy]
> Scope check: ✅ Clean / ⚠️ [n] additions approved / ⚠️ Review needed
> NFR profile: ✅ Saved / ⚠️ No NFRs identified — reviewed

**Learnings exit step (D3 — before proceeding to /estimate):**

Before ending this session — are there any learnings from this decomposition to write to `workspace/learnings.md`? Reply with the learning text, or `skip` to proceed to /estimate.

> Ready to run /review on the stories?
> Reply: yes — or review a specific story first

---

## Estimate prompt — E2 (run after completion output)

Now that story count and complexity are known, prompt the operator to refine the estimate.

> **Story count and complexity are now known ([n] stories, complexity mix: [1:n, 2:n, 3:n]).**
> Run `/estimate` to refine the focus-time forecast before moving to /review.
> Reply: `/estimate` — or `skip` to continue

If the operator replies `/estimate`, invoke the estimate skill (E2 mode).
If the operator replies `skip`, continue to /review without updating the estimate.

---

## What this skill does NOT do

- Does not produce API contracts or technical implementation detail
- Does not write test cases — that is /test-plan
- Does not run /definition-of-ready
- Does not assign stories to people, sprints, or milestones
- Does not modify discovery or benefit-metric artefacts except the coverage matrix
---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

Update `.github/pipeline-state.json` in the **project repository** when all epics and stories for a feature are written and saved:

- Set feature `stage: "definition"`, `health: "green"`, `updatedAt: [now]`
- Set feature `slicingStrategy` to the chosen strategy key (one of: `vertical-slice`, `walking-skeleton`, `user-journey`, `risk-first`)
- Populate `epics[]` array. Each epic object must have this exact shape — stories nested **inside** the epic:
  ```json
  {
    "slug": "epic-slug",
    "name": "Epic title",
    "status": "not-started",
    "stories": [
      { "slug": "story-slug", "name": "Story title", "stage": "definition", "health": "green" }
    ]
  }
  ```
- Stories go inside `epic.stories[]` — not at the feature level. The visualiser reads `epic.stories` to render the story map.

**Guardrails seeding:** After writing epics and stories, seed the feature-level `guardrails[]` array. Read `.github/architecture-guardrails.md` — if a `Guardrails Registry` block exists (fenced `yaml guardrails-registry` code block), parse the guardrail items. For each item, add `{ "id": "[id]", "category": "[category]", "label": "[label]", "status": "not-assessed" }` to `feature.guardrails[]`. This seeds the compliance matrix — evaluation skills (`/review`, `/definition-of-ready`, `/trace`) will update statuses later. If `architecture-guardrails.md` is not found, set `guardrails: []`.

**Human review note:** If a human adds or modifies stories outside a skill session, run `/workflow` to reconcile — it will diff artefacts against the state file.
