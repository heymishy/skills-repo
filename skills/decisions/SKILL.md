---
name: decisions
description: >
  Records human judgment calls, architectural decisions, scope choices, assumptions,
  and risk acceptances. Maintains two clearly separate tracks: a lightweight running
  log for in-flight decisions made during a session, and formal ADRs for structural
  decisions that need to survive long-term. Other skills invoke this at their decision
  points. Use when a significant decision is made, someone says "log this decision",
  "record why we chose", "add an ADR", "note this assumption", or "acknowledge this risk".
triggers:
  - "log this decision"
  - "record why we chose"
  - "add an ADR"
  - "note this assumption"
  - "acknowledge this risk"
  - "why did we decide"
  - "document this choice"
  - at any pipeline decision point
---

# Decisions Skill

## Entry condition

None. Runs at any pipeline stage. If `decisions.md` does not exist for this feature,
create it from `.github/templates/decision-log.md` before appending.

**Two ADR scopes - understand which applies:**
- **Feature-level decisions** (most common): made during this feature's pipeline.
  Live in `artefacts/[feature]/decisions.md`. Managed by this skill.
- **Repo-level ADRs** (structural, cross-feature): architectural decisions that
  apply to all features. Live in `.github/architecture-guardrails.md` under the
  Active ADRs section. When a decision is significant enough to constrain future
  features - a framework choice, a security pattern, a data handling rule - also
  add it to `.github/architecture-guardrails.md` as a repo-level ADR.

---

## Two tracks - ask first, always

When invoked, the first question is always which track:

> **Which type of record does this need?**
>
> 1. **Log entry** - quick, in-flight decision. Reversible or low-stakes.
>    Rationale fits in 1–2 sentences. Takes ~2 minutes.
>
> 2. **ADR (Architecture Decision Record)** - structural decision. Hard to reverse.
>    Affects multiple stories, epics, or the wider codebase. Future engineers need
>    full context. Takes 5–10 minutes.
>
> Not sure? Default to 1. An ADR can be written retrospectively if it turns out
> to matter more than expected.
>
> Reply: 1 or 2

---

## Track 1: Log entry

### Step 1 - The decision

> **What was decided?**
> (One clear sentence - not "we discussed the approach" but "we chose X over Y")
>
> Reply: state the decision

### Step 2 - Category

> **What category?**
>
> 1. SCOPE - what is or isn't in MVP
> 2. ARCH - structural or infrastructure choice
> 3. DESIGN - implementation pattern or approach
> 4. SLICE - story slicing or decomposition choice
> 5. ASSUMPTION - something assumed true that affects the work
> 6. RISK-ACCEPT - known risk acknowledged and accepted
>
> Reply: 1, 2, 3, 4, 5, or 6

### Step 3 - Alternatives

> **What other options were considered?**
> (Even if briefly - "no alternatives considered" is itself a useful signal)
>
> Reply: describe alternatives, or type "none considered"

### Step 4 - Rationale

> **Why this option?**
> (Forces, constraints, information that led here - not a restatement of the decision)
>
> Reply: explain the rationale

### Step 5 - Revisit trigger

> **What would cause you to revisit this decision?**
> (e.g. "If latency requirements tighten below 100ms", "If the vendor changes the API",
> "If we need to support more than 3 concurrent users")
>
> Reply: describe the trigger, or type "no obvious trigger"

### Log entry output

Append to the `## Log entries` section of `decisions.md`.
Format: see `## Log entries` in `templates/decision-log.md`.

> **Logged ✅**
> [Decision summary - one line]
>
> Continue working, or log another decision?
> Reply: continue - or log another

---

## Track 2: ADR

ADRs are heavyweight. Every section requires human input - the skill structures
and writes, but the substance must come from the human. The skill never generates
ADR content from inference.

### Step 1 - Title and number

Confirm the next ADR number from the existing log, then:

> **ADR-[N]: What is the short title for this decision?**
> (e.g. "Use IndexedDB over localStorage for offline data persistence")
>
> Reply: state the title

### Step 2 - Context

> **What is the situation that required this decision?**
> What were you trying to do, what constraint or question arose, and why couldn't
> you just proceed without deciding?
>
> Reply: describe the context

