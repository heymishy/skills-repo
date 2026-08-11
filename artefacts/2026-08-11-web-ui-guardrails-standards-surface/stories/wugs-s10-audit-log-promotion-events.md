## Story: Audit-log promotion request, approval, and rejection events

**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-3-promotion-approval.md
**Discovery reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/discovery.md
**Benefit-metric reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/benefit-metric.md
**Domain:** [web-ui]

## User Story

As the **metric owner (Hamish King, Platform owner) measuring this feature's success**,
I want **every promotion request, approval, and rejection captured as an audit-logged PostHog event**,
So that **benefit-metric M2 (promotion-approval usage) can actually be measured, not estimated** (per `benefit-metric.md`'s stated measurement method for M2).

## Benefit Linkage

**Metric moved:** Product-to-org promotion-approval workflow usage
**How:** This story IS the measurement mechanism benefit-metric.md names for M2 — without it, M2 cannot be measured at all, regardless of whether `wugs-s8`/`wugs-s9` work correctly.

## Architecture Constraints

- **Matches this platform's existing PostHog-capture convention** — same pattern as `standard_created` (in the now-superseded `standards.js`) and `kanban_viewed`/kanban events (`psh-s6`/`psh-s7`) — `_ph.capture(tenantId, eventName, properties)`.
- **Three distinct events, not one generic "promotion_event"** — `guardrail_promotion_requested`, `guardrail_promotion_approved`, `guardrail_promotion_rejected` — matching benefit-metric.md's own named event list, so the metric owner's weekly review query is a straightforward count-by-event-name, not a filter on a generic event's payload field.

## Dependencies

- **Upstream:** `wugs-s8` (fires the `requested` event), `wugs-s9` (fires the `approved`/`rejected` events).
- **Downstream:** None — this is the terminal story in the walking skeleton for Epic 3.

## Acceptance Criteria

**AC1:** Given a promotion request is created (`wugs-s8`), When it's created, Then a `guardrail_promotion_requested` PostHog event fires with `tenantId`, `productId`, `requestId`, and `filePath` properties.

**AC2:** Given a promotion request is approved (`wugs-s9`), When it's approved, Then a `guardrail_promotion_approved` event fires with `tenantId`, `requestId`, `approvedBy`, and the resulting `prNumber`.

**AC3:** Given a promotion request is rejected (`wugs-s9`), When it's rejected, Then a `guardrail_promotion_rejected` event fires with `tenantId`, `requestId`, and `rejectedBy`.

**AC4:** Given the PostHog capture call itself fails (network error, PostHog outage), When any of the above events would fire, Then the underlying request/approve/reject action still completes successfully — a logging failure must never block or roll back the actual state change, matching this platform's existing fail-open convention for analytics capture.

## Out of Scope

- **A dashboard visualising these events** — the metric owner's weekly review (per benefit-metric.md) is a manual PostHog query for MVP; a built dashboard is a future enhancement.
- **Retroactively backfilling events for any pre-this-story activity** — none exists, since this workflow doesn't exist before Epic 3.

## NFRs

- **Performance:** Capture calls must not add meaningful latency to the request/approve/reject actions (async, fire-and-forget pattern matching existing PostHog usage elsewhere in this codebase).
- **Security:** No PII or credential content in event properties — file paths and IDs only, matching `MC-SEC-02`'s spirit even though that guardrail is technically viz-scoped.
- **Accessibility:** Not applicable — no UI in this story.
- **Audit:** This story IS the audit mechanism for the epic.

## Complexity Rating

**Rating:** 1 — straightforward event-capture wiring following an established pattern.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (High)
