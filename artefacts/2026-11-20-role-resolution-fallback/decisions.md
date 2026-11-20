# Decisions: role resolution fallback (rrf-s1)

## D1. Both fallbacks return the lowest role instead of a tenant-wide lookup (2026-11-20)

**Context:** `resolveRoleForPerson` falls back to `resolveRoleForTenant` (`SELECT role ... WHERE tenant_id = $1 LIMIT 1`, no `ORDER BY`) when an identity has no person row, and when a person has no membership in the tenant. In a tenant with members that returns an arbitrary member's role. The login path creates the person row before role resolution (`_bootstrapTenantAdmin`), so the second case occurs on every sign-in of a person who was never given a membership. Found through the failing E2E spec `bri-s3.6` AC1; reproduced with the in-memory database.
**Decision:** return `'user'` from both fallbacks. Keep `resolveRoleForTenant` exported and unchanged. Do not write a membership row at sign-in in this story.
**Rationale:** the default must be the lowest privilege; a missing row must never raise a role. Fixing only the second case would leave the first as the same defect reachable through a different state. Writing membership rows is a product decision (who may join a tenant, and with what role) and is left to the operator.
**Alternatives rejected:** adding `ORDER BY` to the tenant-wide lookup (still hands a person another person's role); making the fallback depend on a configured default role (more surface, no current need); creating a `user` membership at sign-in (changes data and who appears in team lists).
**Operator go-ahead (2026-11-20, "Yes"):** the fix, and a read-only aggregate count on production of people with an identity but no membership.
**Production configuration seen:** `TENANT_ORG_ALLOWLIST` is present as a secret on `skills-framework` (name only; the value was not read), so shared-tenant mode is active in production.
