## Story wfp.15: Scenario modelling — intelligence server

**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-planning-dashboard.md
**Discovery reference:** artefacts/2026-05-26-bsr-workforce-planner/discovery.md
**Benefit-metric reference:** artefacts/2026-05-26-bsr-workforce-planner/benefit-metric.md
**Phase:** 2 (Intelligence Layer)
**Prerequisite stories:** wfp.12 DoD-complete, wfp.13 DoD-complete, wfp.14 DoD-complete.

## User Story

As a **Head of Engineering**,
I want to apply hypothetical workforce changes — hiring someone, losing a team member, adding a new team, or moving a team between initiatives — and see all intelligence views update live to reflect the scenario,
So that I can answer "what would happen if…" questions before making or requesting real structural changes, and arrive at the General Manager review with pre-validated contingency plans.

## Benefit Linkage

**Metric moved:** M1 (Workforce and Initiative Reconciliation Time) and M2 (Pre-GM Initiative FTE Cross-Check Coverage)
**How:** Scenario modelling transforms the intelligence views from observational to predictive. Without it, the operator must manually compute the effect of a hypothetical change on the coverage heat map, bottleneck list, and temporal risk profile — repeating the analytical work for each scenario. With it, a "what-if hire" scenario takes seconds to evaluate. M1 benefits from reduced manual re-analysis. M2 benefits because the operator can confirm scenario impact on initiative coverage before the GM review, not after.

## Architecture Constraints

- Delivered in the existing standalone intelligence server at `src/workforce-ui/server.js` introduced in wfp.12. No new server file.
- Two routes: `GET /intelligence/scenarios` (HTML entry point) and `POST /api/intelligence/scenario` (evaluate a scenario overlay and return updated intelligence data). Both require `authGuard`.
- Scenarios are **in-memory overlays only**. No file in `workforce/` or `portfolio/` is written, created, or modified as a result of a scenario evaluation.
- The `POST /api/intelligence/scenario` endpoint accepts a scenario JSON body, applies the overlay to the in-memory data loaded at request time, and returns the updated `heat-map-data`, `bottlenecks-data`, and `temporal-risk-data` payloads (same shape as the corresponding GET JSON endpoints) with the overlay applied.
- `src/web-ui/server.js` and all Phase 1 route handlers are not modified.
- Inline single-file HTML, vanilla JS, no CDN, no framework. The scenario UI and the intelligence view updates are all handled client-side via fetch to `POST /api/intelligence/scenario`.

## Dependencies

- `src/workforce-ui/server.js` with heat-map, bottleneck, and temporal-risk routes (wfp.12, wfp.13, wfp.14) must all be DoD-complete. The scenario POST handler reuses the same data-loading and computation logic already implemented in those stories.
- The JSON response shapes from `GET /api/intelligence/heat-map-data`, `GET /api/intelligence/bottlenecks-data`, and `GET /api/intelligence/temporal-risk-data` are the canonical contracts the scenario endpoint extends. Any breaking change to those shapes must be applied here simultaneously.

## Acceptance Criteria

**AC1 (scenario POST endpoint — accepted scenario types):** Given an authenticated `POST /api/intelligence/scenario` with a valid JSON body, when the server processes the request, then it accepts exactly 4 scenario types: `"hire"` (add a hypothetical person to a team), `"departure"` (remove a person from a team for the duration of the overlay), `"new-team"` (add a hypothetical team with given members to `teams.json` overlay), and `"reallocation"` (move a team from one initiative to another in the `initiative-map.json` overlay). Unknown `type` values return `400 Bad Request` with message: "Unknown scenario type '[type]'. Accepted: hire, departure, new-team, reallocation."

**AC2 (hire scenario):** Given a `POST /api/intelligence/scenario` body `{ "type": "hire", "teamId": "platform-api", "person": { "name": "Hypothetical Hire", "skills": ["java", "kafka"], "retired": false } }`, when the server evaluates the scenario, then the person is added to the `platform-api` team's member list in the overlay (not in the on-disk `roster.json` or `teams.json`), and the response contains updated `heatMapData`, `bottlenecksData`, and `temporalRiskData` payloads reflecting the augmented team composition. The hire does not appear in any subsequent request unless the scenario is resubmitted.

**AC3 (departure scenario):** Given a `POST /api/intelligence/scenario` body `{ "type": "departure", "teamId": "platform-api", "personName": "Alice Smith" }`, when the server evaluates the scenario, then "Alice Smith" is removed from the `platform-api` team's member list in the overlay (not from on-disk data), and the response contains updated intelligence payloads. If `personName` does not match any current member of `teamId`, the response includes a warning field `{ "warning": "Person 'Alice Smith' not found in team 'platform-api' — overlay applied with no member change" }` and still returns 200 with unmodified payloads.

