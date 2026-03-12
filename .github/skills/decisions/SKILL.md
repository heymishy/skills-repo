---
name: decisions
description: >
  Records human judgment calls, architectural decisions, scope choices, assumptions,
  and risk acceptances to the feature decision log. Use when a significant decision
  is made during any pipeline stage, when someone says "log this decision", "record
  why we chose", "add an ADR", "note this assumption", or "acknowledge this risk".
  Also invoked automatically by other skills at their decision points.
  Produces or appends to .github/artefacts/[feature]/decisions.md
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

## Entry condition check

No hard prerequisites. This skill can run at any pipeline stage.

If `.github/artefacts/[feature]/decisions.md` does not exist, create it from 
`.github/templates/decision-log.md` before appending. Do not create a blank file.

---

## When other skills invoke this skill

The following pipeline skills have explicit decision points that should produce 
a decisions log entry. When running these skills, invoke /decisions at the 
marked point:

| Skill | Decision point | Category |
|-------|---------------|----------|
| `/discovery` | MVP scope finalised | `SCOPE` |
| `/discovery` | Any item explicitly moved to out-of-scope | `SCOPE` |
| `/benefit-metric` | Meta-benefit flag set | `ASSUMPTION` |
| `/definition` | Slicing strategy chosen | `SLICE` |
| `/definition` | Any scope note resolved (add/defer/replace) | `SCOPE` |
| `/review` | MEDIUM finding acknowledged and proceeded | `RISK-ACCEPT` |
| `/review` | LOW finding accepted and not resolved | `RISK-ACCEPT` |
| `/definition-of-ready` | Warning acknowledged | `RISK-ACCEPT` |
| `/definition-of-ready` | Oversight level overridden from epic default | `RISK-ACCEPT` |
| `/test-plan` | Test gap acknowledged | `RISK-ACCEPT` |
| `/test-plan` | Untestable AC accepted | `RISK-ACCEPT` |
| PR review | Any implementation decision not in story/test plan | `ARCH` or `DESIGN` |
| `/definition-of-done` | AC deviation accepted | `RISK-ACCEPT` or `SCOPE` |

---

## Determining the right entry type

Ask the human: is this decision complex enough to warrant a full ADR, 
or is a log entry sufficient?

**Use a log entry** (quick, inline) when:
- The decision is reversible or low-stakes
- The rationale fits in 1–2 sentences
- It's a pattern choice, not a structural choice
- It's a risk acceptance with a clear mitigant

**Use an ADR** when:
- The decision is hard to reverse
- It affects multiple stories, epics, or the wider codebase
- A future engineer would need full context to understand why
- Significant options were considered and rejected
- There are meaningful consequences that restrict future choices

If uncertain, default to a log entry. An ADR can be written retrospectively 
if the decision turns out to be more significant than expected.

---

## Log entry format

Append to the `## Log entries` section of `decisions.md`:

```markdown
---
**[DATE] | [CATEGORY] | [STAGE where decision was made]**
**Decision:** [One clear sentence — what was decided]
**Alternatives considered:** [What else was on the table — even if briefly]
**Rationale:** [Why this option — forces, constraints, information]
**Made by:** [Name + role or basis for the decision]
**Revisit trigger:** [What would cause this to be reconsidered]
---
```

If the human doesn't provide alternatives or revisit trigger, prompt for them:
- "What other options were considered, even briefly?"
- "What would change to make you revisit this decision?"

These two fields are the most valuable for future readers and the most commonly skipped.

---

## ADR format

When an ADR is warranted, append to the `## Architecture Decision Records` section.
Number sequentially from the last ADR in the file.

Prompt the human for each section if not already provided:
1. Context — "What was the situation that required this decision?"
2. Options — "What were the options? List pros and cons for each."
3. Decision — "What was decided and the primary reason?"
4. Consequences — "What becomes easier? What becomes harder? What's now off the table?"
5. Revisit trigger — "What would make you reconsider this?"

Do not generate the ADR content without human input on these questions.
The ADR records the human's reasoning — the skill structures and writes it, 
but the substance must come from the human.

---

## Reading the decision log

When asked "why did we decide X" or "what's the history of Y":

1. Check `decisions.md` log entries for relevant entries by category or keyword
2. Check ADRs for structural decisions
3. If not found, note the gap: "No decision log entry found for this. 
   If this decision was made, consider adding a retrospective entry now."

---

## Retrospective entries

It is valid (and encouraged) to add retrospective entries — decisions that were 
made but not logged at the time. Use this format addition:

```markdown
**[DATE of logging] | [CATEGORY] | [STAGE] | ⚠️ RETROSPECTIVE**
**Decision made approximately:** [when, if known]
```

Retrospective entries are better than gaps. They support honest retrospectives.

---

## Quality checks before appending

- Decision is specific — not "we discussed the approach" but "we chose X over Y"
- Alternatives field is not blank — at minimum "No alternatives formally considered"  
  (which is itself a useful signal)
- Rationale explains the reasoning, not just restates the decision
- Made by names a person or role — not "the team" if a specific person decided
- Category is correct — check the table above if uncertain

## What this skill does NOT do

- Does not make decisions — it records them
- Does not evaluate whether decisions were good — it records them faithfully
- Does not replace story or epic artefacts — those record outputs, this records reasoning
- Does not create Jira tickets or Confluence pages — local artefact only
