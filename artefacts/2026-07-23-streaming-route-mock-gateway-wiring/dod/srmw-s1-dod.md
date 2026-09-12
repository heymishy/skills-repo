# Definition of Done: Wire {stage, scenarioName} into handlePostTurnStreamHtml so MOCK_LLM_GATEWAY actually activates for the real chat UI's streaming turn endpoint (srmw-s1)

**PR:** https://github.com/heymishy/skills-repo/pull/560 | **Merged:** 2026-07-23 (merge commit `dc783db25afcad5b655fc5af909f0c0ba77b7abb`)
**Story:** artefacts/2026-07-23-streaming-route-mock-gateway-wiring/stories/srmw-s1.md
**Test plan:** artefacts/2026-07-23-streaming-route-mock-gateway-wiring/test-plans/srmw-s1-test-plan.md
**DoR:** artefacts/2026-07-23-streaming-route-mock-gateway-wiring/dor/srmw-s1-dor.md
**Assessed by:** Claude Sonnet 5 (agent) — retroactive DoD, written 2026-09-12, ~7 weeks post-merge
**Date:** 2026-09-12

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `options.stage` threaded from `session.skillName`, differentiated across two sessions (`discovery` vs `review`) | `tests/check-srmw-s1-streaming-mock-gateway-wiring.js`, re-run fresh — passing | None |
| AC2 | ✅ | `options.scenarioName` defaults to `'success'`, overridden by `session.mockScenarioName` | Same file, re-run fresh — passing | None |
| AC3 | ✅ | Real streaming turn with `MOCK_LLM_GATEWAY=true` (real `skill-turn-executor.js` + real `mock-llm-gateway.js`) returns `discovery.success.json`'s fixture text, `https.request` never invoked | Same file, re-run fresh — passing | None |
| AC4 | ✅ | Full regression pass at merge time: 372 files run, 36 failed, identical set to `tests/known-baseline-failures.json` (per `decisions.md`) | Full suite run at merge time | None |
| AC5 | ✅ | Real `wuce-staging` (v66) redeployed and driven with a genuine production streaming-turn request (`e2e-test-admin` identity) — SSE response streamed `discovery.success.json`'s deterministic fixture text verbatim, not a real model response | Real, live-verified staging confirmation (per `decisions.md`'s VERIFICATION entry, 2026-07-23) | None |

**Full re-run on current master (2026-09-12):** `tests/check-srmw-s1-streaming-mock-gateway-wiring.js` — 3/3 passing. Sibling regression suites `tests/check-bri-s3.1-mock-llm-gateway.js` (20/20) and `tests/check-s6.1-cache-scope-session-threading.js` (all passing) both re-confirmed clean.

---

## Scope Deviations

None. Confirmed via `gh pr view 560 --json files`: the merged diff touches exactly `src/web-ui/routes/skills.js` (10 lines — the two-line `_turnOptions.stage`/`_turnOptions.scenarioName` addition plus comments), the new test file, this feature's own artefact folder, `decisions.md`, `workspace/capture-log.md`, and `pipeline-state.json` bookkeeping. No change to `mock-llm-gateway.js`, `skill-turn-executor.js`, `server.js`, or SSE framing, matching the story's own Architecture Constraints exactly.

---

## Test Plan Coverage

**Tests from plan implemented:** 5/5 (AC1-AC5, including the deploy-dependent AC5/E2E1)
**Tests passing:** 3/3 automated (own suite, re-run fresh on current master) + full regression baseline-match (AC4) + real-staging confirmation (AC5)

**Gaps:** None against the story's own scope.

---

## NFR Status

No NFR-specific behaviour introduced — this is a two-line options-wiring fix, per the test plan's own "NFR Tests: None beyond IT2" note. No new application logic, no new data classification, no new security surface.

---

## Metric Signal

Reuses the parent feature's own metric (`2026-07-23-e2e-core-journey-coverage`'s m1 — real, staging-verified E2E coverage), per the story's own Benefit Linkage. This story's fix directly enables that metric by closing the last remaining gap in the mock-gateway-on-staging chain (Docker fixtures + adapter wiring from `mgfd-s1`; options wiring from this story) — confirmed working end-to-end via the real AC5 staging verification.

---

## Outcome

**COMPLETE**

All 5 ACs satisfied with real, honest evidence at every level (unit, integration, and genuine real-staging confirmation) — no deviations, no scope gaps, no fabricated passes.

**Follow-up actions:** None from this story itself. This closes "the last link in this session's mock-gateway-on-staging chain" per its own `decisions.md`, unblocking re-verification of a3's/a4's previously-skipped AC3-class assertions.

---

## DoD Observations

1. **This story's own bookkeeping regressed after merge — the same class of gap found and fixed for `eatrl-s1` earlier in this session.** The PR's own merge commit correctly wrote `pipeline-state.json` (35 additions, per `gh pr view 560`), but the current file showed `srmw-s1` at `stage: definition-of-ready, prStatus: none` — as if the PR had never merged. Found only because the operator, reviewing a health-audit report describing `srmw-s1` as "signed-off-but-unimplemented," said "no PRs I can see" — prompting a direct `gh pr view 560` check that revealed a real merge 7 weeks earlier, with a fully-working fix, a real passing test file, and a genuine real-staging AC5 confirmation already on record in `decisions.md`. No implementation work was needed here at all — this was a pure bookkeeping/DoD-writing catch-up.
2. This is the second such case found in one session (after `eatrl-s1`), both apparently caused by the same underlying `pipeline-state.json` merge-conflict-resolution class of bug this repo has documented multiple times (a later PR's conflict resolution picking the wrong side and reverting an unrelated story's fields backward). **Strong candidate for `/improve`:** a periodic reconciliation pass cross-referencing every story's `prUrl` against a live `gh pr list --state merged` fetch would catch this class of drift without depending on `pipeline-state.json`'s own internal self-consistency, which is exactly the field that gets corrupted.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Wire {stage, scenarioName} into handlePostTurnStreamHtml" (srmw-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is AC5's real-staging verification credible and independently corroborated (not just asserted)?
3. Is the outcome verdict (COMPLETE) consistent with the AC and deviation rows?
4. Is the DoD Observation about post-merge bookkeeping regression an accurate, non-speculative account?
Report findings as HIGH / MEDIUM / LOW.
```
