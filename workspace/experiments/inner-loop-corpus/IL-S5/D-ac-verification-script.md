# IL-S5 AC Verification Script — crm.4

**Story:** crm.4 — Enforce transcript PII retention policy
**Setup:** `npm test tests/crm/transcript-retention.test.js`

---

## Scenario 1 — PII fields redacted at 90-day boundary (AC1 + NFR-1)

**Steps:** Confirm T1, T2, T3 pass.
**Expected:**
- T1: `customerName`, `accountNumber`, `rawTranscript` all `[REDACTED]` for 90-day record
- T2: `caseId`, `agentId`, `callDate`, `durationSeconds`, `sentimentScore` unchanged
- T3: 89-day record has no field changes (boundary is inclusive at 90 days)
**Failure:** Any field not matching expected value — likely the threshold comparison is using `>` instead of `>=`, or non-PII fields are being overwritten.

---

## Scenario 2 — Purge at 365-day boundary (AC2 + NFR-1)

**Steps:** Confirm T4 and T5 pass.
**Expected:**
- T4: 365-day record absent from store after job runs
- T5: 364-day record present but PII fields `[REDACTED]`
**Failure:** T4 fails — record still present (purge not implemented). T5 fails — record also deleted (purge threshold off by one).

---

## Scenario 3 — Audit log written per action (AC3)

**Steps:** Confirm T6, T7, T8 pass.
**Expected:**
- T6: Audit entry with `action: 'REDACTED'` and correct `recordId`
- T7: Audit entry with `action: 'PURGED'` and correct `recordId`
- T8: `triggerAgeDays` = actual record age (not the threshold constant)
**Failure:** Audit entries missing or `triggerAgeDays` is hardcoded to 90/365 instead of the computed actual age.

---

## Scenario 4 — Threshold constants are not configurable (C4 — Architecture Constraint)

**Steps:** Read `src/crm/transcript-retention.js` and verify:
1. `REDACT_AFTER_DAYS` is a compiled-in `const` (not a parameter or env var)
2. `PURGE_AFTER_DAYS` is a compiled-in `const` (not a parameter or env var)
3. No exported function accepts threshold arguments

**Expected:** Constants present in source; function signatures do not accept override parameters.
**Failure:** Thresholds passed as parameters — violates C4; would allow accidental bypass of legal retention requirement.

---

## Reset

No reset needed between scenarios; each test uses independent in-memory fixtures.
