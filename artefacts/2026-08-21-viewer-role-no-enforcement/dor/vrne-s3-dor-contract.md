# Contract Proposal: Wire the viewer-write-block gate to Credits/billing routes

**Story reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s3-credits-billing.md`
**Date:** 2026-08-22

## What will be built

`src/web-ui/routes/billing.js` updated to call `requireNonViewer` (from `vrne-s1`) at the single `POST /billing/checkout` call site, immediately after the existing `authGuard`/session-presence check and before the Stripe Checkout session-creation call.

## What will NOT be built

- No changes to `/webhook/stripe` — explicitly confirmed out of scope (no session/role concept exists on that route).
- No changes to Stripe's own SDK calls, credit-provisioning logic, or webhook signature verification.
- No changes to Products/Features, Skill session, or edge-case routes.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | 1 unit test, mock `role='viewer'`, assert 403 + Stripe Checkout session-creation function never invoked (spy) | unit |
| AC2 | 2 unit tests (`engineer`, `admin`), assert `next()` called, checkout proceeds unchanged | unit |
| AC3 | 1 unit test (injectable test logger, same shape as other stories) | unit |
| AC4 | 1 unit test — real Stripe webhook test fixture payload, assert processing unaffected, gate never invoked on this route | unit |

## Assumptions

- Same code-level (not schema-field-level) dependency on `vrne-s1` as `vrne-s2`/`vrne-s4`. `schemaDepends: []`.
- Stripe Checkout remains hosted (no card data touches this app) — confirmed at `/definition`, unaffected by this story.

## Estimated touch points

**Files:** `src/web-ui/routes/billing.js` (1 call site)
**Services:** None new external — Stripe integration is pre-existing and unmodified.
**APIs:** None new.
