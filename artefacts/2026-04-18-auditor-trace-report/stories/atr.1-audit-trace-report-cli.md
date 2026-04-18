# Story: atr.1 — Generate standalone audit trace report from CLI

**Epic reference:** Single-story feature — no parent epic
**Discovery reference:** artefacts/2026-04-18-auditor-trace-report/discovery.md
**Benefit-metric reference:** artefacts/2026-04-18-auditor-trace-report/benefit-metric.md

## User Story

As a **platform maintainer or auditor**,
I want to **run a single CLI command that produces a complete traceability report for any feature**,
So that **I can verify the full chain from discovery to gate evidence without manually reading JSON files or running a Copilot session**.

## Benefit Linkage

**Metric moved:** M1 (Audit chain assembly time), M2 (Chain link coverage), M3 (Archive-aware operation)
**How:** This story delivers the entire CLI tool. Running `node scripts/trace-report.js --feature <slug>` produces a Markdown report in under 30 seconds, replacing 15–30 minutes of manual JSON reading. The report covers all chain link types and works for both active and archived features.

## Architecture Constraints

- ADR-011: Pipeline-state file management — the script must read both `pipeline-state.json` and `pipeline-state-archive.json`, using the merge pattern established by psa.1
- No external dependencies — Node.js standard library only (consistent with all other scripts)
- Read-only — must not modify any files

## Dependencies

- **Upstream:** psa.1 (archive completed features) — must be merged. ✅ Merged as PR #171.
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given a feature slug that exists in `pipeline-state.json`, When I run `node scripts/trace-report.js --feature <slug>`, Then the script produces a Markdown report to stdout containing: feature name, stage, health, and one section per story with chain link status for each artefact type (discovery, benefit-metric, story, test-plan, DoR, DoD).

**AC2:** Given a feature slug that exists in `pipeline-state-archive.json` but not in `pipeline-state.json`, When I run `node scripts/trace-report.js --feature <slug>`, Then the script finds the feature in the archive file and produces the same report format as AC1.

**AC3:** Given a story in `pipeline-state.json` that has a `prUrl` field, When the report is generated, Then the report includes a "Gate Evidence" section that searches `workspace/traces/` for a JSONL entry whose `commitSha` matches the story's merge commit, and displays the verdict, traceHash, and check results if found.

**AC4:** Given a feature where some artefact paths in `pipeline-state.json` point to files that do not exist on disk, When the report is generated, Then those chain links are marked as `MISSING` in the report with the expected path shown.

**AC5:** Given the script is run with `--feature <slug>` where the slug does not exist in either active or archive state, When the script runs, Then it exits with a non-zero exit code and prints a clear error message naming the slug and listing available feature slugs.

**AC6:** Given the script is run with no arguments, When it executes, Then it prints usage instructions showing the available flags (`--feature <slug>`) and exits with a non-zero exit code.

**AC7:** Given a feature with stories at various pipeline stages (some pre-test-plan, some DoD-complete), When the report is generated, Then each story section shows only the chain links that are expected for that stage — a story at `definition` stage does not show DoR or DoD as `MISSING`, it shows them as `not yet reached`.

## Out of Scope

- HTML or web-based report output — Markdown to stdout only
- Modifying any pipeline state or artefact files — read-only script
- Cross-repository tracing
- Replacing or modifying the existing `/trace` skill or `validate-trace.sh`

## NFRs

- **Performance:** Report generation completes in under 5 seconds for a feature with up to 30 stories
- **Security:** Script must not output any secrets, tokens, or credentials even if they appear in trace files
- **Compatibility:** Works with the `pipeline-state.json` and `pipeline-state-archive.json` structure produced by psa.1

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
