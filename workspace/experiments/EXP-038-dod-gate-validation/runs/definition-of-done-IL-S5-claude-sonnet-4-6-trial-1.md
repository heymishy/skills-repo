# Definition of Done — crm.4 Enforce transcript PII retention policy

**PR #221 · Assessment date: today**

---

## Verdict

> **✅ DONE — all DoD gates passed**

---

## Gate-by-gate assessment

### Gate 1 — Acceptance Criteria coverage

| AC / NFR | Tests covering it | Evidence status |
|----------|------------------|-----------------|
| AC1 — PII fields redacted at ≥ 90 days | T1, T2 | ✅ PASS |
| AC1 — Non-PII fields preserved | T2 | ✅ PASS |
| AC2 — Records ≥ 365 days purged | T4 | ✅ PASS |
| AC3 — Audit entry written per record (`recordId`, `action`, `timestamp`, `triggerAgeDays`) | T6, T7, T8 | ✅ PASS |
| NFR-1 — 89-day boundary (untouched) | T3 | ✅ PASS |
| NFR-1 — 90-day boundary (redacted) | T1 | ✅ PASS |
| NFR-1 — 364-day boundary (redacted, not purged) | T5 | ✅ PASS |
| NFR-1 — 365-day boundary (purged) | T4 | ✅ PASS |

**All 8 ACs and NFR-1 boundary conditions have mapped, passing tests.** NFR-1 is the most legally sensitive requirement (Privacy Act 2020); boundary coverage at 89/90 and 364/365 is explicitly confirmed — this is a strength of the test suite.

---

### Gate 2 — Test quality and completeness

| Check | Finding |
|-------|---------|
| All 8 planned tests present in suite | ✅ |
| Test names match test plan entries 1-for-1 | ✅ |
| Both boundary pairs exercised (89/90, 364/365) | ✅ |
| `triggerAgeDays` verified as actual record age, not threshold constant | ✅ T8 explicitly guards against a common implementation shortcut |
| Audit field completeness tested (all four required fields) | ✅ T6, T7 |
| 8/8 tests passing, 0 failures, 0 skipped | ✅ |

**No gaps identified.** T8 (`triggerAgeDays reflects actual record age not threshold constant`) is particularly good defensive testing — flagged as a positive.

---

### Gate 3 — Test run evidence

```
Tests: 8 passed, 8 total   Suites: 1 passed, 1 total
```

✅ Clean run. No skipped, pending, or failing tests. Evidence is present and unambiguous.

---

### Gate 4 — PR diff alignment

| Expectation | Actual |
|-------------|--------|
| Retention logic in dedicated module | ✅ `src/crm/transcript-retention.js` |
| Audit store as separate module | ✅ `src/crm/retention-audit-store.js` |
| Tests co-located under `tests/crm/` | ✅ `tests/crm/transcript-retention.test.js` |
| No threshold parameter export (compiled-in consts) | ✅ `REDACT_AFTER_DAYS = 90`, `PURGE_AFTER_DAYS = 365` — no override path |
| No out-of-scope files touched | ✅ Confirmed — no consent, no Cosmos DB, no attachment, no CRM adapter changes |

**Implementation matches the story design intent and out-of-scope boundaries.** Compiled-in constants satisfy the PIA constraint (PIA-2026-14) and are verified by S4.

---

### Gate 5 — Out-of-scope containment

The following items were explicitly excluded and are confirmed absent from the diff:

- ❌ Consent workflow — not present
- ❌ CRM attachment redaction — not present
- ❌ Azure Cosmos DB migration — not present
- ❌ Configurable thresholds — not present
- ❌ Scheduling wiring (crm.5) — not present

✅ **Scope boundary is clean.** No scope creep detected.

---

### Gate 6 — NFR-1 (Privacy Act 2020) compliance signal

| Requirement | Evidence |
|-------------|----------|
| Redaction threshold exactly 90 days | Compiled const + T1 (pass) + T3 (boundary hold) |
| Purge threshold exactly 365 days | Compiled const + T4 (pass) + T5 (boundary hold) |
| Thresholds not runtime-configurable | S4 verified; no export or env-var override path |

✅ **Regulatory NFR is satisfied at the implementation and test levels.** The Privacy Act 2020 boundary requirements have explicit test evidence — this is audit-ready.

---

## Issues and observations

### 🟡 Observations (non-blocking)

1. **In-memory audit store** — `retention-audit-store.js` uses in-memory storage. This is likely intentional for this story (persistence and Cosmos DB migration are out of scope), but it should be tracked. If crm.5 or a follow-on story does not wire this to a durable store before production deployment, audit entries will not survive process restarts. Recommend ensuring a follow-on story exists for durable audit persistence before the feature goes live.

2. **No integration or contract test** — All 8 tests are unit tests with fixture dates. This is appropriate for this story. Before production deployment, a smoke/integration test against the actual `transcript-store` read path would be advisable, particularly to confirm that `createdAt` field semantics match between the store and the retention module.

3. **Scheduling not wired** — `runRetentionJob()` exists but is not scheduled (correctly deferred to crm.5). Confirm crm.5 is on the backlog and prioritised before treating this feature as operationally active.

### ✅ Strengths worth noting

- T8 guarding `triggerAgeDays` against threshold-constant substitution is good defensive testing practice.
- All four required audit fields explicitly verified in T6 and T7.
- Boundary tests at both threshold pairs satisfy the regulatory requirement cleanly.

---

## Summary

| Gate | Result |
|------|--------|
| AC coverage | ✅ |
| Test completeness | ✅ |
| Test run evidence | ✅ |
| PR diff alignment | ✅ |
| Out-of-scope containment | ✅ |
| NFR-1 compliance signal | ✅ |

**crm.4 is Done.** The three observations above are carry-forward notes for the team, not blockers on this story. PR #221 is good to close.