# Phase 2 — Intelligence Layer Intent

**Feature slug:** artefacts/2026-05-26-bsr-workforce-planner/
**Phase:** 2 (Intelligence)
**Date written:** 2026-05-27
**Stories in scope:** wfp.12, wfp.13, wfp.14, wfp.15, wfp.16

---

## Purpose

Phase 1 delivered the data pipeline: team-first ingestion (`wfp.1`), CLI workforce management (`wfp.2`), allocation mapping (`wfp.3`–`wfp.5`), cost and gap analysis (`wfp.6`–`wfp.8`), and the interactive assignment UI (`wfp.9`–`wfp.11b`). By the end of Phase 1, all allocation data lives in structured JSON files under `workforce/` and `portfolio/`, and the assignment UI enables a full author-save-run-review loop in a browser session.

Phase 2 adds an **intelligence layer** — a separate server that reads the Phase 1 output files and surfaces derived insights the operator cannot read directly from the raw JSON. The five Phase 2 capabilities are: skill coverage heat map, cross-portfolio bottleneck analysis, temporal coverage risk, scenario modelling, and natural-language query via GPT-4o Copilot chat.

---

## Standalone Server Rationale

Phase 2 is delivered as a **standalone intelligence server** at `src/workforce-ui/server.js`, started via `npm run workforce`. It is distinct from the main web UI server at `src/web-ui/server.js`.

Rationale:
- Keeps intelligence-specific routes and context-loading logic separate from the assignment workflow routes, reducing cognitive load when modifying either.
- Allows the intelligence server to be deployed independently if the organisation chooses to separate assignment tooling from analytical tooling in future.
- Avoids coupling the existing Phase 1 route chain (which is stable and has full test coverage) to new analytical endpoints that are more exploratory in nature.
- The NL query capability (wfp.16) uses injectable adapter wiring that is specific to the workforce context window — mixing it into the main server would require separate adapter registrations sharing the same module namespace.

The standalone server follows the same conventions as `src/web-ui/server.js`: `authGuard` middleware, `if/else if` route chain, Node built-ins only, no new npm runtime dependencies, session management via the same pattern.

---

## Capabilities

### wfp.12 — Skill Coverage Heat Map
Routes: `GET /intelligence/heat-map` (HTML), `GET /api/intelligence/heat-map-data` (JSON).

Rows = all unique skill tags in the roster. Columns = initiatives from `initiative-map.json`. Cell value = coverage percentage: what proportion of the initiative's `requiredTags` are covered by the collective skills of all teams currently allocated to it. Secondary aggregation row shows coverage at product-group level. Clickable cells drill down to show which team members cover that skill for that initiative. Directly surfaces M2 and M3 metric signals.

### wfp.13 — Cross-Portfolio Bottleneck Analysis
Routes: `GET /intelligence/bottlenecks`.

Two bottleneck types:
- **Team bottlenecks** — teams allocated to 3 or more initiatives (threshold configurable constant).
- **Skill bottlenecks** — skill tags whose coverage is concentrated in 1 or fewer teams across the portfolio (single-team dependency risk).

Person-level detail is secondary — available as a drill-down within a flagged team, not the primary signal. Directly surfaces M3 metric signals.

### wfp.14 — Temporal Coverage Risk
Routes: `GET /intelligence/temporal-risk`.

Reads `endDate` fields from the roster. Displays a 4-quarter timeline showing rolloff count per team per quarter. A team whose post-rolloff membership falls below 50% of current membership triggers a risk flag. Secondary panel breaks down risk by team. Directly surfaces M1 metric signals.

### wfp.15 — Scenario Modelling
Routes: `GET /intelligence/scenarios` (UI), `POST /api/intelligence/scenario` (scenario evaluation).

Supports 4 scenario types: hire (add a hypothetical team member), departure (mark a member as leaving), new-team (add a hypothetical team), reallocation (move a team between initiatives). All scenarios are in-memory overlays — no file writes. All four intelligence views (heat map, bottlenecks, temporal risk, coverage summary) update live with the scenario overlay applied. A "Scenario mode active" banner shows the overlay count (persons and teams affected). Dependencies: wfp.12 + wfp.13 + wfp.14 must be DoD-complete. Surfaces M1 and M2 signals.

### wfp.16 — Natural-Language Query (GPT-4o Copilot Chat)
Routes: `GET /workforce-chat` (HTML), `POST /api/workforce-chat/turn` (non-streaming), `POST /api/workforce-chat/turn-stream` (SSE streaming).

An injectable adapter pattern analogous to `setSkillTurnExecutorAdapter` in `src/web-ui/server.js`. Stub defaults throw (per D37 rule). Production wiring in `src/workforce-ui/server.js`.

3-tier context window strategy:
- **Always-on (every turn):** teams.json (full) + summarised roster (name, teamId, skills only — no PII fields).
- **On-demand (when query warrants):** initiative-map.json, allocation-input.json.
- **Confirm (operator approves):** full roster with all fields including PII.

Chat accessible from the main nav of the workforce-ui. Surfaces M1 and M2 signals.

---

## Data Foundation

Phase 2 does **not** introduce new data ingestion. All analytical views read exclusively from files written by Phase 1 tools:

| File | Written by | Read by |
|------|-----------|---------|
| `workforce/teams.json` | wfp.1 (`workforce-ingest`) | All Phase 2 views |
| `workforce/roster.json` | wfp.1 | All Phase 2 views |
| `workforce/initiative-map.json` | wfp.3 (`workforce-map`) | wfp.12, wfp.13, wfp.15, wfp.16 |
| `workforce/allocation-input.json` | wfp.9 / wfp.11a | wfp.13, wfp.15, wfp.16 |
| `portfolio/[slug].json` | Pre-existing pipeline artefact | wfp.12, wfp.13 |

No Phase 2 story writes to any `workforce/` or `portfolio/` file.

---

## Constraints (carried forward from Discovery)

- Node built-ins only. Zero new npm runtime dependencies across all Phase 2 stories.
- All workforce data files remain in the private repository under the same IAM posture established in Phase 1. No data is transmitted to external services except the GPT-4o API call in wfp.16 (governed by the PII context-window tier described above).
- `portfolio/` files remain read-only from the perspective of the intelligence server.
- NFR baseline for all Phase 2 stories: 200 people / 40 teams / 40 initiatives.

---

## Delivery Order

wfp.12 → wfp.13 → wfp.14 → wfp.15 → wfp.16.

wfp.15 depends on wfp.12 + wfp.13 + wfp.14 being DoD-complete. All others can be delivered independently in order. wfp.16 has no hard dependency on wfp.12–wfp.15 (it uses the underlying data files, not the rendered views), but delivering it last avoids the intelligence server HTML nav link being broken during delivery.
