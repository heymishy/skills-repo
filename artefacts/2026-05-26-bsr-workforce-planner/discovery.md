# Discovery: BSR Workforce Planner

**Status:** Approved
**Created:** 2026-05-26
**Approved by:** Hamish King — 2026-05-26
**Author:** Copilot / Hamish Ward

---

## Problem Statement

Workforce data for ~200 people across 5 product groups is maintained in separate per-group xlsx files with no unified view and no connection to the initiative portfolio. At financial year planning time, answering questions like "which initiatives are under-resourced?", "who is ending contract before Q3?", or "which squad has capacity for a new initiative?" requires manually cross-referencing up to 5 files with no tooling support.

The FTE and cost figures submitted in initiative proposals (via the `initiative-intake` skill in the enterprise fork) cannot be validated against actual roster data without significant manual effort. There is no mechanism to quickly identify hiring gaps by role or skill, or to flag when an initiative requires a squad profile that is already fully committed on a higher-priority initiative. Leadership overhead roles — Product Owners, leads, people leaders — that are required at scale across groups are also untracked against initiative demand.

The pain is most acute at annual planning time and at contract renewal periods, when end-date visibility directly affects headcount risk decisions for the next financial year.

## Who It Affects

**Head of Engineering (primary)** — needs a consolidated workforce view to resource-plan against the initiative portfolio, challenge FTE and cost claims in GM review sessions, and identify hiring needs by squad, role, and skill before the financial year locks.

**Product group leads / squad leads (secondary)** — maintain their slice of the workforce data and need a team-level capacity view during planning cycles to answer "what can my group absorb?" without manual spreadsheet work.

## Why Now

Financial year planning is the immediate forcing function. The `initiative-intake`, `initiative-portfolio`, and `workshop-facilitator` skills in the enterprise fork already capture FTE demand and cost from initiative submissions — but have no feed of actual supply to validate against. Initiative submissions regularly overstate or understate FTE without effective challenge, because the tool to do the sanity check in real time does not exist. Contract end-date visibility for next-FY headcount risk is also urgently needed.

## MVP Scope

### Skills (3 new, this repo)

**`workforce-intake`** — reads one or more xlsx files (one per product group), applies a per-group column-normalisation config to handle schema variation, and produces `workforce/[product-group].json` per group plus a merged `workforce/roster.json`. Each person record includes: name, team, squad, product group, role, title, employment type (permanent / contractor / third-party), start date, end date (or null if open-ended), and a skills/tags array.

**`workforce-update`** — adds, edits, or retires individual records in `workforce/roster.json` and the relevant per-group file without requiring full re-intake from xlsx. Accepts structured input (name, field, new value) and writes both files atomically.

