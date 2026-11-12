# Spike Brief: Where can production errors be read reliably?

**Feature:** 2026-11-08-cicd-observability-hardening-automation
**Discovery reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/discovery.md
**Date:** 2026-11-12
**Status:** CONFIRMED by the operator (Hamish King) on 2026-11-12 ("Looks good"), unchanged from the draft. Steps 1 and 3 (production reads) still need the operator's approval at the time they run.

---

## Parent discovery context

- **Problem statement:** Production errors are noticed by luck. The only scanner built for this, the scheduled Production Log Scan (coha-s4, PR #1069), has failed on every run since it shipped.
- **Why it fails today (verified 2026-11-12):** `scripts/production-log-scan.js` runs `flyctl logs --since 24h --no-tail`; `flyctl logs` has no `--since` flag (checked against `fly logs --help`), so it exits 1, and the script discards flyctl's error text. Its tests assert the argument list against a mock and never run the real CLI.
- **Facts already known that shape the question:** `fly logs --no-tail` returns only the last ~100 lines, so even a correct call would not cover a 6-hour gap on a busy app; the earlier smt-s1 production check hit the same limit (11 of 14 migration log lines were gone). The workflow comment says "confirmed 7-day log retention", and no evidence for that claim was found; treat it as unverified. `TEAMS_WEBHOOK_URL` is empty, so a match would notify nobody. The incident record store is a file in the repo (`workspace/incidents.json`), which the running production app cannot write.
- **Assumption this spike tests:** that scheduled polling of Fly logs is a workable way to detect production errors at all.
- **Open question flagged in the incident-triage discovery:** initiative 2 owns alert generation, including production-log scanning; initiative 1 consumes incidents once they exist. Neither has a working source of real production errors.

---

## Spike question

Which source of production errors (Fly's own log buffer, a Fly log shipper to an external service, errors the app records itself, or PostHog exception events) can detect a known error pattern within one scan interval without missing events, with credentials and cost the project can accept, and should detection be a scheduled poll or recorded by the app when the error happens?

## Blocking

The redesign of coha-s4 (production-log scanning and notification). It also blocks pinning the triage drafter's provisional similarity threshold, because that needs a real recorded incident, and the first real incident should come from a working detection path.

## Type

3 — Design decision between approaches (with a type 4, real-data check, in steps 1 and 3).

## Scope

**Standard** (up to 6 steps):
1. Measure what Fly's log buffer actually holds today: line count and the oldest timestamp returned by `fly logs --no-tail` for the production app. This is a production read, so the operator approves it before it runs.
2. Read Fly's documentation on log retention and log shipping (shipper options, cost, setup). Documentation only; no account changes.
3. Check what PostHog already holds for production errors: whether exception or error events exist and are queryable, using read-only queries and the credentials the operator supplies or approves. Another production read: approval first.
4. Read the app source for how errors are logged and caught today (for example where `tenant_admin_bootstrap_failed` originates), and decide where an app-side incident record could be written from. The production app cannot write the repo file, so the candidate stores to compare are the production database and a GitHub commit.
5. Compare the candidate sources against the criteria in the done condition.
6. Write the outcome and recommendation.

## Done condition

A comparison table, not a prototype, covering at least four candidates (Fly buffer polled on a schedule, Fly log shipper to an external service, app-side recording, PostHog exception events). Each is assessed on:
1. Measured or documented retention against the scan interval, with the real Fly buffer figures from step 1.
2. Whether a known pattern (the `tenant_admin_bootstrap_failed` line, or a stand-in if it has aged out) can be matched reliably.
3. Credentials and setup needed, and whether any are already available.
4. Cost in money and in code to maintain.
5. Where a detection would be recorded and how it would reach a person without Teams (for example an incident record, a GitHub issue or an email).

The outcome ends with one recommended path, or a statement that no candidate works within scope.

## Out of scope

Building any of the candidates; changing Fly, PostHog or GitHub account configuration; Teams notification (on hold until Teams is in use); alert thresholds and the full list of error patterns; fixing the existing script (it is being disabled, not repaired); anything beyond read-only access to production.

## Constraints

- Read-only on production at every step. Each production read is approved by the operator first; a classifier denial is not worked around.
- No secrets are written to the artefact. Credentials are never pasted into output.
- No edits to `.github/pipeline-state.json` or `workspace/incidents.json` by the investigator; state changes happen afterwards through the normal commands.

## Outcome options

- **PROCEED:** one source is confirmed workable. Record the choice in the feature's `decisions.md`, and write the coha-s4 redesign story against it (real CLI or API call in the test, errors surfaced, a destination that works without Teams).
- **REDESIGN:** polling Fly logs is ruled out, but app-side recording or a shipper works. The coha-s4 story changes shape: for example the app emits an event or record when a known error occurs, and a small job reads that.
- **DEFER:** no source is workable without spend or credentials the project does not have. Production error detection stays manual, and the disabled workflow stays disabled.
