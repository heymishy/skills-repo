# DoR Contract — cdg.3: `skills advance` CLI command — CI-facing state write with typed exit codes

**Story:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.3.md
**DoR artefact:** artefacts/2026-05-19-cli-deterministic-governance/dor/cdg.3-dor.md
**Date approved:** 2026-05-24

---

## Approved Contract Proposal

### What will be built

**`src/enforcement/cli-advance.js`** (new file) — Exports a single function `advance(featureSlug, storyId, fieldPairs, stateFilePath)` returning `{ exitCode, stdout, stderr }`. Implements: (1) argument-count validation (fewer than 3 positional args → exit 8 + usage), (2) feature slug lookup in pipeline-state.json (unknown slug → exit 8 + slug named in stderr), (3) story id lookup within the feature (unknown story id → exit 8), (4) field=value parsing — each pair must contain `=` (malformed arg → exit 8 + arg named in stderr), (5) enum validation for known enum fields by reading `pipeline-state.schema.json` (invalid enum value → exit non-zero + allowed values listed in stderr), (6) atomic write via temp-file rename (write to `pipeline-state.json.tmp`, then `fs.renameSync` to `pipeline-state.json`), (7) exit 0 + one-line confirmation including feature slug and story id. Does not call `process.exit()` directly. Uses only Node.js built-in modules.

**`bin/skills`** (modify — add advance routing) — Add an `else if (subcommand === 'advance')` branch that reads `process.argv.slice(3)` as `[featureSlug, storyId, ...fieldPairs]`, calls `cli-advance.js`, writes stdout/stderr, calls `process.exit(exitCode)`. Existing `validate` routing is not modified.

**`tests/check-cdg3-advance-cli.js`** (new file) — 9 tests: T1 (valid write exits 0), T2 (unknown slug exits 8), T3 (invalid enum exits non-zero + allowed values), T4a (no args exits 8), T4b (one arg exits 8), T5 (malformed field exits 8), T6 (multi-field written atomically), T7 (validate routing unaffected), IT1 (integration: actual state file written correctly end-to-end).

**`package.json`** (modify — test chain only) — Append `&& node tests/check-cdg3-advance-cli.js` to the existing npm test chain.

### What will NOT be built

- Validate-before-advance enforcement in the CLI — the CLI `advance` does not call `cli-outer-loop.validate()` first. That automated sequencing is a Phase 3 quality-of-life item. In Phase 2, the operator is responsible for running `skills validate` before `skills advance` when using the CLI.
- Trace emission — cdg.5.
- Web UI route wiring for `advance` — the web UI calls `pipeline-state-writer.js` directly (gated by cdg.4's validate integration). The CLI binary is for CI use only.
- `--dry-run` flag — post-MVP.
- Any CLI subcommands beyond `advance` (e.g. `emit-trace`, `verify-trace`).

---

## Required Touchpoints (coding agent must touch these files)

| File | Action | Reason |
|------|--------|--------|
| `src/enforcement/cli-advance.js` | Create | AC1–AC7 — advance logic |
| `bin/skills` | Modify (add advance routing) | AC8 — route advance without breaking validate |
| `tests/check-cdg3-advance-cli.js` | Create | AC7 — test plan requirement (9 tests) |
| `package.json` | Modify (test chain only) | AC7 — test file in npm test |

---

## Explicitly Out of Scope (MUST NOT touch)

| File | Reason |
|------|--------|
| `src/enforcement/cli-outer-loop.js` | validate is read-only; advance is a separate module |
| `src/web-ui/routes/journey.js` | Web UI integration is cdg.4 scope |
| `src/web-ui/server.js` | No web UI changes in this story |
| `src/enforcement/governance-package.js` | Trace emission is cdg.5 scope |
| `.github/pipeline-state.json` | Tests use temp fixtures; never modify the real state file |
| `.github/skills/*.md` (any SKILL.md file) | Artefact-first rule (ADR-011) + platform infrastructure |
| `artefacts/**` | Pipeline inputs — read-only per pipeline.instructions.md |
| Any file not listed in Required Touchpoints | Default: out of scope unless a failing test forces it |

---

## AC Verification Table

| AC | Expected behaviour | Test(s) | Pass criteria |
|----|-------------------|---------|---------------|
| AC1 | Valid advance writes state atomically, exit 0 | T1, IT1 | `exitCode === 0`; stdout contains confirmation with feature slug and story id; state file updated |
| AC2 | Unknown feature slug → exit 8, stderr names slug, file unchanged | T2 | `exitCode === 8`; stderr contains slug; file not modified |
| AC3 | Invalid enum value → non-zero exit, stderr names value + allowed values | T3 | `exitCode !== 0`; stderr contains invalid value and allowed values list |
| AC4 | Missing required args → exit 8, stderr shows usage | T4a, T4b | `exitCode === 8`; stderr contains `'Usage:'` or equivalent |
| AC5 | Malformed field=value (no `=`) → exit 8, stderr names arg | T5 | `exitCode === 8`; stderr contains the malformed argument string |
| AC6 | Multiple field=value pairs written in single atomic write | T6, IT1 | Both fields written; only one file rename (atomic) |
| AC7 | npm test includes check-cdg3-advance-cli.js, all 9 tests pass | npm test | All assertions pass in npm test chain |
| AC8 | `bin/skills advance` routes without breaking existing validate | T7 | `node bin/skills validate <path> definition-of-ready` still exits normally; validate tests still pass |

---

## Assumptions (recorded at DoR, binding on implementation)

1. `cli-advance.js` reads `pipeline-state.json` from the path passed as `stateFilePath` parameter (not hardcoded). `bin/skills` passes the resolved repo root path so tests can inject a temp file path.
2. Atomic write uses `path.join(path.dirname(stateFilePath), 'pipeline-state.json.tmp')` as the temp path, then `fs.renameSync`.
3. Enum validation reads `pipeline-state.schema.json` from the repo root (resolved from `stateFilePath`'s directory, or passed separately). If no enum constraint exists for a field, the write proceeds.
4. No injectable adapter pattern (setX) is introduced. `cli-advance.js` directly requires its dependencies; test isolation is achieved by passing `stateFilePath` as a parameter pointing to a temp fixture.
5. Schema declarations (`schemaDepends`) for this story: `dorStatus`, `reviewStatus`, `stage`, `prStatus` — these are the fields the advance command will be used to write in the pipeline.

## Schema Dependencies

`schemaDepends: ["dorStatus", "reviewStatus", "stage", "prStatus"]`
These fields must remain in `pipeline-state.schema.json` with their current enum definitions. If any enum is modified, the test fixtures must be updated in the same PR.
