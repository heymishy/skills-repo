## Definition of Ready: Add error handling and a missing-customer guard to the Stripe Billing Portal redirect

**Story reference:** artefacts/2026-08-16-billing-portal-error-handling/stories/bpe-s1-billing-portal-error-handling.md
**Test plan reference:** artefacts/2026-08-16-billing-portal-error-handling/test-plans/bpe-s1-test-plan.md
**Review artefact:** artefacts/2026-08-16-billing-portal-error-handling/review/bpe-s1-review-1.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-16

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "tenant admin" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 5/5 (AC1-AC2 share a happy-path test case; AC4 has 3 sub-tests) |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Short-track substitute metric named (confirmed production defect from real beta user), same pattern as `pcr-s1`/`tmss-s1` precedent |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review PASS, 0 HIGH, 0 MEDIUM |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged in /decisions) | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block is "None" — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Cites existing `products.js`/`billing.js` precedent for the error-redirect pattern; review ran C/D only (short-track), no Category E findings |
| H-E2E | CSS-layout-dependent AC gap check | ✅ | No AC typed CSS-layout-dependent (Step 3a scan, test plan) — not applicable |
| H-NFR | NFR profile exists or story has explicit "NFRs: None" | ✅ | `artefacts/2026-08-16-billing-portal-error-handling/nfr-profile.md` created |
| H-NFR2 | Compliance NFR with named clause has documented sign-off | ✅ | No compliance NFR named — not applicable |
| H-NFR3 | Data classification field in NFR profile not blank | ✅ | "Internal" |
| H-NFR-profile | NFR profile presence check | ✅ | Story NFR section has real content (not "None") → profile created and populated |
| H-GOV | Governance approval check | ✅ (N/A) | No `discovery.md` exists — short-track deliberately skips discovery. Treated as not-applicable per `pcr-s1`/`tmss-s1` precedent; recorded as an ASSUMPTION entry in `decisions.md` |
| H-ADAPTER | Injectable adapter wiring check | ✅ (N/A) | No new adapter (`setX()`) introduced by this story — reuses the existing D37-injectable `stripeClient` adapter unmodified |
| H-INF | Infra-plan gate check | ✅ (N/A) | `hasInfraTrack` not set |
| H-MIG | Migration-review gate check | ✅ (N/A) | `hasMigrationTrack` not set |

**Result: 15/15 hard blocks passed (4 not-applicable, explicitly recorded as such).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or explicitly "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — (0 MEDIUM findings) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases; agent may verify against wrong criteria | RISK-ACCEPTed — see `decisions.md`, 2026-08-16 entry (solo-operator repo, same rationale applied consistently, most recently by `tmss-s1`) |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | — (gap table is empty) | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Add error handling and a missing-customer guard to the Stripe Billing Portal redirect — artefacts/2026-08-16-billing-portal-error-handling/stories/bpe-s1-billing-portal-error-handling.md
Test plan: artefacts/2026-08-16-billing-portal-error-handling/test-plans/bpe-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Modify ONLY `handleGetBillingPortal` in `src/web-ui/routes/billing.js`.
  Do not touch `handlePostCheckout`, `handleGetBillingSuccess`,
  `handlePostStripeWebhook`, or `handleGetBillingPlanState` — their
  request/response contracts must remain byte-for-byte unchanged.
- Do not modify `src/web-ui/modules/stripe-client.js` — reuse
  `createPortalSession` exactly as it exists today.
- Do not modify `src/web-ui/routes/settings.js` — rendering the new
  `?error=` codes into a visible banner is explicitly out of scope for
  this story (see story's Out of Scope).
- New guard: if `req.session.stripeCustomerId` is falsy (after the
  existing AC2 auth guard has already passed), respond 302 to
  `/settings?error=no_billing_account` and never call
  `stripeClient.createPortalSession`. Log a structured warning first
  (`console.warn`, JSON, `{ event: 'billing_portal_no_customer_id', tenantId }`).
- New try/catch: wrap the existing `createPortalSession(...)` call (and its
  302 response) in a try/catch. On a caught throw, log a structured error
  (`console.error`, JSON, `{ event: 'billing_portal_error', tenantId,
  message: err.message }`) and respond 302 to
  `/settings?error=billing_unavailable`. Never include the raw error
  message or stack in the HTTP response itself — server log only.
- The existing happy-path behaviour (valid session + valid customerId →
  302 to the real portal URL) and the existing no-session guard (→ 302 to
  `/`) must remain byte-for-byte unchanged.
- Architecture standards: read `.github/architecture-guardrails.md` before
  implementing. Do not introduce patterns listed as anti-patterns or
  violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required — operator (Hamish King) requested and is directly reviewing this work in-session; low-risk, single-function defensive fix for a confirmed, already-triaged production defect.
