# Discovery: Auditor Trace Report

**Status:** Approved
**Created:** 2026-04-18
**Approved by:** Hamish, 2026-04-18
**Author:** Copilot

---

## Problem Statement

An auditor arriving cold at this repository cannot produce a single, self-contained report that traces a PR or feature from its original problem statement through to the merged code and gate evidence. The data exists — `pipeline-state.json` records every feature and story with artefact paths, PR URLs, stages, and DoR status; `workspace/traces/` contains JSONL gate evidence per PR with checks, verdicts, and trace hashes — but nothing stitches these together into a readable audit trail.

Today the auditor must: (1) manually search `pipeline-state.json` for the relevant feature/story, (2) follow each artefact path and verify the file exists, (3) grep `workspace/traces/` for JSONL entries matching the commit SHA, (4) mentally correlate the gate checks with the artefact chain. This is error-prone, time-consuming, and impractical for anyone who isn't already a pipeline expert.

The `/trace` skill can walk the chain interactively in a Copilot session, but it requires an active agent session — it is not independently runnable as a CLI tool or CI step that produces a standalone report.

## Who It Affects

- **Auditor / compliance reviewer**: Needs to verify that shipped code has a complete traceability chain from idea through to gate evidence. Arrives cold — may not be a pipeline expert. Needs a self-contained report they can read without running a Copilot session.
- **Tech lead**: Wants to quickly verify chain integrity for a specific PR or feature before signing off, without reading raw JSON.
- **Platform maintainer**: Needs to demonstrate pipeline traceability to stakeholders and regulatory audiences — a human-readable report is the minimum viable evidence artefact.

## Why Now

The pipeline has reached a maturity level where multiple features have shipped through the full chain (Phase 1, Phase 2, Phase 3 partial). The archive script (psa.1) just moved completed features to a separate file. With archived and active features now split across files, the need for a unified report that can walk the chain — including archived features — is immediate. Additionally, the assurance gate now produces trace hashes and JSONL evidence, but there is no tool that correlates this with the artefact chain.

## MVP Scope

A single Node.js script (`scripts/trace-report.js`) that:

1. Accepts a feature slug or PR number as input
2. Reads `pipeline-state.json` (and `pipeline-state-archive.json` if the feature is archived) to find the matching feature and its stories
3. Walks every artefact path (discovery → benefit-metric → epic → story → test-plan → DoR → DoD) and confirms file existence
4. Correlates with `workspace/traces/` to find the matching gate JSONL entry (by commitSha or prRef)
5. Outputs a standalone Markdown report: one section per story, every chain link as a pass/fail row, gate verdict, and traceHash

The report is a read-only artefact — it does not modify any pipeline state.

## Out of Scope

- **Interactive / web-based audit dashboard** — this is a CLI script producing a Markdown file, not a UI. A dashboard is a future initiative if the report proves useful.
- **Modifying the `/trace` skill** — the existing skill will continue to operate as-is. This is a complementary CLI tool, not a replacement.
- **Cross-repository tracing** — the report covers a single repository. Multi-repo programme tracing is out of scope.

## Assumptions and Risks

- **ASSUMPTION-01:** The artefact path conventions in `pipeline-state.json` (e.g. `artefact`, `testPlan.artefact`, `prUrl`) are stable and consistently populated for features that have passed through the pipeline. If early features have inconsistent paths, the report will show them as broken links — which is accurate and useful.
- **ASSUMPTION-02:** `workspace/traces/` JSONL files contain a `commitSha` field that can be matched against `pipeline-state.json` story entries (via `prUrl` → PR → merge commit, or direct SHA match). If the correlation key is unreliable, the gate evidence section of the report will show "not found" rather than failing.
- **RISK-01:** Archived features in `pipeline-state-archive.json` may have different field shapes than active features (e.g. `completedStories[]` vs inline `stories[]`). The script must handle both shapes.

## Directional Success Indicators

- An auditor can run one command and get a complete, readable chain report for any feature
- Broken links in the chain are surfaced clearly without manual JSON reading
- Gate evidence (verdict, trace hash, checks) is correlated with the artefact chain in the same report
- The report works for both active and archived features

## Constraints

- Node.js only — no external dependencies (consistent with existing scripts)
- Must work with the current `pipeline-state.json` and `pipeline-state-archive.json` structure produced by psa.1
- Read-only — must not modify any files
- Must pass `npm test` and `validate-trace.sh --ci`

---

**Next step:** /benefit-metric
