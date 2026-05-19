## Story: H1-H9 DoR deterministic checks — complete coverage and ≥33 test fixtures

**Epic reference:** artefacts/2026-05-19-cli-deterministic-governance/epics/cdg-phase1-validate-cli.md
**Discovery reference:** artefacts/2026-05-19-cli-deterministic-governance/discovery.md
**Benefit-metric reference:** artefacts/2026-05-19-cli-deterministic-governance/benefit-metric.md

## User Story

As a **platform maintainer**,
I want `skills validate definition-of-ready` to check all 33 H-priority deterministic items (H1-H9 DoR gate) and report the first failing category's exit code,
So that any H-priority violation in a story or DoR artefact is caught by executable code rather than model judgment, and I can confirm this in CI by running `npm test`.

## Benefit Linkage

**Metric moved:** M3 — Gate logic unit test fixtures (≥33 fixtures)
**How:** This story adds the remaining 32 H-priority DoR deterministic checks to `cli-outer-loop.js` (cdg.1 established the first check) and creates a test fixture for each, reaching the ≥33 fixture threshold that is the Phase 1 exit condition. npm test will enforce the fixture count via `tests/check-cli-governance.js`. Once merged, M3 is satisfied.

## Architecture Constraints

- **ADR-011** (Artefact-first rule): All additions to `src/enforcement/cli-outer-loop.js` and `tests/check-cli-outer-loop.js` are covered by this story artefact.
- **ADR-013** (Phase 4 enforcement architecture): `cli-outer-loop.js` remains a structural artefact validator only. It does not call `advanceState` or any `governance-package.js` function. These are separate concerns.
- **Product constraint 3** (Spec immutability): Validate is read-only. Adding H4-H9 checks does not change this — no write operations permitted from within `cli-outer-loop.js`.
- **Security — OWASP A01**: The path traversal guard established in cdg.1 (AC6) applies to all code paths. No new entry point may bypass the guard.
- **Test fixture isolation**: Each test fixture must be independently runnable without depending on the state produced by another fixture. Fixtures use self-contained in-memory artefact strings or dedicated fixture files in `tests/fixtures/cli-outer-loop/`.

## Dependencies

- **Upstream:** cdg.1 must be DoD-complete — this story extends `cli-outer-loop.js` and `tests/check-cli-governance.js`. The module structure (validate function, exit code constants, H1 check pattern) must exist before H2-H9 checks can be added.
- **Downstream:** None within this feature. After cdg.2 merges, the Phase 1 exit condition is met and the H7.1 spike can proceed.

## Acceptance Criteria

**AC1:** Given `src/enforcement/cli-outer-loop.js` contains implementations for all 33 H-priority deterministic items across the H1-H9 DoR gate, when `node bin/skills validate <dor-artefact> definition-of-ready` is run against an artefact that violates a specific H-category (e.g. AC format check), then the process exits with the exit code corresponding to that category (1–7) and writes to stderr a message that begins with the H-identifier prefix (e.g. `H2 FAIL:`) followed by a human-readable description of the violation.

**AC2:** Given `tests/check-cli-outer-loop.js` contains test fixtures for all H1-H9 exit code categories, when `npm test` runs, then the fixture suite passes with a minimum of 33 individual assertions (one per H-priority deterministic item). The total count is reported in the test output.

**AC3:** Given `tests/check-cli-governance.js` is updated to assert fixture count, when `npm test` runs, then the governance check asserts that `tests/check-cli-outer-loop.js` contains at least 33 fixture assertions. If the count falls below 33, `npm test` exits non-zero with an error message: `cli-outer-loop fixture count N is below minimum 33`.

**AC4:** Given a DoR artefact where the story has fewer than 3 ACs, when `node bin/skills validate` is run, then the process exits with a non-zero exit code (H2 category) and stderr contains `H2 FAIL` and the specific message `minimum 3 ACs required, found N`.

**AC5:** Given a DoR artefact where an AC does not contain the strings `Given`, `When`, and `Then` (case-insensitive), when `node bin/skills validate` is run, then the process exits with a non-zero exit code (H2 category) and stderr contains `H2 FAIL` and identifies the AC number that fails the format check (e.g. `AC2 does not follow Given/When/Then format`).

**AC6:** Given a DoR artefact where the benefit linkage field contains one of the disqualifying phrases (`"technical dependency"`, `"unblocks"`, `"needed for"`) as the sole justification, when `node bin/skills validate` is run, then the process exits with a non-zero exit code (H5 category) and stderr contains `H5 FAIL` and `benefit linkage describes a technical dependency`.

**AC7:** Given a well-formed DoR artefact that satisfies all 33 H-priority checks, when `node bin/skills validate <dor-artefact> definition-of-ready` is run, then the process exits with code 0 and stdout contains `validate OK: definition-of-ready — 0 violations found`. No false positives.

**AC8:** Given `npm test` runs the full suite after cdg.2 is merged, then all pre-existing tests continue to pass (zero regressions). The test count increases by at least 33 relative to the count before cdg.1 merged.

## Out of Scope

- Gates other than `definition-of-ready` — `discovery`, `definition`, `test-plan`, and `review` gate implementations are future phases.
- H-E2E and H-NFR checks (the H-E2E and H-NFR hard blocks from the DoR skill) — these are not in the 33-item H1-H9 catalogue. If they appear in the audit, flag them as a scope note.
- Warning checks (W1-W5 from the DoR skill) — warnings require different handling (non-fatal output) and are not part of the Phase 1 exit-code-only implementation.
- Automatic correction — validate reports violations and exits; it does not attempt to fix them or suggest specific edits to the artefact.
- Fixture files on disk — prefer in-memory artefact string literals in test fixtures where possible to avoid fixture file path dependencies. If fixture files are needed (e.g. for testing file-resolution checks), store under `tests/fixtures/cli-outer-loop/` and document the fixture path.

## NFRs

- **Performance:** Full 33-fixture suite completes in under 10 seconds as part of `npm test` (pure in-memory checks, no file I/O other than the fixture reads themselves).
- **Security:** No credentials, paths, or internal identifiers logged in test output. Fixture artefacts must not contain real operator names, email addresses, or repository paths from the live workspace.
- **No new runtime dependencies:** All additions use only Node.js built-ins. Zero new entries in `package.json`.
- **Test isolation:** Each fixture assertion must be independently passing or failing — no shared mutable state between fixtures.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable — the 33 H-priority items are catalogued in the pre-architecture ideation audit. No new checks are added beyond the catalogue.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
