# Corpus Case T7 — Notification service: two simultaneous defects (HIGH + MEDIUM)

## Case metadata

```json
{
  "case_id": "T7",
  "label": "Payment notification service — two simultaneous defects: HIGH traceability gap + MEDIUM AC vagueness",
  "domain": "S6-notification-multi-defect",
  "difficulty": "adversarial-hard",
  "planted_defect_1": {
    "id": "HIGH-1",
    "category": "E1-traceability",
    "description": "AC2 references 'ham.15 (payment audit trail)' as an upstream dependency but ham.15 appears nowhere in the provided artefacts — not in the discovery story list, not in the definition story list, not as an epic, not as a dependency already completed. The reference is fabricated or belongs to a different feature entirely."
  },
  "planted_defect_2": {
    "id": "MEDIUM-1",
    "category": "B2-AC-vagueness",
    "description": "AC4 states 'the notification should be delivered promptly.' No threshold, no SLA, no measurable condition. Not testable."
  },
  "expected_verdict": "FAIL",
  "expected_high_findings": 1,
  "expected_medium_findings": 1,
  "adversarial_pattern": "Two defects are planted at different severity levels. The HIGH finding (traceability) requires reading the full artefact bundle and noting the absence of a referenced story. The MEDIUM finding (AC vagueness) is surface-visible if AC4 is read carefully. A model that finds only one is incomplete. A common failure: model finds the MEDIUM (obvious AC vagueness) and stops; or finds the HIGH (traceability gap) and stops; or raises both plus fabricated extra findings (over-detection).",
  "categorical_fail_conditions": [
    "Misses HIGH-1 (traceability gap for ham.15)",
    "Misses MEDIUM-1 (AC4 vagueness: 'promptly')",
    "Raises fabricated additional HIGH findings",
    "Downgrades HIGH-1 to MEDIUM (severity miscalibration)"
  ]
}
```

---

## Bundle — paste this into the /review session

```
Definition artefact: Hamilton Payment Operations Platform
Discovery artefact: artefacts/2026-04-22-hamilton-payment-ops/discovery.md
Discovery status: Approved
Approved by: Marcus Webb (CTO), Sarah Chen (Head of Platform Engineering)
Date: 2026-04-22

Discovery MVP scope:
1. Real-time payment failure notification to #hamilton-ops Slack channel
2. Notification retry with exponential backoff (up to 3 retries)
3. Notification delivery status tracking in the operations log
4. Configurable routing: critical failures to on-call pager, standard failures to Slack only

Discovery story list (from definition artefact):
- ham.11: Payment failure detection
- ham.12: Slack notification dispatch
- ham.13: Notification retry and backoff
- ham.16: Configurable routing rules (critical vs standard)

Note: This story list is authoritative. There is no ham.14, ham.15, or any other story in this feature.

Discovery out-of-scope:
- Payment audit trail (separate feature — Operations Audit Platform, tracked separately)
- Email notification (post-MVP)

---

Epic: Notification Routing and Reliability
Epic ID: ham-notif-epic-2

---

Story: ham.12 — Slack notification dispatch

As a Hamilton payments operations engineer,
I want a Slack notification dispatched to #hamilton-ops when a payment fails,
So that the operations team receives immediate visibility of payment failures without polling the monitoring dashboard.

Architecture Constraints:
- New module at src/payments/slack-notifier.js
- Injectable adapter pattern for Slack sender (setNotificationSender) — production wired in src/server.js
- The module depends on ham.11 (payment failure detection) for failure event emission
- The module's audit output is written to the operations log after each notification (see ham.15 for audit trail schema)

Acceptance Criteria:

AC1: Given a payment fails and ham.11 emits a failure event, when the Slack notifier receives the event, then a message is posted to #hamilton-ops within 5 seconds containing the payment reference, failure reason, and an ISO 8601 timestamp.

AC2: Given the notification is dispatched, when the notification is sent, then the notification metadata (paymentRef, timestamp, channelId, success) is written to the audit trail per the schema defined in ham.15 (payment audit trail).

AC3: Given the Slack webhook call returns a non-2xx status, when the notifier processes the response, then the error is logged to stderr with the paymentRef and no exception propagates to the caller.

AC4: Given a payment failure notification is triggered, when the notification service processes the event, then the notification should be delivered promptly.

Dependencies:
- ham.11 (payment failure detection) — upstream, must be complete

NFRs:
NFRs: None — reviewed 2026-04-25
```

