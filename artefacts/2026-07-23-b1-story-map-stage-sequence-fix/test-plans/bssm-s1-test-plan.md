# Test Plan: bssm-s1 — Fix b1's hardcoded stage-sequence assumption

## Scope

Modified test file: `tests/e2e/b1-formed-idea-outer-loop-story-map.spec.js` (no new standalone Node unit-test file — this is a real-staging Playwright E2E spec; its own AC1-AC3 tests, re-run against real `wuce-staging`, are this fix's own verification).

## Preconditions

- Real `wuce-staging` deployment with `MOCK_LLM_GATEWAY=true` genuinely active (confirmed live this session, 2026-07-23 — see `mock-gateway-fixtures-deploy-fix` decisions).
- The `catc-s1` credits-admin-topup tenant-check fix already merged (PR #568) — AC1-3's real-turn attempts should not be credit-blocked given a working top-up.
- Real per-IP signup rate limiter (10/5min) applies to any local re-verification without the CI-only rate-limit-bypass header — space out repeated local runs accordingly.

## Test Cases

| ID | AC | Scenario | Expected | Type |
|----|----|----------|----------|------|
| T1 | bssm AC1 | `driveSkillToCompletion` / `gateConfirmAndAdvance` after `benefit-metric` completes | The next stage driven is read from the redirect `Location` (`design`), not a hardcoded `'definition'` literal | Behavioural (real staging) |
| T2 | bssm AC2 | Gate-confirm transition into per-story sequence (real transition into `review`, wherever it actually occurs in the driven sequence) | `/stories` redirect is followed transparently by the shared helper; no test-site special-casing needed at any specific call site | Behavioural (real staging) |
| T3 | bssm AC3 | Full AC1 → AC2 → AC3 real drive against staging (discovery → benefit-metric → design → definition → review → test-plan → definition-of-ready) | No 404 at any turn submission; `completedStages` records `design` and `definition` as two distinct entries in the correct order | Behavioural (real staging) |
| T4 | bssm AC4 | Full `npm test` | No new regressions vs. `tests/known-baseline-failures.json` | Full suite |
| T5 | bssm AC5 | `b1`'s own AC1/AC2/AC3 tests, re-run against real `wuce-staging` after the fix | Each reports a real pass, or an honestly-reasoned skip (credits/admin-identity) — no 404, no silently-mislabeled bookkeeping | E2E (real staging, reported in `decisions.md`) |

## TDD / Verification Discipline

T1-T3 were reproduced RED first this session via ad-hoc debug instrumentation directly against real `wuce-staging` (not a local mock): confirmed `GET /api/journey/:id` showed `activeSkill: "definition"` / `completedStages: [discovery, benefit-metric, design]` immediately after driving what the test called a `'definition'` turn (i.e. the session was actually registered server-side as `design`, silently mislabeled by the test's hardcoded literal) — and confirmed the review→test-plan transition's 404 by tracing the exact `gate-confirm` redirect (`/journey/:id/stories`) landing one step later than the test's hardcoded `/stories`-handling expected. Both findings are the direct, reproducing evidence this story's root cause rests on — see this session's investigation transcript and `decisions.md`.

Post-fix, T1-T3 should be re-run against the same real staging environment (not a mock) since the defect is specifically about how the test tracks REAL server-assigned stage names across REAL gate-confirm redirects — a local/mocked unit test cannot exercise the actual `journey-store.js` `STAGE_SEQUENCE` interaction this bug depends on.

## Data/Fixture Notes

No new fixtures. `design.success.json` (already present in `tests/e2e/fixtures/llm-gateway/`) will now be correctly requested and consumed as its own distinct stage for the first time in this spec's real run — previously it was silently substituted-for by whatever fixture the test's mislabeled URL happened to request instead.

## Out of Scope for This Test Plan

- CI's own current skip reason for `b1`'s AC1-3 (observed but not yet isolated this session — CI's compact reporter doesn't surface `test.skip()` reasons). If this fix doesn't change that outcome, it's a separate follow-up investigation, not a regression of this fix.
- Any change to `journey-store.js`, `journey.js`'s gate-confirm logic, or fixture files (see story's Out of Scope).
