## Epic: Workforce Data Ingestion and Maintenance

**Discovery reference:** artefacts/2026-05-26-bsr-workforce-planner/discovery.md
**Benefit-metric reference:** artefacts/2026-05-26-bsr-workforce-planner/benefit-metric.md
**Slicing strategy:** User journey

## Goal

The Head of Engineering and product group leads have a single authoritative, queryable JSON roster representing the full ~200-person workforce across all 5 product groups. Data can be ingested from per-group xlsx files in a single command, and individual records can be added, updated, or retired without triggering a full re-ingestion. Downstream skills (`workforce-map`) and the planning dashboard have a reliable, current data source to read from.

## Out of Scope

- Initiative-to-person mapping and FTE reconciliation — addressed in Epic 2 (wfp-reconciliation-engine)
- Dashboard rendering of roster data — addressed in Epic 3 (wfp-planning-dashboard)
- Integration with HR or payroll systems — explicitly excluded in discovery constraints; JSON files in repo are the authoritative store for this phase
- Automated scheduling or triggered re-ingestion — out of scope for Phase 1; invocation is always operator-initiated

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1: Workforce + Initiative Reconciliation Time | TBD (est. 2–4 hrs manual) | < 10 min | Without a machine-readable roster, `workforce-map` cannot run at all. This epic is the prerequisite that makes M1 measurable. |

## Stories in This Epic

- [ ] wfp.1 — Ingest workforce roster from per-group xlsx files
- [ ] wfp.2 — Update individual roster records without full re-ingestion

## Human Oversight Level

**Oversight:** Low
**Rationale:** The skill writes to local JSON files in the repo. No external system calls, no PII transmission, no shared infrastructure. Operator reviews the output JSON before committing.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
