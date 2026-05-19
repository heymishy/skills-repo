## Story: `skills validate` command — CLI entry point, exit code framework, and governance check

**Epic reference:** artefacts/2026-05-19-cli-deterministic-governance/epics/cdg-phase1-validate-cli.md
**Discovery reference:** artefacts/2026-05-19-cli-deterministic-governance/discovery.md
**Benefit-metric reference:** artefacts/2026-05-19-cli-deterministic-governance/benefit-metric.md

## User Story

As a **platform maintainer**,
I want to run `node bin/skills validate <artefact-path> definition-of-ready` and receive a typed exit code that identifies the first violation category found (or 0 for no violations),
So that I can confirm whether a gate check is executable and testable independently of any model execution, and establish the test infrastructure needed for full H1-H9 coverage in cdg.2.

## Benefit Linkage

**Metric moved:** M3 — Gate logic unit test fixtures (baseline establishment)
**How:** This story creates the executable test infrastructure (cli-outer-loop.js validate function, governance check, and proof-of-pattern fixtures) that takes the current 0-fixture baseline and establishes a working test harness. Without this foundation, cdg.2 (the full 33-fixture delivery) has no structure to extend. The M3 counter moves from 0 to a working framework (≥5 passing fixtures) that proves the approach.

## Architecture Constraints

- **ADR-011** (Artefact-first rule): `bin/skills` and `src/enforcement/cli-outer-loop.js` are new files in `bin/` and `src/` — this story is their required artefact. No commit may precede this story's DoR sign-off.
- **ADR-013** (Phase 4 enforcement architecture): `cli-outer-loop.js` implements artefact structural validation (markdown parsing and field presence checks). This is separate from `governance-package.js`'s `evaluateGate` function (which handles skill hash verification and state transitions). These are different concerns — no reimplementation of `governance-package.js` logic. Phase 2 state advancement will call `advanceState` from `governance-package.js`.
- **ADR-003** (Schema-first): Phase 1 validate command writes no pipeline-state.json fields. No schema changes required.
- **Product constraint 3** (Spec immutability): The `validate` command is read-only. It must not modify artefact files, SKILL.md files, governance criteria, or any repository content. Any write operation from within `cli-outer-loop.js` is a defect.
- **Security — OWASP A01 (path traversal)**: The artefact path argument is user-supplied. `cli-outer-loop.js` must resolve the path with `path.resolve()` and assert it starts with the repository root before reading. Return exit code 8 with an error message if the resolved path escapes the repo root. Do not log the raw path value.

## Dependencies

- **Upstream:** None — this is the first Phase 1 story.
- **Downstream:** cdg.2 depends on this story's `cli-outer-loop.js` module structure and exit code framework to add remaining H1-H9 checks.

## Acceptance Criteria

**AC1:** Given `bin/skills` exists at the repository root and is a valid Node.js script, when a developer runs `node bin/skills validate artefacts/2026-05-19-cli-deterministic-governance/discovery.md definition-of-ready` (or any path to a well-formed artefact with no H1 violations), then the process exits with code 0 and writes a one-line success message to stdout: `validate OK: definition-of-ready — 0 violations found` (or equivalent phrasing confirming gate name and zero violations).

**AC2:** Given a valid artefact path argument but an unrecognised gate name (e.g. `node bin/skills validate artefacts/x.md unknown-gate`), when the command runs, then the process exits with code 8 and writes to stderr a message containing the string `UNSUPPORTED_GATE` and a list of supported gate names (at minimum: `definition-of-ready`).

**AC3:** Given `node bin/skills validate` is called with fewer than 2 arguments (e.g. `node bin/skills validate` or `node bin/skills validate artefacts/x.md` with no gate name), when the command runs, then the process exits with a non-zero code and writes to stderr a usage string: `Usage: skills validate <artefact-path> <gate-name>`.

**AC4:** Given a `definition-of-ready` gate check where the artefact references a story slug whose file does not exist at the expected path (`artefacts/<feature-slug>/stories/<story-slug>.md`), when `node bin/skills validate` is run, then the process exits with a non-zero exit code in the range 1–7 and writes to stderr a message containing the prefix `H` followed by the check identifier and the word `FAIL` (e.g. `H1 FAIL: story artefact not found at artefacts/.../stories/<slug>.md`).

**AC5:** Given `tests/check-cli-governance.js` exists in the npm test suite and `npm test` runs, then the governance check passes (contributes 0 failures) when: (a) `bin/skills` exists as a file, (b) `src/enforcement/cli-outer-loop.js` exists as a file, and (c) `require('./src/enforcement/cli-outer-loop')` exports a function named `validate`. If any of these three conditions fails, `npm test` exits non-zero and the error message names which condition failed.

**AC6:** Given a path argument that resolves outside the repository root (e.g. `../../etc/passwd` or an absolute path to a system directory), when `node bin/skills validate` is run, then the process exits with code 8 and writes an error to stderr that does not include the resolved absolute path. No file outside the repository root is read.

## Out of Scope

- H2-H9 check implementations — only H1 (story artefact exists check) is implemented as the proof-of-pattern. All remaining H-priority checks are cdg.2 scope.
- State writes — the validate command produces no writes to pipeline-state.json, trace.jsonl, or any other file.
- `skills advance`, `skills emit-trace`, or any other CLI subcommand — Phase 2 scope; do not add stubs or placeholders.
- Modifying `cli-adapter.js` — that file handles skill-lockfile operations (a different concern). The validate logic lives in `cli-outer-loop.js`.
- Pinning `bin/skills` and `cli-outer-loop.js` to `check-lockfile-pins.js` — Phase 2 task after the files have stabilised across cdg.1 and cdg.2.

## NFRs

- **Performance:** `node bin/skills validate` completes in under 2 seconds for any artefact file in the repository (pure file reads, no network, no subprocess calls).
- **Security:** Path traversal guard is mandatory (see AC6 and Architecture Constraints). No credentials, tokens, or session data are accessed or logged. CLI output is human-readable text only — no JSON with PII or internal state.
- **Portability:** The command runs on Linux (CI) and Windows PowerShell via `node bin/skills validate`. A Unix shebang line (`#!/usr/bin/env node`) is included in `bin/skills`. No OS-specific paths are hardcoded.
- **No new runtime dependencies:** `bin/skills` and `cli-outer-loop.js` use only Node.js built-in modules (`fs`, `path`). Zero new entries added to `package.json` `dependencies` or `devDependencies`.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
