# Definition of Done — crm.4 · Enforce transcript PII retention policy

**PR #221 merged** · Evaluation timestamp: now

---

## Verdict

> ✅ **DONE** — all DoD gates pass. No blockers, no conditions.

---

## Gate-by-gate assessment

### AC1 — PII fields redacted for records > 90 days; non-PII preserved

| Check | Evidence | Result |
|-------|----------|--------|
| PII fields (`customerName`, `accountNumber`, `rawTranscript`) become `[REDACTED]` at exactly 90 days | T1 PASS; 90-day fixture confirmed in test run | ✅ |
| Non-PII fields survive redaction unchanged | T2 PASS | ✅ |
| 89-day record is untouched (boundary below threshold) | T3 PASS | ✅ |

**AC1: PASS**

---

### AC2 — Records > 365 days purged entirely

| Check | Evidence | Result |
|-------|----------|--------|
| 365-day record purged from store | T4 PASS | ✅ |
| 364-day record redacted but **not** purged (boundary below purge threshold) | T5 PASS | ✅ |

**AC2: PASS**

---

### AC3 — Retention audit entry written per acted-upon record

| Check | Evidence | Result |
|-------|----------|--------|
| `REDACTED` audit entry written with `recordId`, `action`, `timestamp`, `triggerAgeDays` | T6 PASS; test name confirms field-level assertion | ✅ |
| `PURGED` audit entry written with same schema | T7 PASS | ✅ |
| `triggerAgeDays` reflects **actual record age**, not a threshold constant | T8 PASS; test name explicitly confirms this distinction | ✅ |

**AC3: PASS**

---

### NFR-1 — Privacy Act 2020 threshold exactness

| Check | Evidence | Result |
|-------|----------|--------|
| Redaction at exactly 90 days (not 89) | T1 + T3 boundary pair | ✅ |
| Purge at exactly 365 days (not 364) | T4 + T5 boundary pair | ✅ |
| Thresholds are compiled-in constants, not runtime-configurable | `REDACT_AFTER_DAYS = 90`, `PURGE_AFTER_DAYS = 365` hardcoded; S4 PASS; no export or override path present | ✅ |

**NFR-1: PASS**

---

### Test evidence quality

| Dimension | Assessment |
|-----------|------------|
| All 8 planned tests present and named | ✅ Exact match between test plan and run output |
| Boundary pairs complete (89/90, 364/365) | ✅ Both pairs covered |
| Test run output attached and clean | ✅ 8/8, 0 skipped, 0 pending |
| Audit field assertions are field-level (not just "entry exists") | ✅ Test names confirm correct-fields assertions |

---

### Out-of-scope containment

| Item | Status |
|------|--------|
| Consent workflow | ✅ Not touched |
| CRM attachment redaction | ✅ Not touched |
| Azure Cosmos DB migration | ✅ Not touched |
| Configurable thresholds | ✅ Explicitly absent — no export or parameter override |
| Scheduling wiring (crm.5) | ✅ Deferred correctly; `runRetentionJob()` exists but is not wired to a scheduler in this story |

---

### PR diff coherence

| File | Purpose | Aligned to story? |
|------|---------|-------------------|
| `src/crm/transcript-retention.js` | Core retention logic with compiled-in thresholds | ✅ |
| `src/crm/retention-audit-store.js` | Audit log backing store (`append` / `findAll`) | ✅ |
| `tests/crm/transcript-retention.test.js` | T1–T8 unit tests | ✅ |

No unexpected files changed. No pre-existing files modified, consistent with this being a greenfield module.

---

## Observations (non-blocking)

> These do not affect the Done verdict but are worth carrying into backlog or crm.5 planning.

1. **In-memory audit store** — `retention-audit-store.js` is in-memory. This is sufficient for unit testing and the current story scope, but durability of audit entries will need to be confirmed before the retention job runs in production (likely a crm.5 or infrastructure concern).

2. **`runRetentionJob()` not yet scheduled** — correctly deferred to crm.5. Recommend crm.5 acceptance criteria explicitly reference this entry point to avoid ambiguity at that story's DoD gate.

3. **T8 distinction (actual age vs. threshold constant)** — the explicit test for this is good practice and worth noting as a model for future audit-writing stories.

---

**/definition-of-done pipeline complete — crm.4 is DONE.**