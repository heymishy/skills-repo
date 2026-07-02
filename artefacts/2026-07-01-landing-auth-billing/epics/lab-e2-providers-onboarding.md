# Epic 2: Additional Providers + Onboarding

**Feature:** 2026-07-01-landing-auth-billing
**Epic slug:** lab-e2-providers-onboarding
**Slicing strategy:** Risk-first — Epic 2 begins after the spike result is implemented (lab-s1.3 complete). Google OAuth is lower complexity than email/password and is delivered first. The /welcome onboarding flow is last in this epic because it needs to redirect to plan selection, which requires Stripe Checkout from Epic 3 to be in place — the onboarding story defines the redirect target but the full happy path is testable only after Epic 3 stories are complete.
**Architecture guardrails:** Checked against `.github/architecture-guardrails.md` 2026-07-01. Constraints: CJS-only; ADR-011 (Artefact-first); D37 (Injectable adapter rule); `rotateSessionId` mandatory on every provider login (CLAUDE.md sec-perf); ADR-018 (Playwright for browser-facing ACs). No regulated constraints.
**Human oversight level:** High (solo operator — W4 risk-accepted)
**Status:** Not started

---

## Rationale for grouping

Epic 2 adds the two additional auth providers specified in the discovery MVP scope (Google OAuth, email/password) and the post-auth onboarding flow (/welcome). All three stories depend on the provider registry established in lab-s1.3. The /welcome story is the joining point between auth and billing — it detects first login and redirects to plan selection.

---

## Stories

| Slug | Title | Dependency | Metric |
|------|-------|------------|--------|
| lab-s2.1 | Google OAuth — second auth provider | lab-s1.3 | M1 |
| lab-s2.2 | Email/password — third auth provider | lab-s1.3 | M1 |
| lab-s2.3 | /welcome onboarding — first-login detection + plan selection redirect | lab-s1.3, lab-s3.2 (checkout URL) | M1, M3, M4 |

---

## Exit criteria

Epic 2 is complete when:
1. A user can sign up with GitHub, Google, or email/password and reach `/dashboard`
2. First-time login is detected and the user is redirected to `/welcome`
3. `/welcome` presents a plan selection CTA that initiates Stripe Checkout
4. All three providers rotate session IDs after login (sec-perf, verified by test)
