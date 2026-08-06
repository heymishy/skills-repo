## Story: Extend automatic sync to the full gate/stage vocabulary and add the reconciliation safety net

**Epic reference:** artefacts/2026-08-07-cross-surface-state-sync/epics/css-e1-cross-surface-state-sync.md
**Discovery reference:** artefacts/2026-08-07-cross-surface-state-sync/discovery.md
**Benefit-metric reference:** artefacts/2026-08-07-cross-surface-state-sync/benefit-metric.md
**Domain:** [web-ui, data] — advisory, see domain tag check note below

## User Story

As a **Platform maintainer**,
I want to **have the sync mechanism proven in css-s1 through css-s3 for one gate type extended to cover every gate/stage in the pipeline's vocabulary, with a reconciliation safety net that catches advances which failed to propagate synchronously**,
So that **the 100% automatic-agreement target is actually met across real usage, not just for a single proof-of-concept gate type**.

## Benefit Linkage

**Metric moved:** Automatic cross-surface agreement rate
**How:** Closes the gap from "proven for one gate type" (css-s1's `discovery-approved` skeleton) to "covers everything the metric's target requires," and the reconciliation safety net catches the cases where css-s2's in-request retry was exhausted — directly addressing the minimum validation signal (90% automatic propagation in the first 4 weeks) defined in `benefit-metric.md`.

## Architecture Constraints

- **cdg.7 mandate (CLAUDE.md):** reuse the 7 gated-stage values already defined in `src/enforcement/gate-map.js` (`discovery-approved`, `benefit-metric-active`, `definition-complete`, `test-plan-complete`, `dor-signed-off`, `branch-complete`, `definition-of-done`) as the enumerated vocabulary this story extends coverage to — do not invent a second, independent list (the exact anti-pattern this repo's own architecture-guardrails.md warns against: "Duplicating the same fixed sequence as two independent hardcoded arrays in different files").
- **D37:** the parameterization of css-s1/css-s2's mechanism by gate type must not turn a single adapter into 7 duplicated adapters — one mechanism, parameterized.

## Dependencies

- **Upstream:** css-s1, css-s2, css-s3 — this story extends and hardens their mechanism, it does not introduce a new one.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the 7 gated-stage values defined in `src/enforcement/gate-map.js`, When any of them is advanced on either surface, Then the sync mechanism proven in css-s1/css-s2 for `discovery-approved` alone now applies uniformly to all 7 — no gate type is left un-synced, verified by a test parameterized across all 7 values rather than one test per value.

**AC2:** Given a css-s2 in-request retry was exhausted and a reconciliation gap was logged (css-s2 AC3), When a subsequent live, authenticated request touches that same feature (e.g. the operator's next action on that journey), Then the reconciliation mechanism identifies the logged gap and re-attempts the `pipeline-state.json` sync using that new request's own live session token — never a stored credential from the original failed attempt.

**AC3:** Given the reconciliation safety net has been in operation, When the automatic agreement rate is measured per `benefit-metric.md`'s own measurement method (reconciliation-log entries requiring manual intervention vs. total phase-boundary advances), Then the measured rate is reported honestly against the 90% minimum-validation-signal threshold — not assumed to pass without measurement, matching this repo's own established pattern of honest NFR reporting (e.g. `rb-s5`'s RISK-ACCEPT).

## Out of Scope

- Real-time push notifications when a reconciliation gap is found — this story logs the gap and enables re-attempt on the next live request; it does not add a separate alerting channel.
- Any change to the 7 gated-stage values themselves, or to `gate-map.js`'s own structure — this story consumes the existing enumeration, it does not modify it.

## NFRs

- **Performance:** full-vocabulary coverage must not introduce a per-gate-type special case that scales linearly with maintenance cost — a single mechanism parameterized by gate type, not 7 hand-written copies.
- **Security:** the reconciliation re-attempt (AC2) never stores or reuses a credential beyond the lifetime of the live request that triggers it — consistent with css-s2's own no-token-storage constraint.
- **Accessibility:** Not applicable — no UI surface change.
- **Audit:** reconciliation-gap resolution (AC2) is logged with the same rigor as css-s3's conflict log.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
