# Corpus Case T5 — Notification service: H-ADAPTER block (injectable adapter, wiring AC absent)

## Case metadata

```json
{
  "case_id": "T5",
  "label": "Payment notification service — H-ADAPTER block (no wiring AC for setNotificationSender)",
  "difficulty": "adversarial-hard",
  "expected_verdict": "BLOCKED",
  "expected_h_blocks": ["H-ADAPTER"],
  "adversarial_pattern": "Story looks almost complete: 4 well-formed GWT ACs, clean review (no findings), test plan covering all ACs, H-GOV passing. The only gap is H-ADAPTER: the story introduces an injectable adapter (setNotificationSender) in its Architecture Constraints but none of the 4 ACs scope the production wiring of that adapter. A model that checks H1–H9 and H-NFR* carefully but does not apply H-ADAPTER will sign off a story with an unverified adapter wiring gap. H-ADAPTER is the last block in the checklist and is easily skipped if the model concludes READY early.",
  "failure_modes_to_watch": [
    "Skips H-ADAPTER entirely after seeing clean H1–H9 and H-NFR results",
    "Reads 'injectable adapter' in Architecture Constraints but classifies it as implementation detail only",
    "Passes H-ADAPTER because the stub default is mentioned in Architecture Constraints (it is not — only the setter pattern is mentioned)",
    "Surfaces H-ADAPTER as a Warning rather than a hard block"
  ]
}
```

---

## Input bundle

> **Operator instruction:** Please run /definition-of-ready for the story and supporting artefacts below.

---

### Story artefact

**Story ID:** ham.13
**Feature:** Hamilton Core Banking DR Failover
**Epic reference:** artefacts/2026-04-15-hamilton-dr-failover/epics/ham-epic-3-notification.md

---

## Story: Real-time payment failure notification service

**As a** Hamilton payments operations engineer,
**I want** a real-time notification dispatched to the operations Slack channel whenever a payment fails due to a DR failover event,
**So that** the operations team can initiate manual recovery procedures within the 15-minute SLA window.

## Benefit Linkage

**Metric moved:** M2 (Mean time to manual recovery initiation ≤ 15 minutes from failover detection)
**How:** Currently, operations engineers detect failover-induced payment failures by polling a monitoring dashboard (mean detection lag: 8 minutes). This story replaces polling with push notifications, reducing detection time to < 30 seconds.

## Architecture Constraints

- New module at `src/payments/notification-service.js`
- Module exposes `notifyFailover(paymentRef, failureReason)` — the public API consumed by the payment processing pipeline
- Injectable adapter pattern: `let _sender = defaultSender; function setNotificationSender(fn) { _sender = fn; }` — allows tests to inject a mock sender; production uses the real Slack webhook sender
- The default sender `defaultSender` must throw `Error('Adapter not wired: notificationSender. Call setNotificationSender() before use.')` — not return silently
- The real Slack sender is wired in `src/server.js` at application startup

## Dependencies

- **Upstream:** ham.7 (payment status state machine) must be complete — failover events are emitted by the state machine
- **Downstream:** None

## NFRs

NFRs: None — reviewed 2026-05-01

## Acceptance Criteria

**AC1:** Given a payment fails due to a DR failover event, when `notifyFailover` is called with the payment reference and failure reason, then a Slack message is sent to the `#hamilton-ops` channel within 5 seconds, containing the payment reference, failure reason, and a timestamp in ISO 8601 format.

**AC2:** Given the Slack webhook call fails (network error or non-2xx response), when `notifyFailover` is called, then the error is caught and logged to `stderr` with the payment reference included in the log line, and no exception propagates to the caller (fire-and-forget pattern).

**AC3:** Given `notifyFailover` is called concurrently for multiple failover events, when the batch size exceeds 10 concurrent calls, then all notifications are dispatched without message loss (no buffering drop) and the caller is not blocked for more than 100ms per call.

**AC4:** Given the notification module is loaded in a test environment, when the test suite runs without calling `setNotificationSender`, then the module does not silently succeed on any outbound call — the default sender throws an error that makes the misconfiguration visible.

---

### Test plan (extract)

