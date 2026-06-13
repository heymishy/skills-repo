# IL-S5 DoD Input Bundle — crm.4 Transcript Retention

**Story:** crm.4 — Enforce transcript PII retention policy
**PR:** #221
**Expected DoD verdict:** COMPLETE
**Difficulty:** MEDIUM

---

## Definition artefact (inline)

Story: crm.4 — Enforce transcript PII retention policy

AC1: PII fields (`customerName`, `accountNumber`, `rawTranscript`) redacted to `[REDACTED]` for records > 90 days old; non-PII fields preserved.
AC2: Records > 365 days old purged entirely from store.
AC3: Retention audit entry written per acted-upon record: `recordId`, `action`, `timestamp`, `triggerAgeDays`.
NFR-1 (Privacy Act 2020): Redaction threshold exactly 90 days; purge threshold exactly 365 days. Boundary tests at 89/90 and 364/365 days.

Out of scope: Consent workflow, CRM attachment redaction, Azure Cosmos DB migration, configurable thresholds.

---

## Test plan summary

| Test | AC/NFR | Status |
|------|--------|--------|
| T1 — PII fields `[REDACTED]` for 90-day record | AC1 | PASS |
| T2 — Non-PII fields preserved after redaction | AC1 | PASS |
| T3 — 89-day record untouched | AC1, NFR-1 | PASS |
| T4 — 365-day record purged | AC2 | PASS |
| T5 — 364-day record redacted but not purged | AC2, NFR-1 | PASS |
| T6 — REDACTED audit entry written | AC3 | PASS |
| T7 — PURGED audit entry written | AC3 | PASS |
| T8 — `triggerAgeDays` reflects actual age | AC3 | PASS |

**All 8 tests passing. Test suite command:** `npm test`

---

## Test run evidence

```
PASS tests/crm/transcript-retention.test.js
  Transcript retention — Privacy Act 2020
    ✓ PII fields [REDACTED] for 90-day record (4 ms)
    ✓ non-PII fields preserved after redaction (3 ms)
    ✓ 89-day record untouched (2 ms)
    ✓ 365-day record purged (3 ms)
    ✓ 364-day record redacted but not purged (2 ms)
    ✓ REDACTED audit entry written with correct fields (2 ms)
    ✓ PURGED audit entry written with correct fields (2 ms)
    ✓ triggerAgeDays reflects actual record age not threshold constant (3 ms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```

---

## AC verification results

| Scenario | Result |
|----------|--------|
| S1 — PII redacted at 90-day boundary (89-day untouched) | PASS |
| S2 — Purge at 365-day boundary (364-day only redacted) | PASS |
| S3 — Audit log entries correct | PASS |
| S4 — Threshold constants not configurable (C4) | PASS — `REDACT_AFTER_DAYS = 90` and `PURGE_AFTER_DAYS = 365` are compiled-in consts; no parameter override exists |

---

## PR diff summary

**Files changed:**
- `src/crm/transcript-retention.js` — new module; `runRetentionJob()` with compiled-in 90/365-day thresholds; processes all records from `transcript-store`; writes audit entries to `retention-audit-store`
- `src/crm/retention-audit-store.js` — new module; `append(entry)` and `findAll()` for in-memory audit log
- `tests/crm/transcript-retention.test.js` — new file; T1–T8 unit tests with `createdAt` date fixtures

---

## Out-of-scope check

No consent workflow, no Azure Cosmos DB migration, no attachment redaction, no CRM adapter changes. Threshold constants are not configurable — no export for threshold override. Scheduling wiring (crm.5) not included.

---

## NFR check

NFR-1 (Privacy Act 2020): 90-day redact threshold confirmed by T1 (pass at 90 days) and T3 (boundary: 89-day record untouched). 365-day purge threshold confirmed by T4 (pass at 365 days) and T5 (boundary: 364-day record survives). Thresholds are compiled-in constants per C4 (PIA-2026-14). Evidence present.

---

## Expected DoD verdict

**COMPLETE**

Gate conditions:
- D1 (AC coverage): 3/3 ACs verified ✓
- D2 (out-of-scope): No fabricated scope — no consent gate, no Azure Cosmos ✓
- D3 (test plan): 8/8 tests pass ✓
- D4 (NFR): NFR-1 boundary tests present and passing; thresholds are constants ✓
- D5 (metric signal): Test output shows per-test pass status and timing ✓
- D6 (verdict): COMPLETE — no deviations
