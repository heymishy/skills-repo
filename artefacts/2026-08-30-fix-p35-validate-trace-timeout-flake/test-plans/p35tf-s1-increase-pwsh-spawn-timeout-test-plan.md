## Test Plan: Increase check-p3.5-validate-trace.js's pwsh spawn timeout

**Story reference:** artefacts/2026-08-30-fix-p35-validate-trace-timeout-flake/stories/p35tf-s1-increase-pwsh-spawn-timeout.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-30

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Both spawnSync calls reference one named timeout constant | 1 test | — | — | — | — | 🟢 |
| AC2 | Standalone run still passes all 5 tests unchanged | — | 1 run | — | — | — | 🟢 |
| AC3 | Two consecutive full-suite runs both pass cleanly | — | — | — | 1 manual verification run (×2) | 🔴 Untestable-by-nature (timing/load-dependent) | 🟡 |

---

## Coverage gaps

AC3 cannot be asserted as a deterministic pass/fail unit test — it is a probabilistic claim about behaviour under sustained system load, which cannot be reliably reproduced synthetically without materially changing what's being verified (e.g. artificially throttling the CPU). The verification approach is a manual/operator-run smoke check: run `node scripts/run-all-tests.js` twice in immediate succession and confirm `check-p3.5-validate-trace.js` passes cleanly both times. This is declared explicitly here rather than silently treated as "tested" — do not skip this manual step at DoR sign-off or post-merge.

---

## Test Data Strategy

**Source:** N/A — this story touches test infrastructure, not application data.
**PCI/sensitivity in scope:** No
**Availability:** N/A
**Owner:** Self-contained

### Gaps

None.

---

## Unit Tests

### edgeReTimeoutIsASingleNamedConstant

- **Verifies:** AC1
- **Precondition:** None.
- **Action:** Read `tests/check-p3.5-validate-trace.js`'s source; find both `cp.spawnSync('pwsh', ...)` call sites.
- **Expected result:** Both call sites reference the same named constant (not two separate literal `30000`/other numeric values); the constant's value is greater than the original `30000`.
- **Edge case:** No.

---

## Integration Tests

### standaloneRunUnaffected

- **Verifies:** AC2
- **Precondition:** `pwsh` available in the environment (already a precondition of the existing tests — they self-skip via `hasPwsh()` otherwise).
- **Action:** Run `node tests/check-p3.5-validate-trace.js` standalone.
- **Expected result:** `5 passed, 0 failed` — identical to pre-change behaviour.
- **Edge case:** No.

---

## NFR Tests

None beyond the AC-mapped tests above — this is a test-infrastructure timing fix with no new performance/security/accessibility/audit surface of its own.

---

## Out of Scope for This Test Plan

- Root-causing why `pwsh` cold-start is slow under sustained load — declared out of scope by the story itself.
- Synthetic load-injection testing to deterministically reproduce the original timeout — not justified by this bounded fix; the manual double-run smoke check (AC3) is the practical, declared verification method.

---

## Test Gaps and Risks

AC3's manual verification (🔴 Untestable-by-nature) is the one open item — must be run and its result recorded before DoR sign-off, per this story's own Definition of Ready Pre-check.
