# Contract Proposal — Client org self-service conversion to an independent paying account

**What will be built:**
A conversion route/handler that updates `org_type` from `client` to `standalone` in place on the same `organisations` row, gated by `team_memberships.role === 'admin'` for that org, then redirects into the existing `createCheckoutSession` Stripe flow.

**What will NOT be built:**
Any change to the billing model itself. Reversal of a conversion. Any change to Agency relationships as a result of conversion.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|----------------|------|
| AC1 | Unit + integration (×2 — admin allowed, non-admin rejected): `org_type` updated in place, same `org_id` | Unit, Integration |
| AC2 | Integration: redirect reaches the existing, mocked `createCheckoutSession` | Integration |
| AC3 | Unit + integration: relationships/grants unchanged and still functionally enforced post-conversion | Unit, Integration |
| AC4 | Unit + integration: concurrent conversion + grant-creation do not corrupt each other | Unit, Integration |

**Assumptions:**
`team_memberships.role = 'admin'` already exists for the org's first invited user by the time this story is implemented (Story 3, already merged/DoR'd). The existing `createCheckoutSession` function is called unmodified — no new Stripe integration code.

**Estimated touch points:**
Files: conversion route handler, `organisations` adapter (reused from Story 1), `tests/check-story6-conversion-to-independent.js`.
Services: Stripe (existing, unmodified).
APIs: none new.
