## Story: Benefit measurement expansion — platform vs traditional SDLC comparison

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e5-platform-observability.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As a **platform operator evaluating delivery outcomes**,
I want to **record structured comparison data showing delivery performance with the Copilot+platform approach against a counterfactual traditional SDLC baseline for any completed feature**,
So that **I can measure and communicate actual delivery benefit grounded in real actuals rather than estimates, feeding the EXP-001 experiment framework and supporting evidence-based platform improvement**.

## Benefit Linkage

**Metric moved:** MM-A through MM-D (Tier 2 meta-metrics — experiment framework)
**How:** The EXP-001 framework commits to comparing Copilot+platform delivery against alternatives. This story creates the structured data-collection and comparison-reporting tooling that makes that comparison possible beyond model-vs-model. Without this story, the benefit claim "platform reduces delivery cycle time and overhead" is asserted but not measured. With it, each completed feature produces a quantified comparison row that accumulates into `workspace/estimation-norms.md`-style evidence over time.

## Architecture Constraints

- ADR-001: CommonJS modules — no ESM, no TypeScript, no transpilation
- Write target: `workspace/experiments/` — comparison reports written as `benefit-comparison-<feature-slug>.md`; this directory already exists (EXP-001 uses it); no new directory creation required
- Read sources: `pipeline-state.json` + `pipeline-state-archive.json` for platform actuals (cycle times, story counts, AC counts, test counts); `workspace/estimation-norms.md` for E3 actuals if present
- Interactive prompts: `readline` (Node.js built-in) for collecting traditional-estimate inputs; no external prompt libraries
- Report format: Markdown table + narrative summary; machine-parseable fields in a YAML front-matter block at the top of each comparison report for future aggregation
- MC-SEC-02: no credentials, operator personal identifiers, or API tokens in any comparison report output
- ADR-004 equivalent: no hardcoded feature slugs or operator names in script source; all identifiers taken from CLI args or state file content

## Dependencies

- **Upstream:** psa.1 and `archive-completed-features.js` `mergeState()` — reads full state including archived features for cycle time calculation; DoD-complete ✅
- **Upstream:** EXP-001 framework at `workspace/experiments/EXP-001-discovery-phase4-5/` — comparison reports reference this directory; EXP-001 must exist before first comparison run (it is committed ✅)
- **Downstream:** p4-obs-status — weekly report can include latest benefit comparison data point; p4-obs-benefit ships independently; benefit row in weekly report is omitted if no comparison reports exist

## Acceptance Criteria

**AC1:** Given `node scripts/record-benefit-comparison.js --feature <slug>`, When the script runs against a `pipeline-state.json` that contains the named feature with at least one DoD-complete story, Then the script prompts for four inputs (traditional cycle time in days, traditional operator hours estimate, traditional defect count estimate, counterfactual notes), reads platform actuals from state (story count, DoD-complete count, test count, total calendar days from first story discovery to last story dodAt, operator hours from `workspace/estimation-norms.md` if present), and writes `workspace/experiments/benefit-comparison-<slug>.md`.

**AC2:** Given the comparison report is written, When its content is read, Then it contains: a YAML front-matter block with fields `feature_slug`, `report_date`, `platform_cycle_days`, `traditional_cycle_days`, `platform_operator_hours`, `traditional_operator_hours_estimate`, `platform_story_count`, `platform_test_count`; and a markdown body with a two-column comparison table (Platform vs Traditional) for cycle time, operator hours, and test count, plus a percentage delta row for each.

**AC3:** Given two or more benefit comparison reports exist in `workspace/experiments/`, When `node scripts/record-benefit-comparison.js --summary` is run, Then it prints a markdown summary table to stdout with one row per report, columns: Feature, Platform cycle (days), Traditional estimate (days), Delta %, Platform tests, Operator hours saved; and a totals/average row at the bottom.

**AC4:** Given a benefit comparison report is written for a feature, When the report is opened, Then the YAML front-matter contains an `experiment_ref` field pointing to the relevant EXP-xxx directory (e.g. `workspace/experiments/EXP-001-discovery-phase4-5/`) for features that are associated with a named experiment, or `null` if no experiment is associated.

## Out of Scope

- Automated data collection — traditional estimates are always operator-supplied via interactive prompt; no attempt to infer traditional estimates from external sources
- Integration with project management tools (Jira, GitHub Issues) for traditional baseline import
- Statistical significance testing or confidence interval calculation
- Modifying `workspace/estimation-norms.md` directly — this story reads it but does not write to it

## NFRs

- **Security:** No credentials, tokens, API keys, or operator personal identifiers in report output (MC-SEC-02)
- **Correctness:** YAML front-matter in every comparison report must be valid YAML parseable by Node.js `require('js-yaml')` or equivalent — use only built-in types (string, number, null)
- **Correctness:** Percentage delta calculation: `Math.round((platform - traditional) / traditional * 100)` — negative value = platform faster/cheaper, positive = platform slower/more expensive; labelled clearly in output

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable — reads existing state files and writes to existing experiments directory; no new state fields required

## Definition of Ready Pre-check

See: artefacts/2026-04-19-skills-platform-phase4/dor/p4-obs-benefit-dor.md
