# Review Report: Multi-turn session persistence — Run 1

**Story reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.16-session-persistence.md
**Date:** 2026-05-02
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[16-M1]** [E — Architecture] — The Architecture Constraint assigns session lifecycle management to wuce.10 (ADR-009). But wuce.10's contract mandates that the COPILOT_HOME execution directory is deleted within 5 seconds of session end (wuce.10 AC3), and orphaned directories older than 24 hours are cleaned at startup (wuce.10 AC5). Session persistence requires retaining state — answered questions, partial artefact content, session ID binding, and question-completion count — for up to 24 hours across browser tabs and server restarts (wuce.16 AC1, AC4). These two contracts cannot be satisfied by the same storage layer: COPILOT_HOME is transient execution storage; session persistence needs durable session state storage. An implementing agent that conflates the two will violate either wuce.10's cleanup contract or wuce.16's 24-hour retention requirement.
  Fix: Add an Architecture Constraint: "Session persistence state (answered questions, partial artefact content, session ID to user binding, step counter) is stored in a durable layer separate from the transient COPILOT_HOME execution directory — the COPILOT_HOME directory is created per CLI invocation and cleaned up per wuce.10 AC3 independently of session persistence lifecycle; the durable session store (file system under a separate `sessions/` directory, or an in-memory store with explicit restart-loss acknowledgement) is owned by the session module but uses distinct storage from COPILOT_HOME."

---

## LOW findings — note for retrospective

None.

---

## Category Scores

| Category | Score | Pass/Fail | Notes |
|----------|-------|-----------|-------|
| A — Traceability | 5 | PASS | All references present. P2 linkage through abandonment reduction is well-framed: "Sessions that cannot be resumed are more likely to be abandoned than completed; resumable sessions remove a key drop-off cause." Causal mechanism from sessions to P2 rate is explicit. |
| B — Scope integrity | 5 | PASS | Cross-device sync, collaborative sessions, and session export all deferred. Cross-device deferral correctly identified (tied to HTTP session cookie from wuce.1 — device-bound by design in v1). |
| C — AC quality | 5 | PASS | 5 ACs in Given/When/Then, all testable. AC3 (403 on cross-user access) and AC4 (24-hour expiry with deletion) are security-focused and specific. AC5 (multi-session list with metadata) is precisely scoped. |
| D — Completeness | 4 | PASS | All template fields populated. Scope stability Unstable — appropriate given ACP multi-turn GA dependency. Complexity 3 is correct: cross-session persistence, security binding, and multi-session UX all add genuine complexity. Security NFR is the most comprehensive in the feature: lists all five security requirements explicitly. |
| E — Architecture | 3 | PASS | ADR-009 cited for wuce.10 ownership. Session ID requirements (≥128 bits, cryptographically random) are explicit. OAuth token exclusion from session state is explicit. ACP caveat present. MEDIUM on COPILOT_HOME vs durable store storage layer conflict (16-M1) — score 3 (issues identified, rework needed on Architecture Constraints but not on ACs themselves). |

---

## Summary

0 HIGH, 1 MEDIUM, 0 LOW.
**Outcome: PASS** — No HIGH blockers. The MEDIUM (16-M1) is a documentation gap in Architecture Constraints — the ACs themselves are correctly specified, but the implementing agent will encounter an irreconcilable constraint unless the storage layer distinction is made explicit. Straightforward to resolve: add one sentence to Architecture Constraints distinguishing durable session state from transient COPILOT_HOME storage.
