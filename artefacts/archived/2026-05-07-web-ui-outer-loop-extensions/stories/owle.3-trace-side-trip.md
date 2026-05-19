## Story: Trace side-trip — run chain validation from journey

**Epic reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/discovery.md
**Discovery reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/discovery.md
**Benefit-metric reference:** Reduction in traceability defects reaching the coding agent; findings surfaced before DoR sign-off.

## User Story

As an **operator reviewing a feature before signing off a DoR**,
I want to run a traceability chain check from within the journey stage panel,
So that I can see broken links and missing artefacts inline — without running a separate CLI command.

## Benefit Linkage

**Metric moved:** Pre-DoR defect rate — proportion of DoR sign-offs that later fail /trace in CI.
**How:** Currently, operators who do not run `bash scripts/validate-trace.sh --ci` locally before sign-off miss traceability gaps that CI then surfaces on the PR. An inline trace check at the DoR stage catches these issues seconds before sign-off rather than minutes after — eliminating the "fix, re-push, wait for CI" loop.

## Architecture Constraints

- The trace logic reads from the local `artefacts/` directory. It does not call the GitHub API or run the shell script — it is a Node.js re-implementation of the chain-check rules sufficient for the coverage checks that matter most (discovery → benefit-metric → stories → test-plans → DoR artefacts all present; artefact cross-references resolvable on disk).
- The result is display-only — no writes occur in this story. The trace result is not written to pipeline-state.json or any file.
- The trace logic is exposed via a `GET /api/journey/:id/trace` endpoint that returns JSON: `{ status: "passed"|"has-findings"|"failed", findings: [ { type, path, message } ] }`.
- The journey stage panel polls this endpoint on demand (button-click), not automatically.
- No new npm dependencies.
- Path traversal guard applies to any artefact file path read during the trace.

## Dependencies

- **Upstream:** ougl.1–ougl.7 (DoD-complete) — journey infrastructure and feature-slug context required.
- **Downstream:** None. The full `validate-trace.sh` script remains authoritative for CI; this story provides a fast inline subset check.

## Acceptance Criteria

**AC1:** Given the operator is at any stage of an active journey, when they view the stage panel, then a "Run trace" button is visible.

**AC2:** Given the operator clicks "Run trace", when the trace completes, then the result summary is shown inline in the stage panel: one of "✓ Chain OK" (all checks pass), "⚠ Has findings" (warnings but not blocking), or "✕ Chain broken" (one or more required artefacts missing).

**AC3:** Given the trace returns findings, when the result is displayed, then each finding shows: finding type (e.g. "Missing test-plan", "Broken artefact link"), the file path expected, and a one-sentence description of what is missing or broken.

**AC4:** Given the feature's artefact directory is empty or has only a discovery.md, when the trace runs, then the result is "Has findings" (not an error) with a finding for each expected-but-absent artefact stage — the trace never throws an unhandled error for a sparse artefact tree.

**AC5:** Given the trace result contains a file path for a finding, when the operator views the finding, then the path is shown as-is (relative to repo root) — no hyperlink to GitHub required in this story (display-only).

**AC6:** Given the operator runs the trace a second time (clicks the button again), when the result arrives, then the previous result is replaced with the new one — results do not stack or accumulate.

**AC7:** Given `npm test` runs, then the trace logic is tested with synthetic artefact trees that cover: fully-linked chain (PASSED), missing test-plan for one story (HAS-FINDINGS), missing discovery.md (FAILED).

## Out of Scope

- Running `validate-trace.sh` (shell script) — the inline check is a Node.js subset; the full shell script is the CI authority.
- Writing the trace result to `artefacts/<feature-slug>/trace/` — read-only display only.
- Remote artefact fetching (GitHub API) — local disk files only.
- Schema validation of pipeline-state.json as part of the trace — that is the shell script's scope.

## NFRs

- **Performance:** Trace completes within 2 seconds for a feature with up to 10 stories and 50 artefact files.
- **Security:** All artefact file reads must pass path traversal validation — resolved paths must start with `repoRoot`.

## Complexity Rating

**Rating:** 2 — requires distilling the chain-check logic from validate-trace.sh into a Node.js module without depending on Python.
**Scope stability:** Stable.
