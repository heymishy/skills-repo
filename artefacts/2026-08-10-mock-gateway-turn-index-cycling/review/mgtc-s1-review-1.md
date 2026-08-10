## Review: mgtc-s1 — The mock LLM gateway returns the identical response on every turn, blocking multi-turn skill progression in mock mode

**Story:** artefacts/2026-08-10-mock-gateway-turn-index-cycling/stories/mgtc-s1-turn-index-aware-mock-responses.md
**Reviewer:** Claude (agent), operator-directed — found via operator live staging validation, confirmed via direct source trace
**Date:** 2026-08-10

---

### Category A: Traceability

PASS. Cites the exact operator-reported symptom (stuck on 1 ideate lens type, "no way to proceed"), the exact code path (`mock-llm-gateway.js:265`'s missing turn-index parameter, `skill-turn-executor.js:611`/`652`'s unused `history` parameter), and correctly identifies why the already-DoR-ready `mds-s1` story cannot fix this on its own — a static fixture is static regardless of content richness. Honestly flags the clarify/estimate finding as a hypothesis (same root cause, likely but not proven) rather than overclaiming a second confirmed root cause.

### Category B: Scope discipline

PASS. Explicitly declines to write the actual multi-turn fixture content (left to `mds-s1` or a follow-up), explicitly declines to touch `scenarioName` resolution above the executor layer, and explicitly declines to independently chase down the clarify/estimate gating condition rather than assuming it's the same bug.

### Category C: AC quality

PASS. 5 ACs, Given/When/Then, each independently testable. AC2 (graceful degradation past the scripted sequence) and AC3 (100% backward compatibility for every existing fixture) are the two properties most at risk from a naive implementation, both explicitly guarded. AC5 protects the untouched real-provider branches.

### Category D: Completeness

PASS. NFRs correctly frame backward compatibility as a first-class concern given this touches a shared execution path used by every skill turn in the app — not just an afterthought.

### Category E: Architecture compliance

PASS. Correctly identifies that `history` is already in scope at both call sites, avoiding any new plumbing through the session/journey layer — the minimal-touchpoint fix, not a larger refactor. The opt-in `responses` array design (additive fixture field, not a breaking format change) matches this repo's established backward-compatibility conventions.

---

### Verdict

**PASS — 0 HIGH findings.** Precisely root-caused, correctly scoped as the upstream dependency `mds-s1` needs before its own diagram-variety content can be exercised end-to-end. Cleared to proceed to `/test-plan`.
