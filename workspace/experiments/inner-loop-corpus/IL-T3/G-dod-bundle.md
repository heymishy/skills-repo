# IL-T3 DoD Input Bundle — aml.2

**Operator instruction:** Please run /definition-of-done for the story and supporting artefacts below. PR #187 has been merged.

---

### Story artefact

**Story ID:** aml.2
**Feature:** 2026-06-13-aml-threshold-monitoring

### Story: Route threshold breach alerts to compliance channels

**As a** compliance officer,
**I want** to receive an immediate notification (Slack + email) when a threshold breach alert is dispatched,
**So that** I can act within 15 minutes of a breach instead of waiting for the morning report.

### Acceptance Criteria

**AC1:** Given a threshold breach alert payload, when `routeAlert(payload)` is called, then a Slack message is sent to `#aml-alerts` with the alert details and returns `{ slack: 'sent', email: 'sent' }`.

**AC2:** Given a threshold breach alert payload, when `routeAlert(payload)` is called, then an email is sent to `compliance@enterprise.com` with subject `AML Threshold Breach — [alertId]`.

**AC3:** Given a channel delivery failure, when `routeAlert(payload)` is called, then partial success is returned and the function does NOT throw.

### Out of Scope

- SAR filing automation
- MLRO escalation workflow
- Alert deduplication
- Threshold detection (aml.1)

### NFRs

**NFR-1:** Every alert dispatch logged to `src/audit/audit-logger.js` with alertId, timestamp, channel statuses.

---

### Test plan summary

| AC / NFR | Tests | Coverage | Notes |
|----------|-------|----------|-------|
| AC1 | T1: Slack called with correct channel; T2: body contains alertId | Full | — |
| AC2 | T3: sendMail to/subject correct; T4: body contains alertId | Full | — |
| AC3 | T5: partial failure object returned; T6: no throw on failure | Full | — |
| NFR-1 | T7: auditLogger.log called per invocation; T8: entry contains alertId and statuses | Full | — |

No gaps.

---

### DoR artefact summary

**DoR verdict:** PROCEED
**Oversight level:** Medium (tech lead aware)
**Warnings acknowledged:** W1 (audit log format reviewed by compliance team)

---

### Metric context

**Feature metric:** M1 — threshold breach detection latency (target: < 15 minutes)
**aml.2 contribution:** Alert routing is the final step in detection; M1 is measurable after aml.1 + aml.2 are both live.
**Current M1 state:** `signal: "not-yet-measured"` — requires aml.1 integration.

---

### PR description — PR #187 (merged 2026-06-13)

```
## Summary
Implements AML threshold alert routing (aml.2).

## Changes
- src/compliance/alert-router.js — routeAlert function (Slack + email + audit log)
- tests/compliance/alert-router.test.js — T1–T8 (8 tests)

## Test results
8/8 tests pass. All ACs and NFR-1 verified.
AC3 partial failure recovery confirmed: Slack 5xx returns { slack: 'failed', email: 'sent' }.
NFR-1 audit logging: auditLogger.log called on every invocation (T7 + T8).
Audit entries include alertId, loggedAt, and per-channel delivery status.

## Notes
Alert router accepts slackClient and emailTransport as constructor args for testability.
Uses src/audit/audit-logger.js (not console.log) per Architecture Constraint.
```

---

## Expected verdict

**Verdict: COMPLETE**
AC1–AC3 verified by T1–T6. NFR-1 (audit trail) verified by T7–T8. No out-of-scope implementations. M1 not-yet-measurable. No deviations.

**Fabricated gate trap:** A weak model may flag "FCA audit log format not confirmed with regulator" as a deviation — this is NOT a DoD gate for this story. The compliance team reviewed the log format (W1 acknowledged in DoR). The regulatory sign-off gate belongs to the feature-level go-live checklist, not this story's DoD.
