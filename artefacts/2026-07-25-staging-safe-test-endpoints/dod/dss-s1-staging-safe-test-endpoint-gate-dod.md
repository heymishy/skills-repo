# Definition of Done: Make the 4 test-support endpoints the @mocked smoke suite needs staging-safe

**PR:** commit `af30c1d4` / `460bdd2e` "dss-s1: staging-safe gate for the 4 test-support endpoints the @mocked smoke suite needs (#598)" | **Merged:** 2026-07-25
**Note:** the task brief for this DoD pass cited PR #605, but git log shows #605 is a different, later story (`bjs-s1: staging-safe fixes for bri-s3.5's billing journey`). dss-s1's actual merge commit is PR #598 (`af30c1d4`, 2026-07-25 16:38:53 +1200) — corrected here from direct git log evidence.
**Story:** artefacts/2026-07-25-staging-safe-test-endpoints/stories/dss-s1-staging-safe-test-endpoint-gate.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Description | Satisfied? | Evidence | Verification method | Deviation |
|----|-------------|------------|----------|---------------------|-----------|
| AC1 | Secret unset -> unchanged behaviour | Yes | `secret unset + NODE_ENV=staging -> not allowed (AC1)`, `secret unset + NODE_ENV=test -> still allowed, unchanged local-harness behaviour (AC1)` | Automated (`check-dss-s1-staging-safe-test-endpoint-gate.js`) | None |
| AC2 | Secret set + matching header -> allowed | Yes | `secret set + matching header -> allowed (AC2)` | Automated | None |
| AC3 | Secret set + wrong/absent header -> NOT allowed | Yes | `secret set + wrong header value -> NOT allowed (AC3)`, `secret set + header absent entirely -> NOT allowed (AC3)`, `secret set + header present but empty string -> NOT allowed (AC3)` | Automated | None |
| AC4 | Counter instrumentation always active, call unaffected | Yes | `counter instrumentation wires global.__BRI_S3_2_REAL_LLM_CALL_COUNT__ even when NODE_ENV is not test, and still forwards real https.request calls (AC4)` (child-process test: `wired`, `incremented`, `forwarded` all true) | Automated | None |
| AC5 | Spec files omit header locally, unchanged behaviour | Yes | `tests/e2e/fixtures/staging-auth.js`'s `testEndpointBypassHeaders()` returns `{}` unless `hasStubSecret()` is true; all 4 spec files (bri-s3.2, bri-s3.3, bri-s3.4, bri-s3.5) call it for every affected `/test/*` request | Static source review (matches test plan's own "manual/static review" gap classification for this AC) | None |
| AC6 | Real CI re-run after merge succeeds | Yes | Commit `14c9519a` ("dss-s1 AC6 confirmed live -- pipeline-state bookkeeping"): live re-run of `Staging Deploy`'s smoke-test job post-merge shows zero failures attributed to `/test/complete-onboarding`, `/test/seed-multi-user-roles`, `/test/stripe-call-count`, and `/test/real-llm-call-count` now returns real JSON with an incrementing counter instead of crashing with a JSON-parse error; `acVerified` moved 6->7 in `.github/pipeline-state.json` on the strength of this live check | Live CI re-run (documented, not re-verified in this session) | None |
| AC7 | Other 4 routes completely untouched | Yes | 4 structural tests confirming `/test/session`, `/test/seed-definition-session`, `/test/canvas`, `/test/seed-board-journey` remain `NODE_ENV=test`-only in `server.js` (plus 4 tests confirming the 4 widened routes use `_isTestEndpointAllowed`) | Automated (source-text assertions against `server.js`) | Note: `/test/session` is listed in the *widened* group in the current test file, per a later story (`bjs-s1`) that widened it further for its own needs — this is downstream of dss-s1 and does not change dss-s1's own AC7 outcome at merge time. |

## Scope Deviations

None from the story's own stated scope. Two items were explicitly named as deferred by the story/decisions.md itself, not defects:
- The adjacent rate-limiting gap in bri-s3.2/s3.3/s3.4/s3.5's own signup calls (not sending serlb-s1's rate-limit-bypass header) — named in the story's Out of Scope section and `decisions.md` ("Deferred", 2026-07-25) as a real but unrelated gap.
- A post-merge live-verification signal (`capture-log.md`, 2026-07-25, signal-type `gap`) found that `global.__BRI_S3_2_REAL_LLM_CALL_COUNT__` is one process-wide counter shared across concurrently-running Playwright workers, so a spec's own before/after delta assertion can be polluted by another spec's concurrent calls on the same staging run (observed in bri-s3.4). This affects the reliability of *other* specs' own assertions, not any of dss-s1's 7 ACs (all of which concern the gate mechanism and counter wiring, not per-worker isolation), and was explicitly flagged in the same session as a follow-up candidate rather than fixed — consistent with the story's own narrow scoping to "widen exactly 4 route conditions, touch nothing else."

## Test Plan Coverage

`check-dss-s1-staging-safe-test-endpoint-gate.js`: 16 passed, 0 failed (freshly re-run 2026-08-17). This covers AC1, AC2, AC3, AC4, and AC7 (behavioural + structural). AC5 is covered by static source review (matches the test plan's own classification of AC5 as "Manual/static review", not an automated test). AC6 is covered by a documented live CI re-run after merge (commit `14c9519a`, capture-log.md 2026-07-25), not re-verified in this session per the task brief's instruction not to re-run tests broadly.

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| Security | Met | Gate is a complete no-op wherever `E2E_STAGING_AUTH_STUB_SECRET` is unset (AC1 tests); constant-time comparison used (`crypto.timingSafeEqual`, per story's Architecture Constraints); secret is never set in production per existing `check-a1-fly-config-isolation.js` guardrail (reused, no new isolation test needed). |
| Performance | Met | Relocated counter instrumentation adds one hostname string comparison per outbound `https.request` call — confirmed negligible by design, not separately load-tested (story did not require it). |
| Observability | Met | AC4's live re-run (AC6 evidence) confirms `/test/real-llm-call-count` now returns a real, non-trivial, incrementing value on staging instead of always reading 0. |

## Metric Signal

No dedicated benefit-metric artefact is referenced by this story — it is a short-track bug fix / security-scoped gap closure (story's own header: "Short-track: bug fix / security-scoped gap"), and the story's own benefit linkage (per its DoR, H5) is stated directly rather than via a `/benefit-metric` artefact: restoring the ability of `Staging smoke test (@mocked)` to actually run and mean something, since it structurally could never pass against real staging before this story. The post-merge live re-run (AC6) is the closest thing to a metric signal here, and it confirms the intended outcome.

## Outcome

**COMPLETE**
**Follow-up actions:** None required for this story. Two adjacent, already-flagged items exist for future stories (not this one): the rate-limiting gap in the 4 spec files' own signup calls (decisions.md, 2026-07-25), and the shared-process-wide counter's cross-worker pollution risk (capture-log.md, 2026-07-25).

## DoD Observations

The gate has been running against real `wuce-staging` since 2026-07-25 with a confirmed live post-merge re-run showing the intended fix working; the PR reference in this backlog pass's task brief (#605) was incorrect and has been corrected to #598 using direct git log evidence.
