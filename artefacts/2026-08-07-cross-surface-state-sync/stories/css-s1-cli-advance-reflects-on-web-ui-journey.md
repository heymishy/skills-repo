## Story: Automatically reflect a CLI-side gate advance on the corresponding web-UI journey

**Epic reference:** artefacts/2026-08-07-cross-surface-state-sync/epics/css-e1-cross-surface-state-sync.md
**Discovery reference:** artefacts/2026-08-07-cross-surface-state-sync/discovery.md
**Benefit-metric reference:** artefacts/2026-08-07-cross-surface-state-sync/benefit-metric.md
**Domain:** [web-ui, data] — advisory, see domain tag check note below

## User Story

As a **Platform maintainer straddling both surfaces (CLI harness and hosted web UI)**,
I want to **have a CLI-side `bin/skills gate-advance` call for the `discovery-approved` gate automatically update the corresponding web-UI journey's `completedStages` field**,
So that **I see CLI-tracked progress reflected on the web UI without clicking the dashboard's manual "Sync" button**.

## Benefit Linkage

**Metric moved:** Automatic cross-surface agreement rate
**How:** Proves, for one gate type, that a CLI-side advance propagates to the corresponding web-UI journey without any manual action — establishing the walking-skeleton mechanism that css-s2/css-s3/css-s4 extend to full bidirectionality and full gate-type coverage.

## Architecture Constraints

- **D37 (injectable adapter rule, CLAUDE.md):** the new adapter resolving a web-UI journey record from a `pipeline-state.json` feature slug (extending `mtrr-s1`'s `ownerRepoForFeature` correlation pattern in reverse) must have a stub that throws (not silently returns), an explicit DoR wiring AC, a separate wiring task in the implementation plan, and a wiring test asserting behavioral correctness (two different feature slugs resolve to two different, correct journey records — not just that a setter was called).
- **ADR-025 (multi-tenancy):** any write to the journey's Postgres record must remain `tenant_id`-scoped, consistent with the existing application-layer scoping model.
- **No ADR-020 concern in this direction:** this story's write direction (CLI → web-UI/Postgres) is not a GitHub Contents API write and carries no authenticated-user-token requirement; ADR-020 applies to css-s2's reverse direction, not this story.

## Dependencies

- **Upstream:** `das-s1` (`2026-08-07-durable-artefact-storage`) and `das-s2` — this epic's connected-repo requirement and dual-write pattern are the foundation this story extends. `[External: das-s1/das-s2 live in a different feature folder — das-s1 implemented, PR #674 open pending merge (blocked on a GitHub Actions platform outage as of 2026-08-07); das-s2 DoR-signed-off, not yet dispatched — confirmed by operator on 2026-08-07]`
- **Downstream:** css-s2, css-s3, css-s4 all build on this story's slug-correlation and journey-lookup mechanism.

## Acceptance Criteria

**AC1:** Given a feature with both a `pipeline-state.json` entry and a connected web-UI journey sharing the same feature slug, When a CLI operator runs `bin/skills gate-advance` for the `discovery-approved` gate, Then the corresponding web-UI journey's `completedStages` field is updated to include `discovery` before the CLI command exits successfully — synchronously within that command's own execution, not as a background or deferred action.

**AC2:** Given a feature slug that exists in `pipeline-state.json` but has no corresponding web-UI journey, When the same `gate-advance` command runs, Then the CLI command completes normally with no error and no sync attempt is made (there is nothing to sync to).

**AC3:** Given a web-UI journey whose repo connection resolves via `ownerRepoForFeature` to a repository, When the correlating feature slug does not exist in that repo's `pipeline-state.json` at all, Then no journey record is modified, and the mismatch is logged for visibility rather than silently ignored or treated as a hard failure.

**AC4:** Given the `discovery-approved` gate is this story's explicit scope, When any other gate type (e.g. `test-plan-complete`) is advanced via `gate-advance`, Then no sync is attempted for that other gate type — this is deferred to css-s4's full-vocabulary coverage and is this story's stated boundary, not a gap.

## Out of Scope

- Any gate type other than `discovery-approved` — deferred to css-s4.
- The reverse direction (web-UI journey → `pipeline-state.json`) — css-s2.
- Conflict detection between the two surfaces — css-s3.

## NFRs

- **Performance:** the synchronous journey update adds a bounded, small delay to the CLI command's completion — the exact budget is measured and reported at `/test-plan`, but must not turn a sub-second `gate-advance` call into a multi-second one.
- **Security:** no credentials or tokens are exposed in the new adapter's logging; the write uses the existing service-level Postgres connection already used by other CLI-adjacent write paths, not a per-user token (this direction has no ADR-020 concern).
- **Accessibility:** Not applicable — no UI surface change in this story.
- **Audit:** every sync attempt (success or mismatch, per AC3) is logged.

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
