## Story: Fix bri-s3.3's role-boundary regression guard so it actually asserts denial

**Epic reference:** None — short-track, closing a self-documented gap from `bri-s3.3` (`2026-07-09-beta-readiness-infra`)
**Discovery reference:** None — short-track
**Benefit-metric reference:** None — short-track
**Domain:** [web-ui, security]

## User Story

As a **platform maintainer relying on automated regression coverage for tenant/role isolation**,
I want **`bri-s3.3`'s Playwright spec to actually assert role-boundary denial, not just multi-user route access**,
So that **a future regression that lets one tenant's user access another's admin-gated resources is caught by CI, instead of silently passing a test suite that reports green while testing nothing security-relevant**.

## Benefit Linkage

**Metric moved:** None formally tracked (short-track gap-closure) — closes a gap found while writing `bri-s3.3`'s retroactive DoD (2026-08-17/18): the story's own stated Security NFR calls this spec "the primary regression guard against a role-boundary regression," but AC1's test never touches an admin-gated route (only checks both users can use shared product routes, no denial assertion), and AC3's test body is a literal unimplemented placeholder — despite `pipeline-state.json` recording 6/6 tests passing and 4/4 ACs verified.
**How:** A regression guard that doesn't guard is worse than no guard at all, since it creates false confidence. Fixing this closes that gap directly.

## Architecture Constraints

- Reuse the existing test file and fixture setup in `tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js` — do not rewrite the spec from scratch, fix AC1 and implement AC3's already-scaffolded but unimplemented body.
- AC3's fix should use the already-seeded but currently-unused `VIEWER_PERSON_ID` fixture (confirmed present in the spec file by the DoD review) rather than introducing new fixture data.
- Follow the D37/wiring-test-behavioural-correctness convention already established elsewhere in this codebase (CLAUDE.md): a security regression test must assert an observable, differentiating outcome (a real 403/redirect on an admin-gated route for the wrong tenant/role), not merely that two users can both reach some shared, non-gated page.
- **SCOPE CORRECTION (2026-08-21, found while writing this story's test plan):** `bri-s3.3`'s own original AC3 text ("a viewer attempts any write action, then it is denied") describes behaviour that was never actually implemented anywhere in the codebase. A full search of `src/web-ui/middleware/` and every route file confirms `'viewer'` exists only as a stored data value (`team-management.js`'s `VALID_ROLES`) — no middleware or route handler anywhere checks for or blocks it. The only real role-based gate in the entire codebase is `requireAdmin` (admin vs. everyone else — it does not distinguish engineer/product/viewer). AC2 below is corrected to test the boundary that genuinely exists today (viewer is correctly treated as non-admin), not the "any write action" behaviour that does not exist. The missing viewer-specific write-blocking is tracked as its own separate, appropriately-scoped finding — see `artefacts/2026-08-21-viewer-role-no-enforcement/discovery.md` — not folded into this story, since it requires real design judgement (which write actions specifically) rather than a bounded bug fix.

## Dependencies

- **Upstream:** `bri-s3.3` (merged, PR #483) — this story fixes a test-coverage gap in that story's own delivered spec.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the rewritten AC1 test, When a user from tenant A attempts to access an admin-gated route belonging to tenant B (or a route requiring a role tenant A's user doesn't have), Then the test asserts a real denial (403 or equivalent redirect/error), not merely that both users can reach an unguarded shared route.

**AC2 (corrected 2026-08-21 — see Architecture Constraints scope correction):** Given AC3's currently-placeholder test body, When implemented, Then it logs in as the existing `VIEWER_PERSON_ID` fixture (`e2e-viewer`) and attempts the same admin-gated route AC1 exercises, asserting real denial (403) via the one role-gating mechanism that actually exists (`requireAdmin`) — proving a viewer is correctly treated as non-admin. This replaces the placeholder with a real, passing assertion about the boundary that exists today; it does NOT assert "any write action is denied," since no such general enforcement exists (tracked separately).

**AC3:** Given both AC1 and AC3 are fixed, When the full `bri-s3.3-multi-user-tenant-journey.spec.js` suite is run, Then all assertions pass, and the suite genuinely functions as the "primary regression guard against a role-boundary regression" its own story claims it to be.

## Out of Scope

- Any change to the actual role/tenant-boundary enforcement code itself — this story only fixes the test's ability to detect a regression in that code, assuming (per `bri-s3.3`'s own DoD, AC2/AC4 already confirmed genuinely covered) the underlying enforcement is currently correct.
- **Implementing real viewer-role write-blocking enforcement** — confirmed not to exist anywhere in the codebase (see Architecture Constraints scope correction). This is a genuine new authorization feature requiring real design judgement, not a bounded test fix. Tracked separately at `artefacts/2026-08-21-viewer-role-no-enforcement/discovery.md`.
- Broader audit of other regression suites for the same "doesn't test what it claims" pattern — scoped to `bri-s3.3` only; if this recurs elsewhere, that's a separate finding.

## NFRs

- **Security:** Core purpose of this story — restores a claimed-but-non-functional security regression guard.
- **Performance:** None identified.
- **Accessibility:** Not applicable.
- **Audit:** None new.

## Complexity Rating

**Rating:** 2 — the fixture and spec scaffolding already exist; the work is writing correct assertions against an admin-gated route and the already-planned AC3 scenario, not building new test infrastructure.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
