# NFR Profile: Governance Platform Architecture — Close Structural Gaps

**Feature slug:** 2026-05-24-governance-platform-architecture
**Date:** 2026-05-24
**Status:** Active

---

## Performance Targets

- **SC-03:** `skills validate --ci` must complete in under 60 seconds for features with ≤10 stories (A3 performance assumption from discovery artefact).
- **SC-05:** `skills init` must complete in under 2 seconds for pipeline-state.json files up to 5,000 lines (typical repo state size).
- **All other stories:** No specific performance targets — documentation-only or code-extraction stories with no throughput requirements.

## Security Requirements

- **SC-06 (MANDATORY — OWASP A01 closure):** `sourceIntegrity(sourcePath)` must validate `path.resolve(inputPath).startsWith(repoRoot + path.sep)` before any `fs.readFileSync` call. Guard is mandatory per copilot-instructions.md "Path traversal guard for disk writes (ougl)". A dedicated test must cover the traversal-rejection case and assert both the structured warning response and that no file read occurs.
- **SC-05 (MANDATORY):** `skills init` slug input must be validated against an allowlist pattern (`/^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/` or equivalent) before any file operation. Path traversal via slug not permitted.
- **All scripts:** No credentials, tokens, or personal data written to pipeline-state.json or any committed artefact.
- **SC-06 (log injection):** Raw user-supplied path values must not appear in any log output, error message, or return value when the traversal guard fires.

## Data Classification

**Internal** — pipeline-state.json and all artefacts contain internal platform delivery metadata only. No personal data, no financial data, no credentials, no PII.

## Data Residency

Not applicable — local repository only. No data leaves the repository host.

## Availability SLA

Not applicable — developer tooling with no production availability target.

## Compliance Frameworks

| Framework | Story | Obligation |
|-----------|-------|------------|
| OWASP A01 (path traversal) | SC-06 | Closes confirmed finding: unguarded `readFileSync(sourcePath)` in assurance-gate.yml line 260 |
| ADR-013 (internal — shared gate authority) | SC-02 | Closes non-compliance: `run-assurance-gate.js` independent `checkResults` function |
| copilot-instructions.md "Path traversal guard for disk writes (ougl)" | SC-06 | Mandatory implementation pattern; dedicated test required |
| copilot-instructions.md "Disk canonicity for gate-confirm and artefact handoff" | SC-05 | Atomic write (tmp-then-rename) for pipeline-state.json updates |
| copilot-instructions.md "Artefact-first rule" (ADR-011) | All stories | All new modules and governance check scripts in this feature have story artefacts committed before or alongside implementation |

## Accessibility

Not applicable — no UI components in this feature. All stories are CLI tooling, CI wiring, or documentation.

---

*This NFR profile applies across all stories in feature 2026-05-24-governance-platform-architecture. Story-level NFR overrides, if any, are stated in the individual story artefact.*
