## Story: Wire tenant-level flag targeting via PostHog group analytics

**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-1-feature-flags.md
**Discovery reference:** artefacts/2026-07-09-beta-readiness-infra/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-beta-readiness-infra/benefit-metric.md

## User Story

As **Hamish (Founder/Operator)**,
I want a flag's state to be evaluated against the tenant (not the individual user), consistent with the ADR-025 multi-tenancy model,
So that every member of a tenant sees the same flag state — no scenario where two people on the same team see different gated behaviour.

## Benefit Linkage

**Metric moved:** Metric 2 — Feature flags toggle without a redeploy
**How:** "Consistent across all users in a tenant" is the AC discovery names for this metric — without group-based targeting, flag state would be per-user, not per-tenant, and could disagree within one team.

## Architecture Constraints

- ADR-025: multi-tenancy is enforced at the application layer via tenant_id scoping — this story's group key must be the same `tenantId` used everywhere else in the app (session, storage, rate limiting), not a separate identity scheme.
- Requires enabling PostHog's Group Analytics (per `decisions.md` ASSUMPTION entry, validated 2026-07-09) — usage-based, $0 within the 1M-events/month free tier.
- D37: group identification (`posthog.group('tenant', tenantId)`) goes through the same injectable adapter as S1.1.

## Dependencies

- **Upstream:** S1.1 (isEnabled() helper), S1.2 (staging/prod separation)
- **Downstream:** S1.5 (the 3 named flags) uses this targeting mechanism.

## Acceptance Criteria

**AC1:** Given two users, both belonging to the same tenant, When `isEnabled(flagKey, context)` is called for each with their respective session context, Then both receive the identical flag value.

**AC2:** Given a flag is targeted at a specific tenant in PostHog (e.g. "on for tenant X only"), When a user from tenant X calls `isEnabled()`, Then they receive `true`; when a user from a different tenant calls it, Then they receive `false`.

**AC3:** Given the `tenant` group type is not yet defined in the PostHog project (first-time setup), When the group-identification call runs for the first time, Then it correctly registers the group without erroring, and the app does not crash if group registration is delayed or fails (falls back to the S1.1 AC4 safe default).

**AC4:** Given a solo-tenant customer (today's default, one person = one tenant), When they toggle a flag, Then the same per-tenant targeting mechanism applies without any special-casing for the solo case — proving this doesn't regress the existing single-tenant model.

## Out of Scope

- Per-team-member overrides within a tenant (e.g. one engineer opts out of a flag their tenant has enabled) — not supported; targeting is tenant-wide only, consistent with the "same tenant, same flag state" requirement.
- Retroactively re-targeting flags that were already evaluated at the user level before this story — no historical flag-evaluation migration.

## NFRs

- **Performance:** Group identification adds no more than 100ms to session bootstrap (within S1.3's overall 200ms budget).
- **Security:** The `tenantId` used for group targeting is read from `req.session.tenantId`, never from client-supplied request data — consistent with the existing tenant-isolation guard (ADR-025).
- **Accessibility:** Not applicable.
- **Audit:** None identified beyond S1.1.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
