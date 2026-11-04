# Contract Proposal: /workflow reconciles merged-but-no-DoD stories against live GitHub, not just pipeline-state.json

**What will be built:**
A reconciliation check inside `/workflow`'s existing session-start pass: calls `gh pr list --state merged --json number,mergedAt`, cross-references against every story's recorded `prUrl` in `pipeline-state.json`, flags any story whose live-merged status disagrees with its own `prStatus`/`stage` fields (severity: same as "merged but DoD not complete," per ADR-030), surfaces findings prominently near the top of the session-start report, and degrades gracefully (explicit warning, fallback to `pipeline-state.json`-only) if `gh` is unavailable.

**What will NOT be built:**
Retroactive `/definition-of-done` runs for the 22 existing gaps; a new scheduled CI job.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test: cross-reference matches gh output against prUrl | unit |
| AC2 | Unit tests: flags mismatch, no-finding on agreement | unit |
| AC3 | Integration test: finding appears near top of report | integration |
| AC4 | Unit test: graceful degradation on gh failure | unit |
| AC5 | Integration test: all 22 real known gaps correctly identified | integration (real repo data) |

**Assumptions:**
The operator's own `gh` CLI authentication is available in the normal case; `pipeline-state.json`'s `prUrl` field is populated for stories that have actually opened a PR (confirmed true for all stories relevant to this check).

**Estimated touch points:**
Files: `skills/workflow/SKILL.md`, a new `scripts/lib/dod-reconciliation.js`, `tests/check-ilce-s4-dod-reconciliation.js` (new). Services: GitHub CLI (`gh`, already in use elsewhere in this repo). APIs: GitHub REST API via `gh`.

**schemaDepends:** N/A — Dependencies block is "None," no upstream story, no schema check required.
