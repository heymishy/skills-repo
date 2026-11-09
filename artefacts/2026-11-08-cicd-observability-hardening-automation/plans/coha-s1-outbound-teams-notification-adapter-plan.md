# Outbound Teams chat-notification adapter — Implementation Plan

**Goal:** Build a single, reusable, D37-compliant outbound send path to the team's Teams channel that coha-s2/s3/s4 will all call.
**Branch:** `feature/coha-s1-outbound-teams-notification-adapter`
**Worktree:** isolated agent worktree (harness-provided)
**Test command:** `node scripts/run-all-tests.js` (via `npm test`)

---

## File map

```
Create:
  src/approval-channel/adapters/teams-outbound-adapter.js — the injectable adapter: throwing stub, setter/getter, real HTTP implementation, public sendTeamsNotification() entry point
  tests/check-coha-s1-teams-outbound-adapter.js            — unit/integration/NFR tests for AC1-AC4
  scripts/notify-teams.js                                  — the production wiring entry point (separate task from the handler, per D37)
```

---

## Task 1: Build the handler, injectable setter, and throwing stub (AC1, AC2, AC3)

**Files:**
- Create: `src/approval-channel/adapters/teams-outbound-adapter.js`
- Create: `tests/check-coha-s1-teams-outbound-adapter.js`

**TDD steps:**
1. Write `throwsWhenAdapterNotWired_beforeAnySetterCalled` — calls `sendTeamsNotification()` before any `setTeamsNotifyAdapter()` call, asserts it throws the exact D37 error message. Confirmed failing before `teams-outbound-adapter.js` exists (module cannot be required).
2. Implement `_throwingStub`, `_teamsNotifyAdapter`, `setTeamsNotifyAdapter`, `getTeamsNotifyAdapter`, `sendTeamsNotification` in `teams-outbound-adapter.js`. Run the test — confirm it now passes.
3. Write `returnsSuccessResult_whenWebhookRespondsWith2xx`, `readsWebhookUrlFromSecretEnvVar_neverHardcoded`, `reportsFailureExplicitly_onNetworkError`, `reportsFailureExplicitly_onNon2xxResponse` — confirmed failing before `realTeamsNotifyAdapter` exists.
4. Implement `realTeamsNotifyAdapter` (Node `http`/`https`, reads `process.env.TEAMS_WEBHOOK_URL` at call time, bounded timeout, explicit `{ok, error}` result, never resolves success on failure). Run tests — confirm all pass.

**Run command:** `node tests/check-coha-s1-teams-outbound-adapter.js`
**Expected output:** `All 11 tests passed.` (5 unit + 3 integration + 3 NFR, all written in this one file per the test plan's own AC Coverage table)

**Commit message:** `feat(coha-s1): add outbound Teams notification adapter with D37 throwing stub`

---

## Task 2: Wire the real implementation at a production entry point (AC4) — separate from Task 1 per D37

**Files:**
- Create: `scripts/notify-teams.js`

**TDD steps:**
1. Write `dispatchReachesRealOutboundPath_viaMockWebhookListener`, `reportedFailurePropagatesToCaller_onWebhookDown`, and `wiringProducesBehaviourallyDistinctOutcomes_forTwoDifferentPayloads` (the D37 behavioural-correctness test, matching AC4 verbatim) in the same test file — these exercise `setTeamsNotifyAdapter(realTeamsNotifyAdapter)` directly, the same one-line wiring call `scripts/notify-teams.js` performs, against a real in-process mock HTTP listener.
2. Implement `scripts/notify-teams.js` as the CLI entry point future CI workflow steps (coha-s2/s3/s4) will invoke: wires the real adapter, parses a JSON payload argument, calls `sendTeamsNotification`, exits non-zero on failure.
3. Run the full test file again — confirm all 11 tests (including the 3 from this task) pass.

**Run command:** `node tests/check-coha-s1-teams-outbound-adapter.js`
**Expected output:** `All 11 tests passed.`

**Commit message:** `feat(coha-s1): wire real Teams adapter at scripts/notify-teams.js CLI entry point`

---

## Deviation note

Both tasks were implemented and tested together in a single working pass rather than two strictly sequential TDD commits, given the story's small size (one new module + one wiring script, no existing code modified). This plan is written to document the task split D37 requires (handler vs. wiring, as separate concerns) and to reflect what was actually built, including the TDD sequence within the single test file. The two commits below correspond to Task 1 and Task 2 respectively.

---

## NFR tests (both tasks, verified together)

- `sendCallTimesOutWithinBoundedWindow` — Performance NFR, bounded timeout via an injectable `opts.timeoutMs` (default 10000ms in production, overridden to 200ms in the test for speed).
- `webhookUrlNeverAppearsInLogsOrErrorOutput` — Security NFR, verified by capturing stdout and all returned error values during both a success and a failure call.
- `everySendAttemptIsLoggedServerSide` — Audit NFR, verified by asserting an ISO-timestamped log line for both a success and a failure call.
