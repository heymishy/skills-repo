# wfe-s1 Definition of Done

Date: 2026-11-18. Story: a feature the web app records in `pipeline-state.json` is complete enough to pass the repository's own checks. Source issue #1146. Pull request #1147 merged 2026-11-18 (`5e9a5a398`); issue #1146 is closed by it (verified: `closingIssuesReferences` showed [1146] and the issue reads CLOSED). The change touches the two pipeline-state writers and adds one test.

## Result: COMPLETE

All five acceptance criteria (AC, Acceptance Criterion) were verified by 7 new automated tests, the existing suites and CI before merge. All 10 checks on the pull request passed, including the three required jobs.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 (new entry has every required field, update values win) | ✅ | `check-wfe-s1-complete-feature-entries` T1a to T1c, through the github writer with a stubbed Contents API: a new feature gets `name`, `track: standard`, `stage: discovery`, `health: green` plus the update's own fields; a named `stage`, `health` and `name` win; a non-string `name` falls back to the slug; every field in the schema's required list is present. Red first: 6 of 7 tests failed before the change | automated | none |
| AC2 (existing feature untouched) | ✅ | T2: an existing `track: short`, `stage: review` feature receiving `{ health: red }` changes only `health`; no second feature is created | automated | none |
| AC3 (passes the repository's own validators) | ✅ | T3a: the real `check-pipeline-state-integrity.js`, copied into a temporary root with the schema, reports no C11, C15 or C16 for the produced state; T3b: every feature in it has every schema-required field | automated (real script) | none |
| AC4 (local file-system writer) | ✅ | T4: in a temporary git checkout the local writer creates the same complete entry | automated | none |
| AC5 (existing tests unchanged) | ✅ | `check-wsd-s2-github-pipeline-state-writer` (27) and the 11 other tests that touch either writer pass unchanged; integrity script 828 stories, 0 fail; lint clean | automated | none |

## Observations and follow-ups

- **Not proved live.** The production path is proved against a stubbed GitHub API, as `check-wsd-s2` does. The first live confirmation is the next feature started in the app: its commit to `pipeline-state.json` should carry `name`, `track`, `stage` and `health`, and master's checks should stay green.
- **Why master went red.** The first feature the app wrote (`new-feature-c2a2815d`, `dbea58fcb`) was `{ slug, id, discoveryStatus, artefact }`, which failed the integrity check, trace validation's schema check and `check-bfl-s2` on every open pull request until hand repairs `935c260d5` (track, name, health) and `42ff38856` (stage). My first repair missed `stage` because I read only the integrity script's failures, not the schema's full required list; the second was found by reading the CI trace log.
- **Open questions, not decided here (in `decisions.md`):** whether the app should write an entry for an artefact it has not committed (that entry's discovery artefact is not in the repository), and whether the writer should validate the whole state before pushing it.
- **Default assumption:** a feature started in the app is `track: standard`.

## Scope Deviations

- None.
