## Story: Bottom-up programme-candidate detection script (epic-count primary signal)

**Epic reference:** artefacts/2026-11-08-programme-entry-points/epics/pep-e1-validate-entry-points.md
**Discovery reference:** artefacts/2026-11-08-programme-entry-points/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-programme-entry-points/benefit-metric.md

## User Story

As a **platform maintainer validating skill readiness**,
I want to **a small script that flags feature clusters in `pipeline-state.json` that look programme-scale, before anyone decides to coordinate them as one**,
So that **a future effort like `skills-platform-phase4` — which ran through the standard pipeline for its entire life without anyone recognizing it as programme-shaped — gets flagged next time, instead of only being noticed in hindsight**.

## Benefit Linkage

**Metric moved:** Bottom-up detection heuristic validity (meta)
**How:** This story's own acceptance check — running the script against the two known historical cases — is literally what this meta-metric measures; there is no separate validation step.

## Architecture Constraints

- **`product/constraints.md` #11** (no persistent agent runtime): this is a CLI script invoked on demand or from a scheduled CI job — never a standing watcher, consistent with how initiative 2's checks were scoped.
- **ADR-011 / Artefact-first**: this new file under `scripts/` requires a story artefact before/alongside implementation — satisfied by this story itself.
- **CLAUDE.md Platform change policy**: a new file under `scripts/` is merged via branch + PR, not committed directly to master.
- **Signal weighting, confirmed during /clarify with real data**: epic count is the primary signal (phase4: 5 epics vs. `team-identity-roles`: 1 epic — cleanly separates the two cases). `[CORRECTED 2026-11-09 at /review, see decisions.md]` The threshold is pinned at **≥4 epics** — it was left as "a defined threshold" in an earlier draft of this story despite both comparison data points already being known; ≥4 sits strictly between 1 and 5, so it's not merely "whatever number happens to separate these two specific cases" but a round, defensible cutoff with room on both sides. `decisions.md` cross-feature dependency density is secondary (phase4's richer dependency structure vs. `team-identity-roles`'s 4 "depend" mentions across 9 stories). Calendar timeline span is explicitly excluded — confirmed inverted in this repo's real data (phase4: 2-day span; `team-identity-roles`: 39-day span, the *longer*-running effort being the normal single-feature one).
- No new injectable adapter — this is a standalone read-only script against `pipeline-state.json` and `decisions.md` files already on disk, no new D37 surface.

## Dependencies

- **Upstream:** None
- **Downstream:** pep-s2's AC1 reuses this story's validated epic-count threshold as Step 0's new scoring signal — this story should land its threshold decision before pep-s2's AC1 is finalized, or the two should be coordinated within the same PR if sequencing makes that cleaner.

## Acceptance Criteria

**AC1:** Given the script runs against `.github/pipeline-state.json`, When it scans all features, Then it computes, per feature, the epic count (primary signal) and a `decisions.md` cross-feature-dependency-mention count (secondary signal, e.g. counting "depend"/"dependency" mentions), explicitly never computing or using calendar timeline span as a signal, and flags a feature as a candidate when its epic count is **≥4** — chosen so it separates the two known cases below, not an arbitrary round number.

**AC2:** Given the script is run against `skills-platform-phase4`'s real historical data (5 epics), When the ≥4-epic threshold is applied, Then the script flags it as a programme-scale candidate (true positive).

**AC3:** Given the script is run against `team-identity-roles`'s real historical data (1 epic, 9 stories, 4 "depend" mentions), When the same ≥4-epic threshold is applied, Then the script does NOT flag it as a candidate (true negative) — confirming the threshold doesn't produce an obvious false positive on the one known normal-complexity comparison case.

**AC4:** Given the script completes a scan, When it finds zero or more candidates, Then it produces a manual-review report (not an automated escalation, consistent with this epic's Out of Scope) listing each candidate feature, its epic count, its dependency-density score, and a plain-text note that this is a directional signal requiring human judgment, not a verdict.

## Out of Scope

- Automated escalation into an actual `programme.md` artefact or workstream registration — manual-review report only.
- Any web UI rendering of the report — a future extension of initiative 1's visibility surface, not built now (the report format is designed to be artefact-source-agnostic so it can feed that surface later without a redesign).
- Establishing a real-world false-positive rate on future, not-yet-seen features — `[UNKNOWN BASELINE]` per the benefit-metric artefact; this story validates against the 2 known historical cases only, and that result is logged as the trigger for this heuristic's first `/decisions` revisit once real future data exists.

## NFRs

- **Performance:** Must complete quickly enough for ad-hoc or CI-scheduled use — scanning `pipeline-state.json` (a known, bounded file) and per-feature `decisions.md` files is not expected to be a performance concern at this repo's current scale.
- **Security:** None identified — read-only script against local files already in the repo.
- **Accessibility:** Not applicable — CLI output.
- **Audit:** The report itself, plus the script's own run log, form the audit trail.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
