<!-- ASSEMBLED COPILOT INSTRUCTIONS
  assembled-at:         2026-04-10T05:04:47Z
  platform-version:     abc1234def5678
  distribution-model:   pull

  Layer composition (in order):
    1. core-platform    https://github.com/heymishy/skills-repo@abc1234def5678
    2. domain           [absent]
    3. squad            [absent]

  To regenerate: bash scripts/assemble-copilot-instructions.sh
  Reference: artefacts/2026-04-09-skills-platform-phase1/decisions.md
-->

# Copilot Instructions

## Progressive Skill Disclosure

Skills are loaded in two phases to keep the session-start context within the
token budget (≤ 8,000 tokens). Outer loop skills are available immediately.
Inner loop skills are available on demand via `/load [skill-name]`.

### Outer loop — loaded at session start

- **/discovery** — 
Structures a raw idea, problem statement, or opportunity into a formal discovery artefact. Use when someone says "I have an idea", "we should build", "there's a problem with", "can we explore", or pastes a rough ticket, brief, or idea. Produces a discovery artefact that, once approved, unlocks /benefit-metric. Does not produce metrics, stories, or technical design - those are downstream skills. Asks clarifying questions one at a time - never presents a form to fill in.
- **/benefit-metric** — 
Defines measurable outcomes for an approved discovery artefact. Produces a benefit-metric artefact conforming to templates/benefit-metric.md. Use when discovery is approved and someone says "define the metrics", "what does success look like", "how will we measure this", or proceeds past discovery. Detects meta-benefit situations (pilot, tooling test, process experiment) and separates them from product metrics. Does not write stories - that is /definition.
- **/definition** — 
Breaks an approved discovery + benefit-metric pair into epics and stories conforming to templates/epic.md and templates/story.md. Offers slicing strategy choice before decomposing. Runs a scope accumulator at the end - compares total story scope against the original discovery MVP to surface scope drift across the full set, not just individual stories. Does not produce test plans or API contracts. Requires approved discovery AND active benefit-metric artefact.
- **/review** — 
Reviews story artefacts for quality, completeness, traceability, and scope discipline. Produces structured findings with HIGH/MEDIUM/LOW severity. On re-runs, produces a diff showing exactly what changed. HIGH findings block progression to /test-plan. Use when stories exist and someone says "review the stories", "check the definition", "quality check", "re-review", or moves past definition. Run per story or per epic batch.
- **/test-plan** — 
Writes a failing test plan for a story that has passed /review. Produces TWO outputs: (1) a technical test plan for the coding agent and CI; (2) a plain-language AC verification script for human review before coding and smoke testing after merge. Includes a test data strategy section — critical for payments and regulated systems. Use when someone says "write tests for", "create the test plan", "what tests do we need", or moves past a passed review. Requires a story artefact and passed review. Tests are written to fail — TDD discipline enforced.
- **/definition-of-ready** — 
Final gate check before a story is handed to the coding agent. Runs hard blocks (H1–H9, H-E2E, H-NFR through H-NFR3) and warnings (W1-W5), determines oversight level, and produces a coding agent instructions block when all hard blocks pass. Blocks are unambiguous - all must pass, no exceptions. Warnings require explicit acknowledgement. Use when test plan and review are complete and someone says "is this story ready", "definition of ready", "ready to code", or moves past /test-plan.
- **/workflow** — 
Pipeline navigator and diagnostic. Checks the state of all artefacts for the current feature, tells you exactly which skill to run next, and diagnoses why a feature is stuck when nothing has moved. Detects stalled features, identifies the specific blocking item, and tells you who or what can resolve it. Use when starting a session, saying "what's next", "where are we", "start a new feature", "continue working on [feature]", "why is this stuck", or "pipeline status". Routes to short-track for simple tasks. Routes to /spike for genuine unknowns. Always safe to run — no prerequisites.
- **/decisions** — 
Records human judgment calls, architectural decisions, scope choices, assumptions, and risk acceptances. Maintains two clearly separate tracks: a lightweight running log for in-flight decisions made during a session, and formal ADRs for structural decisions that need to survive long-term. Other skills invoke this at their decision points. Use when a significant decision is made, someone says "log this decision", "record why we chose", "add an ADR", "note this assumption", or "acknowledge this risk".


### Inner loop — deferred (available on demand)

Use `/load [skill-name]` to add any of the following to your current session.
The skill loads from the versioned platform reference in the composition header
above. No session restart required.

- tdd
- implementation-plan
- subagent-execution
- verify-completion
- branch-setup
- branch-complete

### `/load` handler

When you see `/load [skill-name]` in a user message:
1. Identify the skill name from the list above (or any core platform skill).
2. Read the skill instructions from the platform version recorded in the
   composition header at the top of this file.
3. Apply the skill for the remainder of this session without restart.
4. Confirm: "Loaded: /[skill-name] — available for this session."

If the skill is not in the inner loop list above, check whether it is a valid
core platform skill name. If unrecognised, respond: "Unknown skill: [name]."

