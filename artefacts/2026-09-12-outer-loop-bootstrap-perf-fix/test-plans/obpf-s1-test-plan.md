# Test Plan: Batch skill-metadata extraction to close the `--with-outer-loop` performance NFR gap (obpf-s1)

**Story:** artefacts/2026-09-12-outer-loop-bootstrap-perf-fix/stories/obpf-s1-batch-skill-metadata-extraction.md
**Track:** Short-track

---

## Test Cases

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Integration (real files) | For each of the 8 real outer-loop SKILL.md files, the new batched extraction's description value byte-matches the old per-skill `get_skill_description` output |
| T2 | AC1 | Integration (real files) | For each of the 8 real outer-loop SKILL.md files, the new batched extraction's trigger value byte-matches the old per-skill `get_skill_triggers` output, including `benefit-metric`'s and `decisions`'s malformed multi-line trigger blocks |
| T3 | AC2 | Manual/timing (wall-clock, same methodology as `rb-s5`/`scr-s1`) | `runInit(dir, {withOuterLoop: true})` measured in isolation, fresh, post-fix — recorded in `decisions.md`, same convention as the two prior investigations |
| T4 | AC3 | Regression | `tests/check-rb-s3-harness-agnostic-instructions.js` re-run unmodified, all pass |
| T5 | AC3 | Regression | `tests/check-rb-s5-optional-outer-loop-install.js` re-run unmodified, all pass (except the now-obsolete timing assertion itself, which this story exists to fix — see Coverage Note below) |
| T6 | AC4 | Unit (static content) | `tests/check-scr-s1-skill-categorization-reconciliation.js` updated to assert zero remaining per-skill `get_skill_triggers`/`get_skill_description` calls in the enabled branch, batched extraction used instead |

## Coverage Note

`rb-s5`'s own timing assertion (`withOuterLoopOverhead...` per its DoD) is expected to newly PASS after this fix, where it previously failed/was RISK-ACCEPTed — this is the intended outcome, not a regression. If it was implemented as a hard-failing automated assertion (check at implementation time), confirm it now passes; if it was manual/semi-automated (per `scr-s1`'s own DoD note that AC4's NFR test is "manual/semi-automated wall-clock timing... not part of this automated file's count"), record the fresh passing measurement in `decisions.md` per the same convention.

## Regression coverage

- `tests/check-rb-s3-harness-agnostic-instructions.js` (full suite)
- `tests/check-rb-s5-optional-outer-loop-install.js` (full suite)
- `tests/check-scr-s1-skill-categorization-reconciliation.js` (updated per AC4, not just re-run)

## Out of Scope (per story)

- Any change to assembled instruction-file content/format.
- `check-instructions-drift.js`'s own cost.
- Any change away from bash for this script.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
