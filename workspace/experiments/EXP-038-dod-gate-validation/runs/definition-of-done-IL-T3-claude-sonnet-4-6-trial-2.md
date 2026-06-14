# Definition of Done — aml.2

**Story:** Route threshold breach alerts to compliance channels
**PR:** #187 (merged 2026-06-13)
**Evaluated:** 2026-06-13

---

## DoD Gate Assessment

### ✅ AC Coverage

| AC | Required | Evidence | Status |
|----|----------|----------|--------|
| AC1 | Slack sent to `#aml-alerts`; returns `{ slack: 'sent', email: 'sent' }` | T1 (correct channel), T2 (body contains alertId); PR confirms 8/8 pass | ✅ PASS |
| AC2 | Email to `compliance@enterprise.com`, subject `AML Threshold Breach — [alertId]` | T3 (to/subject correct), T4 (body contains alertId) | ✅ PASS |
| AC3 | Partial success returned; no throw on channel failure | T5 (partial failure object), T6 (no throw); PR confirms `{ slack: 'failed', email: 'sent' }` on Slack 5xx | ✅ PASS |

---

### ✅ NFR Coverage

| NFR | Required | Evidence | Status |
|-----|----------|----------|--------|
| NFR-1 | Every dispatch logged to `src/audit/audit-logger.js` with alertId, timestamp, channel statuses | T7 (auditLogger.log called per invocation), T8 (entry contains alertId + statuses); PR confirms `alertId`, `loggedAt`, per-channel delivery status present | ✅ PASS |

**Architecture constraint satisfied:** PR explicitly confirms `src/audit/audit-logger.js` used — not `console.log`.

---

### ✅ Test Plan Integrity

- Test plan declares no gaps, with full coverage across all ACs and NFR-1.
- 8 tests specified; 8/8 pass confirmed in PR.
- AC3 edge case (partial failure) is explicitly exercised — not just happy path.
- Audit log structure (T8) tested at field level, not just call presence.
- No concerns with test plan completeness.

---

### ✅ PR Hygiene

| Check | Status |
|-------|--------|
| Implementation files match story scope | ✅ `alert-router.js` only — no SAR, MLRO, deduplication, or detection logic |
| Test file present and co-located | ✅ `tests/compliance/alert-router.test.js` |
| Dependency injection used for testability | ✅ `slackClient` and `emailTransport` as constructor args — appropriate pattern |
| No out-of-scope changes noted | ✅ |

---

### ✅ DoR Continuity

| Item | Status |
|------|--------|
| DoR verdict was PROCEED | ✅ |
| Oversight level (Medium / tech lead aware) | ✅ — no blocker for merge |
| W1 (audit log format) reviewed by compliance team | ✅ — acknowledged at DoR; audit fields (`alertId`, `loggedAt`, channel statuses) align with what was reviewed |

---

### ⚠️ Metric Note — M1 (Non-blocking)

**M1 (breach detection latency < 15 min)** cannot yet be measured. This was anticipated and documented:

- aml.2 is the final routing step; aml.1 (threshold detection) is a prerequisite.
- M1 state is correctly recorded as `signal: "not-yet-measured"`.
- **Action required before M1 can close:** Confirm aml.1 is live and instrumented, then validate end-to-end latency against the < 15-minute target.

This is a feature-level dependency, not a defect in aml.2. The story's contribution to M1 is complete on its own terms.

---

## Verdict

```
┌─────────────────────────────────────────────────┐
│  DoD VERDICT: DONE                              │
│                                                 │
│  All ACs: ✅  NFR-1: ✅  Tests: 8/8 ✅          │
│  PR merged: 2026-06-13                          │
│                                                 │
│  Open item (feature-level, non-blocking):       │
│  M1 measurement pending aml.1 integration.      │
└─────────────────────────────────────────────────┘
```

**aml.2 is done.** No rework required. M1 measurement should be scheduled as a feature-level activity once aml.1 is confirmed live.