---

## Core Platform Layer

*Source: core-platform — see composition header for version reference.*

The following outer loop skills are active at session start.
Use `/load [skill-name]` for any skill (including inner loop) to get full instructions.

#### /discovery


Structures a raw idea, problem statement, or opportunity into a formal discovery artefact. Use when someone says "I have an idea", "we should build", "there's a problem with", "can we explore", or pastes a rough ticket, brief, or idea. Produces a discovery artefact that, once approved, unlocks /benefit-metric. Does not produce metrics, stories, or technical design - those are downstream skills. Asks clarifying questions one at a time - never presents a form to fill in.

Triggers: I have an idea,, we should build,, there's a problem with,, can we explore,, new feature,, new initiative,, discovery

#### /benefit-metric


Defines measurable outcomes for an approved discovery artefact. Produces a benefit-metric artefact conforming to templates/benefit-metric.md. Use when discovery is approved and someone says "define the metrics", "what does success look like", "how will we measure this", or proceeds past discovery. Detects meta-benefit situations (pilot, tooling test, process experiment) and separates them from product metrics. Does not write stories - that is /definition.

Triggers: define the metrics,, what does success look like,, how will we measure this,, benefit metric,, metrics for,,   - after discovery approval

#### /definition


Breaks an approved discovery + benefit-metric pair into epics and stories conforming to templates/epic.md and templates/story.md. Offers slicing strategy choice before decomposing. Runs a scope accumulator at the end - compares total story scope against the original discovery MVP to surface scope drift across the full set, not just individual stories. Does not produce test plans or API contracts. Requires approved discovery AND active benefit-metric artefact.

Triggers: break this down,, create stories,, write the epics,, define the work,, decompose this,, what are the stories for

#### /review


Reviews story artefacts for quality, completeness, traceability, and scope discipline. Produces structured findings with HIGH/MEDIUM/LOW severity. On re-runs, produces a diff showing exactly what changed. HIGH findings block progression to /test-plan. Use when stories exist and someone says "review the stories", "check the definition", "quality check", "re-review", or moves past definition. Run per story or per epic batch.

Triggers: review the stories,, check the definition,, quality check,, are these stories good,, review this epic,, re-review,, findings

#### /test-plan


Writes a failing test plan for a story that has passed /review. Produces TWO outputs: (1) a technical test plan for the coding agent and CI; (2) a plain-language AC verification script for human review before coding and smoke testing after merge. Includes a test data strategy section — critical for payments and regulated systems. Use when someone says "write tests for", "create the test plan", "what tests do we need", or moves past a passed review. Requires a story artefact and passed review. Tests are written to fail — TDD discipline enforced.

Triggers: write tests for,, create the test plan,, what tests do we need,, test plan for,, TDD,, write failing tests,, verification script

#### /definition-of-ready


Final gate check before a story is handed to the coding agent. Runs hard blocks (H1–H9, H-E2E, H-NFR through H-NFR3) and warnings (W1-W5), determines oversight level, and produces a coding agent instructions block when all hard blocks pass. Blocks are unambiguous - all must pass, no exceptions. Warnings require explicit acknowledgement. Use when test plan and review are complete and someone says "is this story ready", "definition of ready", "ready to code", or moves past /test-plan.

Triggers: is this story ready,, definition of ready,, ready to code,, DoR,, can we start coding,, assign to coding agent

#### /workflow


Pipeline navigator and diagnostic. Checks the state of all artefacts for the current feature, tells you exactly which skill to run next, and diagnoses why a feature is stuck when nothing has moved. Detects stalled features, identifies the specific blocking item, and tells you who or what can resolve it. Use when starting a session, saying "what's next", "where are we", "start a new feature", "continue working on [feature]", "why is this stuck", or "pipeline status". Routes to short-track for simple tasks. Routes to /spike for genuine unknowns. Always safe to run — no prerequisites.

Triggers: what's next,, where are we in the pipeline,, start a new feature,, session start,, continue working on,, what should I work on,, pipeline status,, why is this stuck,, what's blocking,, pipeline health

#### /decisions


Records human judgment calls, architectural decisions, scope choices, assumptions, and risk acceptances. Maintains two clearly separate tracks: a lightweight running log for in-flight decisions made during a session, and formal ADRs for structural decisions that need to survive long-term. Other skills invoke this at their decision points. Use when a significant decision is made, someone says "log this decision", "record why we chose", "add an ADR", "note this assumption", or "acknowledge this risk".

Triggers: log this decision,, record why we chose,, add an ADR,, note this assumption,, acknowledge this risk,, why did we decide,, document this choice,,   - at any pipeline decision point

## Domain Layer

*[absent — no domain layer configured]*

To add a domain layer:
```bash
bash scripts/assemble-copilot-instructions.sh --domain-layer path/to/domain-instructions.md
```

---

## Squad Layer

*[absent — no squad layer configured]*

To add a squad layer:
```bash
bash scripts/assemble-copilot-instructions.sh --squad-layer path/to/squad-instructions.md
```

