## Story: Add path traversal guard to manifest sourcePath reads

**Epic reference:** `artefacts/2026-05-24-governance-platform-architecture/epics/gpa-epic-02-ci-enforcement-compliance.md`
**Discovery reference:** `artefacts/2026-05-24-governance-platform-architecture/discovery.md`
**Benefit-metric reference:** `artefacts/2026-05-24-governance-platform-architecture/benefit-metric.md`

## User Story

As a **platform operator** maintaining the CI security posture,
I want the `sourceIntegrity(sourcePath)` function — extracted from assurance-gate.yml inline JS by SC-07 — to validate that any manifest-supplied path resolves inside the repository root before reading the file,
So that M5 (path traversal attack surface in CI comment path) moves from 1 confirmed unguarded `readFileSync` to 0, and the OWASP A01 violation confirmed at assurance-gate.yml line 260 is formally closed.

## Benefit Linkage

**Metric moved:** M5 — Path traversal attack surface in CI comment path.
**How:** SC-07 extracts `sourceIntegrity` to a testable module. SC-06 adds the `path.resolve(p).startsWith(repoRoot + path.sep)` guard per the copilot-instructions.md "Path traversal guard for disk writes (ougl)" obligation, with a dedicated test asserting both the traversal-rejection behaviour and that no file read occurs. Together, SC-07 + SC-06 move M5 from 1 confirmed unguarded call to 0.

## Architecture Constraints

- copilot-instructions.md "Path traversal guard for disk writes (ougl)": **mandatory** guard pattern — `path.resolve(inputPath).startsWith(repoRoot + path.sep)`. Return a structured warning on failure (not an exception). A dedicated test must cover the traversal case and assert both the structured warning response and that no file was read. This guard is not optional.
- ADR-011: modification to `scripts/ci-audit-comment.js` — this story artefact satisfies artefact-first.
- No external npm dependencies.
- Checked against `.github/architecture-guardrails.md`.

## Dependencies

- **Upstream:** SC-07 (`gpa-sc-07-inline-js-extraction.md`) — `sourceIntegrity` must be extracted to a module before the guard can be added with test coverage. SC-06 is not dispatchable until SC-07 is DoD-complete.
- **Downstream:** M5 moves to 0 when SC-06 ships.

## Acceptance Criteria

**AC1:** Given `sourceIntegrity(sourcePath)` receives a path from manifest.json that resolves outside `process.cwd()` (e.g. `../../../etc/passwd`, `../../.github/secrets`), when the function is called, then it returns a structured warning object `{ traversal: true, sanitisedPath: '[REDACTED]' }` — it does not read the file, does not throw an unhandled exception, and does not include the raw input path value in any log output, error message, or return value.

**AC2:** Given `sourceIntegrity(sourcePath)` receives a valid path inside `process.cwd()` (e.g. `artefacts/2026-05-24-governance-platform-architecture/discovery.md`), when the file exists, then the function returns the file content hash as before — no regression in normal-path behaviour.

**AC3:** Given a test file exercises `sourceIntegrity` with a traversal path (`../../../etc/passwd`), when `npm test` runs, then the test passes and the traversal-rejection branch is explicitly exercised (not just the happy path).

**AC4:** Given SC-06 is complete, when the M5 grep check `grep -rn "readFileSync" scripts/ci-audit-comment.js` is run, then zero results appear without a preceding `startsWith(repoRoot)` assertion within the same function body — the raw `sourcePath` variable is not passed directly to `readFileSync` anywhere in the file.

**AC5:** Given SC-06 is merged, when the platform operator runs the M5 evidence check from the benefit-metric M5 "Validated by" condition, then the check returns zero results — M5 evidence is produced at SC-06 DoD.

## Out of Scope

- Guarding other `fs.readFileSync` calls outside the `sourceIntegrity` function — a separate audit pass if needed.
- Changing the manifest.json schema or the semantics of what the sourcePath field can contain.
- Adding authentication or authorisation to the CI comment posting flow.

## NFRs

- **Security:** The raw user-supplied path value must not appear in any log output, error message, or return value from the guard path — prevents log injection.
- **No external npm dependencies.**
- **Test coverage mandatory:** The traversal-rejection case must have a dedicated test assertion, not just a code comment.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] SC-07 DoD-complete confirmed before dispatching
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
