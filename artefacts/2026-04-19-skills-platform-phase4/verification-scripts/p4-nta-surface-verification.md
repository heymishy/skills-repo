# Verification Script: p4-nta-surface

**Story:** p4-nta-surface — Teams bot runtime C11-compliant implementation
**Test file:** `tests/check-p4-nta-surface.js`

## Pre-conditions

- Node.js ≥ 18 available
- `src/teams-bot/bot-handler.js` implemented
- Run from repository root

## Commands

```bash
node tests/check-p4-nta-surface.js
```

## Expected output

```
[p4-nta-surface] T1 — module exists and exports state machine functions
  ✓ T1a: src/teams-bot/bot-handler.js exists
  ✓ T1b: module loads without error
  ✓ T1c: exports initSession as function
  ✓ T1d: exports sendQuestion as function
  ✓ T1e: exports recordAnswer as function

[p4-nta-surface] T2 — initSession returns AWAITING_RESPONSE
  ✓ T2a: result is not null
  ✓ T2b: result.status is "AWAITING_RESPONSE"
  ✓ T2c: result has questionId

[p4-nta-surface] T3 — sendQuestion when AWAITING_RESPONSE returns error
  ✓ T3: second question rejected with AWAITING_RESPONSE error

[p4-nta-surface] T4 — recordAnswer transitions to READY_FOR_NEXT_QUESTION
  ✓ T4: status transitions to READY_FOR_NEXT_QUESTION

[p4-nta-surface] T5 — recordAnswer stores the answer
  ✓ T5: recorded answer present in state

[p4-nta-surface] T6 — no top-level mutable session state (C11)
  ✓ T6: no module-scope session/state variable

[p4-nta-surface] T7 — no persistent process patterns (C11)
  ✓ T7a: no setInterval
  ✓ T7b: no server.listen
  ✓ T7c: no process.stdin.resume

[p4-nta-surface] T8 — no hardcoded config (ADR-004)
  ✓ T8: no hardcoded tenant/channel IDs

[p4-nta-surface] T-NFR1 — no credentials in source (MC-SEC-02)
  ✓ T-NFR1a: no Bearer token
  ✓ T-NFR1b: no password literal
  ✓ T-NFR1c: no secret literal

[p4-nta-surface] T-NFR2 — state machine returns structured objects
  ✓ T-NFR2a: initSession returns plain object
  ✓ T-NFR2b: recordAnswer returns plain object

[p4-nta-surface] Results: N passed, 0 failed
```

## AC coverage

| AC | Tests |
|----|-------|
| AC1 | T2, T3 |
| AC2 | T4, T5 |
| AC3 | T6, T7 |
| AC4 | T8, T-NFR1 |
