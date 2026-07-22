## Contract Proposal — Design and implement a staging test-data cleanup strategy for E2E-generated accounts and records

**What will be built:**
- A Node script `scripts/cleanup-e2e-staging-data.js` that queries staging's users/products/Stripe-test-customer stores for records matching the `e2e-test-` naming/tagging convention (established by A3) older than a defined retention window (e.g. 7 days), deletes them, and logs what was deleted.
- Scoped, least-privilege credentials for the script (not full-admin access).
- An update to `decisions.md`'s "Staging test-data accumulation" RISK entry confirming resolution (already partially done at /review — this story implements the mechanism the decision names).

**What will NOT be built:**
- A scheduled/nightly job runner — this is a manually-triggered script, per the review-resolved decision.
- Any production data cleanup — staging only.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration: seed mixed-age tagged/untagged records, run script, assert correct subset removed | Integration |
| AC2 | Integration: seed an untagged record resembling test data, run script, assert it survives | Integration |
| AC3 | Integration: read `decisions.md`, assert the RISK entry reflects resolution | Integration |

**Assumptions:**
- Staging's users/products/Stripe-test-customer stores are queryable and deletable via existing data-access code (reused, not newly built) — this story adds a script that calls existing deletion paths, not new deletion logic in the application itself.

**Estimated touch points:**
Files: `scripts/cleanup-e2e-staging-data.js`, `tests/check-b3-cleanup-script.js`, `artefacts/2026-07-23-e2e-core-journey-coverage/decisions.md`
Services: `wuce-staging` (Postgres, Stripe test-mode)
APIs: existing user/product/Stripe-test-customer deletion paths
