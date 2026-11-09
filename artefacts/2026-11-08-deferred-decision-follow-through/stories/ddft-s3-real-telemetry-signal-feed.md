## Story: Real telemetry signal feed

**Epic reference:** artefacts/2026-11-08-deferred-decision-follow-through/epics/ddft-e1-follow-through-mechanism.md
**Discovery reference:** artefacts/2026-11-08-deferred-decision-follow-through/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-deferred-decision-follow-through/benefit-metric.md

## User Story

As a **delivery engineer / platform owner reviewing what's been deferred**,
I want to **see real PostHog cost/commit-reliability data alongside a surfaced deferred item, when that data exists**,
So that **my review is informed by real signal where it exists, instead of judging every item from prose alone**.

## Benefit Linkage

**Metric moved:** Real telemetry signal feed quality
**How:** This story is the only mechanism that can deliver "scan output cites real figures when available, degrades gracefully when not" — ddft-s2's scan alone has no telemetry dimension at all without it.

## Architecture Constraints

- **Real volume already verified during /clarify, do not re-litigate**: `stage_completed` fired once in 60 days; `artefact_commit_succeeded`/`failed` once each in 3 months; `stage_started` (25 events) and `kanban_viewed` (55 events) over 3 months were healthier but still thin. This is genuinely sparse, real telemetry — not mature, not fabricated. The design must treat it as supplementary, never primary or guaranteed.
- `product/constraints.md` #12 (credentials are structural): if this pull ever runs as a CI-scheduled script (not just this interactive session), the PostHog API key lives in a secrets store, never the agent's own environment.
- Pulls `stage_completed`/`stage_started` (cost, tokens, `featureSlug`) and `artefact_commit_failed`/`succeeded` events, keyed by the deferred-item record's `linkedFeature` field (from ddft-s1's schema) — never a guessed or fuzzy-matched feature slug.
- **This story's own sparse-data finding is a candidate first real deferred-item record** once this mechanism ships (per the discovery's own note) — "pipeline telemetry events fire too sparsely to rely on — investigate whether tracking calls are wired into real skill execution" should itself be registered via ddft-s1's mechanism once this story ships, proving the epic applies to its own findings.

## Dependencies

- **Upstream:** ddft-s2 (this story enriches that scan's output; it has no standalone surface of its own).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a surfaced deferred-item record has a populated `linkedFeature` field, When the scan runs, Then it queries PostHog for `stage_completed`/`stage_started`/`artefact_commit_*` events keyed by that `featureSlug`, and if any exist, includes the real figures (cost, tokens, event counts) alongside that record in the scan output.

**AC2:** Given a surfaced record's linked feature has zero matching PostHog events (the realistic common case, given confirmed sparse volume), When the scan runs, Then it reports this honestly — e.g. "no telemetry signal found for this feature" — never a crash, and never a false "nothing happened with this feature" conclusion that overclaims what zero events actually means (could be sparse instrumentation, not necessarily zero real activity).

**AC3:** Given a surfaced record has no `linkedFeature` at all (e.g. a backlog-thread-sourced deferral with no clear feature association), When the scan runs, Then it skips the telemetry lookup for that record entirely rather than querying with an empty/invalid key.

**AC4:** Given this story ships and is run for the first time, When its own sparse-telemetry finding is confirmed again in production, Then that finding itself is registered as a new deferred-item record via ddft-s1's mechanism (`source: "capture-log"` or equivalent, `revisitCondition`: "investigate whether tracking calls are wired into real skill execution") — the concrete proof this epic applies its own mechanism to itself, not just to the two pre-seeded historical cases.

## Out of Scope

- Any new PostHog instrumentation — consumes existing events only.
- Treating PostHog data as an auto-decision input — supporting evidence for human review only, never a trigger for automated action.
- Any guarantee of data freshness/real-time telemetry — this is a periodic, bounded pull, not a live dashboard.

## NFRs

- **Performance:** PostHog query volume is bounded by the number of surfaced records per scan cycle — not expected to be a concern at this repo's current record volume.
- **Security:** PostHog API key per `product/constraints.md` #12 above; never logged, never included in the scan's own output text.
- **Accessibility:** Not applicable — CLI output.
- **Audit:** The scan output itself, including which records got real telemetry vs. a "no signal" result, is the audit trail.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
