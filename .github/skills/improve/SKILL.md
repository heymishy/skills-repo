---
name: improve
description: >
  Post-merge learning extraction. Reads the completed artefact chain for a merged
  story or feature, identifies reusable patterns, decisions, and standards that
  emerged during delivery, classifies them, and writes them back to the permanent
  knowledge base. Produces updates to standards/, decisions log, or
  copilot-instructions.md. Use after /definition-of-done is complete and a PR is
  merged. Run when someone says "improve", "extract learnings", "update standards",
  "what did we learn from this", "pattern extraction", or "post-merge review".
  Requires a merged PR and completed DoD artefact.
triggers:
  - "improve"
  - "extract learnings"
  - "update standards"
  - "what did we learn from this"
  - "pattern extraction"
  - "post-merge review"
  - "capture patterns"
  - "lessons learned"
---

# Improve Skill

## Entry condition check

Before proceeding, verify:

1. PR is merged (not draft, not open)
2. DoD artefact exists at `artefacts/[feature]/dod/[story-slug]-dod.md`
3. Story artefact exists at `artefacts/[feature]/stories/[story-slug].md`

If not met:

> ❌ **Entry condition not met**
> /improve requires a merged PR and a completed /definition-of-done artefact.
>
> Missing: [specific item]
>
> Run /definition-of-done first, then return here.

---

## Step 1 — Read the artefact chain

Read the following artefacts in sequence:

1. `artefacts/[feature]/discovery.md` — original problem and constraints
2. `artefacts/[feature]/decisions.md` — all decisions made during delivery
3. `artefacts/[feature]/stories/[story-slug].md` — the story ACs and NFRs
4. `artefacts/[feature]/test-plans/[story-slug]-test-plan.md` — test strategy
5. `artefacts/[feature]/dor/[story-slug]-dor.md` — standards injected at DoR
6. `artefacts/[feature]/dod/[story-slug]-dod.md` — what actually shipped

Summarise what was found:

> **Artefact chain read for [story-slug]:**
> - Discovery: [one sentence problem summary]
> - Decisions logged: [n]
> - ACs shipped: [n/n]
> - NFRs verified: [list]
> - Standards injected at DoR: [list or "none"]
>
> Ready to scan for learnings. Reply: go

---

## Step 2 — Identify patterns and decisions

Scan across the artefact chain and identify items in these four categories:

### Category A — Technical patterns worth standardising
Things that worked well and should be repeated in future stories:
- Naming conventions that emerged
- Architectural patterns adopted
- Test strategies that gave good coverage cheaply
- Error handling approaches proven effective

### Category B — Standards gaps exposed
Moments where a missing standard caused confusion, a PR comment, or rework:
- "We had to discuss whether to..."
- "The reviewer asked us to change..."
- "We weren't sure if we should..."

### Category C — Reusable decisions
Decisions that are likely to recur and shouldn't be re-litigated each time:
- Technology choices with explicit reasoning
- Scope boundary calls that apply to similar future work
- Risk acceptances that define the team's operating posture

### Category D — Anti-patterns to avoid
Methods tried and found to not work:
- Approaches abandoned mid-implementation
- Test strategies that gave false confidence
- Patterns that caused rework

### Category E — Estimation actuals

Run `/estimate` (E3 mode) to compare actual focus time against the E1/E2 forecasts,
compute phase-level deltas, generate flow improvement findings, and append a row
to `workspace/estimation-norms.md`.

This step is mandatory if `estimate.e1` or `estimate.e2` is present in `workspace/state.json`.
If both are null (feature predates `/estimate` or estimation was skipped throughout),
still run E3 to write the actuals-only baseline row — it seeds the normalisation model
for future features.

Run `/estimate` now before presenting findings to the operator.

Present findings for confirmation:

> **Patterns identified:**
>
> [Category A — n items]
> - [summarise each]
>
> [Category B — n items]
> - [summarise each]
>
> [Category C — n items]
> - [summarise each]
>
> [Category D — n items]
> - [summarise each]
>
> Do you want to capture all of these, or select specific ones?
> Reply: all — or list which to keep

---

## Step 3 — Classify and route

For each accepted item, determine where it should be written:

| Type | Destination |
|------|-------------|
| Language/framework convention | `.github/standards/[domain]/[standard].md` |
| Architectural decision | `.github/architecture-guardrails.md` (Active ADRs) |
| Recurring scope or risk call | `artefacts/[feature]/decisions.md` + summary to guardrails if structural |
| Coding pattern | `.github/standards/[domain]/[standard].md` |
| Product/process insight | Note in `/decisions` for team awareness |
| Anti-pattern | `.github/standards/[domain]/[standard].md` (under "What to avoid") |

Confirm routing before writing:

> **Proposed writes:**
>
> 1. [item]: → `.github/standards/api/api-design.md` (new rule under "Naming")
> 2. [item]: → `.github/architecture-guardrails.md` (new ADR: "Adopt [pattern]")
> 3. [item]: → `artefacts/[feature]/decisions.md` (recurring scope call)
>
> Confirm these destinations?
> Reply: yes — or adjust any routing

---

## Step 4 — Write the updates

For each confirmed item, produce the exact text to add and the target location.

**Standards files:** append under the relevant section heading.
Create the file and section if they don't exist — don't leave orphaned rules.

**Architecture guardrails:** append a new ADR block:
```markdown
### ADR-[n]: [Decision title]
**Date:** [YYYY-MM-DD]
**Status:** Active
**Context:** [one sentence — what situation prompted this]
**Decision:** [what was decided]
**Rationale:** [why]
**Consequences:** [what this rules in or rules out going forward]
```

**`copilot-instructions.md`:** if a coding standard is universal (not domain-specific),
add it to the coding standards section.

Confirm each write before creating it:

> **Writing to `.github/standards/api/api-design.md`:**
> [preview of exact text]
>
> Confirm?
> Reply: yes — or adjust the wording

---

## Step 5 — Update standards index

After writing to any standards file:

1. Open `.github/standards/index.yml`
2. Verify the file is listed under the correct domain
3. If not listed — add it

> **Standards index updated:** [file] added to `[domain]` section.

---

## Completion output

> ✅ **Improve complete — [story-slug]**
>
> Patterns extracted: [n]
> Standards updated: [list of files]
> ADRs added: [n]
> Decisions logged: [n]
>
> These learnings are now active — /definition-of-ready will inject them
> into future stories with matching domain tags.
>
> **Governed path for upward standards loop:** If any extracted pattern warrants a SKILL.md update, produce a `proposed-skill-update.md` diff in `workspace/proposals/` with rationale and confidence score. Do not edit SKILL.md files directly — the squad lead raises a PR against the fleet repo; the platform team reviews and merges. All consuming repos receive the improvement on their next upstream sync.
>
> **Recommended: commit `.github/standards/` and `.github/architecture-guardrails.md`**
> with message: `chore: /improve learnings from [story-slug]`

---

## What this skill does NOT do

- Does not reopen the story or test plan — artefacts are read-only post-merge
- Does not create new stories from the learnings — that is a future /discovery or /definition run
- Does not update the story or DoD retroactively
- Does not assign action items to people — it writes to files only
- Does not edit SKILL.md files in the skills fleet directly — produces proposals for PR-based review instead

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill without completing this write.

Update `.github/pipeline-state.json`:

- Under the relevant feature: set `lastImprove: "[YYYY-MM-DD]"`
- Under `standards`: add each updated file name to a `recentUpdates` list

Confirm the write in your closing message: "Pipeline state updated ✅."
