## Story: Restore same-tenant journey access under POLICY.TENANT

**Epic reference:** None — short-track bug fix (bounded, well-diagnosed defect; no discovery/benefit-metric required per CLAUDE.md's short-track definition).
**Discovery reference:** N/A — short-track.
**Benefit-metric reference:** N/A — short-track.
**Domain:** [web-ui, security]

## User Story

As a **teammate sharing a journey within the same tenant**,
I want to **view or resume a journey I don't personally own, when my session's tenant matches the journey's tenant**,
So that **collaborative multi-user journey features (concurrent viewing, resume, breadcrumb navigation) work as designed instead of silently 404ing for every non-owner**.

## Benefit Linkage

**Metric moved:** Collaborative-session functional correctness (wsm.2's own delivered feature: concurrent multi-user journey viewing).
**How:** Fixing the access-guard bug restores the intended behaviour — a same-tenant non-owner viewer gets 200 with the journey's real turns/stage, instead of an incorrect 404 that makes every POLICY.TENANT route behave as if it were POLICY.OWNER.

## Architecture Constraints

`src/web-ui/middleware/journey-access.js` — this story fixes `requireJourneyAccess()` itself; no new guardrail, ADR, or pattern is introduced. Checked against `.github/architecture-guardrails.md` — no conflicting guardrail found.

## Dependencies

- **Upstream:** None.
- **Downstream:** None currently blocked — this is a live functional/access-correctness bug in already-shipped code (p0.1/p0.2, PR #390), not a blocker for other in-flight work.

## Acceptance Criteria

**AC1:** Given a journey with `ownerId: 'user-A'` and `tenantId: 'acme'`, When `requireJourneyAccess(journey, { accessToken: 'tok', login: 'user-B', tenantId: 'acme' }, POLICY.TENANT)` is called (a same-tenant, non-owner viewer), Then it returns without throwing.

**AC2:** Given the same journey, When `requireJourneyAccess(journey, { accessToken: 'tok', login: 'user-C', tenantId: 'other-tenant' }, POLICY.TENANT)` is called (a different-tenant viewer), Then it throws `{ code: 'FORBIDDEN' }`, converted to HTTP 404 by `asHttpResponse(err, POLICY.TENANT)`.

**AC3:** Given the same journey, When `requireJourneyAccess(journey, { accessToken: 'tok', login: 'user-B', tenantId: 'acme' }, POLICY.OWNER)` is called (same-tenant, non-owner, but under the OWNER policy), Then it still throws `{ code: 'FORBIDDEN' }` — `POLICY.OWNER` routes (`handlePostJourneyRecommit`, `handlePostJourneyStageCommit` — the two call sites at journey.js:3064/3156) must remain owner-only; this story must not weaken those.

**AC4:** Given all 11 existing `POLICY.TENANT` call sites in `journey.js` (lines 295, 736, 1456, 2790, 2865, 2917, 2944, 3208, 3256, 3313, 3460 at time of writing), When each is exercised by its own existing test suite after the fix, Then no existing test that currently asserts owner-only or cross-tenant denial regresses — only the previously-broken same-tenant-non-owner-should-be-allowed case changes outcome.

**AC5:** Given `tests/check-wsm2-collaborative-sessions.js` (the test suite that surfaced this bug), When run after the fix, Then T2b/T2c/T2d/T4a/T4b (currently failing with 404s) pass.

## Out of Scope

- Any change to `POLICY.OWNER` semantics — those two routes stay owner-only (see AC3).
- The `agency-client-organisations` relationship-grant extension (`requireGrantAccess`, same file) — unrelated code path, not touched by this fix.
- A broader audit of every `POLICY.TENANT` caller's business logic beyond confirming the access-guard change alone doesn't regress it (AC4 covers regression, not a full re-review of each route).
- Auditing production `journey_store`/database rows for any tenant that has actually attempted (and been wrongly denied) same-tenant collaborative access since PR #390 shipped (2026-06-23) — a separate follow-up if the operator wants historical exploitability/impact context.

## NFRs

- **Performance:** None identified — `isSameTenant()` is an existing, already-cheap in-memory comparison; the fix only changes control flow, not what's computed.
- **Security:** This IS the security fix — restores intended tenant-scoped access control. Must not introduce a regression that allows cross-tenant access (AC2 guards this) or weakens owner-only routes (AC3 guards this).
- **Accessibility:** N/A — backend authorization logic only.
- **Audit:** None identified — existing route-level logging (if any) is unaffected by this change.

## Complexity Rating

**Rating:** 1 — Well understood, clear path. Root cause fully diagnosed (dead-code branch in `requireJourneyAccess`), fix is a small, localized control-flow correction, and the exact failing tests already exist (`check-wsm2-collaborative-sessions.js` T2/T4) plus 11 known call sites to regression-check.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic

## Root cause (diagnostic reference)

`src/web-ui/middleware/journey-access.js`, `requireJourneyAccess()`:

```javascript
function requireJourneyAccess(journey, session, policy) {
  if (journey == null) throw { code: 'NOT_FOUND' };
  if (!session || !session.accessToken) throw { code: 'UNAUTHENTICATED' };
  if (journey.ownerId == null) return;
  if (session.login === journey.ownerId) return;
  if (!isSameTenant(journey, session)) throw { code: 'FORBIDDEN' };
  throw { code: 'FORBIDDEN' };
}
```

The `policy` parameter is accepted but never read inside this function — it's only used later, by the caller, in `asHttpResponse(err, policy)` to pick 403 vs 404. Whether `isSameTenant()` returns true or false, execution reaches one of the two final lines and throws `FORBIDDEN` either way — there is no path that returns (grants access) for a same-tenant non-owner. Confirmed via direct reproduction:

```javascript
requireJourneyAccess(
  { ownerId: 'user-A', tenantId: 'acme' },
  { accessToken: 'tok', login: 'user-B', tenantId: 'acme' },
  POLICY.TENANT
);
// throws { code: 'FORBIDDEN' } -- should return (same tenant, TENANT policy)
```

The likely intended shape (for the implementer to verify against all 11 call sites, not prescribed as the only valid fix):

```javascript
function requireJourneyAccess(journey, session, policy) {
  if (journey == null) throw { code: 'NOT_FOUND' };
  if (!session || !session.accessToken) throw { code: 'UNAUTHENTICATED' };
  if (journey.ownerId == null) return;
  if (session.login === journey.ownerId) return;
  if (policy === POLICY.TENANT && isSameTenant(journey, session)) return;
  throw { code: 'FORBIDDEN' };
}
```

Found while resolving a pre-existing `npm test` failure cluster (`check-wsm2-collaborative-sessions.js` T2b/T2c/T2d/T4a/T4b, all 404 where 200 was expected) during a broader test-suite cleanup pass, 2026-08-22. Not a stale test — isolated reproduction above confirms the bug lives in production source, not test setup. Blast radius: 11 `POLICY.TENANT` routes in `journey.js` (viewing, resuming, breadcrumb, and other same-tenant-shared journey operations) currently behave as owner-only for any non-owner request, regardless of tenant match.
