## Story: Mechanism selection ADR — which enforcement mechanism applies to each surface class

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e3-structural-enforcement.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As a **platform maintainer (heymishy)**,
I want to **produce and commit an Architecture Decision Record specifying which enforcement mechanism (CLI, MCP, schema validation, GitHub Actions, or a combination) applies to each operator surface class**,
So that **E3 implementation stories have an unambiguous, reviewed architectural mandate to build against, and consumers know which mechanism governs their surface**.

## Benefit Linkage

**Metric moved:** M2 — Consumer confidence
**How:** A consumer's confidence that their outer loop was governed depends on knowing which enforcement mechanism applied to their specific surface. Without a mechanism selection ADR, consumers and second-line reviewers cannot assert that the right mechanism was applied — they can only see that some mechanism ran. The ADR is the record that makes "governance by design" claims auditable.

## Architecture Constraints

- ADR-004: the ADR must be committed to `.github/architecture-guardrails.md` as a new numbered entry — not to a feature artefact file; this is a structural constraint of the platform's ADR registry
- C4: this story requires heymishy's explicit review and approval before any E3 implementation story (p4.enf-package, p4.enf-mcp, p4.enf-cli, p4.enf-schema) may enter DoR — the ADR is the entry condition for those stories; an implementation story that enters DoR without the committed ADR reference fails H9
- MC-CORRECT-02: the `guardrails[]` entry written to `pipeline-state.json` must follow the schema-first field definition; no new pipeline-state.json field may be written without a corresponding schema update

## Dependencies

- **Upstream:** p4.spike-a, p4.spike-b1, p4.spike-b2 must all have verdicts (PROCEED or REDESIGN) — the ADR synthesises three spike findings; writing the ADR before all three verdicts exist produces an incomplete mechanism selection
- **Downstream:** p4.enf-package, p4.enf-mcp, p4.enf-cli, p4.enf-schema all depend on this ADR existing and being committed to `.github/architecture-guardrails.md`

## Acceptance Criteria

**AC1:** Given Spike A, Spike B1, and Spike B2 all have written verdicts, When heymishy writes the mechanism selection ADR, Then the ADR specifies for each of the four surface classes — (1) VS Code / Claude Code interactive operator, (2) CI / headless regulated, (3) chat-native progressive (e.g. GitHub Copilot Chat), (4) non-git-native (Teams, Confluence) — exactly which enforcement mechanism is selected, with a brief rationale linking back to the relevant spike verdict.

**AC2:** Given the ADR is written, When it is committed to `.github/architecture-guardrails.md`, Then the entry follows the ADR format already used in that file: context, options considered, decision, consequences, and revisit triggers — the new entry is appended to the active ADRs section under an ID of the form `ADR-phase4-enforcement`.

**AC3:** Given the ADR is committed to `.github/architecture-guardrails.md`, When `pipeline-state.json` is read, Then the feature's `guardrails[]` array contains an entry: `{"id": "ADR-phase4-enforcement", "file": ".github/architecture-guardrails.md", "status": "active"}`.

**AC4:** Given the ADR specifies that a surface class's enforcement mechanism is "deferred" (e.g. non-git-native surface if Spike D has not returned a verdict), When the ADR is read, Then the deferral is explicit — the surface class is named, the reason for deferral is stated (e.g. "Spike D verdict outstanding"), and the revisit trigger is named.

## Out of Scope

- Implementing any mechanism — this story writes the ADR and updates pipeline-state.json; code changes are in p4.enf-package, p4.enf-mcp, p4.enf-cli, p4.enf-schema
- Making the ADR for non-Phase-4 surfaces final — the ADR covers Phase 4 surface classes; Phase 5 surfaces may add new mechanisms via a Phase 5 ADR; this story does not attempt to pre-decide Phase 5
- Deciding which surface gets which _implementation priority_ — implementation order is an operator decision in the inner loop; the ADR records the mechanism per surface, not the implementation schedule

## NFRs

- **Audit:** ADR committed to `.github/architecture-guardrails.md` as the canonical ADR registry (ADR-004); `pipeline-state.json` updated with guardrails entry before this story is closed
- **Correctness:** ADR ID must not conflict with existing ADR IDs in `.github/architecture-guardrails.md`; the implementation-plan story checks this before committing
- **Security:** No credentials, API keys, or environment-specific configuration values in the ADR text (MC-SEC-02)

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable — once the spike verdicts exist, the ADR content follows from them; the structure is well-defined; the main risk is that a spike verdict arrives later than expected, delaying this story

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-decision.md |
| run_timestamp | 2026-04-19 |

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 14 |
| constraints_inferred_count | 3 |
| intermediates_prescribed | 4 |
| intermediates_produced | 14 |
