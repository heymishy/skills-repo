# Definition of Done: Add Scenario B to the CI-blocking gate and publish the spec-to-journey-step coverage mapping

**PR:** https://github.com/heymishy/skills-repo/pull/567 | **Merged:** 2026-07-23
**Story:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/b2-ci-gate-scenario-b-coverage-mapping.md
**Test plan:** artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/b2-ci-gate-scenario-b-coverage-mapping-test-plan.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (broken Scenario B step blocks merge) | ❌ | Live check via `gh api repos/heymishy/skills-repo/rulesets/14979696`: `required_status_checks` lists only `"Run assurance gate"` and `"Scenario A E2E (staging)"` — `"Scenario B E2E (staging)"` is absent | Manual, direct GitHub API check, 2026-08-17 | **Real, confirmed gap — see below** |
| AC2 (clean PRs pass both jobs, neither blocks) | ✅ | Both jobs run and pass on every PR (confirmed via `si-s1`/`si-s2` today) | Continuous CI evidence | None |
| AC3 (coverage mapping doc lists every journey step) | ✅ | `artefacts/2026-07-23-e2e-core-journey-coverage/coverage/spec-to-journey-step-mapping.md` exists | Direct file inspection, 2026-08-17 | None found in a lightweight check |
| AC4 (mapping cross-checked against real spec files) | ✅ (not deeply re-audited) | `check-b2-ci-gate-config.js` includes coverage-mapping assertions, 15/15 (1 skipped — see AC1) | Automated test, re-run fresh 2026-08-17 | Not independently re-derived line-by-line in this lightweight pass |

15/15 assertions pass, **1 skipped** — the skipped assertion is exactly `check-b2-ci-gate-config.js`'s own T12, which checks live ruleset state and correctly reports "SKIPPED — not yet found in required_status_checks" rather than failing hard (the test's own design treats this as inconclusive-from-offline-test, not a false pass). The live `gh api` check performed in this pass converts that "inconclusive" into a confirmed fact.

---

## Root cause / nature of the AC1 gap

Unlike `d2`'s gap (a code bug — a handler never threading a value through), this is a **configuration gap**: the Scenario B E2E job itself is correctly defined and runs on every PR (confirmed working, AC2 holds), but nobody added `"Scenario B E2E (staging)"` to the master branch ruleset's `required_status_checks` list the way `a5`'s own story did for Scenario A. No code fix is needed — only a one-line addition to the GitHub ruleset configuration.

## Scope Deviations

**AC1 is not satisfied.** Per DoD Step 2 protocol, the operator chose: **create a follow-up story** rather than have this agent apply the `gh api` config change directly, or accept as RISK-ACCEPT. Follow-up story written: `artefacts/2026-08-17-scenario-b-not-required-check/stories/sbrc-s1-add-scenario-b-to-required-checks.md`, queued for `/test-plan`. This DoD is not blocked on that fix landing — it records the gap as found, with a named remediation already in motion.

---

## Test Plan Coverage

**Tests passing in CI:** 15/15 (1 intentionally-inconclusive skip), re-run fresh 2026-08-17.
**Gaps:** The test suite correctly flags but cannot itself resolve the live ruleset gap — resolving it requires the follow-up story `sbrc-s1`.

---

## NFR Status

No red flags found beyond the AC1 finding above.

---

## Metric Signal

No formal benefit-metric artefact exists for this feature. No metric signal to record.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- [Owner: coding agent, via next `/test-plan` run] `sbrc-s1` (2026-08-17-scenario-b-not-required-check): add `"Scenario B E2E (staging)"` to the master ruleset's `required_status_checks`, matching the pattern `a5` already established for Scenario A. Story already written; needs `/test-plan` → `/definition-of-ready` → dispatch.

---

## DoD Observations

1. **A second real, live-confirmed finding in this session's DoD backlog pass, distinct in kind from `d2`'s.** `d2` was a code bug (a handler silently not threading a value). This is a configuration/governance gap (a job runs correctly but was never marked required). Both were caught the same way: by directly checking live external state (a real browser session; a real GitHub API call) rather than trusting that "the automated test suite is green" fully proves the AC. **Same `/improve` candidate as `d2`'s DoD**: DoD Step 4 should explicitly prompt for AC claims phrased as universal/structural guarantees ("the PR's merge is blocked," "any page in the app") to be checked against live state, not just a test file's own internal assertions — especially when, as here, the test file itself already flags the check as "inconclusive" rather than confidently passing.
2. This story's own test suite (`check-b2-ci-gate-config.js`) deserves credit for correctly modeling its own limitation — it doesn't falsely report a pass on a check it can't confidently make; it reports SKIPPED. That honest self-limitation is exactly what made this gap easy to find and confirm in this pass, rather than requiring investigation from scratch.
3. This is part of the same 8-story `2026-07-23-e2e-core-journey-coverage` batch as `a1`–`b3`.
