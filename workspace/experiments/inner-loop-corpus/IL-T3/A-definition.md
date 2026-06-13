# IL-T3 Definition Artefact — AML Alert Routing

**Feature:** 2026-06-13-aml-threshold-monitoring
**Epic:** Compliance Operations — Real-Time AML Alerts
**Story slug:** aml.2
**Slicing strategy:** Vertical slice

---

## Epic: Compliance Operations — Real-Time AML Alerts

**Stories:** aml.1 (threshold detection — separate story), aml.2 (alert routing — this story)

---

## Story: aml.2 — Route threshold breach alerts to compliance channels

**As a** compliance officer,
**I want** to receive an immediate notification (Slack + email) when a threshold breach alert is dispatched,
**So that** I can act within 15 minutes of a breach instead of waiting for the morning report.

### Acceptance Criteria

**AC1:** Given a threshold breach alert payload with `{ alertId, amount, customerId, breachTimestamp }`, when `routeAlert(payload)` is called, then a Slack message is sent to the compliance channel (`#aml-alerts`) with the alert details and the function returns `{ slack: 'sent', email: 'sent' }`.

**AC2:** Given a threshold breach alert payload, when `routeAlert(payload)` is called, then an email is sent to the compliance distribution list (`compliance@enterprise.com`) with the same alert details and a subject line `AML Threshold Breach — [alertId]`.

**AC3:** Given a channel delivery failure (Slack API returns 5xx or email transport throws), when `routeAlert(payload)` is called, then the function returns `{ slack: 'failed', email: 'sent' }` (or equivalent partial success) and does NOT throw — partial delivery must not suppress successful channels.

### Out of Scope

- SAR filing automation — deferred in discovery
- MLRO escalation workflow — deferred
- Alert deduplication or suppression logic
- Threshold detection logic (aml.1)
- Compliance officer review-and-clear workflow

### NFRs

**NFR-1 (Audit trail — compliance):** Every alert dispatch must be logged to the audit log module (`src/audit/audit-logger.js`) with: alertId, timestamp, channels attempted, delivery status per channel. This log is required regulatory evidence that alerts were dispatched. Log failure must not suppress the alert delivery.

### Benefit linkage

Contributes to M1: threshold breach detection latency (from 18+ hours to < 15 minutes). This story delivers the alert routing step; aml.1 delivers the detection trigger.

### Architecture Constraints

NFR-1 audit trail is a compliance obligation derived from the FCA regulatory obligation to maintain an audit trail of all alerts and dispositions. The audit log module (`src/audit/audit-logger.js`) is the canonical destination for all compliance-relevant events. Do NOT log alert dispatches to `console.log` — only to the audit logger.

### Complexity

2 — straightforward integration (Slack API + nodemailer); partial-failure handling adds some complexity.

### Dependencies

aml.1 (threshold detection) calls `routeAlert()`; aml.2 (this story) provides the routing module. aml.1 must exist before integration testing, but aml.2 can be unit-tested with a synthetic payload.
