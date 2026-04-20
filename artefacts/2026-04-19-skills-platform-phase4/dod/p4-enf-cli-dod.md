# Definition of Done — p4-enf-cli

**Story:** p4-enf-cli — CLI Enforcement Adapter
**Epic:** E3 — Enforcement Runtime
**Feature:** 2026-04-19-skills-platform-phase4
**Completed:** 2026-04-20
**Commit:** ca00057

---

## AC Coverage

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | All 9 commands present (`init`, `fetch`, `pin`, `verify`, `workflow`, `advance`, `back`, `navigate`, `emitTrace`); each is a function | PASS | T1 ×11, T2 ×9 — 20 assertions passing |
| AC2 | `advance` to non-permitted state → structured error mentioning target, current state, and allowed list | PASS | T3a–T3d — 4 assertions passing |
| AC2 (success) | `advance` to permitted state → success, no error | PASS | T4a–T4c — 3 assertions passing |
| AC3 | `advance` with matching hash → result with current state (envelope built) | PASS | T5a–T5b — 2 assertions passing |
| AC3 (mismatch) | `advance` with hash mismatch → HASH_MISMATCH error, no envelope | PASS | T6a–T6c — 3 assertions passing |
| AC4 | `emitTrace` returns trace with all 6 required fields | PASS | T7 ×6 — 6 assertions passing |
| AC-ADR004 | No hardcoded `github.com/heymishy` URL in source | PASS | T8 — 1 assertion passing |
| AC-NFR1 | No `skipVerify`, `skip-verify`, `--no-verify`, or `force` bypass in source | PASS | T-NFR1a–T-NFR1d — 4 assertions passing |
| AC-NFR2 | No credentials (Bearer token, password, secret) in `emitTrace` output | PASS | T-NFR2a–T-NFR2c — 3 assertions passing |

All 9 ACs satisfied. All 46 test assertions passing (11 test IDs, 46 check points).

---

## Test Run Evidence

```
node tests/check-p4-enf-cli.js

[p4-enf-cli] Results: 46 passed, 0 failed
```

Full suite (`npm test`) — zero failures across all governance check scripts.

---

## Implementation Notes

**File created:** `src/enforcement/cli-adapter.js` (191 lines)

**Nine exports:** `init`, `fetch`, `pin`, `verify`, `workflow`, `back`, `navigate` are Mode 1 MVP stubs returning `{ status: 'ok', command: '<name>' }`. The two enforcement-critical commands are fully implemented:

**`advance({ current, next, declaration, govPackage, skillId, expectedHash })`:**
1. ADR-002 transition check — resolves `declaration.nodes.find(n => n.id === current).allowedTransitions`; if `next` not in list, returns `{ error: 'TRANSITION_NOT_PERMITTED', message: 'Transition to <next> not permitted from <current>. Allowed: <list>' }`.
2. C5 hash check — if `skillId` provided, calls `govPackage.verifyHash({ skillId, expected, actual })`; non-null result returns `{ error: 'HASH_MISMATCH', message: 'Hash mismatch for skill <id>: expected <x>, got <y>' }` with no envelope field.
3. `govPackage.advanceState({ current, next, declaration })` — returns new state object.

**`emitTrace({ skillId, skillHash, inputHash, outputRef, transitionTaken, surfaceType, timestamp, outputPath? })`:**
Assembles trace entry object with 6 required fields plus `skillId`. Optionally writes JSON to `outputPath`. Returns the entry. No credential fields included (MC-SEC-02).

**Architecture constraints met:**
- C5: hash check precedes envelope build; no `skipVerify`, `skip-verify`, `--no-verify`, `force` in source
- ADR-002: `advance` checks `allowedTransitions` directly from declaration before any govPackage call
- ADR-004: no hardcoded URLs — all config injected by caller
- MC-SEC-02: no Bearer tokens, passwords, or secrets in `emitTrace` output

**W2 (Spike B2 schema alignment) — Resolution:** `emitTrace` fields are identical to the governance-package `writeTrace` fields — same 6 required fields (`skillHash`, `inputHash`, `outputRef`, `transitionTaken`, `surfaceType`, `timestamp`). No schema delta required; Assumption A2 risk did not materialise.

**Deviations:** None. Implementation path `src/enforcement/cli-adapter.js` matches the test file hardcoded path. No files outside the DoR contract scope were modified.

---

## Metric Signals

**M1 (Distribution sync):** CLI adapter delivers all 9 Mode 1 commands, enabling Craig's surface class to enforce hash verification and state transitions without a persistent process. Distribution via CLI is now structurally enforced at the `advance` command boundary.

**M2 (Consumer confidence):** `advance` enforces ADR-002 (transition declarations) and C5 (hash verification) in a single synchronous function — the two governance controls that were violated in Phase 3 are now enforced at every CLI state transition.
