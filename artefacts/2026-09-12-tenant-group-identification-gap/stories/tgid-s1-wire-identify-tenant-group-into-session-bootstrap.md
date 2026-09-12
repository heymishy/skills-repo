## Story: Wire identifyTenantGroup() into the real session-bootstrap path

**Epic reference:** None — short-track gap-closure story (closes `bri-s1.4`'s own follow-up action, found during 2026-09-12 pipeline-state audit)
**Discovery reference:** None — short-track
**Benefit-metric reference:** None — short-track

## User Story

As **Hamish (Founder/Operator)**,
I want the tenant PostHog group to actually be registered (`identifyTenantGroup()` called) when a real session bootstraps,
So that tenants show up as real Groups in the PostHog dashboard for analytics/segmentation — not just correctly targeted internally (which already works via `isEnabled()`'s own automatic `groups.tenant` derivation).

## Benefit Linkage

**Metric moved:** Restores `bri-s1.4`'s own stated intent ("every member of a tenant sees the same flag state") a real, observable step further — PostHog's own dashboard can now show which tenants exist as Groups, not just that targeting works internally.
**How:** `bri-s1.4`'s own DoD (2026-07-09) recorded this as a real, disclosed gap: `identifyTenantGroup()` is fully built (`src/web-ui/modules/posthog-flags.js`) and unit-tested, but was never actually called from any live request path — flag targeting itself still works via `isEnabled()`'s automatic group derivation (independent mechanism), but PostHog dashboard group records are never populated. Confirmed via direct source read (2026-09-12): zero call sites for `identifyTenantGroup` anywhere in `src/` outside its own definition and test file.

## Architecture Constraints

- Reuse `identifyTenantGroup(tenantId)` and `resolveTenantIdFromRequest(req)` exactly as already built in `src/web-ui/modules/posthog-flags.js` — do not invent a second mechanism.
- Wire the call inside `bootstrapFlags()` (`src/web-ui/modules/flag-bootstrap.js`), the one real, already-live session-bootstrap entry point (called from `handleGetWizardBootstrapped` in `journey.js`) — matching `bri-s1.4`'s own NFR framing ("within S1.3's overall 200ms budget").
- Only call on the first-bootstrap path (before `req.session.flags` is cached), matching `bootstrapFlags`'s own AC2 "do not re-query on subsequent calls within the same session" convention — group identification should also happen once per session, not on every call.
- Apply the same bounded-timeout wrapper (`_withTimeout`) already used for flag resolution, so a slow/hanging PostHog call can never block session bootstrap beyond the documented budget — `identifyTenantGroup` already has its own internal try/catch (AC3, non-blocking on failure), but adding the timeout wrapper too keeps the latency guarantee consistent with the flag-resolution calls sitting right next to it.
- Do not call `identifyTenantGroup` when `tenantId` is falsy (unowned/solo-dev-mode sessions) — matches `resolveTenantIdFromRequest`'s own null-safe contract.

## Dependencies

- **Upstream:** `bri-s1.1` (isEnabled), `bri-s1.3` (bootstrapFlags), `bri-s1.4` (identifyTenantGroup itself) — all merged, DoD-complete.
- **Downstream:** None currently blocked — this closes a disclosed gap, not a blocker for other work.

## Acceptance Criteria

**AC1:** Given a request reaches `bootstrapFlags()` for the first time in a session (no cached `req.session.flags`) with a real `tenantId` present, When bootstrap runs, Then `identifyTenantGroup(tenantId)` is called exactly once.

**AC2:** Given `bootstrapFlags()` is called again within the same session (cached `req.session.flags` already present), When bootstrap runs, Then `identifyTenantGroup` is NOT called again — matching the existing flag-cache's own once-per-session contract.

**AC3:** Given `req.session.tenantId` is falsy (no tenant), When bootstrap runs, Then `identifyTenantGroup` is not called at all — no error, no wasted call.

**AC4:** Given `identifyTenantGroup`'s underlying adapter call hangs or is slow, When bootstrap runs, Then session bootstrap still completes within the documented budget — the group-identification call is bounded by the same timeout wrapper used for flag resolution, and its own failure never blocks or delays the flag-resolution result being returned.

## Out of Scope

- Any change to `isEnabled()`'s own existing automatic `groups.tenant` targeting derivation (already correct, untouched).
- Wiring `identifyTenantGroup` into any session-establishing path other than `bootstrapFlags` (e.g. login/auth callback) — `bootstrapFlags` is the one real, already-live session-bootstrap mechanism this repo has; if a broader integration point is wanted later, that's a separate story.
- Retroactively registering PostHog groups for tenants whose sessions bootstrapped before this fix ships — no backfill in scope.

## NFRs

- **Performance:** Matches `bri-s1.4`'s own NFR — adds no more than 100ms to session bootstrap, within `bri-s1.3`'s overall 200ms budget. Enforced via the same `_withTimeout` wrapper already used for flag resolution.
- **Security:** `tenantId` sourced exclusively from `req.session.tenantId` via the existing `resolveTenantIdFromRequest`, never from client-supplied request data — unchanged from `bri-s1.4`'s own guarantee.
- **Accessibility:** Not applicable — backend-only.
- **Audit:** None new.

## Complexity Rating

**Rating:** 1 — a small, well-understood change reusing two already-built, already-tested functions exactly as designed, adding them to one already-live call site.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic
