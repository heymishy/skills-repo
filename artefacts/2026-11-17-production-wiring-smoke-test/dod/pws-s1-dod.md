# pws-s1 Definition of Done

Date: 2026-11-17. Story: a production-wiring smoke test in the unit chain. PR #1133, merged to master on 2026-11-16 at 17:43 UTC (`2ae700acf`). The change adds a script and tests only and changes no production module, so there is no deploy to check.

## Result: COMPLETE

AC1 to AC6 (Acceptance Criteria 1 to 6) were verified by 6 automated tests before merge (see `reference/pws-s1-verify-completion-evidence.md`), and all 9 checks of the PR passed on Linux CI, including "Lint, typecheck, test, build" which runs the new test and the four files that fail locally for lack of a working bash.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | T1: every throwing stub's setter is called at boot or allow-listed with a reason; mutation run (removing the `setGetCommitResult` wiring) made it fail naming the setter | automated | the allow-list holds 7 reasoned entries, not the empty list the story expected (recorded in `decisions.md`) |
| AC2 | ✅ | T2: no stale entry in either list; both stale shapes reported on synthetic input | automated | none |
| AC3 | ✅ | T3: the 7 skill-session probes answer 404, 410, 200 or 303, never 5xx, never "Adapter not wired" | automated | none |
| AC4 | ✅ | T4: 99 route patterns, about 1,100 requests, no unexplained 5xx | automated | `POST /api/skills/{id}/execute` skipped (starts a real CLI); `/products/{id}/repo/create` and `/agency/clients/{id}/invite` allow-listed (wired only outside test mode) |
| AC5 | ✅ | T5: an unwired, un-allow-listed stub is reported | automated | none |
| AC6 | ✅ | T6: in the unit chain, boot under 60 s (about 4 to 6 s), `HEAD` and `git status` unchanged | automated | none |

## Source Issue Closure

No source issue.

## Observations and follow-ups

- Not covered by this check (stated in the story): wiring that exists only under a real production environment (Postgres, GitHub, PostHog), adapter modules other than `adapters/skills.js` and `routes/skills.js`, and the three routes above.
- Three small follow-ups recorded in `decisions.md`: `defaultListSkills` returns an empty list instead of throwing (against the adapter rule); the `_nextQuestionExecutor` stub message names the wrong setter; `POST /api/skills/{unknown}/execute` answers 500 rather than 404.
- `sep-s1` (moving the staging end-to-end Scenario A and B to run after deploy) was blocked on this story and can now go ahead.

## Scope Deviations

None.
