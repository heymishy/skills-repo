## Contract Proposal — Real telemetry signal feed

**What will be built:**
`ddft-s2`'s `scripts/lib/deferred-item-scan.js` output is enriched: for each surfaced record with a populated `linkedFeature`, a PostHog query (via the PostHog MCP/API already available to this repo) pulls `stage_completed`/`stage_started`/`artefact_commit_succeeded`/`artefact_commit_failed` events keyed by `featureSlug`. If events exist, real figures (cost, tokens, event counts) are attached to the record in the scan output. If zero events exist, the output states this honestly (e.g. "no telemetry signal found for this feature") without crashing or overclaiming. Records with no `linkedFeature` skip the lookup entirely.

**What will NOT be built:**
Any new PostHog instrumentation — this story consumes existing events only. Treating PostHog data as an auto-decision input — supporting evidence for human review only. Any guarantee of data freshness or real-time telemetry — this is a periodic, bounded pull, not a live dashboard.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit tests on the event-query/attach logic with a mocked PostHog response containing events; integration test running the enriched scan end-to-end | unit + integration, PostHog mocked (External-dependency) |
| AC2 | Unit test asserting a zero-events mock produces the honest "no telemetry signal found" message, not a crash or a false "nothing happened" claim; integration test confirming this doesn't break the overall scan output | unit + integration, PostHog mocked |
| AC3 | Unit test asserting a record with no `linkedFeature` skips the PostHog call entirely (never queries with an empty/invalid key); integration test confirming the record still appears in output without a telemetry section | unit + integration |
| AC4 | Integration test asserting that, on first real run, this story's own sparse-telemetry finding is registered as a new `deferred-item` record via `ddft-s1`'s mechanism (`source: "capture-log"`) | integration |

**Assumptions:**
PostHog's real event volume remains genuinely sparse (already verified during /clarify: `stage_completed` once in 60 days, `artefact_commit_*` once each in 3 months) — this story's design treats that as supplementary signal, never primary or guaranteed, and is not re-litigating that volume finding. If this pull ever runs as a CI-scheduled script rather than this interactive session, the PostHog API key lives in a secrets store, never the agent's own environment (`product/constraints.md` #12).

**Estimated touch points:**
Files: `scripts/lib/deferred-item-scan.js` (extended by `ddft-s2`, now enriched with a PostHog lookup module — new file `scripts/lib/telemetry-lookup.js`).
Services: PostHog (read-only query, existing events only).
APIs: PostHog query API.
