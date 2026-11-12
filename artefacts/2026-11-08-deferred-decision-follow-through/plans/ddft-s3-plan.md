## Implementation Plan: Real telemetry signal feed

**Story reference:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s3-real-telemetry-signal-feed.md
**Test plan reference:** artefacts/2026-11-08-deferred-decision-follow-through/test-plans/ddft-s3-real-telemetry-signal-feed-test-plan.md
**DoR reference:** artefacts/2026-11-08-deferred-decision-follow-through/dor/ddft-s3-real-telemetry-signal-feed-dor.md

---

## File map

| File | Change |
|------|--------|
| `scripts/lib/telemetry-lookup.js` | New module: `buildQuery`, `summarizeRows`, `formatTelemetry`, `createPostHogQueryClient` (real HTTP client for PostHog's query API), `clientFromEnv`, `enrichRecord`, `registerSparseTelemetryFinding` |
| `scripts/lib/deferred-item-scan.js` | Add `--telemetry` flag and an async `scanFileWithTelemetry`; the default (no flag) path is unchanged |
| `tests/check-ddft-s3-real-telemetry-signal-feed.js` | New tests; every enrichment assertion runs the real scan as a child process against a local HTTP server standing in for PostHog |

---

## Real telemetry source

PostHog's HogQL query endpoint, `POST {host}/api/projects/{id}/query/` with a personal API key as a Bearer token. The repo only holds the write-only project capture key (`POSTHOG_KEY`), which cannot read events, so the read side needs `POSTHOG_PERSONAL_API_KEY` and `POSTHOG_PROJECT_ID` (neither is a repo secret today). Without them the scan prints "telemetry not configured" per record and carries on. Event and property names (`featureSlug`, `costUsd`, `inputTokens`, `outputTokens`) were checked against the emitters in `src/web-ui/routes/journey.js` and against the live PostHog project.

## Task 1 -- failing tests first (AC1-AC4 plus degradation and key-safety)

Write the test file. Run it -- expected: fails (module missing).

## Task 2 -- telemetry-lookup module

Exact-equality query using a HogQL value placeholder (never string interpolation, never fuzzy). Zero rows reports "no telemetry signal found for this feature" and notes zero can mean sparse instrumentation. A query error is reported as "telemetry lookup failed", never as zero events. Empty or blank `linkedFeature` skips the lookup.

## Task 3 -- scan wiring (separate task, per the wiring rule)

`main` calls `scanFileWithTelemetry` when `--telemetry` is passed. AC4: when at least one lookup succeeded and every successful lookup returned zero events, register one `deferred-item` (source `capture-log`, revisitCondition naming the investigation) through `incident-store`, once only (deduplicated by trigger).

## Task 4 -- verify

Run the test file, grep that each new function has a production caller, then `npm test`.
