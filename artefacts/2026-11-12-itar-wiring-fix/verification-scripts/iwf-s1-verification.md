# AC Verification Script: Wire triage drafting to incident creation

**Story:** artefacts/2026-11-12-itar-wiring-fix/stories/iwf-s1-wire-triage-drafting-to-incident-creation.md
**Date:** 2026-11-12
**Time to run:** under 5 minutes, terminal only. Every scenario uses a scratch file so the real `workspace/incidents.json` is never changed.

## Setup

Open a terminal in the repo root. Pick a scratch path, for example `$env:TEMP\iwf-demo.json` in PowerShell. The configured test runner is `node scripts/run-all-tests.js`; this story's own check is `node tests/check-iwf-s1-incident-recording.js`.

## Scenario 1 — record an incident and see its triage summary (AC1, AC2)

1. Run `node scripts/create-incident.js --trigger "checkout timing out" --summary "db connection pool exhausted" --tags db,timeout --file $env:TEMP\iwf-demo.json`.
2. The command should print a new record id and a triage summary, and finish without an error.
3. For a first-ever incident the summary should say no relevant prior incident was found.
4. Open the scratch file. It should hold one record with `"type": "incident"` and the same summary.

## Scenario 2 — a second, similar incident points back to the first (AC5)

1. Run the same command again with `--tags db,timeout,retry` and the same `--file`.
2. The printed summary should name the first incident's id as a similar prior incident.
3. In the scratch file, the second record's `priorIncidentLinks` should list the first record's id.

## Scenario 3 — deferred items are not treated as incidents (AC3)

1. Copy the real file to a scratch file: `Copy-Item workspace/incidents.json $env:TEMP\iwf-mixed.json`. It holds two deferred items and no incidents.
2. Run the command with `--file $env:TEMP\iwf-mixed.json` and `--tags pipeline-state,integrity-check,tfhc-s1` (the same tags as the real deferred item).
3. The summary should say no relevant prior incident was found, and `priorIncidentLinks` should be empty. If the deferred item appears as a prior incident, the filter is broken.

## Scenario 4 — bad input writes nothing (AC2)

1. Run the command with no `--trigger`. It should print an error naming the missing option and exit with a failure code (`$LASTEXITCODE` is not 0).
2. Run it with a very long `--tags` value (more than the allowed length). It should print a tag-length error, and the scratch file should be unchanged.

## Scenario 5 — a failed draft never loses the incident (AC4)

This is covered only by the automated test (UT5), because it needs the draft step to fail on purpose. Run `node tests/check-iwf-s1-incident-recording.js` and confirm the line for UT5 shows a tick.

## Reset

Delete the scratch files. Confirm `git status` shows `workspace/incidents.json` unmodified.
