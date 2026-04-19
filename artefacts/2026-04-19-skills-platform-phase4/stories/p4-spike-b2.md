## Story: Evaluate Craig's CLI MVP as the reference implementation for regulated and CI surface enforcement (Spike B2)

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e1-spike-programme.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As a **platform maintainer (heymishy)**,
I want to **evaluate Craig's CLI approach — as documented in `artefacts/2026-04-18-cli-approach/` (PR #155) — as the candidate mechanism 1 of 5 for regulated and CI surface enforcement**, 
So that **the mechanism selection ADR has an evidence-backed verdict for the CLI mechanism, and p4.enf-cli in E3 either proceeds on a tested foundation or is reshaped based on findings**.

## Benefit Linkage

**Metric moved:** M1 — Distribution sync; M2 — Consumer confidence
**How:** Craig's CLI MVP is the most concrete distribution + enforcement candidate in Phase 4. A PROCEED verdict from this spike means M1's zero-commit install target has a specific implementation path (Craig's sidecar + lockfile + init command), and M2's confidence claim has an enforcement mechanism for the regulated/CI surface class. Without this verdict, neither metric has a grounded implementation approach for those surface types.

## Architecture Constraints

- C5: hash verification at envelope build is the primary audit signal — Spike B2 must explicitly verify that Craig's `verify` command fires on a deliberate hash mismatch and that mismatch aborts the step (not silently proceeds); this is the load-bearing claim in `artefacts/2026-04-18-cli-approach/discovery.md` MVP scope item 1
- C1: non-fork distribution — the spike must confirm that the sidecar install (`init`) does not require forking `heymishy/skills-repo`; a consumer repository using Craig's CLI must contain no copy of any SKILL.md or POLICY.md file
- C4: human approval gates — Craig's CLI must route approval-gate nodes through the existing approval-channel adapter, not implement inline approval handling
- ADR-004: any CLI configuration (upstream source URL, surface type, skill pin versions) must be sourced from `.github/context.yml` — the spike must note any CLI configuration that bypasses context.yml
- MC-CORRECT-02: if the spike produces any new `pipeline-state.json` fields (e.g. a spike-b2 verdict record), those fields must follow schema-first definition
- MC-SEC-02: spike output artefacts and any CLI config files produced must not contain API keys, tokens, or credentials

## Dependencies

- **Upstream:** p4.spike-a must have a PROCEED or REDESIGN verdict — Spike B2 evaluates Craig's CLI against the shared package interface or shared contracts Spike A produces; without Spike A's output, the spike cannot assess whether Craig's CLI is the right adapter shape
- **Downstream:** p4.enf-cli in E3 depends on a PROCEED or REDESIGN verdict from this spike; p4.dist-install, p4.dist-lockfile, and p4.dist-no-commits in E2 all consume the sidecar design validated here

## Acceptance Criteria

**AC1:** Given heymishy has read Craig's discovery artefact at `artefacts/2026-04-18-cli-approach/discovery.md`, the benefit-metric at `artefacts/2026-04-18-cli-approach/benefit-metric.md`, and reference documents 012 and 013 under `artefacts/2026-04-18-cli-approach/reference/`, When the Spike B2 investigation runs, Then the spike output artefact at `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-b2-output.md` records that these artefacts were read as inputs — Craig's work is evaluated as a reference implementation, not reconstructed from scratch.

**AC2:** Given the spike tests Craig's CLI reference implementation against the four fidelity properties, When heymishy records the results, Then the artefact states the observed outcome for each of P1 (skill-as-contract: does `verify` abort on a deliberate hash mismatch?), P2 (context injection: does the envelope build assemble skill body + standards + artefacts before handoff?), P3 (trace anchoring: does `emit-trace` produce a trace entry accepted by the existing `assurance-gate.yml`?), and P4 (interaction mediation: does the envelope permit single-turn only for skills prescribing per-exchange mediation?) — each as SATISFIED, PARTIAL, or NOT MET with a rationale.

**AC3:** Given Assumption A2 in Craig's discovery (the existing `assurance-gate.yml` can re-verify a CLI-emitted trace with minor-to-no modification), When the spike runs Assumption A2 validation, Then the artefact explicitly records whether the assurance gate accepted a CLI-emitted trace without requiring a new parallel gate — if the gate required substantial modification, the artefact states the specific schema delta and flags this as a REDESIGN trigger.

**AC4:** Given the spike produces any verdict, When heymishy records the outcome, Then a PROCEED / REDESIGN / DEFER / REJECT verdict is written to both `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-b2-output.md` and `pipeline-state.json` under the feature's spike record, AND an ADR entry is added to `artefacts/2026-04-19-skills-platform-phase4/decisions.md` covering the CLI-for-regulated-CI-surface decision, alternatives considered, and the revisit trigger — this is the mechanism-selection ADR that Craig's PR #155 requested heymishy generate.

**AC5:** Given a PROCEED verdict, When heymishy begins the p4.enf-cli story in E3, Then p4.enf-cli's architecture constraints section references both the Spike A package interface and the Spike B2 output as inputs, and the story explicitly notes that Craig's `artefacts/2026-04-18-cli-approach/` artefacts are the source reference implementation — the implementation story does not re-derive the CLI design from scratch.

## Out of Scope

- Merging PR #155 as part of this spike — Spike B2 reads Craig's artefacts as inputs to the evaluation; whether to merge PR #155 is a separate decision recorded in decisions.md after the verdict
- Implementing the CLI enforcement adapter for production — that is p4.enf-cli in E3
- Evaluating Mode 2 (headless subprocess) or Mode 3 (CLI-as-MCP-server) — the spike evaluates Mode 1 (human-driven interactive) only, consistent with Craig's MVP scope
- Evaluating non-git-native surfaces — the spike is git-native only, consistent with Craig's discovery MVP scope

## NFRs

- **Security:** CLI spike must not commit or log API keys, tokens, or credentials (MC-SEC-02); hash mismatch abort must be verified as a hard stop, not a warning (C5)
- **Audit:** C1 compliance (no SKILL.md or POLICY.md copied into consumer repo during sidecar install) must be explicitly verified and recorded in the spike artefact; verdict written to pipeline-state.json
- **Performance:** None identified — spike is a time-boxed evaluation against Craig's existing MVP, not a performance benchmark

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable — Assumption A2 (assurance gate accepts CLI trace with minor modification) is the most likely source of a REDESIGN verdict; the spike may need to extend the scope to include a schema alignment sub-investigation

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-b2.md |
| run_timestamp | 2026-04-19 |

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 14 |
| constraints_inferred_count | 6 |
| intermediates_prescribed | 5 |
| intermediates_produced | 3 |
