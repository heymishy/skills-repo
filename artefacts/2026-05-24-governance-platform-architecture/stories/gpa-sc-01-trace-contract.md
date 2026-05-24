## Story: Write trace contract standards document

**Epic reference:** `artefacts/2026-05-24-governance-platform-architecture/epics/gpa-epic-01-governance-foundation.md`
**Discovery reference:** `artefacts/2026-05-24-governance-platform-architecture/discovery.md`
**Benefit-metric reference:** `artefacts/2026-05-24-governance-platform-architecture/benefit-metric.md`

## User Story

As a **story author** (or future coding agent implementing a governance-adjacent feature),
I want a canonical `standards/governance/trace-contract.md` document that records all 15 design principles (P01-P15) identified in the architecture discovery, each with its enforcement path, responsible module, and the field or behaviour it governs,
So that M1 (architecture documentation coverage) moves from 15 undocumented principles to 0, and implementation questions can be resolved against a written standard rather than by reading source code.

## Benefit Linkage

**Metric moved:** M1 — Architecture documentation coverage.
**How:** This story writes the standards file that documents the enforcement-path principles. At SC-01 DoD, M1 moves from 15 undocumented principles toward 0, with the three highest-risk principles (P02 path traversal, P06 disk canonicity, P08 chain-hash) explicitly documented first. SC-04 closes the remainder.

## Architecture Constraints

- ADR-011: this story creates a new file under `standards/governance/`. This story artefact satisfies the artefact-first requirement.
- No enforcement module changes — documentation only.
- Checked against `.github/architecture-guardrails.md` — no other guardrails apply to documentation-only changes.

## Dependencies

- **Upstream:** None.
- **Downstream:** SC-03 (`gpa-sc-03-cli-validate-ci.md`) — H9 (architecture constraints check) relies on trace-contract.md being present to be meaningfully evaluatable; SC-03 should be dispatched after SC-01 is DoD-complete.

## Acceptance Criteria

**AC1:** Given the `standards/governance/` directory exists, when a contributor or future agent asks "what fields must a governance trace contain and why," then `trace-contract.md` contains all 15 principles from discovery (P01-P15), each with: (a) the principle statement, (b) the module in the enforcement path where it is currently implemented, (c) the field or observable behaviour it governs, and (d) a cross-reference to the canonical source (copilot-instructions.md rule name, ADR number, or code module path).

**AC2:** Given trace-contract.md is committed, when CONTRIBUTING.md is read by a new contributor, then it contains a reference to `standards/governance/trace-contract.md` as the canonical first stop for governance principle questions.

**AC3:** Given `npm test` is run after SC-01 is merged, then all existing tests pass — no regression from the new file.

**AC4:** Given trace-contract.md lists principle P02 (path traversal guard), when a future coding agent implements any feature that reads from or writes to disk at a path derived from external data, then they find an explicit entry in trace-contract.md stating the required validation pattern (`path.resolve(inputPath).startsWith(repoRoot + path.sep)`) and the source obligation (copilot-instructions.md "Path traversal guard for disk writes (ougl)").

## Out of Scope

- Implementation changes to any enforcement module (assurance-gate.yml, run-assurance-gate.js, governance-package.js, journey.js) — documentation only.
- Writing test plans or DoR artefacts for any story referenced in the document.
- Documenting principles outside the 15 identified in discovery as P01-P15.
- Documenting non-governance-path principles (viz rendering, CSS, etc.).

## NFRs

- **Documentation quality:** Each principle entry must be human-readable without tooling — plain markdown, no embedded code required to interpret.
- **Accuracy:** All module path references must resolve to real files at commit time.
- **No new npm dependencies.**

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
