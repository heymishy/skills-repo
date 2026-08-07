# Story: Stop b1's real-staging outer-loop spec from hardcoding a stale stage sequence that silently skips the real `design` stage

**Epic reference:** None — short-track (bounded bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is a live-verified defect found while re-verifying `tests/e2e/b1-formed-idea-outer-loop-story-map.spec.js`'s AC3 against real `wuce-staging` after fixing the missing `MOCK_LLM_GATEWAY` deploy-config gap (2026-07-23 session, PR #571 CI investigation).
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below.

## User Story

As **an operator relying on Scenario B's CI-blocking gate (`b1-formed-idea-outer-loop-story-map.spec.js`) to give real signal about the outer-loop pipeline (discovery → benefit-metric → definition → review → test-plan → definition-of-ready)**,
I want **the spec to drive whatever stage the server's own `gate-confirm` redirect actually names, rather than a hardcoded literal stage-name sequence that has drifted out of sync with the real pipeline**,
So that **AC1-AC3 exercise the real, current stage sequence end-to-end and their pass/fail result can be trusted as real signal, not a false pass caused by mislabeled turns or a 404 caused by an unhandled stage transition**.

## Benefit Linkage

**Metric moved:** Restores real, trustworthy CI signal for Scenario B (`b1`) — currently AC3 404s and AC2 "passes" only by accident (see Root Cause) whenever this spec's real turns are exercised end-to-end (previously masked in CI by the credits-gate skip and, before that, by the missing `MOCK_LLM_GATEWAY` deploy-config gap fixed earlier in this same session).

**How:** `journey-store.js`'s real `STAGE_SEQUENCE` is `ideate → discovery → benefit-metric → design → definition → review → test-plan → definition-of-ready` — it has a `design` stage between `benefit-metric` and `definition`. `b1`'s spec assumes `benefit-metric → definition` directly (its own header comment claims "six stages," omitting `design`) and hardcodes a literal skill-name string into every `driveSkillToCompletion(request, '<literal>', sessionId, ...)` call, rather than reading the actual next-stage name from the `gate-confirm` redirect `Location` header (`/skills/:skillName/sessions/:id/chat`) as its own header comment claims it does ("It follows whatever `/api/journey/:id/gate-confirm`'s redirect Location names as the next stage"). Because turn-submission does not validate that the URL's skill-name segment matches the session's real registered `skillName`, every `driveSkillToCompletion` call from `benefit-metric` onward is silently one stage ahead of what the test believes it is driving, until the one-time `/stories` per-story-list redirect (which fires exactly once, on the real transition into `review`) lands one step late relative to the test's hardcoded expectations and produces a 404.

## Architecture Constraints

- **Test-file-only fix, in `tests/e2e/b1-formed-idea-outer-loop-story-map.spec.js`.** No server-side route, `journey.js`, or `journey-store.js` change — `STAGE_SEQUENCE`'s inclusion of `design` between `benefit-metric` and `definition` is correct, intentional, real platform behaviour (matches the documented pipeline in `CLAUDE.md` and `journey-store.js`'s own comments), not a bug to "fix" on the server side.
- **Honor the file's own stated design intent.** The header comment already claims this spec "never assumes a single persistent session spans all six stages. It follows whatever `/api/journey/:id/gate-confirm`'s redirect Location names as the next stage" — the fix should make the code actually match that claim (extract the real skill name from each redirect `Location`), not just patch around the specific `design` gap with another hardcoded literal.
- **Generalize the `/stories` redirect handling**, currently special-cased only after the (mislabeled) `definition` step, into `gateConfirmAndAdvance` itself (or an equivalent shared helper used at every transition) so it correctly applies wherever a `/stories` redirect actually occurs, independent of which hardcoded step the test author guessed it would follow.
- **Do not touch** `mock-llm-gateway.js`, `skill-turn-executor.js`, `journey-store.js`'s `STAGE_SEQUENCE`, or any fixture file under `tests/e2e/fixtures/llm-gateway/` — a `design.success.json` fixture already exists and is already correctly served; this is purely a test-file stage-tracking defect.

