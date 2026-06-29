# Review: bee.3 — PostHog instrumentation

**Run:** 1
**Date:** 2026-06-29
**Reviewer:** /review skill (agent-auto)
**Categories:** A, B, C, D, E

---

## FINDINGS

### 1-M1 — MEDIUM — AC7 placement deferred to implementation time, making it untestable at DoR

**Location:** bee.3 AC7 — "This may fire on the journey initialisation page or be embedded in the first skill session response — the exact placement is confirmed at implementation time."

**Problem:** An AC that defers placement to implementation time cannot be independently verified at DoD. The test plan author cannot write a test for this AC, and the DoD reviewer cannot confirm AC7 is satisfied without first investigating how it was implemented. This is an ambiguity-at-definition defect.

**Recommended action:** Commit to a specific placement now. Recommended: "fires on the page or redirect response that follows a successful journey creation (i.e. the response to the POST that creates the journey, or the first GET to the new journey session page)." Align with the implementation path at DoR if the exact route is not yet known — add a DoR prerequisite: "Implementation team confirms exact journey creation response URL before DoR sign-off."

---

### 1-M2 — MEDIUM — Graceful degradation gap: posthog.capture() calls will throw ReferenceError when POSTHOG_KEY is unset

**Location:** bee.3 AC4 — "The navigation must not be blocked — if PostHog is unavailable, the CTA still navigates." — and bee.3 AC8 — "If POSTHOG_KEY is unset or an empty string, no PostHog snippet is injected."

**Problem:** If `POSTHOG_KEY` is unset, the PostHog CDN snippet is omitted (AC8). However, AC4's CTA handler calls `posthog.capture('cta_clicked')` and AC3 / AC6 call `posthog.capture(...)` on page load. With the snippet absent, `posthog` is `undefined` — calling `posthog.capture()` throws a `ReferenceError`. In some browsers this blocks navigation (AC4 would fail). This is a real runtime defect in the no-POSTHOG_KEY path that contradicts AC4 and AC8.

**Recommended action:** Add an explicit guard requirement: "All `posthog.capture()` and `posthog.identify()` calls in inline scripts must be wrapped in a `typeof posthog !== 'undefined'` guard, or the PostHog init snippet must include the standard PostHog stub (which queues calls before PostHog loads). The graceful degradation path (POSTHOG_KEY unset → no snippet) must not introduce any JavaScript errors on page load or CTA interaction." Add this to Architecture Constraints.

---

## SCORE

| Criterion | Score | Pass/Fail | Justification |
|-----------|-------|-----------|---------------|
| A — Traceability | 5 | PASS | M3, M4, M1 all named with mechanism sentences. Clean metric chain. |
| B — Scope integrity | 4 | PASS | Out-of-scope section covers 5 items. AC7 deferred placement is a minor scope discipline concern — not a scope addition, but an undefined boundary. |
| C — AC quality | 4 | PASS | 9 ACs, all Given/When/Then. No "should". 1-M1 (AC7 placement) and 1-M2 (ReferenceError gap) both addressable without story rework. |
| D — Completeness | 5 | PASS | All template fields populated. Named operator persona. Dependencies (bee.1, bee.2) declared. NFRs present and specific. |
| E — Architecture compliance | 4 | PASS | PostHog CDN-only constraint named. POSTHOG_KEY env var pattern named. ADR-011 and ADR-018 referenced. req.session.accessToken canonical noted. 1-M2 exposes a gap in the graceful degradation architecture constraint (not a guardrail violation — the intent is correct but the guard is not specified). |

---

## VERDICT

**PASS — Run 1**

0 HIGH, 2 MEDIUM (1-M1 — AC7 placement ambiguity; 1-M2 — graceful degradation ReferenceError gap). Both are addressable before DoR without story rework. 1-M2 in particular should be fixed: the Architecture Constraints field should explicitly require the `typeof posthog !== 'undefined'` guard pattern.