```
Test plan: ham.13 — Real-time payment failure notification service
Status: Written (failing)

UNIT-1: notifyFailover sends to #hamilton-ops with correct payload (AC1)
  - Inject mock sender via setNotificationSender
  - Call notifyFailover('PAY-001', 'DR_FAILOVER')
  - Assert mock sender called with correct channel, paymentRef, failureReason, ISO8601 timestamp

UNIT-2: notifyFailover swallows Slack errors (AC2)
  - Inject mock sender that throws a network error
  - Assert no exception propagates from notifyFailover
  - Assert stderr log contains paymentRef

UNIT-3: Concurrent notifications — no message loss (AC3)
  - Inject mock sender with 10ms artificial delay
  - Call notifyFailover 20 times concurrently
  - Assert all 20 mock sender calls were made, caller unblocked within 100ms per call

UNIT-4: Default sender throws on misconfigured module (AC4)
  - Do NOT call setNotificationSender
  - Assert calling notifyFailover throws or rejects with adapter-not-wired error
```

---

### Review report (extract)

```
Review: ham.13
Date: 2026-05-02
Reviewer: automated /review pass

HIGH findings: 0
MEDIUM findings: 0
LOW findings: 1

LOW-1: UNIT-3 concurrent test relies on 10ms artificial delay — if CI host is slow, the 100ms assertion may be flaky. Suggest using a controlled test clock or dropping the timing assertion in favour of a count-only assertion.

Verdict: PASS (1 LOW finding — acknowledged)
```

---

### Discovery artefact (extract)

```
Feature: Hamilton Core Banking DR Failover
Status: Approved
Approved By: Sarah Chen (Head of Platform Engineering), Marcus Webb (CTO)
Date: 2026-04-15
```

---

## Expected verdict

**BLOCKED — H-ADAPTER**

The story introduces an injectable adapter (`setNotificationSender`) in the Architecture Constraints. The Architecture Constraints correctly describe the pattern and the throw-on-default requirement. However, none of AC1–AC4 scope the production wiring: none of the ACs state "the real Slack sender is wired in `src/server.js` before the first request is served" or equivalent. Without a wiring AC, the coding agent will implement the adapter pattern and the throw-default stub (AC4 covers that) but there is no AC requiring the agent to wire the real sender in `server.js` — the wiring step is a separate task requirement and it has no acceptance criterion.

H-ADAPTER fires:
> H-ADAPTER FAIL: adapter `setNotificationSender` is introduced by this story but no AC scopes its production wiring in `src/server.js`. The Architecture Constraints name the wiring location but an AC that mandates wiring before go-live is required. Add: "Given the server starts, when the application initialises, then `setNotificationSender` is called with the real Slack webhook sender before the first payment event is processed."

All other hard blocks pass:
- H1: As/Want/So with named persona ✅
- H2: 4 ACs in GWT format ✅
- H3: Each AC has a unit test ✅
- H4: Out-of-scope section present (implicit — epic scoping) — NOTE: story lacks explicit Out-of-Scope section (borderline H4 - depends on whether epic-level scoping satisfies H4)
- H5: Benefit linkage to M2 ✅
- H6: Complexity not rated — **borderline H6** — story does not include a Complexity field
- H7: 0 HIGH review findings ✅
- H8: All ACs covered by tests ✅
- H9: Architecture Constraints populated ✅
- H-NFR: `NFRs: None — reviewed 2026-05-01` ✅
- H-GOV: `Approved By: Sarah Chen, Marcus Webb` ✅
- H-ADAPTER: **FAIL** — no wiring AC (see above)

**Calibration note:** H4 and H6 are borderline — a model that fires both as blocks in addition to H-ADAPTER is overcounting (H4 can be satisfied by epic-level scoping; H6 may be present in the full story). The target outcome is H-ADAPTER as the primary block. A model that fires H4 or H6 in addition to H-ADAPTER is close but not at full G1=1.0.

## Scoring notes

| Dimension | Expected | Notes |
|-----------|----------|-------|
| G1 | 0.8–1.0 | Full credit for H-ADAPTER identified; partial credit for missing H4/H6 borderlines |
| G2 | N/A (BLOCKED) | Warnings not scored when BLOCKED |
| G3 | N/A (BLOCKED) | Instructions block not produced when BLOCKED |
| G4 | N/A (BLOCKED) | Contract not finalised when BLOCKED |
| G5 | 0.7–1.0 | Oversight derivable from H-GOV approvers (High) |
| G6 | 1.0 | Process ordering: contract → hard blocks → blocked |
