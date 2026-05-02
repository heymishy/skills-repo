# Review Report: Multi-turn session persistence — Run 2

**Story reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.16-session-persistence.md
**Date:** 2026-05-02
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Re-review scope:** 16-M1 resolution only — all other category scores carry forward from Run 1
**Outcome:** PASS

---

## Re-review: 16-M1 — COPILOT_HOME vs durable session state storage irreconcilable

**Resolution:** A Storage layer distinction has been added to Architecture Constraints. It names the two layers explicitly: `COPILOT_HOME` is ephemeral (created per subprocess execution, deleted on subprocess exit per wuce.10 AC3); application-layer session state (conversation history, partial artefact draft, question index, user-to-session binding) is persisted to a separate named durable server-side store. The 24-hour retention window applies only to the durable store. v1 durable store is named: file system `sessions/` directory, or in-memory with acknowledged restart-loss. ACP multi-turn state is the preferred GA path.

**Assessment:** 16-M1 is resolved. The two storage lifecycles are now independently specified and cannot be conflated by an implementing agent. The constraint satisfies both requirements simultaneously: wuce.10 AC3 (5-second COPILOT_HOME cleanup) and wuce.16 AC4 (24-hour session retention) are no longer operating on the same storage layer. The in-memory fallback with restart-loss acknowledgement is appropriate as a v1 option — it is honest about its limitations without blocking the coding agent.

**Carry-forward scores from Run 1:**
- A — Traceability: 5 / PASS
- B — Scope integrity: 5 / PASS
- C — AC quality: 5 / PASS
- D — Completeness: 4 / PASS

**Revised E — Architecture: 5 / PASS** — 16-M1 resolved; all architecture constraints now internally consistent.

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

None.

---

## Category Scores

| Category | Score | Pass/Fail | Notes |
|----------|-------|-----------|-------|
| A — Traceability | 5 | PASS | Carried from Run 1. |
| B — Scope integrity | 5 | PASS | Carried from Run 1. |
| C — AC quality | 5 | PASS | Carried from Run 1. |
| D — Completeness | 4 | PASS | Carried from Run 1. |
| E — Architecture | 5 | PASS | Storage layer distinction resolves 16-M1; COPILOT_HOME and durable store lifecycles are now independently specified. |

---

## Summary

0 HIGH, 0 MEDIUM, 0 LOW.
**Outcome: PASS** — 16-M1 resolved by naming and separating the two storage layers. wuce.16 is clean and ready for /test-plan.
