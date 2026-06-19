# Decision Log: [feature-slug]

<!--
  PURPOSE: Records the reasoning behind human judgment calls made during the pipeline.
  
  Artefacts record WHAT was decided.
  This log records WHY, by WHOM, and what was considered and rejected.
  
  This is the document you read six months later when someone asks:
  "Why did we do it this way?" or "Who agreed to skip that?"
  
  Written to by: pipeline skills (at decision points) and humans (during implementation).
  Read by: retrospectives, audits, onboarding, future work on this feature.
  
  To evolve this format: update templates/decision-log.md and open a PR.
-->

**Feature:** [name]
**Discovery reference:** [link]
**Last updated:** [date]

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

<!--
  Add entries chronologically. Most recent at the bottom.
  
  Each entry:
  ---
  **[DATE] | [CATEGORY] | [STAGE]**
  **Decision:** [What was decided — one clear sentence]
  **Alternatives considered:** [What else was on the table, even briefly]
  **Rationale:** [Why this option — forces, constraints, information that drove the choice]
  **Made by:** [Name + role or basis for the decision]
  **Revisit trigger:** [What would cause this decision to be revisited? "Never" is valid.]
  ---
-->

<!-- Pipeline will append entries here as decisions are made -->

---

## Architecture Decision Records

<!--
  For decisions that warrant more depth than a log entry — significant technical
  choices with long-term implications, irreversible or hard-to-reverse decisions,
  choices that affect multiple stories or the wider codebase.
  
  Use ADR format below. For lightweight decisions, a log entry above is sufficient.
  Rule of thumb: if a future engineer would want to understand the full context 
  of why this choice was made, write an ADR.
-->

### ADR-001: [Title]

**Status:** [Proposed / Accepted / Deprecated / Superseded by ADR-XXX]
**Date:** 
**Decided by:** 

#### Context
<!--
  The situation that necessitated a decision. What forces were at play?
  What constraints existed? What problem were we trying to solve?
  Write as if explaining to someone who wasn't in the room.
-->

#### Options considered

| Option | Pros | Cons |
|--------|------|------|
| [Option A — the one chosen] | | |
| [Option B] | | |
| [Option C if applicable] | | |

#### Decision
<!-- What was decided and the primary reason. One paragraph. -->

#### Consequences
<!-- What becomes easier, what becomes harder, what is now off the table. -->

#### Revisit trigger
<!-- What circumstance would make us reconsider this? -->

---
<!-- Add further ADRs as ADR-002, ADR-003 etc. -->
