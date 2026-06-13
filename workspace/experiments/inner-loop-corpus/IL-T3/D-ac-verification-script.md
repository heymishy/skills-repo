# IL-T3 AC Verification Script — aml.2

**Story:** aml.2 — Route threshold breach alerts to compliance channels
**Setup:** Run `npm test tests/compliance/alert-router.test.js`

---

## Scenario 1 — Slack alert is sent to compliance channel (AC1)

**What to check:** When a threshold breach alert is routed, a Slack message appears in `#aml-alerts` with the alert details.

**Steps:**
1. Run `npm test tests/compliance/alert-router.test.js`
2. Confirm T1 and T2 both pass

**Expected:** Tests show `✓ Slack postMessage called with correct channel` and `✓ message body includes alertId`. In production smoke test: confirm message appears in `#aml-alerts` Slack channel.

**What failure looks like:** T1 fails with `expected 'postMessage' to have been called` — alert was not sent to Slack at all.

---

## Scenario 2 — Email is sent to compliance distribution list (AC2)

**What to check:** Email arrives at `compliance@enterprise.com` with subject `AML Threshold Breach — [alertId]`.

**Steps:**
1. Confirm T3 and T4 both pass

**Expected:** `✓ sendMail called with correct to/subject` and `✓ email body contains alertId`.

**What failure looks like:** T3 fails — email not sent, or sent to wrong address.

---

## Scenario 3 — Partial channel failure does not suppress other channels (AC3)

**What to check:** If Slack is down, the email still goes through. The function never crashes.

**Steps:**
1. Confirm T5 and T6 both pass

**Expected:** T5 shows `✓ returns { slack: 'failed', email: 'sent' }` when Slack rejects. T6 confirms function resolves (no throw) even when both channels fail.

**What failure looks like:** T5 or T6 fails — partial failure propagated as a thrown error, which would prevent the calling code from knowing partial delivery occurred.

---

## Scenario 4 — Every dispatch is audit logged (NFR-1)

**What to check:** Every call to routeAlert writes an entry to the audit log module. This is the compliance evidence trail.

**Steps:**
1. Confirm T7 and T8 both pass

**Expected:** `✓ auditLogger.log called on every invocation` and `✓ log entry contains alertId and channel statuses`.

**What failure looks like:** T7 fails — audit log not called. This is an NFR failure; the story should NOT be marked COMPLETE if the audit log is missing.

---

## Reset between scenarios

No reset needed — all tests are stateless unit tests with mocked dependencies.
