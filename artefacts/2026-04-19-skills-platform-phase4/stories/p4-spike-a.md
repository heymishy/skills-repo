## Story: Determine whether governance logic is extractable into a shared package (Spike A)

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e1-spike-programme.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As a **platform maintainer (heymishy)**,
I want to **determine whether the governance logic — skill resolution, hash verification, gate evaluation, state advancement, and trace writing — can be extracted into a shared package that CLI, MCP server, and orchestration framework mechanisms all invoke**,
So that **Phase 4's enforcement mechanism implementation stories begin with a resolved architecture decision rather than a competing-implementation assumption**.

## Benefit Linkage

**Metric moved:** M2 — Consumer confidence
**How:** Mechanism selection (Spikes B1 and B2) cannot be committed without knowing whether a shared governance core is viable. If Spike A produces PROCEED, E3 stories decompose against a single package interface. If REDESIGN, each mechanism implements its own agreed contracts. Either way, consumer confidence depends on the enforcement architecture being decided before stories start — not halfway through.

## Architecture Constraints

- ADR-004: any shared package configuration must be sourced from `.github/context.yml` — no hardcoded paths or mechanism-specific config files
- MC-CORRECT-02: any new fields written to `pipeline-state.json` by the spike output must follow schema-first definition — define the field in the schema before writing it
- C5: hash verification is the primary audit signal and must be preserved intact in any extracted package interface — it cannot be relaxed as a simplification
- C4: human approval is required at every gate; the shared package must route approval events through the approval-channel adapter (ADR-006), not handle them inline
- MC-SEC-02: no API keys, tokens, or credentials may appear in spike output artefacts or be hard-coded in any package design proposal

## Dependencies

- **Upstream:** None — this is the first spike and gates all others
- **Downstream:** p4.spike-b1 and p4.spike-b2 both depend on the shared core interface this spike produces; p4.enf-package in E3 depends on PROCEED verdict

## Acceptance Criteria

**AC1:** Given heymishy has completed the spike investigation, When the spike output artefact is written to `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md`, Then the artefact contains one of the four valid verdicts (PROCEED / REDESIGN / DEFER / REJECT) as a top-level labelled field, with a rationale of at least 3 sentences explaining the evidence that drove the verdict.

**AC2:** Given the spike produces a PROCEED verdict, When heymishy reviews the artefact, Then the artefact defines a candidate package interface — at minimum: the function signatures or contract shapes for skill-resolution, hash-verification, gate-evaluation, state-advancement, and trace-writing — precise enough that Spike B1 and Spike B2 can each evaluate whether their mechanism adapter satisfies it.

**AC3:** Given the spike produces a REDESIGN verdict, When heymishy reviews the artefact, Then the artefact defines the specific constraint that prevents a single shared package (e.g. incompatible runtime assumptions, CLI vs MCP lifecycle differences) and proposes the minimum shared contract — at least skill-format and trace-schema — that mechanisms must honour even without a shared implementation.

**AC4:** Given the spike produces any verdict, When heymishy records the outcome, Then the verdict is written to `pipeline-state.json` under the feature's spike record AND a corresponding ADR entry is added to `artefacts/2026-04-19-skills-platform-phase4/decisions.md` documenting the decision, the alternatives considered, and the revisit trigger.

**AC5:** Given the spike artefact exists with a PROCEED or REDESIGN verdict, When the next operator session begins E3 story decomposition, Then no E3 story (p4.enf-package, p4.enf-mcp, p4.enf-cli, p4.enf-schema) may enter DoR without referencing the Spike A output artefact as its architecture input.

## Out of Scope

- Implementing the shared package — the spike produces a design decision and interface definition, not shipping code; p4.enf-package in E3 is the implementation story
- Evaluating any specific enforcement mechanism (CLI, MCP, orchestration, schema, GitHub Actions) — those are Spikes B1 and B2; this spike asks only whether a shared core is extractable
- Changing any existing `src/*` component, `scripts/`, or `.github/workflows/` — the spike is a design artefact, not a code change
- Deciding which mechanism to use for which surface class — that is p4.enf-decision in E3

## NFRs

- **Security:** Spike output artefact must not include any API keys, tokens, or production secrets (MC-SEC-02); interface proposals must preserve hash-at-execution-time as the primary audit signal (C5)
- **Audit:** Spike verdict is written to both the spike artefact and `pipeline-state.json`; decisions.md entry is mandatory before this story is closed
- **Performance:** None identified — this is a design spike, not a runtime implementation

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable — the spike may surface a constraint that requires the scope to be reshaped mid-investigation

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

---

## Capture Block

### Metadata

| Field | Value |
|-------|-------|
| experiment_id | exp-phase4-sonnet-vs-opus-20260419 |
| model_label | claude-sonnet-4-6 |
| cost_tier | fast |
| skill_name | definition |
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-a.md |
| run_timestamp | 2026-04-19 |

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 14 |
| constraints_inferred_count | 5 |
| intermediates_prescribed | 5 |
| intermediates_produced | 1 |
