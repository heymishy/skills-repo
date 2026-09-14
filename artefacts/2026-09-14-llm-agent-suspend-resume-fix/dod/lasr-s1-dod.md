# Definition of Done: Eliminate stale-socket LLM call failures caused by Fly machine suspend/resume during a discovery session

**PR:** https://github.com/heymishy/skills-repo/pull/880 | **Merged:** 2026-09-14T01:42:38Z
**Merge commit:** 54ec4d6f915ee4a94952cad6a77398540f29d95e
**Story:** artefacts/2026-09-14-llm-agent-suspend-resume-fix/stories/lasr-s1-disable-keepalive-on-llm-agents.md
**Test plan:** artefacts/2026-09-14-llm-agent-suspend-resume-fix/test-plans/lasr-s1-test-plan.md
**DoR:** artefacts/2026-09-14-llm-agent-suspend-resume-fix/dor/lasr-s1-dor.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `_anthropicAgent` constructed with `keepAlive: false` — test T1, re-run fresh against merged master | Automated source-inspection test (`unit`) | None |
| AC2 | ✅ | `_copilotAgent` constructed with `keepAlive: false` — test T2 | Automated source-inspection test (`unit`) | None |
| AC3 | ✅ | Both agents retain `maxSockets: 4`, unchanged — test T3 | Automated source-inspection test (`unit`) | None |
| AC4 | ✅ | The rationale comment explains the real suspend/resume/stale-socket cause, not the old "reuse TLS connections" framing — test T5 | Automated source-inspection test (`unit`) | None |
| AC5 | ✅ | All four `https.request` call sites still reference `_anthropicAgent`/`_copilotAgent` via `options.agent`, unchanged in count — test T6 | Automated source-inspection test (`unit`) | None |

**All 5 ACs satisfied.** 6/6 new tests re-run fresh against merged master (commit `54ec4d6f`), 0 failures.

**Verification strength:** 6 unit (source-inspection + one runtime `https.Agent` property check), 0 integration-real-code, 0 live-verified, 0 production-observed. This story's core claim — "the first LLM call after a Fly machine resume no longer hangs on a stale socket" — was root-caused via real production log correlation (`fly logs`) but has not yet had a live post-fix confirmation, since production deploy requires separate manual approval (`bri-s2.6`). Recorded as a Follow-up Action below.

---

## Scope Deviations

None. The merged diff (`src/modules/skill-turn-executor.js` — the two-line `keepAlive` flag flip plus an updated rationale comment, `tests/check-lasr-s1-llm-agent-keepalive.js`, 3 new artefacts, `.github/pipeline-state.json`) maps directly to the story. `fly.toml`, `DEFAULT_TIMEOUT_MS`, and the existing `sse_retry_attempt` retry logic were all left untouched exactly as scoped.

---

## Test Plan Coverage

**Tests passing:** 6/6 new, re-run fresh 2026-09-14 against merged master (commit `54ec4d6f`) — `tests/check-lasr-s1-llm-agent-keepalive.js`.

**Regression coverage:** all 9 `skill-turn-executor.js`-touching test suites (`check-wuce26-per-answer-model-response.js`, `check-srmw-s1-streaming-mock-gateway-wiring.js`, `check-s6.1-cache-scope-session-threading.js`, `check-res-s3-suggest-revision-materiality.js`, `check-pla-s2-posthog-wiring.js`, `check-mgtc-s1-turn-index-cycling.js`, `check-mfc1-model-first-chat-session.js`, `check-bri-s3.1-mock-llm-gateway.js`, `check-amgt-s1-mock-gateway-toggle.js`) re-run clean before merge — all use the mock LLM gateway, so none exercise the real `https.request`/agent path, confirming this change is invisible to them exactly as expected.

**Gaps:** None against the story's own ACs.

**Full regression suite (post-merge, fresh on master, alongside `fsdn-s1`):** 654 files run, 1 failure — `tests/check-p3.5-validate-trace.js`, the pre-existing documented resource-contention flake. No new regressions.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | Accepted small per-call TCP+TLS handshake cost (~50-150ms) against multi-second call durations observed in production, in exchange for removing a 90-second failure mode |
| Security | ✅ N/A | `keepAlive: false` has no effect on TLS validation, API key handling, or any other security-relevant behaviour |
| Availability | ✅ | Directly improves availability — eliminates the specific stale-socket failure mode confirmed in production logs, with no new failure mode introduced |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track feature (per the story's own Benefit Linkage field). Directly closes a gap the operator found first-hand this session — multiple apparent "model errors" mid-`/discovery` session, root-caused via real production log correlation (`fly logs --app skills-framework` + `fly status`) to a Fly machine suspend/resume cycle interacting with a shared keep-alive HTTP agent.

---

## Outcome

**COMPLETE**

No deviations, no test gaps, no NFR gaps.

---

## DoD Observations

1. **Follow-up Action — not yet live-verified against the real production app.** This fix will auto-deploy to `wuce-staging` but production still requires manual deploy approval. Once approved, the next time the operator has an idle gap long enough for the Fly machine to suspend (observed in this session's logs as roughly 3-4 minutes) during an active `/discovery` (or any skill) session, confirm the next LLM call succeeds on its first attempt rather than hanging/erroring.
2. **The alternative fix (selective stale-socket invalidation) was deliberately rejected**, not merely deferred — see the story's Architecture Constraints for the cross-tenant blast-radius reasoning. If a future story ever wants to bring keep-alive back for performance reasons, it would need its own per-tenant or per-request agent scoping to do so safely, not a revert of this fix.
