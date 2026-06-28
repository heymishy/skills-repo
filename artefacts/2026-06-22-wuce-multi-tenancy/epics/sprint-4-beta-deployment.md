# Epic: Sprint 4 — Beta Deployment and Tenant Onboarding

**Feature:** wuce-multi-tenancy
**Epic slug:** sprint-4-beta-deployment
**Status:** not-started

## Rationale

With Phase 3 persistence infrastructure provisioned (Sprint 3), this epic deploys the full multi-tenancy stack to production, configures the first beta tenant(s) via `TENANT_ORG_ALLOWLIST`, provisions their directory trees, and verifies the deployment with a post-deploy smoke test. Sprint 4 is the gate that opens the beta.

## Stories

| Story | Title | Complexity | Scope stability |
|-------|-------|------------|----------------|
| s4.1 | Production deployment and end-to-end smoke test | 1 | Stable |
| s4.2 | Tenant onboarding configuration | 1 | Stable |

## Metric linkage

- **M1** (Authorization coverage rate): production deployment confirms the guard is live at beta scale.
- **M2** (Cross-tenant journey data leakage prevention): tenant directory provisioning establishes the physical isolation boundary that M2 measures in production.
