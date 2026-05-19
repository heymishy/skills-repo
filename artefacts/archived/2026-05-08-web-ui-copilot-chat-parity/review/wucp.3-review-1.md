# Review Report — wucp.3: Tool execution loop

**Story:** Tool execution loop — read-only file access for mid-session artefact reads
**Feature:** 2026-05-08-web-ui-copilot-chat-parity
**Run:** 1 (initial)
**Review date:** 2026-05-13
**Reviewer:** Automated (/review skill)
**Categories run:** A (Traceability), B (Scope discipline), C (AC quality), D (Completeness), E (Architecture compliance)

---

## FINDINGS

### 1-M1 — MEDIUM: AC8 conflates HTTP 400 (route-level) with tool_result error injection (in-loop)

**Location:** AC8, last sentence: "A dedicated test asserts both the 400 response and that no file was read."

**Issue:** AC8 requires two outcomes from a path traversal attempt: (a) the request is rejected with HTTP 400, and (b) a `tool_result` error turn is injected informing the model the path was out of bounds. These are mutually exclusive at runtime. The tool executor fires *inside* an already-accepted POST /api/session/:id/turn — it is not a route handler receiving a direct HTTP request with a path in the body. If the outer handler returns HTTP 400 in response to path traversal detected mid-turn, no `tool_result` turn reaches the model. If an error `tool_result` turn is injected, the outer response code is 200 (turn processed, error content returned as tool result). You cannot simultaneously return 400 AND inject a tool_result turn in the same flow.

ADR-023 says "Return HTTP 400" for route handlers where the path comes from request data. Here the path originates from model output, not request data — the appropriate pattern is: inject an error `tool_result` turn (so the model receives bounded feedback) and log the attempt, rather than aborting the outer HTTP request with 400.

**Recommended action:** Clarify AC8 before dispatch. Recommended resolution: remove the "HTTP 400" requirement from AC8; keep the "tool_result error turn injected" requirement. Update the test to assert the error turn content and zero file reads. If the DoR contract author specifically wants the outer handler to return 400, they must explain how the tool_result turn is also delivered, or drop one of the two requirements. Either outcome is acceptable — the ambiguity must be resolved.

---

### 1-L1 — LOW: Scope stability field is stale

**Location:** Complexity Rating section — "Scope stability: Unstable until wucp.0 spike result is known"

**Issue:** wucp.0 completed 2026-05-13 with Outcome A (100% emission rate, GO). The condition triggering Unstable has been met. The field still reads Unstable. This does not affect testability or scope — it is a documentation accuracy issue.

**Recommended action:** Update to "Stable — wucp.0 spike confirmed GO (Outcome A, 2026-05-13)" before dispatch. This can be done at DoR time.

---

## SCORES

| Criterion | Score | Pass/Fail | Justification |
|-----------|-------|-----------|---------------|
| Traceability (A) | 5 | PASS | Epic, discovery, and benefit-metric all referenced; benefit linkage names M1/M2/M3/MM1/MM2 with a mechanism sentence |
| Scope integrity (B) | 5 | PASS | Out-of-scope section names four distinct excluded behaviours; all align with epic out-of-scope; no epic exclusions are accidentally implemented |
| AC quality (C) | 4 | PASS | 9 ACs all in Given/When/Then; observable behaviours; independently testable. Minor: AC8 ambiguity (HTTP 400 vs tool_result injection — see 1-M1 finding) deducts one point |
| Completeness (D) | 4 | PASS | All template fields populated; named persona; DoR PROCEED-BLOCKED condition stated explicitly and now satisfied. Minor deduction for stale scope stability field (1-L1) |
| Architecture compliance (E) | 5 | PASS | ADR-023 (path traversal) and D37 (injectable adapter, throw-on-unwired-default) explicitly cited in Architecture Constraints and wired into specific ACs (AC7, AC8); ADR-011 (artefact-first) satisfied by this story being the artefact; zero external npm deps stated; no anti-patterns triggered |

---

## VERDICT

**Review PASSED ✅ — Run 1**

0 HIGH findings | 1 MEDIUM (1-M1 — must be resolved before dispatch, not before test plan) | 1 LOW (1-L1 — documentation only)

The MEDIUM finding (AC8 ambiguity) does not block /test-plan — it must be resolved before the DoR is signed off and the story is dispatched. The test plan should write tests for the correct interpretation of AC8 (tool_result error injection only); the DoR pass confirms which interpretation was chosen and the AC is updated accordingly.

Ready to run /test-plan for wucp.3.
