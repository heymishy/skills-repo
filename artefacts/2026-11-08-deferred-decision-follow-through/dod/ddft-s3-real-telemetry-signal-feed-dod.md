# Definition of Done: Enrich the deferred-item scan with real telemetry

**PR:** https://github.com/heymishy/skills-repo/pull/1083 | **Merged:** 2026-11-12 (merge commit d5fa1421e)
**Story:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s3-real-telemetry-signal-feed.md
**Test plan:** artefacts/2026-11-08-deferred-decision-follow-through/test-plans/ddft-s3-real-telemetry-signal-feed-test-plan.md
**DoR artefact:** artefacts/2026-11-08-deferred-decision-follow-through/dor/ddft-s3-real-telemetry-signal-feed-dor.md
**Assessed by:** Claude (against merged code on master at d5fa1421e)
**Date:** 2026-11-12

---

## AC Coverage

Verification-strength tags: `unit` = against fixtures; `integration-real-code` = the real scan script run as a child process, with the real HTTP client talking to a local mock server standing in for PostHog; `live-verified` = confirmed against a real running instance; `production-observed` = observed in production. The script has never queried live PostHog, so no AC has `live-verified` evidence.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ⚠️ | AC1 (Acceptance Criterion 1: for a surfaced record with a `linkedFeature`, the scan queries PostHog for `stage_completed`, `stage_started` and `artefact_commit_*` events keyed by that feature slug and shows the real figures). Tests buildsExactFeatureSlugQueryNeverFuzzyMatched, formatsRealEventsIntoFigures and enrichesScanOutputWithRealFiguresWhenEventsExist pass; the last drives the real scan with `--telemetry` and asserts the request path, the Bearer header and the exact slug value. Strength: `integration-real-code`. | Automated test `tests/check-ddft-s3-real-telemetry-signal-feed.js` (12 passed, 0 failed, re-run on merged master) | The script has never been run against live PostHog. The event names and result shape were checked against the emitters in `src/web-ui/routes/journey.js`, and the build agent ran the same aggregate query once through the PostHog MCP to confirm the shape, but the script's own client needs `POSTHOG_PERSONAL_API_KEY` and `POSTHOG_PROJECT_ID`, and neither is a repo secret. |
| AC2 | ✅ | AC2 (Acceptance Criterion 2: zero matching events is reported honestly, never a crash and never a false "nothing happened"). reportsZeroEventsHonestlyWithoutOverclaiming and enrichesScanOutputWithHonestZeroSignalMessage pass: the output reads "no telemetry signal found for this feature" with a note that zero can mean sparse instrumentation. unconfiguredOrUnreachableDegradesHonestlyAndNeverRegisters shows a failed lookup is reported as "telemetry lookup failed" and is never read as zero events. Strength: `integration-real-code`. | Automated test | None |
| AC3 | ✅ | AC3 (Acceptance Criterion 3: a record with no `linkedFeature` is skipped for telemetry entirely). skipsLookupWhenNoLinkedFeature and neverQueriesPostHogForRecordWithoutLinkedFeature pass; the second asserts the mock server received no request for that record. Strength: `integration-real-code`. | Automated test | None |
| AC4 | ⚠️ | AC4 (Acceptance Criterion 4: when the sparse-telemetry finding is confirmed again in production, it is registered as a new deferred-item via ddft-s1's mechanism). selfRegistersSparseTelemetryFindingAsNewDeferredItemRecord and doesNotRegisterWhenEventsWereFound pass, on temporary files. Strength: `integration-real-code`. | Automated test | The AC's "when confirmed again in production" is vague, and the build agent's reading is: register one deferred-item (`source: capture-log`, `linkedStory: ddft-s3`, with the required `revisitCondition`) only when at least one lookup succeeded and every successful lookup was empty, deduplicated by trigger. No production run has happened, so "confirmed in production" is untested. |

**Verification strength summary:** AC2 and AC3 `integration-real-code`; AC1 and AC4 `integration-real-code` but marked ⚠️ because no run has reached live PostHog; 0 `live-verified`; 0 `production-observed`. UI-evidence gate: N/A, no browser-observable ACs.

---

## Scope Deviations

None against the story's Out of Scope list. The PR changed four files: `scripts/lib/telemetry-lookup.js` (new), `scripts/lib/deferred-item-scan.js` (a `--telemetry` flag; without the flag the scan is unchanged and makes no calls, which a test asserts), `tests/check-ddft-s3-real-telemetry-signal-feed.js` (new) and the plan. One behaviour change worth stating plainly: **with `--telemetry` the scan is no longer read-only.** If every successful lookup is empty it writes a new deferred-item into the file it scans. The registration is tested only on temporary files, and the real file's hash is asserted unchanged when no key is configured.

---

## Test Plan Coverage

**Tests from plan implemented:** the test plan registered 9 tests; the test file implements 12. I did not map the plan's 9 names one to one against the 12.
**Tests passing:** 12 / 12, re-run locally on merged master; ddft-s2's own test still passes 10/10. The build agent reported RED first (the module was missing). Re-run by me: `node scripts/lib/deferred-item-scan.js --telemetry` with no key set printed "telemetry not configured" for the `tfhc-s1` record and left `workspace/incidents.json` unchanged (file hash compared before and after). Final CI results for PR #1083 were not re-inspected; the operator merged it.

**Gaps (tests not implemented):** none identified apart from the live-PostHog run.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security: the API key is never printed | ✅ | Test realCommittedFileNeverWrittenAndKeyNeverInOutput checks the key is absent from output. |
| Correctness: exact matching only | ✅ | The query uses exact equality on a value placeholder, with no fuzzy matching (buildsExactFeatureSlugQueryNeverFuzzyMatched). |
| Honesty of the signal: sparse versus failed | ✅ | A failed lookup is never read as zero events (AC2 evidence). |
| Credentials: a read client needs a personal PostHog API key | ⚠️ | No such secret exists in the repo or its workflows. The only PostHog key is the write-only capture key. Until an operator supplies `POSTHOG_PERSONAL_API_KEY` and `POSTHOG_PROJECT_ID`, the feature prints "telemetry not configured". |

---

## Metric Signal

No metric in the feature's `metrics[]` lists ddft-s3 as a contributor.

**Telemetry enrichment of the review scan**
Signal: not-yet-measured
Evidence note: the enrichment works against a mock that follows the real response shape, but no real query has been made from the script, so no real figures have appeared in a scan.
Date measured: null

---

## Outcome

**COMPLETE WITH DEVIATIONS**

ACs satisfied: 4/4 in substance. AC2 and AC3 are ✅; AC1 and AC4 are ⚠️. Nothing is ❌. The deviation is that the feature has never run against live PostHog and cannot until credentials are supplied.

**Follow-up actions:**
1. Supply `POSTHOG_PERSONAL_API_KEY` and `POSTHOG_PROJECT_ID` (and optionally `POSTHOG_HOST`) in a local shell, run `node scripts/lib/deferred-item-scan.js --telemetry`, and check the output against PostHog. Note that the first real run will probably write the sparse-telemetry deferred-item, because neither seeded record's linked feature has events today. Owner: operator.
2. Decide whether a scan that writes is acceptable under the name "scan", or whether registration should be a separate command. Owner: operator.

---

## DoD Observations

1. **The tests prove the client and the formatting, not the live service.** The mock follows a shape confirmed once against real data, but a change on PostHog's side would not be caught by any test.
2. **The agent that built this story read from the live PostHog project once, through the PostHog MCP, to confirm the shape.** It was a read-only aggregate query and was not specifically cleared with the operator beforehand. Recorded here so the operator knows it happened.
3. **Not verified here:** no live PostHog run from the script, no scheduled use, and per-check CI results for the merged PR.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Enrich the deferred-item scan with real telemetry".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
