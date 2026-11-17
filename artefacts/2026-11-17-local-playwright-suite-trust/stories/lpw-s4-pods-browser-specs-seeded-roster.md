## Story: The four pod browser specs run against a seeded team roster and join the browser suite

**Epic reference:** None - short-track (follow-up from the lpw-s2 capability matrix; capability gap "pods", per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: `tests/e2e/capability-matrix.json` entries for `ep1-s1-pod-creation`, `ep1-s2-product-default-pod`, `ep1-s3-feature-pod-inheritance` and `ep4-s1-multi-pod-assign` (lane quarantined, reason "verified locally"), and `artefacts/2026-11-17-local-playwright-suite-trust/decisions.md`.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [testing] [web-ui]

## User Story

As **the operator who relies on the browser suite to say whether the product still works**,
I want **the pod specs to run against a team roster the test server seeds, instead of an empty one**,
So that **pod creation, a product's default pod, a feature inheriting its product's pod and multi-pod assignment are checked on every change, and the "pods" capability stops being a blind spot**.

## Benefit Linkage

**Metric moved:** None formal. The capability matrix lists "pods" as a capability with no passing browser spec: all four specs are quarantined because `GET /api/team/members` returns an empty roster in test mode, so the spec's click on the "Hamish" row times out. The roster was a hardcoded list until rtri-s2 replaced it with the real team roster; the specs were never updated.
**How:** a test-only seed route puts named people into the fake test database's team tables for the test tenant, the four specs seed what they need and use the seeded names, and the four specs leave quarantine.

## Architecture Constraints

- **Test-only.** The seed route exists only when `NODE_ENV=test`, uses the same inline guard as the other `/test/seed-*` routes, and writes only to the fake test database (never a real pool). It must not exist in production or staging.
- **No change to product behaviour.** The pod manager, the roster read (`listTeamMembers`) and the team routes are not edited; the fake database already answers the real roster query.
- **Reuse the real shapes.** A seeded member is a person, a person identity and a team membership with a role, exactly as the real tables hold them, so the roster query's inner join returns it.
- **Isolation.** Seeded members belong to the `e2e-` tenant the spec runs as, so other specs sharing the default test tenant are not disturbed beyond a larger roster; specs must not rely on the roster being empty.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain.

## Dependencies

- **Upstream:** lpw-s2 (the capability matrix and core job), lpw-s3 (`_fakeDbSaveJourney` and the seed-route conventions).
- **Downstream:** none. Model sessions (lpw-s5) are independent.

## Acceptance Criteria

**AC1:** Given the test server in test mode, When `POST /test/seed-team-member` is called with an identity and a role, Then a person, a person identity and a team membership exist for the test tenant, `GET /api/team/members` returns that member with its role, and calling it again with the same identity does not add a duplicate.

**AC2:** Given the route outside test mode (`NODE_ENV` not `test`), When it is requested, Then it answers 404 and writes nothing; and an identity that is empty, or not a plain login-style string, is refused with 400 and writes nothing.

**AC3:** Given the four pod specs, When each runs, Then it seeds the members it needs before opening the pod manager, selects them by the seeded names, and passes on its own and in the core order (its own file alone, and after the other core specs).

**AC4:** Given the capability matrix, When the four specs pass, Then they are moved from `quarantined` to a runnable lane with the "reason" removed, the matrix guards (`check-lpw-s2-*` and the quarantine-review-date guard) still pass, and at least one pods spec is in the core lane.

**AC5:** Given the product code, When the diff is read, Then it changes only the test server, the fake database seed helpers if needed, the four specs, the matrix and the new tests, with no change under `src/web-ui/public/`, `src/web-ui/modules/` or `src/web-ui/routes/`.

## Out of Scope

- Changing the pod manager, the roster query or the real team-management routes.
- Model sessions and the `ep2-s2` crash (lpw-s5), the three live-feature rewrites, regress-back #1042.
- Making the real "add teammate" flow testable (it looks the identity up on GitHub); this story seeds around it.

## NFRs

- **Security:** the seed route is unreachable outside `NODE_ENV=test`; identities are validated (length, characters) so the route cannot be used to write arbitrary text.
- **Reliability:** a spec that seeds members twice, or runs after another pod spec in the same server, still passes.
- **Runtime:** the four specs together add no more than about a minute to the core job; if more, only the fastest one joins the core and the rest stay in the extended lane.

## Complexity Rating

**Rating:** 1 - the fake database already answers the roster query; the gap is seed data and four selectors.
**Scope stability:** Stable