**`workforce-map`** — the core reconciliation skill. Links people and teams to initiative slugs from `portfolio/[slug].json` (output of the `initiative-intake` skill in the enterprise fork) using three allocation modes:
- **Direct**: named squad or individual person assigned explicitly to an initiative slug.
- **Profile match**: initiative requires capabilities similar to a known squad type, but that squad is fully committed. Matching is tag-intersection based: the operator specifies the required role-tag set at invocation time (not derived automatically from squad X's composition); the skill identifies people in the roster whose `skills[]` array satisfies all required tags and who are not already at full allocation. "Similar to squad X" is not inferred — it is an explicit required-tags list the operator provides when invoking `workforce-map`.
- **Net new**: no current squad or roster capacity matches the initiative's requirements — flagged as a hiring need with the required role, skill, and squad type specified.

`workforce-map` reads `workforce/cost-model.json` to infer cost per person per quarter/year from their role, computes actual FTE and cost per initiative from the allocation, and diffs against the `people.fte_demand` and `financial_metrics` fields in the corresponding `portfolio/[slug].json`. Produces `workforce/initiative-map.json` and a human-readable gap report.

### Supporting data files

**`workforce/cost-model.json`** — editable role → quarterly and annual cost assumption table. Not derived from payroll. Updated manually at financial year boundaries.

**`workforce/initiative-map.json`** — machine-produced by `workforce-map`. Records direct assignments, profile matches, net-new gaps, and computed FTE/cost deltas per initiative slug.

### Web dashboard

**`dashboards/workforce.html`** — static HTML, no server required, consistent with existing dashboard pattern. Views:
- **Roster view**: filterable and searchable by product group, squad, employment type, and end-date range. Shows all ~200 people with their current allocation status.
- **Initiative allocation matrix**: rows = initiatives, columns = squads/people. Shows allocation mode (direct / profile-match / net-new gap) and computed vs claimed FTE delta per initiative.
- **FTE and cost delta view**: per initiative — claimed FTE and cost from `portfolio/[slug].json` vs actual allocated FTE and cost from the roster mapping. Surfaces over-claims and under-resourcing.
- **Hiring gap view**: net-new gaps expressed as named role/skill requirements per initiative slug. Grouped by product group and squad type needed.
- **Leadership coverage view**: shows Product Owners, Engineering Chapter Leads, and People Leaders (anyone with direct reports in the roster) across groups. A flag is raised when an initiative with a direct or profile-match allocation of 3 or more FTE across multiple squads has no identified Product Owner or Engineering Lead in its allocation. These three role types — Product Owner, Engineering Chapter Lead, People Leader — are the defined leadership overhead roles for this purpose.

## Out of Scope

- The `initiative-intake`, `initiative-interrogate`, `initiative-portfolio`, and `workshop-facilitator` skills — these exist in the enterprise fork and are read-only inputs. This feature reads their `portfolio/[slug].json` output but does not own, duplicate, or modify it.
- Payroll system or HR system integration — cost model uses manually maintained role-rate assumptions, not live payroll data.
- Performance, capability assessment, or career data — scope is headcount, capacity, and initiative allocation only.
- Real-time sync — all updates are file-based via skills invocation; no live data feed.
- Creating or modifying initiative submissions — `workforce-map` reads and diffs against initiative data but does not write back to `portfolio/` files.

## Assumptions and Risks

- **Initiative slug stability**: initiative slugs in `portfolio/[slug].json` are stable identifiers. If a slug changes post-intake, the workforce mapping breaks silently. Mitigation: `workforce-map` warns when a mapped slug has no corresponding portfolio file.
- **xlsx schema variation**: the 5 product group sheets vary in column naming. A per-group `workforce/schema-map/[group].json` config file will capture the mapping. This config must be maintained when group sheets change structure.
- **Cost model staleness**: role-rate assumptions in `cost-model.json` become stale if not updated at FY boundaries. Named owner: Head of Engineering (Hamish King), with Finance input at each FY boundary review. The web UI will display the `lastUpdated` date of the cost model prominently as a data-freshness indicator.
- **Enterprise fork skill prerequisite**: `workforce-map` requires `portfolio/[slug].json` files to exist (produced by `initiative-intake` in the enterprise fork) before reconciliation can run. If the enterprise fork's portfolio is not current, the delta output will be misleading.
- **Profile match accuracy**: matching is tag-intersection based against the person's `skills[]` array in the roster; the operator supplies the required tag set at invocation time. Accuracy depends on role/skill tags being applied consistently during intake and updates. Inconsistent tagging produces false positives (matched person lacks the actual capability) or missed capacity (capable person is not matched). The required-tag set the operator specifies at invocation time is the primary control point.
- **PII boundary**: roster data includes personal information. The repo is private and sits behind IAM roles and a development proxy. This constraint must be reviewed before the repo access model changes.

## Directional Success Indicators

The FY planning outcome if this works: the Head of Engineering can commit to initiative FTE and cost numbers at the GM review session with evidence from the actual roster — not assumption. Over-commitment of scarce people across competing high-priority initiatives is identified before it becomes a mid-year delivery failure, not after.

- **Hiring decisions are evidence-based, not negotiated.** Named role/skill gaps attached to specific initiative slugs replace a negotiated headcount number derived from past years' patterns. The decision — hire N engineers of type X for initiative Y — is grounded in a specific identified gap, not a round-number estimate.
- **Contract ending risk is priced into planning before the GM review.** Renewals and endings within the planning horizon are visible in the roster view, so headcount risk is a known input to resourcing decisions, not a surprise mid-year.
- **FTE over-claims in initiative submissions are challenged at the right moment.** Submissions that claim FTE not supported by available roster capacity are identified before the GM session, when it is still possible to resize or defer an initiative — not after budget is committed.
- **The "can we take on initiative Z?" question is answerable in one tool invocation.** The Head of Engineering does not need to open an xlsx file or ask a product group lead to manually check squad capacity.

## Constraints

- Repo is private, behind IAM roles and development proxy — storing personal data in JSON within the repo is acceptable within this boundary. This must be revisited if the repo's access model changes.
- xlsx schemas vary across the 5 product groups; per-group column-normalisation config is required.
- Web dashboard must be static HTML with no server dependency, consistent with `dashboards/index.html` and `dashboards/pipeline-viz.html`.
- The enterprise fork initiative skills (`initiative-intake` etc.) are read-only inputs — this feature does not touch, replace, or duplicate them.
- Node.js only; no new runtime dependencies without explicit approval.
- No new `npm` dependencies that are not already in the repo's `package.json` without a design decision recorded.

## Contributors

- Hamish Ward — Head of Engineering / product owner of this capability

## Reviewers

- [Name — Role — to be filled before approval]

## Approved By

- Hamish King — 2026-05-26
