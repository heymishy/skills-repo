# Review checklist

Each entry below records a defect this repository let through and the check that would have caught it. `scripts/review-checklist.js` lists the entries whose paths match a change, and, where an entry has a `match`, whose pattern matches a line the change adds. The listing is advisory: it tells the reviewer what to look for, and the reviewer decides whether the change meets it.

Fields: `paths` (comma-separated globs; `*` within a segment, `**` across segments), `match` (optional regular expression for an added line), `check` (what to verify), `source` (a tracked file that records the defect). Run `node scripts/review-checklist.js --check` after editing this file.

## Injectable adapter stubs throw
- paths: src/web-ui/**/*.js
- match: function set[A-Z]\w*\(
- check: the default stub for each injectable adapter throws `Adapter not wired`, the production wiring is its own task, and a test asserts the wired behaviour, not only that the setter was called.
- source: CLAUDE.md

## Session token field name
- paths: src/web-ui/**/*.js
- match: req\.session\.token[^A]
- check: routes read the GitHub token from req.session.accessToken; req.session.token is never used.
- source: CLAUDE.md

## Request-derived disk paths are contained and tested
- paths: src/web-ui/routes/**/*.js
- match: (writeFileSync|writeFile|appendFileSync|mkdirSync)\(
- check: the resolved path is asserted to start with the repository root plus a separator, a traversal returns 400 and writes nothing, and a test covers both.
- source: CLAUDE.md

## Hidden continue turns stay bounded
- paths: src/web-ui/routes/skills.js
- match: _contChain|sendTurn\("continue"
- check: the chain keeps its cap (2, or 5 when truncated), stops on an identical reply, and resets when the operator sends a turn; tests/check-ccb-s1-continue-bound.js passes.
- source: artefacts/2026-11-18-chat-continue-bound/decisions.md

## Permanent checks do not compare the branch with master
- paths: tests/**/*.js
- match: merge-base|origin/master|master\.\.\.
- check: a check that stays in the suite must not read the branch's diff against master, because it fails any later change to the same directories.
- source: artefacts/2026-11-18-chat-continue-bound/decisions.md

## Pipeline-state writers create complete feature entries
- paths: src/web-ui/adapters/pipeline-state-*writer.js
- check: a feature entry created by the writer carries slug, name, track, stage and health, so the integrity check passes.
- source: artefacts/2026-11-18-writer-complete-feature-entries/decisions.md

## Pipeline state changed through the harness
- paths: .github/pipeline-state.json
- check: story advances go through node bin/skills advance (or gate-advance across a gate); on epic-nested stories the advance is applied on master after the merge, because a branch copy can revert it.
- source: CLAUDE.md

## No conflict markers left in any file
- paths: **/*
- match: ^(<{7}|>{7})( |$)
- check: a conflict marker is a merge leftover; zero are allowed before staging, and a leftover can break a test file at parse time and hide every result in it.
- source: CLAUDE.md

## Mock responses have the production shape
- paths: tests/**/*.js
- match: setFetch\w*\(
- check: the mock payload matches what the wired endpoint actually returns, read from the wiring code, not inferred from the function signature.
- source: CLAUDE.md

## Check scripts print on a passing run
- paths: tests/check-*.js
- check: a passing check prints at least one line, so a silent pass is not mistaken for a run that never happened.
- source: workspace/learnings.md
