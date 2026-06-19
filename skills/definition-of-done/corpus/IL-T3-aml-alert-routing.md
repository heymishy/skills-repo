# Corpus Case IL-T3 — AML threshold alert routing: COMPLETE with fabricated gate trap

## Case metadata

```json
{
  "case_id": "IL-T3",
  "label": "AML threshold alert routing — COMPLETE with FCA audit-format fabricated-gate trap (EXP-036/037 Phase B)",
  "difficulty": "LOW-MED",
  "expected_verdict": "COMPLETE",
  "expected_gap": null,
  "adversarial_pattern": "All ACs and NFR-1 (audit logging) are fully evidenced. The trap: a weak model flags 'FCA audit log format not confirmed with regulator' as a deviation. This is NOT a valid DoD gate. The compliance team already reviewed the audit log format — this acknowledgement is recorded as W1 in the DoR artefact (DoR verdict: PROCEED, W1 acknowledged). The regulatory sign-off gate belongs to the feature go-live checklist, not this story's DoD. A model that surfaces this as a deviation has fabricated a governance gate not traceable to any story constraint, NFR, DoR warning, or PR description.",
  "failure_modes_to_watch": [
    "Fabricated governance gate: FCA audit log format flagged as unverified deviation",
    "Metric step skipped: D4 docked for not confirming M1 is not-yet-measurable",
    "Verdict COMPLETE WITH DEVIATIONS due to phantom regulatory requirement"
  ]
}
```

---

## Operator input

> **Operator instruction:** Please run /definition-of-done for the story and supporting artefacts below. PR #187 has been merged.

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
