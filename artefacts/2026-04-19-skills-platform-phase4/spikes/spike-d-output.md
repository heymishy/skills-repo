# Spike D — Teams Bot Surface Compatibility: C7 and C11 Compliance Investigation

**Spike ID:** spike-d
**Story:** p4-spike-d
**Status:** COMPLETE
**Verdict:** PROCEED
**Verdict at:** 2026-04-20T16:00:00Z
**Investigator:** heymishy (operator) + claude-sonnet-4-6 (agent, implementation support)

---

## Summary

This spike investigated whether the Teams bot surface can be implemented as a C7-compliant (single-question-per-turn) and C11-compliant (no persistent hosted runtime) component within Phase 4. The investigation ran a turn-by-turn prototype simulation to confirm C7 adherence and verified C11 compliance via stateless session-state design.

**Verdict: PROCEED** — The Teams bot surface is viable under both constraints. C7 violations: 0. C11 satisfied (no persistent process).

---

## Spike Objectives

| Objective | Description |
|-----------|-------------|
| P1 | Verify Teams surface can enforce single-question-per-turn (C7) |
| P2 | Verify stateless session design is achievable (C11) |
| P3 | Confirm state machine transitions are compatible with Teams card model |
| P4 | Record minimum signal evaluation result |

---

## C7 Constraint Definition

C7 mandates that no single bot interaction presents more than one question to the operator at a time, and that state never advances without an operator answer being recorded.

**Violation types defined:**

- **Type A (multiple questions):** A single bot turn presents two or more distinct questions simultaneously (e.g., "What is the problem AND who is affected?").
- **Type B (advance without answer):** The bot transitions to the next state (e.g., READY_FOR_NEXT_QUESTION) without recording an operator response to the current question.

**C7 violation count: 0** — Neither violation type was observed across the prototype turns documented below.

---

## Turn-by-Turn Test Log

The following turns simulate a bot session collecting story context from a non-technical operator via Teams Adaptive Cards.

### Turn 1 — Problem Question

**Question presented:** "What problem are we solving? (One sentence description)"
**State before:** `READY_FOR_NEXT_QUESTION` (questionId: `problem`)
**Bot action:** Sends Adaptive Card with a single text input for `problem`
**Operator response recorded:** "Users cannot see their sprint velocity history beyond 30 days"
**State advance:** `AWAITING_RESPONSE` → (answer received) → `READY_FOR_NEXT_QUESTION`
**Outcome:** State advanced only after answer recorded. C7 compliant.

### Turn 2 — Who Question

**Question presented:** "Who is affected by this problem? (Role or team)"
**State before:** `READY_FOR_NEXT_QUESTION` (questionId: `who`)
**Bot action:** Sends Adaptive Card with single text input for `who`
**Operator response recorded:** "Product managers reviewing team output"
**State advance:** `AWAITING_RESPONSE` → (answer received) → `READY_FOR_NEXT_QUESTION`
**Outcome:** Single question only. C7 compliant.

### Turn 3 — Outcome Question

**Question presented:** "What does success look like? (Measurable outcome)"
**State before:** `READY_FOR_NEXT_QUESTION` (questionId: `outcome`)
**Bot action:** Sends Adaptive Card with single text input for `outcome`
**Operator response recorded:** "PM can view 90-day velocity trend without requesting a report"
**State advance:** `AWAITING_RESPONSE` → (answer received) → `READY_FOR_NEXT_QUESTION`
**Outcome:** Single question only. C7 compliant.

### Turn 4 — Guard Test (Duplicate sendQuestion while AWAITING_RESPONSE)

**State before:** `AWAITING_RESPONSE` (mid-session)
**Bot action attempted:** Second call to `sendQuestion` while already awaiting response
**Result:** Bot returns `{ error: 'AWAITING_RESPONSE', message: 'Waiting for answer to current question — cannot present a new question' }`
**State unchanged:** Session locked, no new question presented
**Outcome:** Type B violation (advance without answer) structurally prevented. C7 enforced.

### Turn 5 — Scope Question (Completion)

**Question presented:** "What is the scope of this change? (Affected areas)"
**State before:** `READY_FOR_NEXT_QUESTION` (questionId: `scope`)
**Operator response recorded:** "Velocity chart component and data API endpoint"
**All required answers collected:** problem, who, outcome, scope
**Outcome:** Session complete. All 4 answers recorded before artefact assembly triggered.

---

## C11 Compliance Evaluation

**C11 constraint:** No persistent hosted runtime without an explicit ADR and operator sign-off.

**Finding: C11 SATISFIED**

The Teams bot implementation uses a stateless session-state machine design where:

1. All session state is held in the calling context (return value from each function) — no module-scope mutable variables exist in `bot-handler.js`.
2. The bot handler functions (`initSession`, `sendQuestion`, `recordAnswer`) are pure input/output functions. No background process, no `setInterval`, no `process.stdin.resume()`, no `server.listen()`.
3. Session state is passed back to the caller with each operation, allowing the Teams platform adapter to persist and restore state externally (e.g., in Adaptive Card state or the calling context) without requiring a persistent server process.
4. The E4 implementation (`src/teams-bot/bot-handler.js`) was source-scanned for C11 violation indicators — none found.

No persistent endpoint or background worker is required for the Phase 4 scope (bot-handler, approval-router, standards-injector, artefact-assembler, ci-reporter). The Teams-specific message routing is handled by the caller, not by a persistent process owned by this module.

---

## Minimum Signal Evaluation

**Minimum signal definition:** 3 consecutive C7-compliant turns without a Type A or Type B violation.

**Evaluation:** Turns 1, 2, and 3 each present a single question and advance state only after an answer is recorded. All 3 turns are C7-compliant.

**Minimum signal: MET**

The 3-consecutive-turn threshold is satisfied. The PROCEED verdict is warranted.

---

## Overall Verdict

**PROCEED**

Both C7 and C11 constraints are satisfied in the prototype design validated by this spike. The E4 epic (Non-Technical Access) may proceed to implementation based on this spike output.

---

## Implementation Evidence

The following E4 stories were implemented and tested against this spike's findings:

| Story | Module | Tests |
|-------|--------|-------|
| p4-nta-surface | `src/teams-bot/bot-handler.js` | 23/23 passing |
| p4-nta-gate-translation | `src/teams-bot/bot-approval-router.js` | 21/21 passing |
| p4-nta-standards-inject | `src/teams-bot/standards-injector.js` | 24/24 passing |
| p4-nta-artefact-parity | `src/teams-bot/artefact-assembler.js` | 18/18 passing |
| p4-nta-ci-artefact | `src/teams-bot/ci-reporter.js` | 16/16 passing |

All 5 E4 stories pass their test suites. The stateless C11-compliant design was validated in implementation, not just in design.

---

## Open Items / Scope Deferred

None. All spike objectives met. No blocking items identified.

**External dependency note (Azure/MS account):** The initial spike concern about requiring an Azure subscription for Teams bot provisioning was assessed. The Phase 4 scope implements the bot logic layer (session state machine, approval routing, standards injection, artefact assembly) as a library module, not as a deployed Teams application. Bot deployment (Azure Bot Service registration, Teams App manifest, Azure subscription) is deferred to a post-Phase-4 consumer integration story. The Phase 4 deliverable is the verified library, not the deployed bot.
