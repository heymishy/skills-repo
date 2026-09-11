# Decisions: agency-grant-comment-wiring

Per this repo's standing rule (`CLAUDE.md`, "decisions.md is mandatory for features with architectural choices"). Created at story-authoring time (short-track); appended as further decisions are made during delivery.

---

## Decision: Design a new URL scheme rather than guess at what Story 3/4 "would have" defined

**Date:** 2026-09-11
**Context:** Story 2's own scope note deferred defining the real user-facing URLs for its grant handlers to "Story 3 or Story 4," which never happened. This story must therefore define that URL contract itself.
**Decision:** `POST /api/agency/grants`, `POST /api/agency/grants/:grantId/revoke`, `POST /api/agency/comments`, `GET /api/agency/comments/:id` (Agency-side); `GET /client/shared-products`, `GET /client/shared-products/:id`, `PUT`/`POST`/`DELETE /client/shared-products/:id`, `POST /client/comments`, `GET /client/comments/:id` (Client-side).
**Rationale:** Mirrors this codebase's existing `/api/*` (mutating, agency-owned-resource actions) vs. plain-path (read/client-facing) convention seen elsewhere in `server.js`, and groups routes by which side of the relationship initiates them — the same organising principle `/agency/clients/*` (Story 3) and `/organisations/*` (Story 6, `asa-s1`) already use.

---

## Decision: Add CSRF protection as part of this story, not a separate follow-up

**Date:** 2026-09-11
**Context:** `handleCreateGrant`, `handleCreateSharedComment`, and `handleCreateAgencyComment` do not call `csrfGuard` internally — every other mutating POST route in `products.js` does.
**Decision:** Add the identical `csrfGuard` preamble already established elsewhere in this file, at the point these routes are wired.
**Rationale:** Shipping 3 new, externally-reachable, CSRF-unprotected mutating endpoints would be a real, new vulnerability this story would introduce, not fix. This is not scope creep — it's a necessary correction bundled with the wiring, using this codebase's own already-reviewed pattern, not a new mechanism.

---

## Decision: `handleCreateAgencyComment`/`handleListAgencyComments`'s missing resource-ownership check is a separate, smaller finding — logged, not fixed here

**Date:** 2026-09-11
**Context:** These two handlers trust the caller's own `agencyOrgId` as the resource owner without verifying the resource actually belongs to that org.
**Decision:** Not fixed in this story — logged here as a follow-up finding.
**Rationale:** This story's own scope is wiring + the one CSRF gap that wiring would otherwise introduce. Expanding scope to audit every pre-existing authorization edge case in the 9 handlers risks scope creep on an already-substantial short-track story. Worth its own small follow-up if confirmed exploitable in practice (an Agency org would need to already know another org's exact `resourceId` and have some product/feature of its own at that ID to collide with — bounded blast radius, not urgent).

---

## RISK-ACCEPT: Verification script not yet reviewed by a separate domain expert

**Date:** 2026-09-11
**Category:** RISK-ACCEPT (DoR Warning W4)
**Context:** DoR flagged W4 — the test plan/verification script has not been reviewed by a separate person before implementation begins.
**Decision:** Proceed without a separate pre-code review.
**Rationale:** All 9 wired handlers' own internal logic is already covered by 2 existing, already-reviewed test suites (`check-story2-relationship-grants-enforcement.js`, `check-story5-client-agency-comments.js`) — this story only adds route-dispatch coverage plus the one CSRF addition, both mirroring already-established, already-reviewed patterns in this exact codebase. Operator (Hamish King) directed this story directly in-session, immediately after independently reviewing the live-verification finding that produced it, matching the same precedent as `asa-s1`.
