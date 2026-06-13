# IL-S13 AC Verification Script — payments.11

**Story:** payments.11 — Trans-Tasman intra-group routing with dual-AML screening
**Setup:** `npm test tests/payments/trans-tasman-router.test.js`

---

## Scenario 1 — AU intragroup routing uses SWIFT path (AC1)

**Steps:** Confirm T1 and T2 pass.
**Expected:**
- T1: SWIFT gateway called for AU intragroup payment
- T2: SWIFT gateway not called for NZ domestic payment

**Failure:** T1 fails — AU payment going to NZ domestic gateway (routing branch missing). T2 fails — NZ payments incorrectly routed via SWIFT.

---

## Scenario 2 — Dual-AML screening blocks matches from both watchlists (AC2)

**Steps:** Confirm T3, T4, T5 pass.
**Expected:**
- T3: RBNZ match → `DUAL_AML_HOLD`; SWIFT gateway not called
- T4: AUSTRAC match (RBNZ clear) → `DUAL_AML_HOLD`; SWIFT gateway not called
- T5: Both clear → payment forwarded via SWIFT

**Failure:** T3 fails — RBNZ screening not implemented. T4 fails — only RBNZ checked, not AUSTRAC. T5 fails — dual-AML clear payments still blocked.

---

## Scenario 3 — SWIFT notification artefact produced with correct content (AC3 + NFR-2)

**Steps:** Confirm T6, T7, T9 pass. Additionally verify manually:
1. `artefacts/swift/routing-notification-draft.md` exists after test run
2. Contains `correspondentBank: 'JPMorgan Chase'`
3. Contains `notificationEmail: 'swiftcorrespondent@jpmorgan.com'`
4. Contains `deadlineTimestamp` within 24h of test run time

**Expected:** File present; all 4 required fields populated; deadline is 24 hours from routing event.
**Failure:** File missing — C5 violated; enterprise is at risk of SWIFT agreement breach. Wrong deadline — contractual timing not enforced.

---

## Scenario 4 — RBNZ screening is called before AUSTRAC (NFR-1 / C7)

**Steps:** Confirm T8 passes.
**Expected:** `rbnzClient.screen` call precedes `austracClient.screen` call (verified by mock call order tracking).
**Failure:** T8 fails — either AUSTRAC is called first (C7 violation), or the calls are parallelised (Promise.all — also a C7 violation, since ordering cannot be guaranteed). This is a regulator audit risk: RBNZ expects to be the primary domestic screening layer.

---

## Scenario 5 — No FX reporting, AUSTRAC transaction reporting, or DIA registration in diff (out-of-scope check)

**Steps:** Review PR diff for `payment-router.js`, `trans-tasman-router.js`, `dual-aml-screener.js`.
**Expected:** No calls to FX reporting API, no AUSTRAC transaction report submission, no DIA registration calls, no inbound AU-to-NZ routing logic.
**Failure:** Any of the above present — IP2 categorical fail; fabricated scope beyond Contract Proposal.

---

## Reset

No reset needed between scenarios; each test uses independent mock instances.
