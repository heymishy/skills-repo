## Epic: Planning and Visibility Dashboard

**Discovery reference:** artefacts/2026-05-26-bsr-workforce-planner/discovery.md
**Benefit-metric reference:** artefacts/2026-05-26-bsr-workforce-planner/benefit-metric.md
**Slicing strategy:** User journey

## Goal

The Head of Engineering and product group leads can open a single static HTML file in any browser and immediately answer planning questions — who is available, what is each initiative's FTE claim versus actual allocation, where are the hiring gaps by role and skill profile, and which initiatives lack leadership coverage — without opening a single xlsx file or running a terminal command.

## Out of Scope

- Editing roster records from the browser — that is `workforce-update` (wfp.2); the dashboard is read-only
- Exporting or downloading data from the dashboard — out of scope for Phase 1
- Authentication or access control for the dashboard — explicitly excluded (private repo + IAM roles is the access gate per discovery)
- Server-side rendering, frameworks, or build steps — static HTML only; must open directly from `file://` with no serving infrastructure

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1: Workforce + Initiative Reconciliation Time | TBD (est. 2–4 hrs manual) | < 10 min | Dashboard reduces the "answer the question" step from xlsx cross-referencing to a browser view open; contributes to overall sub-10-minute answer time |
| M2: Pre-GM Initiative FTE Cross-Check Coverage | 0% | 100% at first FY GM | The allocation matrix view makes coverage gaps immediately visible; supports confirmation of M2 |
| M3: Hiring Gap Specificity Rate | 0% (headcount only today) | 100% | Hiring gap view renders the role + skill-tag structured gaps; makes M3 visually confirmable |

## Stories in This Epic

- [ ] wfp.5 — Roster view: filterable and searchable workforce table
- [ ] wfp.6 — Initiative allocation matrix and FTE delta view
- [ ] wfp.7 — Hiring gap view and leadership coverage view
- [ ] wfp.8 — Multi-team initiative scope decomposition and rollup view (Tab 5)

## Phase 2 — Intelligence Layer Stories (src/workforce-ui/server.js)

- [ ] wfp.12 — Skill coverage heat map — intelligence server
- [ ] wfp.13 — Cross-portfolio bottleneck analysis — intelligence server
- [ ] wfp.14 — Temporal coverage risk — intelligence server
- [ ] wfp.15 — Scenario modelling — intelligence server
- [ ] wfp.16 — Natural-language workforce query via GPT-4o — intelligence server

## Human Oversight Level

**Oversight:** Low
**Rationale:** Static HTML rendering JSON files — no writes, no external calls, no user authentication. No shared infrastructure risk.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
