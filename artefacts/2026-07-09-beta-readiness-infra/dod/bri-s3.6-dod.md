# Definition of Done: Auth journey spec

**PR:** https://github.com/heymishy/skills-repo/pull/450 | **Merged:** 2026-07-10
**Story:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.6-auth-journey.md
**Test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.6-auth-journey-test-plan.md
**DoR artefact:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s3.6-auth-journey-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | First-time GitHub OAuth login redirects to `/welcome` (fixed behaviour from commit `f845caf7`) | automated test | None |
| AC2 | ✅ | Returning GitHub OAuth login redirects straight to `/dashboard`, not `/welcome` — the specific regression this spec exists to prevent | automated test | None |
| AC3 | ✅ | Expired/invalidated session redirects to re-authenticate rather than a silent failure or dead-end error page | automated test | None |
| AC4 (Acceptance Criterion 4) | ✅ | `accessToken` never appears in HTML response body or captured logs, across GitHub/Google/email-password | automated test (structural token-leak check, group IT3) | None |
| AC5 | ✅ | Spec tagged `@mocked`, real GitHub/Google OAuth endpoints stubbed; spec still drives a real browser through the redirect chain | E2E spec present and correctly tagged, with an explicit safety net that aborts if it ever attempts a real github.com/google OAuth domain call (`maxRedirects: 0` on the initial hop) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

None. This story explicitly and correctly self-corrects a wrong "Better Auth" assumption from the original brief (this repo uses a roll-your-own OAuth stack, per `landing-auth-billing/decisions.md`'s ARCH-002 — a feature-local decision, not the global ADR-002) rather than perpetuating a test plan built against a library the codebase doesn't use. Reviews clean: 0 HIGH findings both runs; 1 MEDIUM in run 1 resolved by run 2.

---

## Test Plan Coverage

**Tests from plan implemented:** 22 / 22
**Tests passing in CI:** 18 / 18 node-runnable + 1 E2E spec (re-verified directly against current master, 2026-07-14)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `check-bri-s3.6-auth-journey.js` | ✅ | ✅ (18/18) | `rotateSessionId` called exactly once per provider (GitHub/Google/email); first-login vs returning-user redirect; `accessToken` absence across all three providers; zero real OAuth-endpoint HTTP calls under `@mocked` |
| `tests/e2e/bri-s3.6-auth-journey.spec.js` | ✅ | Present, tagged `@mocked` | Real-OAuth-domain abort safety net confirmed present |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| GitHub/Google OAuth and email/password login flows covered by deterministic E2E coverage | ✅ | `pipeline-state.json` guardrail `NFR-auth-e2e-coverage` already marked `met`, citing this story |
| Session token / `accessToken` never appears in HTML response or logs | ✅ | Test group IT3; `pipeline-state.json` guardrail `NFR-accesstoken-audit` already marked `met` |
| `rotateSessionId` called after every provider login | ✅ | Test group U1; `pipeline-state.json` guardrail `NFR-session-rotation` already marked `met` |
| Contributes to shared `@mocked` suite under-10-minute budget | ✅ | No individual per-spec budget violation found. This is the final epic-3 story to merge, so it is also the first point at which suite-wide runtime could in principle be measured — see Metric Signal below |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 4 — Risk-critical journeys have deterministic E2E coverage | ✅ (0 of 5) | Yes — 5 of 5 journeys now covered (signup/onboarding, cross-tenant isolation, billing, auth, plus bri-s3.1's foundation) — but see note below | bri-s3.3 (multi-user within one tenant) is the 5th named journey in the epic's own goal statement and is explicitly out of scope for this DoD sweep (still `dorStatus: blocked`, not merged) — so the epic's own target of "5 of 5" is not yet fully met even though 4 of the 5 journey specs plus the gateway foundation are done. Recording this honestly rather than rounding up. |
| Metric 6 — `@mocked` suite runtime under 10 minutes | ✅ (not yet established) | Not yet — requires an actual timed full-suite CI run, which is outside this DoD sweep's scope (this sweep verified individual story test files, not a timed aggregate run) | |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None for this story's own scope.

---

## DoD Observations

1. **Epic-3's "5 of 5 journeys" target is not actually complete** even though this is the 5th and final *merged* journey-spec story processed in this sweep — the epic's own goal statement names 5 journeys (signup/onboarding, multi-user/permissions, cross-tenant isolation, billing, auth), and bri-s3.3 (multi-user within one tenant) remains blocked pending `team-identity-roles`, per its own `decisions.md` RISK-ACCEPT (2026-07-09). Metric 4 should read 4-of-5-plus-gateway, not 5-of-5, until bri-s3.3 lands. See the feature-level `SUMMARY.md` for the consolidated picture.
2. Metric 6 (suite runtime under 10 minutes) has never actually been measured end-to-end across all epic-3 specs together in this DoD sweep — each story's own test file was verified individually. A dedicated timed run of the full `@mocked` suite is a genuine open action, not something any single story's DoD can close.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Auth journey spec" (bri-s3.6).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Is the "5 of 5 journeys" claim in Metric 4 honestly qualified given bri-s3.3 is still blocked?
Report findings as HIGH / MEDIUM / LOW.
```
