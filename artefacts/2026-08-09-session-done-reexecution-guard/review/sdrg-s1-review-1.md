## Review: sdrg-s1 — Guard the initial-turn auto-fire so viewing an already-completed session can never re-execute or re-mutate it

**Story:** artefacts/2026-08-09-session-done-reexecution-guard/stories/sdrg-s1-session-done-reexecution-guard.md
**Reviewer:** Claude (agent), operator-directed — found via live browser exploration of `rubber-duck-review-capture`'s hypothesis
**Date:** 2026-08-09

---

### Category A: Traceability

PASS. Benefit linkage traces to a directly observed, reproducible live symptom (a real kanban card's state changed from a GET-only page view, with a never-opened sibling card confirmed unchanged as a control) and names the exact two code locations responsible, each with the specific flawed invariant identified (`turns.length === 0` / `thread.children.length === 0` used as a "fresh session" proxy that is false whenever a session is done with an empty turns array).

### Category B: Scope discipline

PASS. Out of scope explicitly excludes the separately-reported SSE-after-resume symptom (correctly not assumed to share this root cause without further evidence), the leaked mock-fixture card's cleanup (a data action, not a code fix), and any change to session-restore/Redis-merge logic (this story guards the consequence, not every possible cause of the empty-turns-but-done shape — a reasonable scope boundary given the fix is defensive regardless of how that shape arises).

### Category C: AC quality

PASS. 5 ACs, each Given/When/Then, each independently testable. AC1/AC2 cover the security-relevant no-op guard on both the streaming and non-streaming endpoints (correctly recognizing these are two separate exploitable call sites, not one). AC3/AC5 are explicit regression guards ensuring the fix doesn't change behaviour for genuinely fresh/in-progress sessions — a good discipline given this is a guard-clause change to shared, high-traffic turn-handling code. AC4 correctly targets the client-side flag as a UX-layer improvement (fewer wasted requests) while AC1/AC2 remain the actual security backstop — the story does not conflate "hide it in the browser" with "actually fix it," which the Architecture Constraints section states explicitly.

### Category D: Completeness

PASS. NFRs correctly name the two distinct concerns (integrity/security — a read action must never cause a write side-effect; and cost — wasted LLM/mock-gateway spend), tying the cost concern back to this session's own earlier mock-gateway-cost finding rather than treating it as a new, disconnected observation. Complexity rated 2 with clear reasoning (small diff, but two independent call sites plus correct no-op response shape). Dependencies section is honest about NOT claiming to fix the operator's separate SSE report, which is the correct call given the mechanisms are related but not confirmed identical.

### Category E: Architecture compliance

PASS. No new adapter or D37 pattern needed — correctly identified as a guard-clause fix, not new infrastructure. The Architecture Constraints section explicitly requires that the no-op path still emits a well-formed terminal SSE event (not silence), which correctly anticipates a real regression risk (client-side code awaiting a response that never comes) that a naive "just return early" fix could introduce.

---

### Verdict

**PASS — 0 HIGH findings.** Well-scoped, security-relevant short-track fix with a root cause independently confirmed via direct code reading (not just inference from the observed symptom) at three call sites (client auto-fire, streaming handler, non-streaming handler). The explicit regression-guard ACs (AC3/AC5) and the refusal to over-claim resolution of the separate SSE-after-resume report are both good discipline for a fix touching shared turn-handling code. Cleared to proceed to `/test-plan`.
