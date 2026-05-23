# DoR Contract — cdg.1: `skills validate` CLI entry point, exit code framework, and governance check

**Story:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.1.md
**DoR artefact:** artefacts/2026-05-19-cli-deterministic-governance/dor/cdg.1-dor.md
**Date approved:** 2026-05-23

---

## Approved Contract Proposal

### What will be built

**`bin/skills`** (new file) — Thin Node.js CLI entry point with `#!/usr/bin/env node` shebang. Reads `process.argv`, routes the `validate` subcommand to `src/enforcement/cli-outer-loop.js`, writes the returned `stdout` to `process.stdout` and `stderr` to `process.stderr`, and calls `process.exit(exitCode)`. No logic beyond argument routing lives here.

**`src/enforcement/cli-outer-loop.js`** (new file) — Exports a single function `validate(artefactPath, gateName, repoRoot)` that returns `{ exitCode, stdout, stderr }`. Implements: (1) argument-count validation (< 2 args → exit 8 + usage string), (2) gate name validation against supported list (unknown gate → exit 8 + UNSUPPORTED_GATE message), (3) path traversal guard using `path.resolve()` + `startsWith(repoRoot + path.sep)` (outside root → exit 8, no raw path in output), (4) artefact file read, (5) H1 structural check (story slug file existence), (6) exit 0 success message on clean pass. Does not call `process.exit()` directly. Does not write to any file. Uses only Node.js built-in modules.

**`tests/check-cli-outer-loop.js`** (new file, TDD red) — 21 tests covering AC1, AC2, AC3 (integration via `child_process.spawnSync`), AC4, AC5 (structural presence), AC6, and NFR checks (timing, shebang, no new deps). Currently failing because implementation files do not exist.

**`tests/check-cli-governance.js`** (new file, TDD red) — 3 governance checks for AC5: `bin/skills` exists, `src/enforcement/cli-outer-loop.js` exists, `require('./src/enforcement/cli-outer-loop').validate` is a function. Currently failing.

**`package.json`** (modify — test chain only) — Append `&& node tests/check-cli-outer-loop.js && node tests/check-cli-governance.js` to the existing `npm test` chain.

### What will NOT be built

- H2–H9 check implementations — only H1 (story artefact exists check) is the proof-of-pattern. All remaining H-priority checks are cdg.2 scope.
- `skills advance`, `skills emit-trace`, or any other CLI subcommand. No stubs or placeholder routing.
- Any writes to `pipeline-state.json`, `trace.jsonl`, or any repository file. The `validate` command is strictly read-only.
- Any modification to `src/enforcement/cli-adapter.js` (handles skill-lockfile operations — a different concern).
- Lockfile pinning entries for `bin/skills` or `cli-outer-loop.js` in `check-lockfile-pins.js` — Phase 2.
- New `package.json` `dependencies` or `devDependencies` entries.

---

## Required Touchpoints (coding agent must touch these files)

| File | Action | Reason |
|------|--------|--------|
| `bin/skills` | Create | AC1, AC2, AC3, AC5 — CLI entry point |
| `src/enforcement/cli-outer-loop.js` | Create | AC1–AC6 — core validate logic |
| `tests/check-cli-outer-loop.js` | Create | Test plan requirement — 21 tests |
| `tests/check-cli-governance.js` | Create | AC5 governance check — 3 tests |
| `package.json` | Modify (test chain only) | AC5 — both test files in npm test |

---

## Explicitly Out of Scope (MUST NOT touch)

| File | Reason |
|------|--------|
| `src/enforcement/cli-adapter.js` | Lockfile/skill hash operations — different concern from validate |
| `src/enforcement/governance-package.js` | Gate evaluation/state transitions — Phase 2 dependency |
| `.github/pipeline-state.json` | Validate is read-only; no state writes in Phase 1 |
| `.github/skills/*.md` (any SKILL.md file) | Artefact-first rule (ADR-011) + platform infrastructure |
| `artefacts/**` | Pipeline inputs — read-only per pipeline.instructions.md |
| `tests/check-lockfile-pins.js` | Lockfile pinning is Phase 2 |
| Any file not listed in Required Touchpoints | Default: out of scope unless a failing test forces it |

---

## AC Verification Table

| AC | Expected behaviour | Test(s) | Pass criteria |
|----|-------------------|---------|---------------|
| AC1 | Exit 0 + stdout "validate OK: definition-of-ready — 0 violations found" | T4a, T4b, T4c | `exitCode === 0`; `stdout` contains `'validate OK'` and `'0 violations'` |
| AC2 | Exit 8 + stderr contains `UNSUPPORTED_GATE` and supported gate list | T5a, T5b, T5c | `exitCode === 8`; stderr contains `'UNSUPPORTED_GATE'` and `'definition-of-ready'` |
| AC3 | Exit non-zero + stderr `Usage: skills validate <artefact-path> <gate-name>` | IT1a, IT1b, IT2a, IT2b | `status !== 0`; stderr contains `'Usage:'`; tested via `spawnSync` (process boundary) |
| AC4 | Exit 1–7 + stderr `H1 FAIL:` + slug | T6a, T6b, T6c | `exitCode >= 1 && exitCode <= 7`; stderr contains `'H1 FAIL'` and the slug string |
| AC5 | `bin/skills` exists + `cli-outer-loop.js` exists + exports `validate` function | T1, T2, T3, G1a, G1b, G1c | All three file/export checks pass in `npm test` |
| AC6 | Exit 8 on path traversal + stderr does not contain resolved absolute path | T7a, T7b | `exitCode === 8`; `stderr` does not include `path.resolve('../../etc/passwd')` |

---

## Assumptions (recorded at DoR, binding on implementation)

1. `validate` returns `{ exitCode, stdout, stderr }` — it does not call `process.exit()` directly. That is `bin/skills`'s responsibility.
2. H1 maps to exit code 1. The formal H1-H9 → 1–7 mapping is cdg.2 scope; cdg.1 only asserts exit code is in range 1–7.
3. The path traversal guard uses `path.resolve(artefactPath)` relative to the current working directory, compared against `repoRoot` which `bin/skills` passes as `process.cwd()` (or equivalent repository root detection).
4. "Well-formed artefact with no H1 violations" for AC1/T4a–T4c is a synthetic in-memory or tmpdir string that contains no story slug references — not `discovery.md` (see RISK-ACCEPT-001).
5. No test fixture may contain real operator names, email addresses, or live repository paths (nfr-profile.md MC-SEC-02 constraint).
