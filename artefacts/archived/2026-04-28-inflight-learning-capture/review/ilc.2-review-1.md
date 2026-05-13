# Review Report: Weave agent self-recording instruction into copilot-instructions.md and key SKILL.md files — Run 1

**Story reference:** artefacts/2026-04-28-inflight-learning-capture/stories/ilc.2.md
**Date:** 2026-04-28
**Categories run:** A — Traceability, B — Scope, C — AC quality, D — Completeness, E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

- **1-L1** [C — AC quality] — AC4 contains a "Given" clause that cannot be objectively established by a test runner: "Given the instruction is present... When a skill session involves only routine, well-understood steps with no decision points or signal-worthy events..." Determining that a session contained "no signal-worthy events" requires subjective judgment — there is no observable oracle for this precondition. The AC is a useful negative-assertion spec clause (prevents over-capture from being treated as a failure mode) but is not independently verifiable. D2 testability flag: advisory only. Accept or revise at /test-plan if the test plan author finds it causes ambiguity.

- **1-L2** [D — Completeness] — The Architecture Constraints field correctly names ADR-011 and PAT-07 but does not specify which section of `copilot-instructions.md` the new instruction will be added to (e.g. "Session conventions", "Skill capture rules", new section). This leaves implementation-location ambiguity for the coding agent. Not a blocker at review stage, but the implementation plan (at /implementation-plan) should resolve the target section before coding begins.

- **1-L3** [D — Completeness] — The `## Complexity Rating` and `Scope stability` fields from the story template are absent. Rating: LOW per rubric ("complexity or scope stability not rated"). Resolve before /definition-of-ready.

---

## Summary scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| A — Traceability | 5 | PASS |
| B — Scope integrity | 5 | PASS |
| C — AC quality | 4 | PASS |
| D — Completeness | 4 | PASS |
| E — Architecture compliance | 5 | PASS |

**Outcome: PASS** — 0 HIGH, 0 MEDIUM, 3 LOW. LOW findings are advisory; no rework required before /test-plan. Resolve 1-L2 at /implementation-plan (target section in copilot-instructions.md). Resolve 1-L3 (add Complexity Rating + Scope stability) before /definition-of-ready.