## Dependencies

- **Upstream:** The 2026-07-23 `mock-gateway-fixtures-deploy-fix` (this session, same day) — `MOCK_LLM_GATEWAY` was not actually active on live `wuce-staging` until that fix landed; this story's bug was masked until real turns could be driven far enough to reach the `review → test-plan` transition.
- **Downstream:** None known. Scenario B's CI gate (`b2-ci-gate-scenario-b-coverage-mapping`) already treats `b1` as its coverage source; no new consumer.

## Acceptance Criteria

**AC1:** Given `b1`'s `driveSkillToCompletion` helper, When it is invoked for any stage in the real outer-loop sequence, Then the actual skill name driven is read from the most recent `gate-confirm`/`stories` redirect `Location` header (e.g. via a regex against `/skills/([^/]+)/sessions/`), not a literal string hardcoded at the call site — so the spec self-corrects if `STAGE_SEQUENCE` changes again in the future.

**AC2:** Given the real transition into the per-story sequence (`/journey/:id/stories` redirect, which fires exactly once, on the real transition into `review`), When `gateConfirmAndAdvance` (or its replacement helper) encounters this redirect at ANY point in the sequence — not just immediately after a hardcoded `definition` call — Then it transparently performs the `POST /api/journey/:id/stories` follow-up and returns a valid session ID, with no test-site special-casing required.

**AC3:** Given AC1 test file re-run against real `wuce-staging` end-to-end, When AC1, AC2, and AC3 (the spec's existing acceptance-criteria tests, not this story's ACs) are run, Then all three complete their real turn-driving without any 404 or misrouted-turn defect, and `AC2`'s own `completedStages` bookkeeping correctly records `design` and `definition` as two distinct completed stages (not one mislabeled as the other).

**AC4:** Given the full existing test suite (`npm test`), When run after this fix, Then no previously-passing test starts failing, and the count/set of pre-existing baseline failures matches `tests/known-baseline-failures.json` (no new regressions introduced).

**AC5:** Given this fix, When re-run against real `wuce-staging` (subject to no concurrent deploy from another agent), Then `b1`'s AC1, AC2, and AC3 are reported honestly as observed — including if credits-gate or admin-identity blockers still cause a clean, accurately-reasoned skip rather than a false pass or an unexplained 404.

## Out of Scope

- Any change to `journey-store.js`'s `STAGE_SEQUENCE`, `journey.js`'s gate-confirm stage-advancement logic, or any fixture file.
- Fixing why CI's own `b1` job currently skips AC1-3 (observed during this session's investigation, reason not yet isolated — CI's compact Playwright reporter does not surface `test.skip()` reasons in its log). If that skip persists after this fix for an unrelated reason (e.g. contention on the shared `e2e-test-admin` identity across concurrent CI runs), it is a separate, follow-up investigation.
- The credits-admin-topup mechanism itself (`tests/e2e/fixtures/admin-credits-topup.js`) — already fixed by `catc-s1` (PR #568) — this story does not re-touch it.
- Any change to `a1`/`a2`/`a3`/`a4`'s own spec files.

## NFRs

- **Performance:** Neutral — same number of real HTTP calls; the redirect-parsing approach adds no additional round-trips versus the current hardcoded-literal approach.
- **Security:** None — no new attack surface; parses an already-trusted, same-origin redirect `Location` header the test already receives.
- **Cost:** Neutral — no change to the number of real/mocked model turns driven.
- **Accessibility:** Not applicable (test-file-only change).
- **Audit:** Not applicable — no change to any audited production code path.

## Complexity Rating

**Rating:** 2 — some ambiguity: the exact shape of the generalized redirect-parsing helper needs care so it doesn't silently swallow a genuine, unexpected redirect (e.g. an error page) as if it were a valid stage transition; requires a real-staging re-verification pass to confirm, not just a unit-level check.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic
