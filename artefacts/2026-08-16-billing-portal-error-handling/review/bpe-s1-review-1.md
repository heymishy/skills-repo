# Review Report: Add error handling and a missing-customer guard to the Stripe Billing Portal redirect — Run 1

**Story reference:** artefacts/2026-08-16-billing-portal-error-handling/stories/bpe-s1-billing-portal-error-handling.md
**Date:** 2026-08-16
**Categories run:** C — AC quality / D — Completeness (short-track scope, per `skills/review/SKILL.md`'s "C and D only (short-track stories)" option — confirmed genuinely short-track: bounded to one function (`handleGetBillingPortal`) in one file (`routes/billing.js`), no new adapter, no change to any other handler's contract, root cause already confirmed live against staging per `artefacts/feedback/beta-001.md`)
**Outcome:** PASS

---

### Category C: AC quality

For each AC:
- AC1 (happy-path redirect, regression): Given/When/Then ✓ | Observable (302 status + Location header, createPortalSession called with right args) ✓ | Independently testable ✓ | Uses "is called"/"is", not "should" ✓
- AC2 (returnUrl contains /dashboard, regression): Given/When/Then ✓ | Observable (argument inspection) ✓ | Independently testable ✓ | No "should" ✓
- AC3 (no session → 302 to /, regression): Given/When/Then ✓ | Observable (302 + Location, Stripe not called) ✓ | Independently testable ✓ | No "should" ✓
- AC4 (missing customerId → guarded redirect, new): Given/When/Then ✓ | Observable (302 + specific Location, Stripe not called — the exact regression this story exists to fix, made explicit and testable) ✓ | Independently testable ✓ | No "should" ✓
- AC5 (Stripe throw caught → guarded redirect, new): Given/When/Then ✓ | Observable (302 + specific Location, no unhandled exception) ✓ | Independently testable ✓ | No "should" ✓

5 ACs (minimum 3 met). No HIGH findings (all in Given/When/Then, all ≥3 ACs, all independently testable, no "should" language).

**MEDIUM-adjacent observation (not scored as a finding):** AC4 and AC5 both assert on a specific `?error=<code>` redirect target rather than a fully rendered user-facing message — because no visible banner is being built in this story (explicitly out of scope, see story), "user-facing" here means "a normal navigation outcome instead of a crash," not "a message the user reads." This is appropriate given the story's own explicitly bounded scope, not a defect — the alternative (asserting on rendered banner text) would require building UI this story deliberately defers.

**AC quality score (1–5): 4** — well-formed, independently testable, no "should" language; one point held back for the same structurally-necessary reason as the `tmss-s1` precedent (AC4/AC5 are redirect-target-shaped rather than pure end-user-facing-content assertions, inherent to this story's intentionally bounded scope).

### Category D: Completeness

For each field against `.github/templates/story.md`:
- User story in As/Want/So format ✓
- Named persona — "tenant admin," matching the real user reported issue (billing management is an admin/owner action in this app) ✓
- Benefit linkage populated — explains the mechanism (a real beta user's reported defect, validated live against staging, root-caused to a specific line) and is explicit this is a short-track substitute for a formal benefit-metric artefact ✓
- Out of scope populated — 4 explicit exclusions, none blank or "N/A" ✓
- NFRs populated — Performance/Security/Accessibility/Audit all addressed, with reasoning given for each rather than left blank ✓
- Complexity rated — 1, with justification (single function, defensive-only change, no new adapter or external contract change) ✓
- Scope stability declared — Stable ✓

No HIGH or MEDIUM findings.

**Completeness score (1–5): 5** — every template field populated with real, specific content, directly traceable to `artefacts/feedback/beta-001.md`'s validated triage.

---

## Summary

**Total findings:** 0 HIGH, 0 MEDIUM (2 non-scored observations noted above)
**Outcome:** PASS — ready for `/test-plan`.
