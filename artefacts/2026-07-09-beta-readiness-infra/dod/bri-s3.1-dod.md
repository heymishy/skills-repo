# Definition of Done: Build the mock LLM gateway and fixture set

**PR:** https://github.com/heymishy/skills-repo/pull/445 | **Merged:** 2026-07-10
**Story:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.1-mock-llm-gateway.md
**Test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.1-mock-llm-gateway-test-plan.md
**DoR artefact:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s3.1-mock-llm-gateway-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `src/web-ui/modules/mock-llm-gateway.js` `_loadFixtureFile`/`getMockResponse` returns the same canned fixture deterministically for a given `(stage, model, scenarioName)` key | automated test (group A, 3/3) | None |
| AC2 | ✅ | 7 gate-map.js stages × success+failure = 14 fixtures present under `tests/e2e/fixtures/llm-gateway/` | automated test (group D, 3/3) | None |
| AC3 | ✅ | `scripts/regenerate-llm-fixtures.js` refreshes fixtures in place; throws a clear error rather than faking a value when no live credentials are present | automated test (group F, 3/3) | Coverage gap explicitly disclosed in the test plan itself: fidelity against a real live API response is stubbed, not live-verified — an accepted, documented limitation, not a silent gap |
| AC4 (Acceptance Criterion 4) | ✅ | `branch-setup`/`branch-complete` fixtures exist and are wired in `routes/journey.js`'s `SLASH_CAPABILITY_MAP`, resolving the open question logged in `decisions.md` (2026-07-09) | automated test (group E, 2/2) | None |
| AC5 | ✅ | `isMockGatewayEnabled()` hard-overrides `NODE_ENV=production` even when `MOCK_LLM_GATEWAY=true` — gateway cannot be activated in production by config error | automated test (groups G/H, 7/7) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

None within this story's own diff. Note for cross-story awareness: two extra fixture files (`design.success.json`, `review.success.json`) exist in the shared `tests/e2e/fixtures/llm-gateway/` directory. These were added later by bri-s3.2 (commit `bcfc8cd7`), not by this story — bri-s3.2 needed them to traverse the full 7-stage `journey-store.js` `STAGE_SEQUENCE`, and the addition is disclosed in bri-s3.2's own `decisions.md` entry (2026-07-10, SCOPE, inner loop). Correctly attributed to the downstream story, not a bri-s3.1 scope violation.

---

## Test Plan Coverage

**Tests from plan implemented:** 20 / 20
**Tests passing in CI:** 20 / 20 (re-verified directly against current master, 2026-07-14)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| Group A — deterministic fixture return (AC1) | ✅ | ✅ (3/3) | |
| Group C — latency budget (NFR) | ✅ | ✅ (C1: 100 calls all under 50ms) | |
| Group D — 14-fixture inventory (AC2) | ✅ | ✅ (3/3) | |
| Group E — branch-setup/branch-complete fixtures (AC4) | ✅ | ✅ (2/2) | |
| Group F — regeneration script (AC3) | ✅ | ✅ (3/3) | |
| Group G/H — production activation guard (AC5, NFR) | ✅ | ✅ (7/7) | |

**Gaps (tests not implemented):** None. Full run: `node tests/check-bri-s3.1-mock-llm-gateway.js` → 20 passed, 0 failed.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Mock LLM gateway response under 50ms per call | ✅ | Test C1: 100 calls, all under 50ms budget |
| Gateway only activatable via explicit test configuration, never by production config error | ✅ | Test groups G/H: `NODE_ENV=production` hard-overrides `MOCK_LLM_GATEWAY=true`; matches `guardrails[]` entry `NFR-gateway-activation-guard` |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 6 — `@mocked` suite runtime under 10 minutes | ✅ (not yet established) | Not yet — requires all 6 epic-3 stories' specs to exist and a full suite timing run | This story is the foundation that makes a sub-10-minute suite possible, but the suite-wide runtime itself is not independently measurable from bri-s3.1 alone |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. An untracked, unrelated file (`src/modules/mock-api-client.js`) was visible in the outer session's `git status` at the start of this DoD sweep and initially looked like it might be undelivered bri-s3.1 code. Independently confirmed via `git log --all` (zero commits, any branch) and a clean worktree checkout that this path does not exist in git history anywhere and is not referenced by any file outside `node_modules`. The real, actually-shipped gateway module is `src/web-ui/modules/mock-llm-gateway.js`, fully covered by the 20 passing tests above. This is recorded here only to close out the investigation trail — it is not a defect in what merged.
2. Metric 6 (`@mocked` suite runtime under 10 minutes) cannot be assessed from this story in isolation — see bri-s3.6-dod.md (the last epic-3 story to merge) for the first point at which a suite-wide runtime read is possible.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Build the mock LLM gateway and fixture set" (bri-s3.1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