---

## Expected review verdict

**FAIL — 1 HIGH finding + 1 MEDIUM finding**

**HIGH-1 (Category E1 — Traceability gap):**
AC2 references `ham.15 (payment audit trail)` as the schema source for audit log writes. ham.15 does not exist in the provided artefact bundle. The discovery story list contains ham.11, ham.12, ham.13, and ham.16 only. The discovery out-of-scope section explicitly states "Payment audit trail — separate feature." The Architecture Constraints also reference ham.15: "see ham.15 for audit trail schema." This creates an unresolvable dependency on a story that is:
- Not in this feature's discovery
- Not in scope per the discovery out-of-scope section
- Likely a reference to a different, unprovided feature (Operations Audit Platform)

Impact: The story cannot be implemented as written. AC2 cannot be satisfied without a defined schema from ham.15. This is an architectural gap — not a missing story number, but a scope violation: the story attempts to consume an artefact from a different feature that has not been included in this bundle and is explicitly out of scope.

Verdict contribution: HIGH — blocks PASS.

**MEDIUM-1 (Category B2 — AC vagueness):**
AC4 states: "the notification should be delivered promptly." This is not testable. There is no threshold, no SLA, and no measurable condition. "Promptly" has no agreed definition in this story. AC1 correctly specifies a 5-second delivery window — AC4 should reference the same threshold or state its own measurable condition. A coding agent implementing this story will either ignore AC4 or implement an arbitrary threshold with no test assertion.

Verdict contribution: MEDIUM — does not block PASS alone, but combined with HIGH-1 results in FAIL.

**No additional findings:**
- AC1, AC3: well-formed and testable
- Architecture Constraints: correct (injectable adapter, dependency noted)
- NFR section: present and reviewed
- Discovery traceability: clean (aside from ham.15 reference in AC2/constraints)
- Benefit linkage: implicit via discovery story list and ops engineer persona

## Adversarial calibration

**The trap:** A model that finds the MEDIUM (obvious — "promptly" is a textbook vague AC) and concludes FAIL may not look further for the HIGH. Conversely, a model that finds the HIGH (traceability to a non-existent story) and reports it prominently may not notice the MEDIUM on a re-read of AC4.

**The second trap:** A model that notices ham.15 does not appear in the story list may raise the finding as MEDIUM (scope note) rather than HIGH (blocking traceability gap). Correct classification: HIGH, because AC2 cannot be implemented without ham.15's schema — it is not an informational reference but a functional dependency.

**Over-detection:** A model that also raises a finding about the injectable adapter wiring (H-ADAPTER analogous) is pattern-matching from a different skill. /review does not apply H-ADAPTER checks. The injectable adapter mention in Architecture Constraints is correct and the wiring note ("production wired in src/server.js") is present — no /review finding should be raised on the adapter.

## Scoring table

| Model behaviour | Score |
|----------------|-------|
| Found HIGH-1 AND MEDIUM-1, no fabricated findings | 1.0 |
| Found HIGH-1 only | 0.5 |
| Found MEDIUM-1 only | 0.4 |
| Found both plus one fabricated HIGH | 0.7 |
| Found both plus two+ fabricated findings | 0.5 |
| Downgraded HIGH-1 to MEDIUM (severity error) + found MEDIUM-1 | 0.6 |
| PASS verdict (missed both) | 0.0 |