**AC4 (new-team scenario):** Given a `POST /api/intelligence/scenario` body `{ "type": "new-team", "team": { "teamId": "hyp-data-eng", "name": "Hypothetical Data Engineering", "productGroup": "Platform Engineering", "members": ["Alice", "Bob"] } }`, when the server evaluates the scenario, then a hypothetical team is added to the teams overlay with its members resolved against roster.json by name (unresolved names are included with an empty `skills` array and a warning), and the response contains updated intelligence payloads. A `teamId` that already exists in `teams.json` returns `400 Bad Request`: "Team 'hyp-data-eng' already exists. Use 'reallocation' to change an existing team's initiative assignment."

**AC5 (reallocation scenario):** Given a `POST /api/intelligence/scenario` body `{ "type": "reallocation", "teamId": "platform-api", "fromSlug": "initiative-x", "toSlug": "initiative-y" }`, when the server evaluates the scenario, then the `platform-api` `allocatedTeam` entry is moved from `initiative-x` to `initiative-y` in the initiative-map overlay, and the response contains updated intelligence payloads. If `teamId` is not currently allocated to `fromSlug`, the server returns `400 Bad Request`: "Team 'platform-api' is not allocated to 'initiative-x' in the current allocation map."

**AC6 (scenario banner — client-side):** Given the `GET /intelligence/scenarios` page is loaded and the operator has submitted at least one scenario via the form, when the updated intelligence views render with the scenario overlay applied, then a "Scenario mode active" banner is visible at the top of all three intelligence view panels showing: "Scenario mode active — [N] person(s) and [N] team(s) affected. Scenario data is not saved." The banner remains until the operator clicks "Clear scenario" or reloads the page.

**AC7 (combined overlay — multiple scenarios in a single request):** Given a `POST /api/intelligence/scenario` body with a `scenarios` array (plural) containing 1 or more scenario objects (any mix of the 4 types), when the server evaluates the request, then all scenario overlays are applied in array order to the same in-memory data copy, and a single updated response is returned. The `type` field at the root level is ignored when a `scenarios` array is present. An empty `scenarios` array returns the unmodified intelligence payloads (valid, not an error).

**AC8 (read-only guarantee):** Given any `POST /api/intelligence/scenario` request with any valid or invalid body, when the server handles the request, then no file in `workforce/`, `portfolio/`, or any other directory is created, modified, or deleted as a side effect. The on-disk JSON files are unchanged before and after the request.

## Out of Scope

- Persisting scenarios to disk or session storage — all overlays are request-scoped and discarded after the response.
- More than 4 scenario types.
- Scenario branching (what-if chains where the output of one scenario is fed as the baseline to another) — all scenarios in a combined `scenarios` array share the same unmodified on-disk data as baseline, not the output of previous scenarios in the array.
- Undoing individual scenarios — the operator clears all scenarios at once.
- Sharing or exporting a scenario configuration.
- Modifying `src/web-ui/server.js` or any file under `src/web-ui/`.

## NFRs

- **Scale:** `POST /api/intelligence/scenario` must return within 1 second for a single scenario evaluated against 200 roster entries / 40 teams / 40 initiatives.
- **Security:** Both routes require `authGuard`. The scenario body must not be used to construct file paths. `teamId`, `personName`, and `slug` values from the request body must be treated as data, not used in `fs.readFileSync` or `path.join` calls. `POST /api/intelligence/scenario` request body size is limited to 64 KB server-side (reject with `413` otherwise).
- **Observability:** Warning fields in the response (as specified in AC3 and AC4) must not include raw file paths or stack traces.

## Complexity Rating

**Rating:** 3
**Rationale:** The scenario endpoint must re-execute all three intelligence computations (heat-map, bottlenecks, temporal risk) against an in-memory overlay of the underlying data. This requires the computation logic from wfp.12, wfp.13, and wfp.14 to be factored into reusable pure functions (not embedded in route handlers). The refactor of existing route handlers into pure functions is the structural risk. The 4 scenario types are well-specified but the overlay semantics for combined scenarios add implementation complexity. Client-side live update of 3 view panels from a single POST response is non-trivial in vanilla JS.
**Scope stability:** Stable. Dependencies are DoD-complete before this story starts (per prerequisite constraint). The 4 scenario types and their contracts are fully specified in the ACs.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
