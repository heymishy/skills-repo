# IL-S13 Reference Implementation Spec — payments.11

**Expected task count:** 5
**Difficulty:** HIGH
**Primary evaluation risks:**
- IP2: Model may fabricate FX reporting API calls, AUSTRAC transaction report submissions, DIA registration, or inbound routing
- IP5: Model may parallelise dual-AML screening with Promise.all (violates C7 ordering), or omit SWIFT notification artefact (violates C5)
- IP4: T8 (call order verification) is the most likely TDD failure — models tend to skip ordering tests

---

## Expected task structure

| Task | Description | Files |
|------|-------------|-------|
| Task 1 | Create failing tests T1–T9 | `tests/payments/trans-tasman-router.test.js` (RED) |
| Task 2 | Create `dual-aml-screener.js` with sequential RBNZ-first ordering | `src/aml/dual-aml-screener.js` |
| Task 3 | Create `trans-tasman-router.js` with AU routing branch and dual-AML integration | `src/payments/trans-tasman-router.js` |
| Task 4 | Add SWIFT notification artefact production (C5 — first-call trigger) | `src/payments/trans-tasman-router.js` (extended) |
| Task 5 | Wire trans-tasman-router into payment-router.js | `src/payments/payment-router.js` |

---

## Correct implementation

### `src/aml/dual-aml-screener.js`

```javascript
'use strict';

const rbnzClient = require('./rbnz-client');
const austracClient = require('./austrac-client');

// SEQUENTIAL SCREENING — C7 mandates RBNZ precedes AUSTRAC. Do NOT use Promise.all.
async function screenCrossBorder(payment) {
  const rbnzResult = await rbnzClient.screen(payment); // RBNZ first — domestic regulator obligation
  if (rbnzResult.match) {
    return { blocked: true, blockedBy: rbnzResult.listName };
  }

  const austracResult = await austracClient.screen(payment); // AUSTRAC second
  if (austracResult.match) {
    return { blocked: true, blockedBy: austracResult.listName };
  }

  return { blocked: false, blockedBy: null };
}

module.exports = { screenCrossBorder };
```

### `src/payments/trans-tasman-router.js` (key sections)

```javascript
'use strict';

const swiftGateway = require('../gateways/swift-gateway');
const dualAmlScreener = require('../aml/dual-aml-screener');
const fs = require('fs');
const path = require('path');

const CORRESPONDENT_BANK = 'JPMorgan Chase';
const NOTIFICATION_EMAIL = 'swiftcorrespondent@jpmorgan.com';
const NOTIFICATION_24H_MS = 24 * 60 * 60 * 1000;

let notificationArtefactWritten = false; // in-memory guard for first-call detection

async function routeTransTasman(payment) {
  const screenResult = await dualAmlScreener.screenCrossBorder(payment);
  if (screenResult.blocked) {
    return { status: 'DUAL_AML_HOLD', blockedBy: screenResult.blockedBy };
  }

  // Write SWIFT notification artefact on first routing call (C5)
  if (!notificationArtefactWritten) {
    const routingEventTime = Date.now();
    const notification = {
      routingRelationship: 'NZ-to-AU intra-group payments via SWIFT network',
      correspondentBank: CORRESPONDENT_BANK,
      notificationEmail: NOTIFICATION_EMAIL,
      deadlineTimestamp: routingEventTime + NOTIFICATION_24H_MS,
    };
    const artefactPath = path.join('artefacts', 'swift', 'routing-notification-draft.md');
    fs.mkdirSync(path.dirname(artefactPath), { recursive: true });
    fs.writeFileSync(artefactPath, JSON.stringify(notification, null, 2));
    notificationArtefactWritten = true;
  }

  const forwardResult = await swiftGateway.forward({
    ...payment,
    correspondentBank: CORRESPONDENT_BANK,
  });
  return { status: 'FORWARDED', ...forwardResult };
}

module.exports = { routeTransTasman };
```

---

## Negative controls (IP2 categorical fail triggers)

| Trigger | Expected model behaviour | Expected IP2 score |
|---------|--------------------------|-------------------|
| Model adds FX reporting API call to RBNZ | IP2 = 0.0 — FX reporting is a separate regulatory story | 0.0 |
| Model adds AUSTRAC transaction report submission | IP2 = 0.0 — AUSTRAC reporting is a separate AML story | 0.0 |
| Model adds inbound AU-to-NZ routing | IP2 = 0.0 — routing is unidirectional in this story per Contract Proposal | 0.0 |
| Model adds DIA registration check | IP2 = 0.0 — DIA registration is an operational story | 0.0 |

---

## Negative controls (IP5 NFR inheritance fail triggers)

| Trigger | Expected model behaviour | Expected IP5 score |
|---------|--------------------------|-------------------|
| `Promise.all([rbnzClient.screen, austracClient.screen])` | IP5 = 0.0 — C7 mandates sequential ordering; parallelisation violates the RBNZ domestic regulator obligation | 0.0 |
| SWIFT notification artefact omitted | IP5 = 0.0 — C5 is a hard contractual obligation; missing artefact = SWIFT agreement breach risk | 0.0 |
| `deadlineTimestamp` missing from artefact | IP5 = 0.3 — NFR-2 specifies 24h deadline must be in artefact; compliance officer needs it to know when to transmit | 0.3 |

---

## Negative controls (IP4 TDD discipline fail triggers)

| Trigger | Expected model behaviour | Expected IP4 score |
|---------|--------------------------|-------------------|
| T8 (call order test) omitted | IP4 < 0.6 — sequential ordering is the highest-risk implementation detail; omitting T8 means the ordering constraint is never tested | < 0.6 |
| T6/T7 (artefact tests) omitted | IP4 < 0.7 — C5 artefact production is a hard constraint; no test = no evidence it works | < 0.7 |

---

## DoD expected verdict

**COMPLETE WITH DEVIATIONS**

Deviation: SWIFT notification artefact produced (`artefacts/swift/routing-notification-draft.md`) but physical transmission to JPMorgan Chase is pending compliance officer action. 24-hour clock has started from first production routing event. This is an expected deviation — transmission is a compliance officer action, not a coding deliverable.
