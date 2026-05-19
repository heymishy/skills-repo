## Story: Spike A — Determine whether governance gate logic can be extracted into a standalone distributable package

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4-opus/epics/e1-governance-extractability-enforcement-selection.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

## User Story

As a **tech lead at work (Craig's context)**,
I want to **know whether the governance logic (gate checks, schema validation, skill structural contracts) can be extracted from the monolithic skills-repo into a standalone package**,
So that **I can evaluate whether the distribution model (M1) is architecturally feasible — if governance logic cannot be extracted, no distribution mechanism can deliver meaningful content to consumers**.

## Benefit Linkage

**Metric moved:** M1 (Distribution sync — zero-commit install and sync success rate)
**How:** This spike resolves the prerequisite architectural question: can the governance logic that consumers need be separated from the platform's own delivery artefacts, state, and history? Without this answer, the distribution mechanism has nothing to distribute. A PROCEED verdict unblocks all Theme B implementation stories. A REDESIGN verdict forces a rethink of the distribution architecture before any implementation begins.

## Architecture Constraints

- **C1 (update channel never severed):** The extracted package must preserve the ability to receive upstream updates without forking — extraction must not sever the update channel
- **C5 (hash-verified skill files):** Extracted governance logic must preserve hash verification — the lockfile model must work across the extraction boundary
- **ADR-012 (platform-agnostic architecture):** The extraction approach must not be vendor-specific (e.g. must not depend on GitHub-only features for the extraction mechanism)

## Dependencies

- **Upstream:** None — this is the first spike in the risk-first sequence
- **Downstream:** All Theme B stories (Epic 2 implementation) depend on this spike's PROCEED verdict. Spike C (distribution model) depends on knowing what is being distributed.

## Acceptance Criteria

**AC1:** Given the current skills-repo repository structure, When I audit all governance gate logic (files under `.github/scripts/`, schema at `.github/pipeline-state.schema.json`, and skill structural contracts in `.github/skills/`), Then a clear boundary is documented: which files constitute the distributable governance package and which files are platform-internal only.

**AC2:** Given the identified governance package boundary from AC1, When I attempt to run `npm test` governance checks using only the files inside the identified boundary (without the full skills-repo history, artefacts, or workspace state), Then either (a) all governance checks pass — confirming extractability — or (b) specific checks fail with documented reasons — identifying extraction blockers that must be resolved.

**AC3:** Given the extraction boundary and test results from AC1 and AC2, When I write the spike verdict, Then the verdict is one of: PROCEED (governance logic is extractable — extraction blockers are zero or have documented resolution paths), REDESIGN (governance logic has structural dependencies that require architecture changes before extraction), or DEFER (extraction is possible but the cost exceeds Phase 4 capacity). The verdict includes evidence from AC2, not opinion.

**AC4:** Given a PROCEED verdict, When the spike artefact is saved, Then it includes: (a) the list of files in the distributable governance package, (b) the list of files excluded and why, (c) any extraction blockers resolved during the spike, and (d) the recommended extraction mechanism (copy, symlink, git subtree, npm package, or other).

## Out of Scope

- Implementing the extraction mechanism — this spike produces a verdict and evidence, not a working package
- Evaluating enforcement mechanisms — that is Spikes B1 and B2
- Evaluating distribution transport (npm vs git subtree vs installer script) — that is Spike C
- Resolving the upstream authority question — that is Spike C

## NFRs

- **Security:** Spike artefact must not contain credentials or API keys (MC-SEC-02)
- **Performance:** None — spike produces a document, not running code
- **Accessibility:** None — no UI component

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable — the question is well-defined; only the answer is unknown

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
| model_label | claude-opus-4-6 |
| cost_tier | high |
| skill_name | definition |
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/stories/spike-a-governance-extractability.md |
| run_timestamp | 2026-04-19T18:50:00Z |

> **Security note:** `model_label` is a descriptive string only (MC-SEC-02).

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 3 |
| constraints_inferred_count | 3 |
| intermediates_prescribed | 1 |
| intermediates_produced | 1 |

**files_referenced:**

- artefacts/2026-04-19-skills-platform-phase4/discovery.md
- artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md
- artefacts/2026-04-18-skills-platform-phase4-revised/ref-skills-platform-phase4-5.md
- .github/architecture-guardrails.md

### Fidelity self-report

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| AC coverage | 5 | 4 ACs covering boundary audit, test evidence, verdict format, and PROCEED detail |
| Scope adherence | 5 | Spike scope only — no implementation leak |
| Context utilisation | 4 | Discovery spike exit criteria and Phase 4.5 reference doc both used |

### Backward references

- target: artefacts/2026-04-19-skills-platform-phase4/discovery.md
  accurate: yes
- target: artefacts/2026-04-18-skills-platform-phase4-revised/ref-skills-platform-phase4-5.md
  accurate: yes

### Operator review

| Field | Value |
|-------|-------|
| context_score | |
| linkage_score | |
| notes | |
| reviewed_by | |
