# Contract Proposal: Confirm the Stripe billing portal satisfies the "manage my plan" ask

**Story reference:** artefacts/2026-08-17-settings-improvements/stories/si-s3-confirm-billing-portal-sufficient.md
**Date:** 2026-08-17

---

**What will be built:** Nothing new — this story re-runs `bpe-s1`/`bse-s1`'s existing automated test suites (AC1) and performs two live checks against staging (AC2, AC3), then records the outcome in its own DoD (AC4).

**What will NOT be built:** No new in-app plan-management UI; no Stripe account/config changes.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Re-run existing `tests/check-bpe-s1-*.js`/`check-bse-s1-*.js` unmodified | Integration (regression) |
| AC2 | Manual — sign in to a no-Stripe-customer staging account, click "Manage billing" | Manual |
| AC3 | Manual — sign in to a valid-Stripe-customer staging account, click "Manage billing" | Manual |
| AC4 | Procedural — record outcome in DoD | Manual/documentation |

**Assumptions:** A staging account with a configured Stripe test-mode customer ID exists — **confirmed by operator at DoR, 2026-08-17**. Account identity to be obtained from the operator at verification time, not recorded in this artefact.

**Estimated touch points:** None — no source files change. Test/verification artefacts only.

**Contract review outcome:** PASSED — no implementation, so no mismatch is possible.

**schemaDepends:** `[]` — si-s3's Dependencies block names `bpe-s1`/`bse-s1` as external upstream stories, but this story depends on their *behaviour* (existing redirect/banner logic already merged), not on any shared `pipeline-state.schema.json` field. No schema fields to declare.
