---
name: discovery
description: >
  Structures a raw idea, problem statement, or opportunity into a formal discovery
  artefact. Use when someone says "I have an idea", "we should build",
  "there's a problem with", "can we explore", or pastes a rough ticket, brief, or idea.
  Produces a discovery artefact that, once approved, unlocks /benefit-metric.
  Does not produce metrics, stories, or technical design - those are downstream skills.
  Asks clarifying questions one at a time - never presents a form to fill in.
triggers:
  - "I have an idea"
  - "we should build"
  - "there's a problem with"
  - "can we explore"
  - "new feature"
  - "new initiative"
  - "discovery"
---

# Discovery Skill

## Evaluation mode

When `evaluation.mode: true` is set in `.github/context.yml`, this skill runs in
non-interactive mode:

- All confirmation prompts are skipped — the skill proceeds through every step
  without waiting for operator reply
- Clarifying questions (Steps 1–2) are produced as content in the artefact, not
  as interactive gates
- The complete artefact is produced in a single pass
- **Ambiguous or thin inputs (T2/T4-type):** For inputs with no specific problem named, no named persona, and no measurable baseline (e.g. "improve the onboarding experience", "make the API faster"), the correct eval-mode behaviour is: (1) produce the clarifying questions prominently at the top of the artefact, (2) note that artefact sections cannot be reliably populated without answers, (3) populate all sections with placeholder state (`[UNKNOWN — requires clarification]`). **Do NOT produce a staged pipeline, phased framework, hypothesis list, stakeholder map, assumption inventory, or solution directions as a substitute for the missing operator input.** These are fabrication patterns, not clarification patterns.
- The final line of any artefact produced must be: `<!-- eval-mode: true -->`
  This marker signals the artefact was produced in eval mode and must not be
  committed to a production artefact path
- A structured result is written to the path configured at `evaluation.output_path`
  in `.github/context.yml` (default: `workspace/eval-run-result.json`) on completion

**Substantive behaviour is unchanged.** The skill still applies all quality logic —
constraint surfacing, scope refusal on thin inputs, regulatory question generation.
The only difference is whether it pauses for a reply before producing output.

**eval-run-result.json schema:**
```json
{
  "skill": "discovery",
  "caseId": "[corpus case ID if running against eval corpus, else null]",
  "model": "[model that produced this artefact]",
  "completedAt": "[ISO datetime]",
  "artefactPath": "[path to produced artefact, or null if eval-mode discard]",
  "dimensionsScored": null,
  "verdict": null
}
```

---

## Entry condition

No prerequisites. First step in the pipeline.

---

## Step 0 - Check for product context and reference materials

Before asking any questions, check two things:

**1. Product context:**

Check whether `product/` (repo root) exists and contains:
- `mission.md` — what the product does and for whom
- `constraints.md` — hard limits (regulatory, technical, budget)
- `tech-stack.md` — current technology decisions

If found, read them and extract:
- Target users (from `mission.md`) ? pre-populate the "Who it affects" section
- Hard constraints (from `constraints.md`) ? pre-populate the Constraints section
- Technical limits (from `tech-stack.md`) ? surface as known constraints

Surface what was found:

> **Product context read:**
> Target users: [extracted personas]
> Known constraints: [list from constraints.md]
>
> I'll use these to frame the discovery questions and pre-populate sections.
> You can override anything I extract.

If product context files do not exist — skip and proceed. Discovery will surface
these fields through conversation.

**2. Reference materials:**

Check whether a reference folder exists for this feature at
`artefacts/[feature-slug]/reference/`.

If the folder exists and contains files, list them:

> **Reference materials found:**
> - [filename] - [brief description from reference-index.md if present]
>
> I'll use these to pre-populate sections where they contain relevant context.
> You can still correct or override anything I extract.
>
> Do you want me to read these documents before we start?
> Reply: yes - or skip, I'll describe the context directly

If the user says yes, read the available documents and summarise what you found
before proceeding:

> **From the reference materials:**
> - Problem / opportunity: [extracted summary]
> - Stakeholders / personas mentioned: [list]
> - Scope or boundaries mentioned: [summary]
> - Success indicators or targets mentioned: [summary]
> - Constraints mentioned: [summary]
>
> I'll use this as a starting point. Confirm or correct each section as we go.