### Step 3 - Options considered

> **What were the options?**
> List each option with its key pros and cons.
> Minimum 2 options - if only one was ever considered, note that explicitly
> as it affects how the ADR should be read.
>
> Reply: list options with pros/cons

### Step 4 - Decision and primary reason

> **What was decided, and what was the primary reason?**
> (If multiple reasons, rank them - what tipped the balance?)
>
> Reply: state the decision and primary reason

### Step 5 - Consequences

> **What are the consequences of this decision?**
>
> Specifically:
> - What becomes easier?
> - What becomes harder or more constrained?
> - What is now off the table?
>
> Reply: describe the consequences

### Step 6 - Revisit trigger

> **What would cause this decision to be reconsidered?**
> (Think: technology changes, scale changes, regulatory changes, team changes)
>
> Reply: describe the trigger

### ADR output

Append to the `## Architecture Decision Records` section of `decisions.md`.
Format: see `## Architecture Decision Records` in `templates/decision-log.md`.

> **ADR-[N] recorded ✅**
> [Title]
>
> This ADR should be referenced in any story or artefact it constrains.
> Want to note any artefacts that should reference ADR-[N]?
> Reply: yes - list them / no

---

## When other skills invoke this skill

The following pipeline points should produce a log entry. When running these
skills, the decision point is marked - invoke /decisions at that point:

| Skill | Decision point | Category |
|-------|---------------|----------|
| /discovery | MVP scope finalised | SCOPE |
| /discovery | Item moved to out-of-scope | SCOPE |
| /benefit-metric | Meta-benefit flag set | ASSUMPTION |
| /clarify | Assumption added or materially changed during clarification | ASSUMPTION |
| /definition | Slicing strategy chosen | SLICE |
| /definition | Scope note resolved (add/defer/replace) | SCOPE |
| /definition | Scope accumulator flags drift - decision made | SCOPE |
| /review | MEDIUM finding acknowledged and proceeded | RISK-ACCEPT |
| /review | LOW finding accepted and not resolved | RISK-ACCEPT |
| /definition-of-ready | Warning acknowledged | RISK-ACCEPT |
| /definition-of-ready | Oversight level overridden | RISK-ACCEPT |
| /test-plan | Test gap acknowledged | RISK-ACCEPT |
| /test-plan | Untestable AC accepted | RISK-ACCEPT |
| /spike | Outcome logged (PROCEED / REDESIGN / DEFER) | ARCH or DESIGN or RISK-ACCEPT |
| /definition-of-done | AC deviation accepted | RISK-ACCEPT or SCOPE |

---

## Reading the decision log

When asked "why did we decide X" or "what's the history of Y":

1. Check log entries for relevant category or keyword
2. Check ADRs for structural decisions
3. If not found:

> **No decision log entry found for this.**
> If this decision was made but not logged, would you like to add a
> retrospective entry now?
>
> Reply: yes - or no

---

## Retrospective entries

Valid and encouraged. Retrospective entries are better than gaps.

Add to the log entry format:

```markdown
**[DATE of logging] | [CATEGORY] | [STAGE] | RETROSPECTIVE**
**Decision made approximately:** [when, if known]
```

> Retrospective entry ready to log. Proceed the same as a standard log entry.
> What was decided?

---

## Quality checks before appending

- Decision is specific - not "we discussed the approach"
- Alternatives field is not blank - at minimum "None formally considered"
- Rationale explains reasoning, not just restates the decision
- Made by names a person or role - not "the team" if a specific person decided
- ADR has human-provided content in every section - not inferred by the agent

---

## What this skill does NOT do

- Does not make decisions - records them
- Does not evaluate whether decisions were good
- Does not replace story or epic artefacts
- Does not create Jira tickets or Confluence pages
- Does not generate ADR content from inference - substance must come from the human

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill without completing this write. Confirm the write in your closing message: "Pipeline state updated ✅."

Update `.github/pipeline-state.json` for the relevant feature after each decision is recorded:

- Set `updatedAt: [now]`
- If a `RISK-ACCEPT` was recorded: add a `riskAcceptances` entry with `id`, `decision`, and `date`
- Do not change `stage` — /decisions does not advance the pipeline stage
