# Story: src.1 — Integrate CLI observability tools into skill routing

**Epic reference:** Single-story feature — no parent epic
**Feature reference:** artefacts/2026-04-21-skill-routing-cli-tools/

## User Story

As a **platform operator running the skills pipeline**,
I want **the `/workflow` and `/improve` skills to surface the CLI observability tools at the right moment**,
So that **I discover and use `generate-status-report.js` and `record-benefit-comparison.js` through normal pipeline flow rather than having to know they exist independently**.

## Benefit Linkage

**Metric moved:** M1 (CLI observability tool discovery rate — proportion of pipeline sessions where the operator uses the status report or benefit comparison tool)
**How:** Both tools are currently DoD-complete and tested but are not referenced by any skill. An operator following the standard pipeline flow will never be directed to them. Adding routing hooks in `/workflow` (session start) and `/improve` (post-DoD learning extraction) converts these from orphaned scripts to first-class pipeline actions, directly increasing their usage and the quality of delivery signal they capture.

## Architecture Constraints

- SKILL.md changes must go via PR (platform change policy — `.github/skills/` files require PR with tech lead review)
- No changes to `src/`, `scripts/`, `standards/`, `dashboards/`, or `tests/` beyond the governance check script for this story
- No changes to `pipeline-state.json` schema — no new fields required
- The routing hooks must reference the exact script paths: `scripts/generate-status-report.js` and `scripts/record-benefit-comparison.js`
- The routing in `/improve` must be non-blocking — operators must be able to defer the benefit comparison without the skill stalling

## Dependencies

- **Upstream:** p4-obs-status (generate-status-report.js) — DoD-complete ✅ PR #175 merged
- **Upstream:** p4-obs-benefit (record-benefit-comparison.js) — DoD-complete ✅ PR #177 merged
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given a platform operator invokes `/workflow` at session start when `pipeline-state.json` contains at least one feature that is not DoD-complete, When the pipeline status table is presented, Then the output includes a callout instructing the operator to run `node scripts/generate-status-report.js --daily` to see a detailed status report — appearing before the prompt asking which feature to work on.

**AC2:** Given a platform operator invokes `/workflow` with an intent phrase matching "daily report", "weekly report", or "pipeline status report", When the skill processes the trigger, Then the skill responds with the exact `node` invocation `node scripts/generate-status-report.js --daily` (for daily) or `node scripts/generate-status-report.js --weekly` (for weekly) and describes that the output shows in-flight stories, blocked items, and pending actions.

**AC3:** Given a platform operator runs `/improve` after a feature is DoD-confirmed and the skill is about to present pattern findings, When the skill outputs the completion section, Then the output includes a `## Benefit Measurement` callout that provides the exact command `node scripts/record-benefit-comparison.js --feature <slug>` with the correct feature slug substituted, and a note explaining this records delivery actuals for EXP-001.

**AC4:** Given the `/improve` benefit measurement callout has been shown, When the operator indicates they want to skip or defer the comparison run, Then the skill acknowledges the deferral and continues to present the standard learning extraction steps — the benefit comparison is non-blocking and explicitly described as deferrable.

**AC5:** Given either SKILL.md change has been applied and an operator reads the modified skill file, Then the workflow SKILL.md contains the exact string `node scripts/generate-status-report.js` with correct `--daily` and `--weekly` flag variants, and the improve SKILL.md contains the exact string `node scripts/record-benefit-comparison.js` with a `--feature` flag reference.

## Out of Scope

- Changes to `scripts/generate-status-report.js` or `scripts/record-benefit-comparison.js` themselves — both are DoD-complete and unchanged
- Adding the status report or benefit comparison to any skill other than `/workflow` and `/improve`
- Automating execution of either script — they remain operator-run CLI tools
- Adding a `--summary` flag callout to `/improve` — the `generateSummary` function is a separate operator action not part of the post-feature flow
- Any changes to `copilot-instructions.md` — skill routing is in the SKILL.md files

## NFRs

**NFRs:** None — confirmed 2026-04-21. No security surface (text-only SKILL.md changes), no data handling, no performance impact.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared
- [x] Benefit linkage is written (references named metric M1)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (None — confirmed)
- [x] Human oversight level: Low — personal repo, non-regulated, single operator
