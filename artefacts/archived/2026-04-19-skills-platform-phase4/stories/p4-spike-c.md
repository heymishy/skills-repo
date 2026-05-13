## Story: Resolve the distribution model — upstream authority, sidecar semantics, lockfile structure, and update channel integrity (Spike C)

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e1-spike-programme.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As a **platform maintainer (heymishy)**,
I want to **resolve the four distribution sub-problems — repo structure collision, commit provenance and format validation, update channel severance, and non-technical interaction surface exclusion — so that each has a specific design response and the E2 implementation stories have a decided architecture to implement against**,
So that **M1 (zero-commit install + conflict-free sync) has a grounded implementation path and Craig and Thomas's teams can adopt without forking**.

## Benefit Linkage

**Metric moved:** M1 — Distribution sync
**How:** M1's target (100% zero-commit install, ≥90% conflict-free sync) has no implementation path until the four distribution sub-problems are resolved with specific design decisions. Spike C is the gate: once it produces a PROCEED verdict with design decisions for each sub-problem, E2 stories p4.dist-install, p4.dist-no-commits, p4.dist-lockfile, p4.dist-upgrade, p4.dist-upstream, p4.dist-commit-format, p4.dist-migration, and p4.dist-registry have an architecture to build against.

## Architecture Constraints

- C1: non-fork distribution is the primary constraint shaping every design decision in this spike — any proposed design that requires consumers to fork `heymishy/skills-repo` in order to adopt or upgrade is a REJECT for that sub-problem
- ADR-004: upstream source URL, pinned versions, and surface adapter selection must all be configurable via `.github/context.yml` — the spike must check whether Craig's CLI `init` config and heymishy's `skills_upstream` config can be unified under a single context.yml schema
- MC-CORRECT-02: any new `pipeline-state.json` fields produced by E2 implementation stories (e.g. a consumer registry entry or lockfile-version field) must be defined in the schema before E2 stories write them; the spike should identify which new fields E2 will need
- C5: POLICY.md floors must be propagated through every upgrade cycle and must not be relaxable below the stated minimum during `upgrade`
- C4: upgrade operations that involve instruction-set changes must require human sign-off before the upgraded content is pinned — the spike must define where this approval gate lives in the upgrade flow
- MC-SEC-02: no API keys, tokens, or credentials may appear in lockfiles, sidecar configuration, or spike output artefacts

## Dependencies

- **Upstream:** p4.spike-a should have a PROCEED or REDESIGN verdict before this spike closes — the package interface shapes whether the lockfile pins CLI binary versions, skill content versions, or both; however Spike C may run in parallel with Spikes B1 and B2 on the distribution sub-problems that do not depend on the package interface
- **Downstream:** p4.dist-install, p4.dist-no-commits, p4.dist-commit-format, p4.dist-lockfile, p4.dist-upgrade, p4.dist-upstream, p4.dist-migration, p4.dist-registry in E2 all depend on a PROCEED verdict from this spike

## Acceptance Criteria

**AC1:** Given heymishy has reviewed Craig's `artefacts/2026-04-18-cli-approach/discovery.md` (sidecar + lockfile + MVP command set) and the four distribution sub-problems named in the Phase 4 discovery, When the spike output artefact is written to `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-c-output.md`, Then the artefact contains a named design decision for each of the four sub-problems: (1) repo structure collision — sidecar directory convention and conflict avoidance, (2) commit provenance — zero-commit install design and operator-configured commit-format validation approach, (3) update channel severance — lockfile structure and `upgrade` semantics, (4) upstream authority — whether `heymishy/skills-repo` or a productisation fork is the authoritative publishing source.

**AC2:** Given the spike addresses the upstream authority question (sub-problem 4), When heymishy records the design decision, Then the artefact explicitly states which repository is the authoritative upstream source for SKILL.md, POLICY.md, and standards files, how this is configured in `.github/context.yml` (specifically the `skills_upstream` block), and whether Craig's fork becomes a publishing layer or remains a downstream fork — this decision must be made before p4.dist-upstream in E2 can proceed to DoR.

**AC3:** Given the spike addresses the update channel design (sub-problem 3), When heymishy records the lockfile structure decision, Then the artefact specifies: the lockfile format (minimum required fields: upstream source URL, pinned ref, skill content hashes), how `upgrade` surfaces the diff for consumer review before re-pinning, and how POLICY.md floors are verified after upgrade — precise enough for p4.dist-upgrade to write testable ACs against.

**AC4:** Given the spike produces any verdict, When heymishy records the outcome, Then the overall verdict (PROCEED / REDESIGN / DEFER / REJECT) and per-sub-problem verdicts are written to `pipeline-state.json` under the feature's spike record AND an ADR entry is added to `artefacts/2026-04-19-skills-platform-phase4/decisions.md` covering the upstream authority decision (the most consequential and irreversible choice).

**AC5:** Given the spike produces a PROCEED verdict, When heymishy begins E2 story decomposition, Then each E2 story references the Spike C output as its architecture input and no E2 story enters DoR without that reference; a story that enters DoR without the Spike C reference fails the H9 architecture constraint check.

## Out of Scope

- Implementing the sidecar install, lockfile, or upgrade command — those are E2 stories; the spike produces design decisions and schema definitions, not implementation
- Evaluating enforcement mechanisms — that is Spikes A, B1, B2; Spike C focuses entirely on distribution
- Designing the non-technical interaction surface (Teams bot) — that is Spike D; sub-problem 4 of distribution (non-technical surface exclusion) means acknowledging the gap, not solving it here
- Deciding Phase 5 distribution features (consumer customisation, non-npm distribution fallbacks) — the spike decisions scope to Phase 4 MVP only

## NFRs

- **Security:** Lockfile must not contain API keys or tokens (MC-SEC-02); POLICY.md floor propagation through upgrade must be verifiable
- **Audit:** Upstream authority decision written to decisions.md before this spike closes — it is an irreversible structural decision (ADR-004 implications for context.yml schema)
- **Performance:** None identified — spike is a design investigation, not a runtime implementation

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable — the upstream authority sub-problem (whether Craig's fork becomes a publishing layer) is the most consequential open question and may produce a REDESIGN verdict if a publishable intermediate layer cannot be designed within the Phase 4 budget

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-c.md |
| run_timestamp | 2026-04-19 |

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 14 |
| constraints_inferred_count | 6 |
| intermediates_prescribed | 5 |
| intermediates_produced | 4 |
