# Epic: Beta Entry Surface

**Feature:** 2026-06-29-beta-entry-experience
**Epic slug:** bee-entry-surface
**Slicing strategy:** User journey — stories follow the user's chronological path: land (bee.1) → authenticate and see guidance (bee.2) → be measured (bee.3)
**Oversight level:** Low
**Status:** Not started

---

## What this epic delivers

A complete beta entry experience for external users arriving at `skills-framework.fly.dev` for the first time: a public landing page that explains the product before the GitHub OAuth redirect, a first-run empty-state after login that guides the user to their first skill session, and PostHog instrumentation that gives Hamish visibility into who signed up, from which channel, and whether they activated.

---

## Stories

| Story | Name | Metric linkage | Complexity |
|-------|------|----------------|------------|
| bee.1 | Public landing page | M3 (conversion rate), M1 (entry point) | 1 |
| bee.2 | First-run empty-state experience | M1 (activation), M2 (second tenant enabler) | 1 |
| bee.3 | PostHog instrumentation | M3 (measurement), M4 (referral attribution), M1 (measurement) | 2 |

---

## Architecture guardrails checked

- ADR-011: Story artefacts written before any src/ implementation ✅
- ADR-018: E2E tests in `tests/e2e/` using Playwright if browser-level AC verification is required
- D37: Injectable adapters — default stubs must throw; production wiring is a named story task
- Node.js CommonJS, no Express, zero npm deps
- Path traversal guard: any HTML served from disk must use a hardcoded path
- `req.session.accessToken` is the canonical session token field

---

## Out of scope for this epic

- Self-serve signup or waitlist
- Profile page or account management
- PostHog custom dashboards, cohort analysis, server-side SDK
- Interactive onboarding tutorial
- Organisation-based onboarding wizard
- Journey list tenant filter (Group 2)