If no reference folder exists, proceed directly to the conversational process.

> **Tip for large or multi-team initiatives:** Drop scoping documents, business
> cases, or other source materials into
> `artefacts/[feature-slug]/reference/` and create a
> `reference-index.md` there (template at `.github/templates/reference-index.md`).
> Discovery, /benefit-metric, and /definition will read them automatically.

If no input has been provided, ask this first:

> **What's the problem or opportunity you want to explore?**
> A sentence or two is enough to start — or point me to the reference folder
> if you've already uploaded source documents.
>
> Reply: describe it

**3. EA registry blast-radius integration:**

After checking product context and reference materials, read `.github/context.yml` and check the `architecture.ea_registry_authoritative` field.

### Path A — EA registry authoritative (`architecture.ea_registry_authoritative: true`)

When this flag is `true` in `context.yml`, call `getBlastRadius(systemId)` for any system named in the problem statement or scope. Surface the blast-radius summary inline in the discovery artefact:

> **EA registry blast-radius (from EA registry):**
> System: [systemId]
> Affected consumers: [count from registry]
> Downstream consumers: [list from registry]
> Domain owner: [domain owner from registry]
>
> **Impact note:** [n] downstream consumers are affected. Review the /ea-registry artefact for full dependency graph before defining scope boundaries.

Include a note in the Architecture / Technical Context section of the discovery artefact referencing this blast-radius summary. This integration is read-only — do not write to or modify the EA registry during discovery. (ADR-007: EA registry surface-type mapping table governs which surface types are in scope for `getBlastRadius()` queries.)

If the EA registry has no entry for the named system, surface this gracefully:

> **EA registry:** no EA registry entry found for [systemId]. Proceed without blast-radius data — this does not block discovery.

The discovery session continues regardless of whether a registry entry exists.

### Path B — EA registry not authoritative (`architecture.ea_registry_authoritative: false` or absent)

When `architecture.ea_registry_authoritative` is `false` or the key is absent from `context.yml`, behave as before: no blast-radius section is surfaced, no error is raised, and no EA registry query is attempted. The discovery session proceeds identically to pre-Phase-3 behaviour.

**4. Reference corpus check (legacy system context):**

If the discovery involves a system that has been reverse-engineered, check whether a reference corpus exists. If the system slug is not yet known at session start, ask the operator: "Which system does this feature touch? I need the system slug to locate any reference corpus."

Check `artefacts/[system-slug]/reference/` for:
- `discovery-seed.md` — if present, read it and pre-populate problem framing, known constraints, and personas in the draft discovery artefact
- `constraint-index.md` — if present, populate the existing **Constraints** section with entries from it, prefixed with: `*Source: constraint-index.md ([extraction date])*`; insert within the existing section, do not create a new heading

The operator may override, edit, or adjust any pre-populated content at any time — confirm corrections and proceed.

If neither file exists, proceed with the standard discovery flow — no error, no warning.

---

## Purpose

Transform a rough idea into a structured artefact that answers:
*What problem are we solving, for whom, why now, and what does success look like at the edges?*

This is a scoping and clarity exercise - not a solution definition.
The discovery artefact does not specify how to build anything.

---

## Clarification gate (mandatory — applies before any artefact output)

If the operator input is ambiguous or thin — no specific problem named, no named persona, no measurable baseline, no regulatory or technical context — you **must not** produce any of the following before asking at least one operator question:

- A staged or phased pipeline (STAGE 1–N, PHASE 1–N, Step 1–N, or any sequential multi-section framework)
- Any standard discovery artefact section (Problem, Personas, MVP, Assumptions, Out-of-Scope, Constraints)
- A hypothesis list, constraint taxonomy, stakeholder map, assumption inventory, or solution directions
- A "proposed next steps" or "what I'd do first" section

Ask **one specific clarifying question** that names the concrete gap (which problem? which metric? which persona? which system?). Wait for the operator's answer. Then produce artefact sections based on what the operator provides.

**This prohibition applies in both interactive mode and eval mode.** Producing a structured multi-section deliverable before the first operator question is a process violation regardless of how the sections are labelled.

