## Story: Automatically reflect a web-UI journey stage completion in pipeline-state.json

**Epic reference:** artefacts/2026-08-07-cross-surface-state-sync/epics/css-e1-cross-surface-state-sync.md
**Discovery reference:** artefacts/2026-08-07-cross-surface-state-sync/discovery.md
**Benefit-metric reference:** artefacts/2026-08-07-cross-surface-state-sync/benefit-metric.md
**Domain:** [web-ui, data] — advisory, see domain tag check note below

## User Story

As a **Platform maintainer whose web-UI journey completes a stage for a repo-connected feature**,
I want to **have that completion automatically write the corresponding advance to that repo's `pipeline-state.json` via the GitHub Contents API, using my own authenticated token**,
So that **CLI-side state reflects web-UI progress without me needing to run `bin/skills advance` by hand**.

## Benefit Linkage

**Metric moved:** Automatic cross-surface agreement rate
**How:** Completes bidirectionality — css-s1 proved CLI-to-web-UI propagation; this story proves the reverse direction, which is the harder of the two because it must satisfy ADR-020's authenticated-write requirement within a single request's lifetime rather than as a background process.

## Architecture Constraints

- **ADR-020 (GitHub Contents API write-back — authenticated user's token only, never a service account):** this write is a `PUT /repos/{owner}/{repo}/contents/{path}` call and MUST use `req.session.accessToken`, matching `das-s1`'s already-compliant artefact-commit pattern. The resulting commit's author must be the authenticated user, not a service account or `GITHUB_TOKEN`.
- **Resolved design decision (Step 1.5, /definition, 2026-08-07):** the async/best-effort sync direction described in discovery.md's MVP scope is implemented as a **bounded in-request retry only** — a small, fixed number of retry attempts within the original authenticated request's lifetime, using the live session token already present. No token or credential is stored for later background retry; if retries are exhausted, the gap is logged (see AC3) for css-s4's reconciliation safety net to pick up on a future live request, not resumed from stored credentials.
- **D37 (injectable adapter rule):** the new write-adapter (extending `das-s1`'s `artefact-commit-writer.js` shape) must have a stub that throws, an explicit DoR wiring AC, a separate wiring task, and a wiring test asserting behavioral correctness.
- **Repo-resolution mechanism (added at /review Run 1, 1-M1):** this story's write direction requires resolving *which* repo's `pipeline-state.json` to write to, given the journey's own tenant/product context — this is `mtrr-s1`'s already-shipped `ownerRepoForFeature` resolution mechanism (journey → connected repo), not css-s1's mechanism (which resolves the opposite direction: a `pipeline-state.json` feature slug → the corresponding web-UI journey). This story reuses `ownerRepoForFeature` directly; it does not reimplement repo resolution.

## Dependencies

- **Upstream:** `mtrr-s1` (`2026-08-06-multi-tenant-repo-resolution`) — this story's write path reuses `ownerRepoForFeature` to resolve the target repo before writing. `das-s1` (reuses its GitHub Contents API commit pattern directly). `[External: mtrr-s1/das-s1 live in different feature folders — mtrr-s1 shipped and merged; das-s1 implemented, PR #674 open pending merge, blocked on a GitHub Actions platform outage as of 2026-08-07 — confirmed by operator on 2026-08-07]`
- **Downstream:** css-s3 (conflict detection needs both directions working), css-s4 (full-vocabulary coverage).

## Acceptance Criteria

**AC1:** Given a web-UI journey for a repo-connected feature completing a stage (e.g. DoR sign-off), When the stage-completion request is processed, Then within that same request's lifetime, `pipeline-state.json` in the connected repo is updated via the GitHub Contents API using the authenticated user's own OAuth token, and the resulting commit's author in GitHub history is that authenticated user — not a service account or bot identity.

**AC2:** Given the same stage-completion request, When the `pipeline-state.json` write is added to the existing `das-s1` artefact-commit flow, Then the additional latency this write introduces is measured and is no more than 2x the latency already contributed by `das-s1`'s own artefact-commit write alone — the two writes are sequenced within a bounded combined budget, not each independently unbounded.

**AC3:** Given the `pipeline-state.json` write fails after the bounded number of in-request retries, When the retries are exhausted, Then the stage-completion itself still succeeds for the operator (the `das-s1` artefact commit remains authoritative for stage completion), the `pipeline-state.json` write failure is logged as a reconciliation gap with the feature slug and gate name, and no token or credential is persisted for a later retry attempt.

**AC4:** Given a web-UI journey whose feature slug has no corresponding entry in the connected repo's `pipeline-state.json` at all, When the stage-completion request is processed, Then no sync write is attempted (there is nothing to sync to) and this is not treated as an error.

## Out of Scope

- Background or queued retry beyond the original request's lifetime — explicitly excluded per the Step 1.5 architecture-constraints resolution (bounded in-request retry only, no stored credentials).
- Conflict detection between the two surfaces — css-s3.
- Any gate type beyond what this story's test-plan exercises — full-vocabulary coverage is css-s4.

## NFRs

- **Performance:** in-request retry budget is bounded (see AC2) and does not materially degrade the operator's perceived stage-completion latency beyond `das-s1`'s own already-accepted overhead.
- **Security:** ADR-020 compliance is mandatory — commit author must be the authenticated user, never a service account; verified in this story's DoD by comparing the commit author in GitHub history against the authenticated user's login, per ADR-020's own stated consequence.
- **Accessibility:** Not applicable — no new UI surface, an existing stage-completion action gains a side effect.
- **Audit:** reconciliation-gap log entries (AC3) are queryable — this feeds css-s4's safety net directly.

## Data Model

This story introduces a new `sync_log` entity (shared with css-s3, per the ADR-026 reuse-check confirmed at `/definition` on 2026-08-07 — one table for both reconciliation gaps and conflicts, not two near-identical tables) and reuses the existing `journeys` table (read-only in this story, no schema change).

---CANVAS-JSON: {"type":"data-model","title":"Data model","content":{"mermaid":"erDiagram\n    JOURNEYS {\n        varchar journey_id PK\n        varchar tenant_id\n        varchar owner_id\n        varchar feature_slug\n        timestamptz created_at\n        jsonb data\n    }\n    SYNC_LOG {\n        serial id PK\n        varchar feature_slug\n        varchar tenant_id\n        varchar entry_type\n        jsonb pipeline_state_value\n        jsonb journey_value\n        jsonb resolved_value\n        timestamptz created_at\n    }\n    SYNC_LOG }o--|| JOURNEYS : \"correlated by feature_slug\""}}---

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
