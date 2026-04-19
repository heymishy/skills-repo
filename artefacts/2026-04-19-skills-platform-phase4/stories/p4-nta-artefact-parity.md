## Story: Artefact landing parity for non-technical surface outputs

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e4-non-technical-access.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As a **non-technical outer-loop participant producing a discovery artefact via the Teams bot**,
I want to **have the artefact produced by my bot session committed to the repository in the same format, at the same path, and with the same field coverage as an artefact produced by a git-native operator session**,
So that **downstream pipeline steps (benefit-metric, definition, review) cannot distinguish between a bot-produced artefact and a git-native-produced artefact — and do not require special handling or format conversion for bot sessions**.

## Benefit Linkage

**Metric moved:** M2 — Consumer confidence; M3 — Teams bot C7 fidelity
**How:** Artefact parity is the property that enables M2 for non-technical roles — if a bot session produces a discovery.md that passes the same quality gates as a git-native discovery.md, the non-technical participant's contribution is first-class. Without parity, the bot session produces a "draft" or "summary" that needs manual reformatting — making non-technical participation a second-class input rather than a governed outer loop contribution. M3 cannot be claimed without demonstrating that bot artefacts complete the outer loop, which requires them to be accepted by downstream steps.

## Architecture Constraints

- Template adherence: artefacts produced by the bot must follow the exact same templates as git-native artefacts — `discovery.md`, `benefit-metric.md`, and story artefacts use the templates in `.github/templates/`; the bot's artefact assembler reads the templates from the sidecar and fills fields using participant responses
- C1 (non-fork): artefact commit must not require a forked repository; the bot commits artefacts via the GitHub API (or equivalent) using the installation token — the repository is not modified in a way that creates a fork
- MC-CORRECT-02: artefact frontmatter and field names must match the template exactly — no new fields, no renamed fields, no omitted required fields; the artefact assembler is validated against the template schema by `npm test`
- ADR-004: artefact target paths (feature slug, sub-directory) are derived from `context.yml` `artefacts.root` and the session's feature slug — no hardcoded paths in the bot

## Dependencies

- **Upstream:** p4.nta-surface must be complete (bot runtime handles the session conversation); p4.nta-standards-inject is a parallel dependency (the bot can produce artefacts without standards injection, but the artefact quality may be lower; ordering is risk-based, not sequential)
- **Downstream:** p4.nta-ci-artefact — CI artefact integration requires artefacts to be committed at known paths; this story provides those committed artefacts

## Acceptance Criteria

**AC1:** Given a non-technical participant completes a discovery session via the Teams bot (all required template fields are answered), When the bot assembles and commits the artefact, Then `artefacts/<feature-slug>/discovery.md` is committed to the repository with all required fields populated — the file is valid against the template schema validated by `npm test`, and no field is empty or contains a placeholder like `[FILL IN]`.

**AC2:** Given a bot-produced discovery.md is committed to the repository, When the `/review` skill processes the artefact (as simulated by the review test harness), Then the review produces the same categories of findings (or passes) as it would for a git-native discovery.md — no additional finding category is triggered specifically because the artefact was bot-produced.

**AC3:** Given C1 applies, When the bot commits the artefact via the GitHub API, Then the commit is made to a branch on the origin repository (not a fork), using the bot's installation token, and the branch name follows the platform's naming convention (`chore/nta-<feature-slug>-<date>`).

**AC4:** Given the participant's session is interrupted before all required fields are answered, When the bot resumes the session (participant returns to the Teams channel), Then the bot resumes from the last answered question — it does not restart the session, and no partially completed artefact is committed.

## Out of Scope

- Formatting or post-processing artefacts produced by git-native sessions — this story covers bot-produced artefacts only
- Quality assurance review of bot artefact content — the `/review` skill handles quality; this story ensures format parity so that the review skill can run
- Approval gate routing — that is p4.nta-gate-translation

## NFRs

- **Correctness:** Bot-produced artefacts pass the template schema validation test (`npm test`) before commit; invalid artefacts are not committed
- **Security:** No participant-identifiable information written beyond what a git-native session would write (MC-SEC-02)
- **Reliability:** Partial artefact session state is persisted so that resumption is possible after interruption

## Complexity Rating

**Rating:** 2
**Scope stability:** Unstable — depends on Spike D PROCEED verdict; deferred if DEFER

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/stories/p4-nta-artefact-parity.md |
| run_timestamp | 2026-04-19 |

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 14 |
| constraints_inferred_count | 4 |
| intermediates_prescribed | 5 |
| intermediates_produced | 22 |