**What a gate-compliant thin-input response looks like:**
> I need a few things before I can scope this properly. Which specific part of the onboarding flow is failing — account setup, first-use guidance, or team activation? And who's experiencing it — new individual users or IT admins provisioning accounts?

**What a gate-violation looks like (do not do this):**
> STAGE 1: Problem Decomposition
> STAGE 2: Stakeholder Mapping
> STAGE 3: Assumption Inventory
> ... [400 lines of structured analysis without a single question]

---

## Conversational process

Work through sections one at a time. Ask one question, wait for the answer, write
the section, then move to the next. Never present the full structure as a form.

When you have enough to write a section confidently, write it and confirm:
> "I've written the [section] section as: [summary]. Does that capture it?
> Reply: yes - or correct me"

### Section 1 - Problem statement

Ask:
> **What's actually happening now that shouldn't be - or not happening that should?**
> (Not the solution â€” the problem. Who experiences it, when, how often, what does
> it cost them when it's unresolved?)
>
> Reply: describe the problem

### Section 2 â€” Who it affects

Ask:
> **Who specifically experiences this problem?**
> I need named personas, not generic "users". What are they trying to accomplish
> when they hit this?
>
> Reply: describe the people

### Section 3 â€” Why now

Ask:
> **What's changed that makes this worth addressing now?**
> (Regulatory change, volume threshold, competitive pressure, strategic initiative,
> accumulated pain reaching a tipping point, something else?)
>
> Reply: describe the trigger

### Section 4 â€” MVP scope

Ask:
> **What's the smallest thing that could validate this is worth building?**
> What must be true for the first person who uses it to find it useful?
>
> Reply: describe the MVP

### Section 5 - Out of scope (mandatory)

Ask:
> **What's explicitly NOT part of this initiative?**
> Minimum 2 items - naming what's out of scope is as important as what's in.
> It's what /review will validate stories against.
>
> Reply: list at least 2 items

If the answer is vague or "nothing is out of scope":
> What's something related that might seem obvious to include, but you want to defer?
> Even one example helps - it signals where the boundary is.
>
> Reply: give an example

### Section 6 â€” Assumptions and risks

**Writing rule — constraint labelling (applies before writing this section and the Constraints section):**
Before writing any section that references constraints, compliance requirements, data handling, integration dependencies, or regulatory obligations, list every constraint you cannot confirm from the input as an explicit assumption using this exact format:

> [ASSUMPTION] [constraint statement] — unconfirmed, requires /clarify before scope is locked.

Examples:
> [ASSUMPTION] Data must remain within EU jurisdiction — unconfirmed, requires /clarify before scope is locked.
> [ASSUMPTION] Existing tooling (Jira) cannot be replaced — unconfirmed, requires /clarify before scope is locked.

Do not bury unconfirmed constraints in prose. Every unconfirmed constraint must have its own `[ASSUMPTION]` line. Confirmed constraints (from `product/constraints.md`, reference materials, or explicit operator statement this session) do not need the tag.
Ask:
> **What are we assuming is true that we haven't validated yet?**
> And what could make this not worth building?
>
> Reply: list assumptions and risks

### Section 7 — Directional success indicators

**Writing rule — observability minimum (applies when writing each success indicator):**
For each success indicator, name:
1. A **baseline value** — where things stand today (or flag as `[UNKNOWN BASELINE]` if genuinely unmeasurable at this stage)
2. A **target value** — what good looks like after this initiative
3. **How it will be measured** — the data source, tool, or mechanism

Do not write vague directional signals like "improved adoption" or "reduced friction". If you cannot specify a baseline, write `[UNKNOWN BASELINE]` explicitly — not a directional phrase. This signals to /benefit-metric where measurement work is needed.

Example (acceptable):
> **Onboarding time-to-first-artefact:** Baseline: ~4 hours (operator-estimated). Target: =30 minutes. Measured via: session transcript timing script.

Example (not acceptable):
> Faster onboarding for new teams.

The "these don't need to be precise metrics" guidance applies to the numeric precision of the target — not to whether a baseline and measurement method are named.

Ask:
> **What would you see, hear, or measure that would tell you this worked?**
> These don't need to be numerically precise metrics yet — that's /benefit-metric's job.
> But name a baseline, a target direction, and how you'd measure it.
>
> Reply: describe what success looks like

### Section 8 â€” Constraints

Ask:
> **Any constraints I should know about?**
> (Time, budget, regulatory, technical dependencies, team capability)
>
> Reply: list constraints - or type "none identified"

---

### Section 8a — /clarify decision gate (mandatory check)

After completing Sections 6, 7, and 8, count every line in the draft artefact that begins with `[ASSUMPTION]`.

**If two or more `[ASSUMPTION]` lines exist:**

End the artefact with an explicit /clarify recommendation block:

```
---

## /clarify recommendation

This discovery contains [N] unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- [list each [ASSUMPTION] item verbatim from the artefact]

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions produces metrics that will require revision after clarification.
```

Do not substitute a softer phrase like "consider running /clarify" or bury the recommendation in a note. The block must appear as a named section at the end of the artefact and must list each unresolved assumption by name.

**If fewer than two `[ASSUMPTION]` lines exist:**

No /clarify block is needed. Proceed to Step 1 (attribution).

---

## Step 1 — Establish attribution

Before finalising the artefact, ask the operator for contributor details:

> **Who contributed to this discovery?**
> Provide contributor names and roles for the Attribution section.
> Include anyone who shaped the problem statement, scoping, or success criteria.
>
> Reply: Name — Role (repeat for each contributor)

Record the contributor names and roles provided for use in the Attribution section of the artefact.

---

## Structural completeness requirement (applies to all inputs, including complex regulated cases)

Every discovery artefact must contain all of the following sections, regardless of input complexity or regulatory depth:

| Section | Minimum content | Common failure mode |
|---|---|---|
| **Personas** | ≥ 1 named persona with role, when they encounter the problem, and cost/impact | Producing analytical risk commentary without naming who bears the risk |
| **MVP scope** | Named, bounded subset of the opportunity with ≥ 1 explicit deferral | Producing a capability survey without committing to a scope boundary |
| **Out of scope** | ≥ 2 named items with one-line reasons | Omitting the section or writing "future phase" with no specifics |
| **Success indicators** | ≥ 1 indicator with a baseline value (or `[UNKNOWN BASELINE]`) and a target | Writing directional statements ("adoption improves") instead of anchored targets |
| **Constraints** | Items sourced from operator input or `product/constraints.md` — not fabricated | Substituting international/generic regulatory citations (GDPR, ECOA, SR 11-7) for the actual applicable constraints named in the input |

**For complex regulated inputs (financial services, healthcare, public sector):** High-quality analytical content (regulatory risk analysis, assumption challenges, AML/CFT mechanics) does not replace structural completeness. A response that demonstrates deep regulatory knowledge but omits personas, MVP scope, and success indicators fails D2, D3, and D6 regardless of D5 quality. Analytical depth and artefact structure are independent requirements — both must be present.

---

## Output artefact

Conforms to `.github/templates/discovery.md`.

**Before saving, establish the timestamped feature slug:**

> **What shall we call this feature? I'll use this as the folder name.**
>
> Convention: `YYYY-MM-DD-[short-descriptive-slug]`
> Today's date: `[current date]`
>
> Example: `2025-07-15-payments-fraud-detection`
>
> Reply: confirm the slug — or give me a different name

All subsequent artefacts for this feature will live in:
`artefacts/[YYYY-MM-DD-feature-slug]/`

Save to `artefacts/[YYYY-MM-DD-feature-slug]/discovery.md`.

The discovery artefact must include the following Attribution section:

## Attribution

**Contributors** (one or more names and roles):
- Name — Role — Date

**Reviewers** (optional, one or more names and roles):
- Name — Role — Date

**Approved By** (Name — Role — Date, or Pending):
- Pending

---

## Approval gate

After producing the artefact:

> **Discovery draft complete ?**
>
> Before approving and moving to /benefit-metric, run **/clarify** to sharpen the artefact.
> /clarify identifies the highest-value open questions across scope, integration, constraints,
> and user journey — and asks them one at a time.
>
> **Why not skip it?**
> Vague scope = scope drift in /definition. Undocumented assumptions = rework in /review.
> /clarify is the cheapest place to resolve both.
>
> How do you want to proceed?
> 1. Run /clarify now (recommended)
> 2. Review and approve without /clarify — skip to sign-off
>
> Reply: 1 or 2

If option 2:
> **Skipping /clarify.** Before approving, confirm the artefact meets these quality checks:
> - Out of scope has at least 2 explicit items with reasons
> - Assumptions are genuine uncertainties, not facts
> - Success indicators are observable
>
> When approved: update the Status field to "Approved" and note who approved it and when.
> The /benefit-metric skill checks for this before proceeding.
>
> Reply: approved — [your name], [date]

<!-- approved-by-required -->

> **Attribution — required before marking Approved:**
> Before setting Status to "Approved", populate the attribution sections in the discovery artefact:
> - **## Contributors** — everyone who contributed to the discovery (name + role)
> - **## Reviewers** — everyone who reviewed the artefact before approval (name + role)
> - **## Approved By** — the named individual approving this discovery (name + role + date)
>
> A non-engineering approver is expected for M3 (non-engineering outer loop attribution rate) measurement.
> Leaving the Approved By field empty will result in a H-GOV hard block at Definition of Ready.
> If Approved By is Pending or empty, remind the operator to return and populate it before the DoR gate.

---

## Quality checks before outputting

- Problem statement describes a problem, not a solution
- MVP scope is bounded - not "everything" or "phase 1 of a platform"
- Out of scope has at least 2 explicit items with reasons
- Success indicators are observable, not "users like it"
- Assumptions are genuine uncertainties - not facts dressed as assumptions
- No implementation detail has crept in

---

## What this skill does NOT do

- Does not define metrics - that is /benefit-metric
- Does not write stories or ACs - that is /definition
- Does not make build/buy/defer decisions
- Does not update your issue tracker or backlog tool

---

## Estimate prompt — E1 (run before closing this skill)

Before closing /discovery, prompt the operator to record a rough estimate.
This seeds the normalisation model — the prompt takes 2 minutes.

> **Before we move to /benefit-metric:**
> Run `/estimate` to record a rough focus-time forecast for this feature.
> This gives us a Phase 1 baseline for calibration at /improve.
> Reply: `/estimate` — or `skip` to continue without an estimate

If the operator replies `/estimate`, invoke the estimate skill (E1 mode).
If the operator replies `skip`, write `"e1": null` to `estimate` in `workspace/state.json`.

---

## State update - mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ?."

When the discovery artefact is saved and approved, update `.github/pipeline-state.json` in the **project repository**:

- If the feature does not exist in `features[]`: add a new entry with `stage: "discovery"`, `health: "green"`, `updatedAt: [now]`
- If it exists: set `stage: "discovery"`, `health: "green"`, `updatedAt: [now]`
**Compliance context bridge:** Read `.github/context.yml` and copy these fields to the feature entry:
- `regulated: [value of meta.regulated]` (boolean)
- `complianceProfile: "regulated"` if `meta.regulated` is true, otherwise `"standard"`
- `complianceFrameworks: [value of compliance.frameworks]` (array, may be empty)
- `sensitiveDataCategories: [value of compliance.sensitive_data_categories]` (array, may be empty)

These fields are read by the visualiser governance view. They must be set at discovery time so the governance matrix can apply the correct policy (strict/standard) from the start of the feature lifecycle.

**Config governance bridge:** Also read `mapping.governance.gates` from context.yml. If non-empty, write it to `config.governance.gates` in pipeline-state.json (top-level `config` object). This allows the visualiser to use repo-specific gate definitions instead of hardcoded defaults.

**Compliance guardrails seeding:** If `compliance.frameworks` from context.yml is non-empty, seed the feature-level `guardrails[]` array with compliance framework entries: for each framework, add `{ "id": "CF-[FRAMEWORK-NAME]", "category": "compliance-framework", "label": "[framework] compliance", "status": "not-assessed" }`. This makes compliance frameworks visible in the Guardrails Compliance Matrix from the start of the feature lifecycle. Also read `.github/copilot-instructions.md` — if it contains an `Architecture standards` section referencing an `architecture-guardrails.md` file, note this context for downstream skills.
**Human review note:** If a human approves the discovery outside of a skill session, run `/workflow` â€” it will reconcile the state file with the artefacts.
