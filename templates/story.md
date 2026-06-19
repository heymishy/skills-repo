# Story Template

<!--
  USAGE: This is the canonical format for all stories produced by the /definition skill.
  Skills reference this file. Do not embed story structure inside skill files.
  To evolve the format: update this file, open a PR, tag BA lead + QA lead for review.
  
  A well-formed story is independently testable, delivers observable value, 
  and can be traced back to a benefit metric. If a story cannot do all three, 
  it is either a task (merge it) or a spike (label it differently).
-->

## Story: [Title]

<!-- Title format: verb + object + context
     Good: "Export grid results as CSV from the canvas view"
     Bad:  "CSV export" -->

**Epic reference:** [Link to parent epic]
**Discovery reference:** [Link to approved discovery artefact]
**Benefit-metric reference:** [Link to benefit-metric artefact]

## User Story

As a **[persona]**,
I want to **[specific action]**,
So that **[observable outcome]**.

<!--
  Persona: must be a named segment from the benefit-metric artefact, not "a user" or "the system".
  Action: specific and bounded — avoid "manage", "handle", "deal with".
  Outcome: connects directly to a benefit metric. If it doesn't, the story needs rethinking.
  
  Good: "As a workshop facilitator, I want to export the canvas as CSV, 
         so that I can share results with stakeholders who don't have tool access."
  Bad:  "As a user, I want to export data so that I can use it elsewhere."
-->

## Benefit Linkage

**Metric moved:** [Name of metric from benefit-metric artefact]
**How:** One honest sentence explaining the mechanism by which completing this story 
         moves that metric. If you cannot write this sentence, reconsider the story.

<!--
  Example: "Completing this story reduces the post-session admin time metric 
            by eliminating manual transcription of canvas results."
  
  "We need this to build the next thing" is not a benefit linkage — 
  that describes a technical dependency, not user value.
  If a story is a pure technical dependency, label it as a task and note which story it unblocks.
-->

## Architecture Constraints

<!--
  List any architecture guardrails, ADRs, pattern library references, or style guide
  constraints that apply to this story's implementation.
  Check .github/architecture-guardrails.md before writing stories.
  
  Write "None identified — checked against .github/architecture-guardrails.md" if
  genuinely none apply. Do not leave blank.
  
  Examples:
  - "ADR-003: must use shared auth service — no local session handling"
  - "Pattern library: use <DataTable> component, not a custom table"
  - "Guardrail: no direct DB access from UI layer — all data via API"
  - "Mandatory constraint: all user inputs validated server-side"
-->

[ADR / guardrail / pattern references — or "None identified — checked"]

## Dependencies

<!--
  Optional for single-team features. Mandatory for programme-track stories.
  List any upstream stories, workstreams, or external deliverables that must
  complete before this story can start or proceed past a given stage.
  
  If none, write "None" — do not leave blank on programme-track stories.
  
  Examples:
  - "Upstream: cards-account-api workstream must deliver signed-off API contract
    before this story can proceed past /definition"
  - "Upstream: Story [slug] must be DoD-complete — this story consumes its output"
  - "Infrastructure: [environment] must be provisioned by [team] before coding starts"
-->

- **Upstream:** [Story, workstream, or external deliverable — or "None"]
- **Downstream:** [What this story unblocks — or "None"]

## Acceptance Criteria

<!--
  Format: Given / When / Then.
  Rules:
  - Minimum 3 ACs per story.
  - Each AC must be independently testable without running other ACs first.
  - Edge cases get their own AC, not a sub-bullet.
  - ACs describe observable behaviour, not implementation approach.
  - Avoid "should" — use "does" or "returns" or "displays".
  
  Good: "Given a canvas with 5 cards, When I click Export CSV, 
         Then a CSV file downloads containing one row per card with columns: 
         title, position, category, timestamp."
  Bad:  "The CSV export works correctly."
-->

**AC1:** Given [context], When [action], Then [observable outcome].

**AC2:** Given [context], When [action], Then [observable outcome].

**AC3:** Given [context], When [action], Then [observable outcome].

<!-- Add more ACs as needed. There is no maximum. -->

## Out of Scope

<!--
  MANDATORY. "N/A" is not acceptable.
  Name at least one adjacent behaviour this story explicitly excludes.
  This is what the /review skill checks against.
  
  Example: "Excel export format is out of scope for this story — separate story."
           "Bulk export of multiple canvases is out of scope."
-->

- [Adjacent behaviour explicitly excluded]

## NFRs

<!--
  Non-functional requirements specific to this story.
  Do not leave blank — write "None identified" if genuinely none apply.
  Common categories for a banking context: performance, security, audit logging, 
  accessibility, data residency, PCI scope.
-->

- **Performance:** [e.g. Export completes in under 3 seconds for canvases up to 100 cards]
- **Security:** [e.g. Exported file must not contain session tokens or internal IDs]
- **Accessibility:** [e.g. Export button meets WCAG 2.1 AA]
- **Audit:** [e.g. Export action is logged with user ID and timestamp]

## Complexity Rating

**Rating:** [1 / 2 / 3]
**Scope stability:** [Stable / Unstable]

## Definition of Ready Pre-check

<!--
  Filled in by the /definition-of-ready skill before handing to coding agent.
  Leave blank at story creation — populated at DoR stage.
-->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
