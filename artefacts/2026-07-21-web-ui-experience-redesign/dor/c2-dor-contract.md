**Contract Proposal — Billing tab plan status and Stripe portal access**

**What will be built:** A Billing tab reading `/billing/plan-state` and linking to the existing `/settings/billing` (portal) and `/billing/checkout` (Stripe Checkout, `lab-s3.2`) routes.

**What will NOT be built:** New Stripe API calls, webhooks, or plan-change logic.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test on trial status rendering | unit |
| AC2 | Unit test on active status rendering | unit |
| AC3 | Unit test on past_due/canceled visual distinction | unit |
| AC4 | Integration test on Manage billing → existing portal redirect | integration |
| AC5 | Integration test on Upgrade → existing Checkout route | integration |

**Assumptions:** None — both underlying routes already exist and are tested (`lab-s3.2`, `lab-s3.5`).

**Estimated touch points:**
Files: `src/web-ui/routes/settings.js` (from C1)
Services: None new
APIs: None new
