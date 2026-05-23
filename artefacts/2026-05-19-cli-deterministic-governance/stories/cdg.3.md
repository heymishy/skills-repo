## Story: `skills advance` CLI command — CI-facing state write with typed exit codes

**Epic reference:** artefacts/2026-05-19-cli-deterministic-governance/epics/cdg-phase2-advance-and-trace.md
**Discovery reference:** artefacts/2026-05-19-cli-deterministic-governance/discovery.md
**Benefit-metric reference:** artefacts/2026-05-19-cli-deterministic-governance/benefit-metric.md

## User Story

As a **platform maintainer**,
I want to **run `node bin/skills advance <feature-slug> <story-id> <field>=<value>...` in a CI step and have it write the specified pipeline-state.json fields atomically with schema validation, exiting non-zero with a descriptive error if the write fails**,
So that **CI harnesses can advance pipeline state without relying on model discretion, reducing the schema violation rate on state writes to zero (M4)**.

## Benefit Linkage

**Metric moved:** M4 — Schema violation rate on CLI-written state writes
**How:** `skills advance` calls `pipeline-state-writer.js`, which validates enum fields before writing and writes atomically via rename. CLI-originated writes cannot produce schema violations — they are correct by construction, delivering M4's 0-violation target from the first CLI-written event.

## Architecture Constraints

- **ADR-H7.1:** `skills advance` calls `pipeline-state-writer.js` via `require()` — not via `child_process`. The bin entry point is a thin CLI wrapper around the module, not a subprocess launcher.
- **ADR-001:** CommonJS `require()` throughout — no ESM imports.
- **Schema sync rule:** If `skills advance` introduces new writable fields not yet in `pipeline-state.schema.json`, the schema must be updated in the same PR.
- **No new npm dependencies:** Implementation uses only existing `package.json` dependencies.
- **Injectable adapter rule (D37):** If a default adapter is introduced for the state writer in the CLI entry point, the default must throw (not return empty/null) with a message naming the adapter and the required setup call.

## Dependencies

- **Upstream:** cdg.1 and cdg.2 must be DoD-complete (they are). `src/enforcement/cli-outer-loop.js` and `bin/skills` must exist on master before this story starts coding.
- **Upstream:** `pipeline-state-writer.js` factory must exist at `src/web-ui/adapters/pipeline-state-writer.js` (it does — wired in server.js).
- **Downstream:** cdg.4 may reuse the validation pattern established here. cdg.5 depends on `pipeline-state-writer.js` being called before trace emission.

## Acceptance Criteria

**AC1 — Valid advance writes state atomically:**
Given `pipeline-state.json` contains a feature with slug `<feature-slug>` and a story with id `<story-id>`,
When `node bin/skills advance <feature-slug> <story-id> dorStatus=signed-off` is run,
Then `pipeline-state.json` is updated with `dorStatus: "signed-off"` for that story, exit code is 0, and stdout contains a one-line confirmation including the feature slug and story id.

**AC2 — Unknown feature slug exits non-zero:**
Given `pipeline-state.json` does not contain a feature matching `<feature-slug>`,
When `node bin/skills advance <feature-slug> <story-id> dorStatus=signed-off` is run,
Then the command exits with code 8 (SYSTEM error), stderr names the unknown feature slug, and `pipeline-state.json` is not modified.

**AC3 — Invalid enum value exits non-zero:**
Given a valid feature slug and story id,
When `node bin/skills advance <feature-slug> <story-id> prStatus=invalid-value` is run,
Then the command exits with a non-zero code, stderr names the invalid value and lists the allowed values, and `pipeline-state.json` is not modified.

**AC4 — Missing required arguments exits non-zero:**
Given the command is run with fewer than 3 positional arguments (feature-slug, story-id, at least one field=value pair),
When `node bin/skills advance` or `node bin/skills advance <feature-slug>` is run,
Then the command exits with code 8, stderr prints usage instructions, and `pipeline-state.json` is not modified.

**AC5 — Malformed field=value argument exits non-zero:**
Given a valid feature slug and story id,
When `node bin/skills advance <feature-slug> <story-id> invalidarg` is run (no `=` separator),
Then the command exits with code 8, stderr names the malformed argument, and `pipeline-state.json` is not modified.

**AC6 — Multiple field=value pairs are applied in a single write:**
Given a valid feature slug and story id,
When `node bin/skills advance <feature-slug> <story-id> dorStatus=signed-off reviewStatus=passed` is run,
Then both fields are written to the story entry in `pipeline-state.json` in a single atomic write, exit code is 0.

**AC7 — npm test suite includes unit tests for all AC paths:**
Given the implementation is complete,
When `npm test` runs,
Then `tests/check-cdg3-advance-cli.js` exists and all its assertions pass, covering at minimum: AC1 (valid write), AC2 (unknown feature), AC3 (invalid enum), AC4 (missing args), AC5 (malformed field), and AC6 (multi-field write).

**AC8 — `bin/skills advance` subcommand is routed from existing bin/skills entry point:**
Given the existing `bin/skills` entry point handles `validate` via `cli-outer-loop.js`,
When `node bin/skills advance` is invoked,
Then it routes to the advance handler without modifying the existing `validate` routing, and `npm test` continues to pass all pre-existing tests.

## Out of Scope

- This story does not validate the DoR artefact before writing. Artefact validation before state advance is cdg.4 (web UI integration) — in the CLI surface, the operator is responsible for running `skills validate` before `skills advance` in Phase 2. Automated validate-before-advance enforcement in the CLI is a Phase 3 quality-of-life item.
- `skills advance` does not write a trace entry. Trace emission is cdg.5.
- This story does not add `skills advance` as a route in the web UI. The web UI calls `pipeline-state-writer.js` directly (cdg.4 gates that call with validate). The CLI binary is for CI use only.
- No `--dry-run` flag in this story. Post-MVP.

## Implementation Notes

`bin/skills` already handles `validate` with a subcommand dispatch pattern. `advance` is a new subcommand in the same dispatch:

```
node bin/skills advance <feature-slug> <story-id> [field=value ...]
```

The handler calls `pipelineStateWriterFactory(repoRoot)` to get the writer function, then calls `writer(featureSlug, storyId, stateUpdate)` where `stateUpdate` is the object built from the `field=value` args. Exit 0 on success; exit 8 on any failure, with stderr message.

`pipeline-state-writer.js` factory signature: `pipelineStateWriterFactory(repoRoot) → writer`. The factory must be called with the repo root path (use `path.resolve(__dirname, '..')` from `bin/skills`).

Enum validation is already in `pipeline-state-writer.js`. The CLI advance handler does not duplicate it — it relies on the writer's built-in enum check.

## Complexity

**Rating:** 1 — Well-understood pattern. `pipeline-state-writer.js` exists and is tested. The CLI is a thin adapter. No new algorithms or external dependencies.

## Scope Stability

**Stability:** Stable.
