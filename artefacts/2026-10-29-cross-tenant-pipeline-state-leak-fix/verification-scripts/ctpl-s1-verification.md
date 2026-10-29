# AC Verification Script: Tenant-match guard on pipeline-state-derived journey features (ctpl-s1)

**Audience:** Product owner / domain expert — pre-code sign-off, post-merge smoke test, delivery review.
**Setup:** A deployment with `PLATFORM_TENANT_ID` set (the self-hosted product's own tenant) and at least one other tenant/product with no repo connected, or a different repo connected.

## Scenario 1 (AC1) — A tenant that isn't the platform's own sees none of the platform's internal backlog

1. Sign in as a tenant whose `tenantId` does not match the deployment's `PLATFORM_TENANT_ID`.
2. Load `/journey`.
3. Expected result: no card on this page names any of this repo's own internal feature work (e.g. no "Auto capture target resolution", no "Production playback capture" — or whatever the platform's own current backlog items are). Only this tenant's own real journeys (if any) appear.

## Scenario 2 (AC2) — The platform's own self-hosted session is unaffected

1. Sign in as the platform's own self-hosted tenant (the one whose `tenantId` matches `PLATFORM_TENANT_ID`).
2. Load `/journey`.
3. Expected result: the platform's own internal backlog still appears exactly as it did before this fix — no regression.

## Scenario 3 (AC3) — A misconfigured deployment (no self-hosted tenant at all) fails closed

1. 🔴 Requires a deployment with `PLATFORM_TENANT_ID` unset or empty — not reproducible against the live staging/production deployment, which has it configured. Confirm via the automated test suite instead (`ctpl-s1 AC3` tests in `tests/check-ep1-s1-journey-feature-merge.js`).
2. Expected result: no tenant, including one with an empty-string `tenantId`, ever sees the merged content.

## Reset instructions

None needed — each scenario is read-only (loads `/journey`, no state mutation).
