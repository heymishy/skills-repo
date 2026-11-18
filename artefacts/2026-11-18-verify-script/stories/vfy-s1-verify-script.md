## Story: One committed command boots the test server, runs the core browser lane, and prints what broke

**Epic reference:** None - short-track (test tooling, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: the local-suite trust work in `artefacts/2026-11-17-local-playwright-suite-trust/`; the core lane is defined in `tests/e2e/capability-matrix.json` and selected by `scripts/list-core-specs.js`; CI runs the same lane in `.github/workflows/core-browser-tests.yml`.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [tests] [tooling]

## User Story

As **the developer about to open a pull request**,
I want **one committed command that runs exactly the core browser lane CI runs, and ends with a short list of the failures and where they are**,
So that **I can check my change the way CI will, without reading a 2,000-line reporter log or guessing which of several hundred lines failed**.

## Benefit Linkage

**Metric moved:** None formal. Today the core lane is run by hand with `npx playwright test $(node scripts/list-core-specs.js) --workers=1`, and a failure means scrolling a line reporter that also prints the server log. The lane is also easy to run wrongly (more than one worker races on shared state, and the wrong spec list runs a different lane).
**How:** a script that uses the same spec selector and worker count as CI, lets Playwright start the test server itself (its `webServer` setting), and reads Playwright's JSON report to print one line per failed test with its file, line, and first error line.

## Architecture Constraints

- Runs under Node with no new npm dependency.
- The server is booted by Playwright's existing `webServer` (`playwright.config.js`, port 3999, `NODE_ENV=test`); the script does not start its own server, so there is one place that defines how the server starts.
- Spec selection comes only from `scripts/list-core-specs.js`; the script never keeps its own list.
- Uses `--workers=1` to match CI (shared in-memory state races under parallel workers).

## Dependencies

- **Upstream:** lpw-s2 (core lane defined and selected by script), lpw-s4 and lpw-s5 (core lane grown to 39 specs), qrw-s1 (the 13 quarantined specs that remain outside the lane).
- **Downstream:** none.

## Acceptance Criteria

**AC1:** Given a clean checkout, When `node scripts/verify.js` runs with no arguments, Then it runs exactly the specs `scripts/list-core-specs.js` prints, with one worker and `NODE_ENV=test`, and Playwright starts the test server on port 3999 itself.
**AC2:** Given a run in which some tests fail, When the run ends, Then the script prints one entry per failed test giving its title, file and line, and the first line of its error message with terminal colour codes removed, and no server log lines.
**AC3:** Given a run in which every test passes, When it ends, Then the script prints the pass count and exits 0; Given any failure, Then it exits non-zero with the same exit code the Playwright run returned.
**AC4:** Given explicit spec file arguments, When `node scripts/verify.js tests/e2e/x.spec.js` runs, Then only those files run (still one worker, same server) and the digest is printed the same way.
**AC5:** Given port 3999 is already in use, When the script runs, Then it stops before running any test and says which port is busy, rather than letting Playwright's own error scroll past.

## Out of Scope

- Running the quarantined specs or the Scenario A and B specs (staging-bound).
- Running lint, typecheck, unit tests or the governance checks (`npm test` and CI already do; a combined "run everything" command is a separate decision).
- Changing the core lane or any spec.
- A watch mode.

## NFRs

- **Reliability:** the script's exit code is the Playwright exit code on failure and 0 on pass; no randomised ordering.
- **Security:** test-only credentials come from the same defaults `playwright.config.js` already uses; the script adds no secrets.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
