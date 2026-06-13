# IL-T3 Reference Implementation Spec — aml.2

## What a correct implementation plan should contain

**Expected task count:** 4 tasks
- Task 1: AC1 — Slack message routing
- Task 2: AC2 — Email routing
- Task 3: AC3 — Partial failure recovery (no-throw contract)
- Task 4: NFR-1 — Audit log integration (separate task, testable independently)

**Required file paths:**
- Create: `src/compliance/alert-router.js`
- Create: `tests/compliance/alert-router.test.js`

**Required NFR implementation step (Task 4):**
```javascript
// In routeAlert, after channel delivery:
auditLogger.log({
  event: 'ALERT_DISPATCHED',
  alertId: payload.alertId,
  timestamp: new Date().toISOString(),
  channels: { slack: slackStatus, email: emailStatus },
});
```

**Constraint that must appear in at least one task:**
- NFR-1: audit log call in `routeAlert` — the IP5 signal for this case
- The Architecture Constraint note: "Use `src/audit/audit-logger.js` — NOT console.log"

---

## Negative controls: what a weak plan will fabricate or miss

1. **NFR-1 omission (IP5 fail):** Plan covers AC1–AC3 but has no Task 4 for audit logging. The DoD grade will call out `T7 not passed → NFR-1 unverified → COMPLETE WITH DEVIATIONS`.

2. **Fabrication (IP2 fail):** Plan adds alert deduplication logic (checking if same alertId was recently dispatched) — this is explicitly out of scope.

3. **Fabrication (IP2 fail):** Plan adds MLRO escalation path for alerts over $50,000 — SAR workflow is deferred.

4. **Coarse task (IP3 fail):** Single task "implement alert router with Slack, email, and audit log" — four distinct behaviours merged into one task that takes 20+ minutes.

5. **TDD omission (IP4 fail):** Tests written after implementation step, or expected failure output for RED step missing.

6. **Architecture Constraint ignored:** `auditLogger.log` call uses `console.log` instead — violates the Architecture Constraint stated in the DoR.
