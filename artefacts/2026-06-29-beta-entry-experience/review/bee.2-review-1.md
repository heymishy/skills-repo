# Review: bee.2 — First-run empty-state experience

**Run:** 1
**Date:** 2026-06-29
**Reviewer:** /review skill (agent-auto)
**Categories:** A, B, C, D, E

---

## FINDINGS

### 1-M1 — MEDIUM — AC3 "journey list as before" is not independently testable

**Location:** bee.2 AC3 — "Then the response HTML contains the journey list as before — no empty-state content is shown, and existing journey display behaviour is fully preserved."

**Problem:** "As before" and "fully preserved" are not independently testable. A test verifying AC3 needs a concrete baseline assertion — at minimum, that the HTML contains a journey card element for each journey returned by `listJourneys()`. Without this, two engineers write different tests.

**Recommended action:** Add a specific assertion: "Then the response HTML contains one journey card element for each journey returned by `listJourneys()`, the empty-state block is absent, and the response HTTP status is 200."

---

### 1-M2 — MEDIUM — AC4 describes internal implementation approach rather than observable behaviour

**Location:** bee.2 AC4 — "Then the decision is made server-side by checking the result of `listJourneys()` before the HTML response is written. No client-side JavaScript detection is required."

**Problem:** "The decision is made server-side" is an internal implementation property, not externally observable behaviour. A black-box test runner cannot distinguish server-side from client-side rendering by examining the HTTP response alone (without disabling JS). The intent (correct state on first response, no JS required) is valid but the AC is written as an implementation prescription.

**Recommended action:** Reframe as observable: "Then the HTML response body contains the correct state (empty-state or journey list) on first HTTP response, without requiring JavaScript execution. Verification: the correct content is present when the response body is inspected directly."

---

### 1-M3 — MEDIUM — AC5 "existing error-handling behaviour" is ambiguous

**Location:** bee.2 AC5 — "it renders an error page or falls back to the existing error-handling behaviour for a failed journey list load."

**Problem:** "Existing error-handling behaviour" is not specified anywhere in the artefact. If `listJourneys()` throws today and there is no specific error handler, the fallback is a 500 or an unhandled exception. The AC should name a concrete expected outcome.

**Recommended action:** Specify the expected behaviour: "Then the server responds with an error page (HTTP 500 or the application's standard error format) and the empty-state block is not rendered. The `[journey-store]` error pattern is logged to console."

---

## SCORE

| Criterion | Score | Pass/Fail | Justification |
|-----------|-------|-----------|---------------|
| A — Traceability | 4 | PASS | M1 and M2 linkage present with mechanism sentences. Indirect discovery artefact reference via feature slug. No broken chain. |
| B — Scope integrity | 5 | PASS | Out-of-scope section well-populated. bee.1 dependency correctly declared. Nothing outside discovery MVP scope. |
| C — AC quality | 3 | PASS | 5 ACs in Given/When/Then format. Three MEDIUM findings (1-M1, 1-M2, 1-M3) all addressable without story rework. Score 3 — at threshold. |
| D — Completeness | 5 | PASS | All template fields populated. Named persona. Dependencies declared. NFRs present. Architecture constraints populated. |
| E — Architecture compliance | 4 | PASS | ADR-011 referenced. req.session.accessToken noted. D37 handling noted conditionally ("if listJourneys() does not yet exist as an injectable") — acceptable flag; will be confirmed at DoR. |

---

## VERDICT

**PASS — Run 1**

0 HIGH, 3 MEDIUM (1-M1, 1-M2, 1-M3 — all AC testability gaps). All three are wording issues that can be tightened before DoR without story rework. Proceed to /test-plan with the understanding that the test plan author should use the recommended-action wording above as the operative definition for each affected AC.
