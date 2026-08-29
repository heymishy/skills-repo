## Test Plan: Increase the session-persist timeout to close the suspend race

**Story reference:** artefacts/2026-08-30-csrf-persist-timeout-race/stories/cptr-s1-increase-persist-timeout-to-close-suspend-race.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-30

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | A write slower than the old 500ms cap but within the new 8000ms cap lands before `persistSession` resolves | 1 test | — | — | — | — | 🟢 |
| AC2 | No-adapter case unchanged | 0 new tests (existing AC3 in `cpr-s1`'s own suite already covers this exact case) | — | — | — | — | 🟢 |
| AC3 | Rejecting write still resolves | 0 new tests (existing AC4a in `cpr-s1`'s own suite already covers this exact case) | — | — | — | — | 🟢 |
| AC4 | Hung write bounded at the new 8000ms cap | 1 updated test (existing AC4b, bound raised) | — | — | — | — | 🟢 |
| AC5 | Existing suite passes with the one declared, necessary update | — | 1 run | — | — | — | 🟢 |

---

## Coverage gaps

None. AC2 and AC3 are fully covered by `cpr-s1`'s own existing tests (`AC3: no-adapter case resolves cleanly with no throw` and `AC4a: a rejecting Redis write still resolves generateCsrfToken with the token`) — this timeout-value-only change does not alter either code path, so no new test is needed; re-running the existing suite (AC5) is sufficient evidence.

---

## Test Data Strategy

**Source:** Synthetic (in-memory fake Redis adapter, reusing `cpr-s1`'s own established `makeFakeRedis(delayMs)` fixture)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Gaps

None.

---

## Unit Tests

### writeSlowerThanOldCapStillLandsWithinNewCap

- **Verifies:** AC1
- **Precondition:** A fake Redis adapter with a 2000ms injected delay (longer than the old 500ms cap, well within the new 8000ms cap).
- **Action:** Call `persistSession(id)` and await it.
- **Expected result:** The fake adapter's store contains the persisted data by the time `persistSession` resolves — proving the real write, not a timeout, is what resolved the promise. (Contrast with the pre-fix behaviour, where this exact scenario would have resolved via the 500ms timeout branch with the write still in flight.)
- **Edge case:** No.

### hungWriteStillBoundedAtNewCap (update to cpr-s1's existing AC4b test)

- **Verifies:** AC4
- **Precondition:** A fake Redis adapter whose `writeSession` never resolves (`cpr-s1`'s existing `makeHangingRedis()` fixture, reused as-is).
- **Action:** Call `persistSession(id)` (via `generateCsrfToken`) and measure elapsed time.
- **Expected result:** Resolves within a bounded time consistent with the NEW 8000ms cap (e.g. assert `elapsedMs < 9000`, replacing the old test's `elapsedMs < 2000` assertion, which was written against the old 500ms cap and would now correctly fail since the real wait is intentionally much longer).
- **Edge case:** Yes — this is the "genuinely broken Redis" boundary case, now at a larger bound.

---

## Integration Tests

### existingCprS1SuiteUnaffectedExceptTheOneDeclaredUpdate

- **Verifies:** AC2, AC3, AC5
- **Precondition:** `tests/check-cpr-s1-csrf-persist-race.js`'s AC4b test updated per the above.
- **Action:** Run `node tests/check-cpr-s1-csrf-persist-race.js`.
- **Expected result:** All tests pass, including the updated AC4b assertion. AC1, AC2/AC6 (rehydration), AC3 (no-adapter), and AC4a (rejecting write) all pass completely unchanged — this fix touches only the timeout constant's value and the one assertion that was bound to its old value.
- **Edge case:** No.

---

## NFR Tests

None beyond the AC-mapped tests above — this is a single-constant timing fix with no new performance/security/accessibility/audit surface of its own.

---

## Out of Scope for This Test Plan

- Actually reproducing a real Fly suspend/resume cycle against live infrastructure — not automatable; the closest practical automated proxy (injected write latency between the old and new bounds) is what AC1 uses instead, consistent with `cpr-s1`'s own established precedent.

---

## Test Gaps and Risks

None — all 5 ACs have automated coverage, either via a new test (AC1, AC4) or by explicit reference to `cpr-s1`'s own already-sufficient existing tests (AC2, AC3), re-run as a whole (AC5).
