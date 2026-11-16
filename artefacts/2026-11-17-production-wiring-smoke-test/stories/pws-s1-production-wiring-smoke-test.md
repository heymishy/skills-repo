## Story: A production-wiring smoke test in the unit chain that fails when an adapter is unwired or a route answers a hostile request with a 5xx

**Epic reference:** None - short-track (a test-and-guard story from the CI audit, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: `artefacts/2026-11-15-production-error-sweep/reference/ci-regression-scenarios-audit.md` item 4; the production defects it would have caught: `submitAnswer` never wired (#1121, sub-s1), `getCommitResult` never wired (scr-s1), `getCommitPreview` answering 500 for an unknown session (cpv-s1).
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [web-ui]

## User Story

As **the operator**,
I want **a test that runs on every pull request, boots the real route table with the production adapter wiring, and fails when an injectable adapter is left unwired or a route answers hostile input with a server error**,
So that **the class of defect that reached production three times is stopped on the PR, and the staging end-to-end no longer has to be the only place it could be seen**.

## Benefit Linkage

**Metric moved:** None formal. Replaces the per-PR signal that `sep-s1` (moving the staging end-to-end off the PR gate) would otherwise remove, and runs on the PR's own code rather than on the deployed staging master.
**How:** one new check in the unit chain (`npm test`), about a minute at most, with no network and no real model.

## Architecture Constraints

- **Fail, not warn (operator decision 2026-11-17).** An unwired adapter fails the check. The only exception is a named allow-list entry in the test file, each with the adapter, the reason and the owning story. A stale entry (an adapter that is now wired, or a name that no longer has a stub) fails too, the same way `known-baseline-failures.json` does. The list starts with the legacy and no-op adapters that are deliberately unwired (each reason recorded in the decisions file).
- **How "unwired" is detected without editing production modules.** The throwing stubs name their setter in their own message (`Call setX() with a real implementation`). The check reads `src/web-ui/adapters/skills.js` and `src/web-ui/routes/skills.js` for those names (the two modules where the three defects were), boots the real `server.js` in a child process with `NODE_ENV=test` and `WIRE_SKILL_ADAPTERS=true` after wrapping each exported `set*` function to record calls, and compares. A child process is used because re-requiring `server.js` more than once in a process hangs.
- **Behaviour, not only references (the D37 rule 4).** Beyond "the setter was called", the check makes real requests through the real route table for the skill-session routes with an unknown session id and asserts the answers (404 or 410, never 5xx, and never text containing "Adapter not wired"). That is what proves `getCommitPreview`, `getCommitResult`, `getNextQuestion` and the retired `/answer` route answer correctly, not just that something was assigned.
- **Hostile-input sweep.** The route patterns are read from `server.js`'s own `pathname.match(/.../)` literals (so a new route is covered automatically), each id segment is filled with the six hostile values of the earlier sweeps (`not-a-uuid`, `%00`, the broken escape `%E0%A4%A`, a well-formed unknown uuid, a 300-character value, an encoded path traversal), and every pattern is requested with GET and with POST through a signed-in seeded test session. No answer may be 5xx. A guard fails the check if fewer than 60 patterns are found, so the extractor cannot silently go blind.
- **Scope of the wiring comparison is honest:** `NODE_ENV=test` skips production-only wiring blocks (those that need Postgres, GitHub or PostHog), and `server.js` wires stub adapters under test mode. The check covers the `WIRE_SKILL_ADAPTERS` surface and the route table; wiring that exists only under a real production environment is out of its reach and is listed as such, not claimed.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; D37 is the rule being enforced; no other Active ADR engaged. Zero new npm dependencies. No production module is changed.

## Dependencies

- **Upstream:** sub-s1, cpv-s1, scr-s1 (merged; they remove the three known defects, so the allow-list starts without them), tht-s1 (the test leaves the repo clean).
- **Downstream:** `sep-s1` (moving the staging end-to-end after deploy) is blocked on this story merging (recorded decision 2026-11-16).

## Acceptance Criteria

**AC1:** Given the throwing stubs in `adapters/skills.js` and `routes/skills.js`, When the real `server.js` is booted with the skill-adapter wiring on, Then every setter named by a stub is called during boot except the entries on the allow-list, and the check fails naming any setter that is neither called nor allow-listed.

**AC2:** Given the allow-list, When an entry names a setter that was called at boot, or a setter that no stub names, Then the check fails naming the stale entry.

**AC3:** Given the real route table and a signed-in test session, When the skill-session routes (state, next question, commit preview, commit result page, resume, `/answer`) are requested for an unknown session, Then each answers 404 or 410 (never 5xx) and no body contains "Adapter not wired".

**AC4:** Given every route pattern in `server.js`, When each is requested with GET and POST for each of the six hostile id values, Then no answer is 5xx, and the check fails if fewer than 60 patterns were found.

**AC5:** Given a negative control, When the comparison is run on a stub whose setter is not called and is not allow-listed, Then it reports that setter (so the check is proven able to fail on the original defect).

**AC6:** Given the unit chain, When `npm test` runs, Then the check is part of it and finishes in under 60 seconds on the PR's CI, and it leaves the repository clean (no new files, `HEAD` unchanged).

## Out of Scope

- Wiring that exists only under a real production environment (Postgres, GitHub, PostHog), and the other adapter modules outside the two named files (a later story can widen the scan).
- Moving the staging end-to-end off the PR gate (`sep-s1`), the performance budgets, deleting any legacy handler.
- Fixing any 5xx the sweep finds beyond recording it: a real defect found is either fixed in this story if it is one line, or entered on a second allow-list with its own follow-up story.

## NFRs

- **Reliability:** deterministic; no network, no real model, no clock dependence.
- **Performance:** under 60 seconds in CI.
- **Hygiene:** writes nothing inside the repository.

## Complexity Rating

**Rating:** 2 - a child-process boot probe, a source scan, and a route sweep whose first run may find real 5xx answers. **Scope stability:** Stable.
