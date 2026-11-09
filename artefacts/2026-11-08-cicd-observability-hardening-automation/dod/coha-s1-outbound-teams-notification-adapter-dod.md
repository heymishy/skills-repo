# Definition of Done: Outbound Teams chat-notification adapter

**PR:** https://github.com/heymishy/skills-repo/pull/1060 | **Merged:** 2026-11-09
**Story:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s1-outbound-teams-notification-adapter.md
**Test plan:** artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s1-outbound-teams-notification-adapter-test-plan.md
**DoR artefact:** artefacts/2026-11-08-cicd-observability-hardening-automation/dor/coha-s1-outbound-teams-notification-adapter-dor.md
**Assessed by:** Claude Sonnet 5
**Date:** 2026-11-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ⚠️ | `returnsSuccessResult_whenWebhookRespondsWith2xx` and `dispatchReachesRealOutboundPath_viaMockWebhookListener` pass fresh (re-ran `node tests/check-coha-s1-teams-outbound-adapter.js`: 11/11 passing). The adapter's HTTP mechanics are proven against a real local mock webhook listener (a real HTTP server on a real port, not a mocked function) — but AC1's actual claim is delivery to the real Teams Incoming Webhook URL, an external effect no test in this repo can reach: no test (or even sandbox) Teams webhook URL is configured anywhere (`.env.example`, `context.yml` both checked). | `integration-real-code` (claim requires `live-verified`) | See Follow-up Actions |
| AC2 | ✅ | `reportsFailureExplicitly_onNetworkError`, `reportsFailureExplicitly_onNon2xxResponse`, `reportedFailurePropagatesToCaller_onWebhookDown` all pass fresh | `integration-real-code` | None |
| AC3 | ✅ | Confirmed directly in shipped code (`src/approval-channel/adapters/teams-outbound-adapter.js:39`): throws the exact message `'Adapter not wired: teamsNotifyAdapter. Call setTeamsNotifyAdapter() with a real implementation before use.'` — matches AC3's wording verbatim | `integration-real-code` | None |
| AC4 | ✅ | `wiringProducesBehaviourallyDistinctOutcomes_forTwoDifferentPayloads` passes fresh — asserts two different payloads produce two distinctly different webhook POST bodies at the real wiring call site (`scripts/notify-teams.js`), the correct D37 bar, not a weaker "setter was called" check | `integration-real-code` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. Confirmed against the real merged diff (`git show f2a03cf0 --stat`): only `scripts/notify-teams.js` (new), `src/approval-channel/adapters/teams-outbound-adapter.js` (new), the test file, the plan artefact, and pipeline-state.json bookkeeping were touched. The existing inbound-only `teams-adapter.js` was not touched, confirming the Architecture Constraints' explicit separation held. No Slack/other-platform target added (Out-of-Scope item 1); no message-formatting/templating for coha-s2/s3/s4's own payloads was built here (Out-of-Scope item 2).

---

## Test Plan Coverage

**Tests from plan implemented:** 11 / 11
**Tests passing in CI:** 11 / 11 (re-run fresh on current master: `node tests/check-coha-s1-teams-outbound-adapter.js` → "All 11 tests passed.")

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| returnsSuccessResult_whenWebhookRespondsWith2xx | ✅ | ✅ | |
| readsWebhookUrlFromSecretEnvVar_neverHardcoded | ✅ | ✅ | |
| reportsFailureExplicitly_onNetworkError | ✅ | ✅ | |
| reportsFailureExplicitly_onNon2xxResponse | ✅ | ✅ | |
| dispatchReachesRealOutboundPath_viaMockWebhookListener | ✅ | ✅ | Real local HTTP listener, not a mocked function |
| reportedFailurePropagatesToCaller_onWebhookDown | ✅ | ✅ | |
| wiringProducesBehaviourallyDistinctOutcomes_forTwoDifferentPayloads | ✅ | ✅ | D37 wiring test |
| sendCallTimesOutWithinBoundedWindow | ✅ | ✅ | |
| webhookUrlNeverAppearsInLogsOrErrorOutput | ✅ | ✅ | |
| everySendAttemptIsLoggedServerSide | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Outbound notification timeout (bounded) | ✅ | `sendCallTimesOutWithinBoundedWindow` confirms the call times out at 200ms in test (bounded, configurable) |
| Credential storage (`product/constraints.md` #12) | ✅ | `readsWebhookUrlFromSecretEnvVar_neverHardcoded` confirms `TEAMS_WEBHOOK_URL` is read from env, never hardcoded |
| Credential exposure in logs | ✅ | `webhookUrlNeverAppearsInLogsOrErrorOutput` confirms |
| Structural verifiability of dispatch (`product/constraints.md` #13) | ✅ | `dispatchReachesRealOutboundPath_viaMockWebhookListener` is a CI-gate-verifiable assertion (real mock listener records the call), not just a trust-the-instruction unit test |

---

## Metric Signal

`benefit-metric.md`'s Metric Coverage Matrix names `coha-s1` only against "CI/CD chain notification coverage" (`m1`). Unlike a sibling DoD run this session (urpv-s1, where `contributingStories` was found empty across the board), **this feature's `m1.contributingStories` was already correctly populated with `["coha-s1"]`** at `/definition` time, with a good evidence note already in place ("coha-s1 ships only the outbound adapter; no story yet calls it on a real CI/CD event (coha-s2 not yet implemented)."). No fix needed here — confirming this is a per-feature state, not assuming the urpv gap generalizes.

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| CI/CD chain notification coverage (m1) | ✅ (0%) | Not yet — requires coha-s2 (the actual CI/CD hook that calls this adapter on a real event) | Measurement-ready gate: **not yet**. Signal remains `not-yet-measured`, evidence note unchanged (already accurate). |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. **Live-verify AC1 (real Teams delivery):** configure a real or sandbox Teams incoming-webhook URL and confirm an actual notification is delivered and renders correctly in a real Teams channel. Requires a human to provision the webhook URL in a Teams workspace — cannot be done by an agent with no Teams workspace access. Owner: Hamish King (Platform Owner).

---

## DoD Observations

1. `coha-s1`'s own benefit-metric bookkeeping (`contributingStories`, evidence note) was already correct at merge time — worth noting as a positive counter-example to the gap found in `urpv-s1`'s DoD, confirming the gap is inconsistent across features rather than universal, and should still be checked per-feature rather than assumed fixed or assumed broken.
2. The D37 wiring test's bar (`wiringProducesBehaviourallyDistinctOutcomes_forTwoDifferentPayloads`) is exactly the correct shape per CLAUDE.md's own rule and the `tir-s1` precedent it cites — a genuinely strong test, not a weaker "setter was called" check.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Outbound Teams chat-notification adapter.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
