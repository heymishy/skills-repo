# Decisions: PostHog LLM Analytics Instrumentation

---

## Decision 1: Hand-rolled $ai_generation events instead of @posthog/ai npm package

**Date:** 2026-07-04
**Context:** PostHog publishes `@posthog/ai`, an OpenTelemetry-based auto-capture wrapper for LLM calls. The codebase uses hand-rolled HTTP clients for both Anthropic (`src/modules/skill-turn-executor.js`) and PostHog (`src/web-ui/modules/posthog-server.js`). Adding `@posthog/ai` would require `posthog-node` as a peer dependency, violating the zero-new-npm-dependencies product constraint.
**Decision:** Emit `$ai_generation` events as manual PostHog `capture()` calls using the existing hand-rolled HTTP pattern. All `$ai_*` properties are set manually in the event body.
**Rationale:** The hand-rolled pattern is already proven in production. Manual event emission gives full control over property names and values. The property schema is documented in the PostHog docs and is stable. Adding npm packages for a feature that is achievable with built-ins is not justified.

---

## Decision 2: $ai_session_id = login + '-' + journeyId (not tenantId)

**Date:** 2026-07-04
**Context:** The initial instrumentation plan (§4) proposed `$ai_session_id = tenantId` to group journeys by tenant. This was identified as incorrect during the discovery review: using `tenantId` as `$ai_session_id` collapses all users of a tenant into a single PostHog session, making per-user analysis impossible.
**Decision:** `$ai_session_id = req.session.login + '-' + session.journeyId`. This scopes each PostHog session to one user's journey. Tenant-level aggregation is handled by `$groups: { company: tenantId }` on every event.
**Rationale:** PostHog sessions are user-scoped, not tenant-scoped. The correct mechanism for tenant aggregation is PostHog Group analytics (`$groups`), not `$ai_session_id`. Using `tenantId` as session ID would break per-user trace analysis.

---

## Decision 3: role added to identify() $set properties and to $ai_generation events

**Date:** 2026-07-04
**Context:** The initial instrumentation plan did not include `role` as a person property or as a `$ai_generation` event property. During the discovery review, the operator requested that admin and standard user sessions be distinguishable in PostHog cost data.
**Decision:** Add `role: req.session.role || 'user'` to `posthog.identify()` `$set` properties (pla-s1 infrastructure) and to every `$ai_generation` event (pla-s2). This enables PostHog to filter or segment LLM cost by role.
**Rationale:** With the admin role panel now live (PR #435), multi-role is a production reality. Without `role` on PostHog events, it is impossible to determine whether admin-triggered skill sessions cost more than standard user sessions.
