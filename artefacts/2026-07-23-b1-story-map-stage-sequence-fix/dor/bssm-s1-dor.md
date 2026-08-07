# Definition of Ready: bssm-s1 — Fix b1's hardcoded stage-sequence assumption

## Summary

Short-track bug fix (`/test-plan → /definition-of-ready → coding agent`). Story: `artefacts/2026-07-23-b1-story-map-stage-sequence-fix/stories/bssm-s1.md`. Test plan: `artefacts/2026-07-23-b1-story-map-stage-sequence-fix/test-plans/bssm-s1-test-plan.md`.

## Root Cause (independently confirmed against real staging)

`journey-store.js`'s real `STAGE_SEQUENCE` is:

```
ideate → discovery → benefit-metric → design → definition → review → test-plan → definition-of-ready
```

`tests/e2e/b1-formed-idea-outer-loop-story-map.spec.js` assumes `benefit-metric → definition` directly (its own header comment claims "six stages," omitting `design`) and hardcodes a literal skill-name string at each `driveSkillToCompletion(request, '<literal>', sessionId, ...)` call site, rather than reading the real next-stage name from the `gate-confirm` redirect `Location` (`/skills/:skillName/sessions/:id/chat`) as its own header comment claims it does.

Turn submission (`POST /api/skills/:skillName/sessions/:id/turn`) does not validate that the URL's `:skillName` segment matches the session's actual registered `skillName` — it uses the URL segment for mock-gateway fixture lookup (`stage: skillName` in `_turnMeta`), while `gate-confirm`'s own stage-advancement logic uses the session's REAL registered `skillName` (server-side, independent of whatever the test called it). This means:

1. After `benefit-metric` completes, the real next session created is `design` — but the test calls it `'definition'`, so it fetches `definition.success.json` for what is really a `design` session.
2. `gate-confirm` correctly advances based on the REAL session name (`design`), creating a real `definition` session next — but the test again calls it `'review'`.
3. This one-stage drift continues until the ONE-TIME `/journey/:id/stories` redirect (which fires exactly once, on the real transition into `review`) lands one step later than the test's hardcoded `/stories`-handling (written only for the `definition→review` call site), causing a naive `advance.sessionId` read (`null`) at the `review→test-plan` call site — a 404.

**Live-verified evidence (this session, real `wuce-staging`, via debug instrumentation added and then reverted in the spec file):**
- `GET /api/journey/:id` immediately after driving what the test called a `'definition'` turn showed `activeSkill: "definition"` and `completedStages: [discovery, benefit-metric, design]` — i.e. the session the test just drove was REALLY `design`, and `gate-confirm` had already (correctly) advanced past it.
- The `review→test-plan` submission failed with `Received: 404`, immediately after `gateConfirmAndAdvance` returned `{"nextLocation":"/journey/.../stories","sessionId":null}` — confirming the `/stories` fallback fires one step later than the test's hardcoded handling expects.

**AC2 currently "passes" only by accident:** its canvas-content assertions happen to still pass because the mock fixture requested (by URL segment, not by the session's real name) still contains valid epic/story canvas markup — but its `completedStages` bookkeeping silently records the wrong stage name throughout.

## The Fix

1. Add a small helper, e.g. `_extractSkillNameFromRedirect(location)`, using the same regex shape as the existing `sessionIdFromChatPath` (`/\/skills\/([^/]+)\/sessions\//`), and use it at every `driveSkillToCompletion` call site instead of a hardcoded literal — so the spec drives whatever stage the server actually names, matching its own header comment's claimed design.
2. Fold the `/stories` redirect handling into `gateConfirmAndAdvance` itself (or an equivalent shared helper invoked at every transition) so it transparently follows the `POST /api/journey/:id/stories` step wherever it actually occurs, rather than being special-cased only at the `definition→review` call site.
3. Do not change `journey-store.js`, `journey.js`, or any fixture file — `STAGE_SEQUENCE`'s `design` stage is correct, real platform behaviour.

## Acceptance Criteria Coverage

| AC | Verified by |
|----|-------------|
| bssm AC1 | T1 — real-staging re-run confirms `design` is now correctly driven as its own distinct stage |
| bssm AC2 | T2 — real-staging re-run confirms `/stories` is followed transparently regardless of which call site it occurs at |
| bssm AC3 | T3 — full AC1→AC3 real drive completes with no 404 and correct `completedStages` bookkeeping |
| bssm AC4 | T4 — full `npm test`, diffed against `tests/known-baseline-failures.json` |
| bssm AC5 | T5 — `b1`'s own AC1/AC2/AC3 tests re-run against real staging, reported honestly in `decisions.md` |

## Coding Agent Instructions

1. Implement the fix described above in `tests/e2e/b1-formed-idea-outer-loop-story-map.spec.js` only.
2. Do not touch `journey-store.js`, `journey.js`, `mock-llm-gateway.js`, or any fixture file under `tests/e2e/fixtures/llm-gateway/`.
3. Re-run `b1`'s own AC1, AC2, AC3 tests against real `wuce-staging` (`E2E_STAGING_BASE_URL` override) — space out repeated local runs to respect the real per-IP signup rate limiter (10 attempts/5 min). Report the real, observed result for each — including an honestly-reasoned skip if credits or admin-identity provisioning blocks it, per this repo's skip-not-fail precedent.
4. Confirm `completedStages` now correctly records `design` and `definition` as two distinct entries, in order, for AC2/AC3's full drive.
5. Run `npm test` and diff against `tests/known-baseline-failures.json` — confirm zero new regressions.
6. Update `.github/pipeline-state.json` with a new flat `feature.stories[]` entry for `bssm-s1` (per cdg.6/cdg.7 — use `node bin/skills advance` / `node bin/skills gate-advance`, not a direct JSON write).
7. Append a `workspace/capture-log.md` entry (source: agent-auto) documenting the root cause and fix.
8. Commit, push to a new branch (`fix-forward-b1-stage-sequence-mismatch`), open a **draft PR** against `master`.
9. Per this repo's own mandatory convention: if you report the task as finished, waiting, or blocked, expect independent verification via `git status`/`git log`/`gh pr view` before that report is trusted — do the real work, not just the narration.

## Definition of Ready Sign-off

- [x] Story exists and is complete (`stories/bssm-s1.md`)
- [x] Test plan exists and is complete (`test-plans/bssm-s1-test-plan.md`)
- [x] Root cause independently confirmed (real-staging debug instrumentation, reproducing evidence captured above)
- [ ] Fix implemented and verified GREEN against real staging — pending coding-agent dispatch
- [x] No contradiction between DoR contract and test plan required touchpoints (single file touched: `tests/e2e/b1-formed-idea-outer-loop-story-map.spec.js`)
- [x] Conflict-marker scan not applicable (no merge/rebase/cherry-pick performed yet)
- [x] Human oversight level: Low (single-file, test-only fix with a clearly reproduced, real-staging-verified root cause; short-track)

**Proceed:** Yes
