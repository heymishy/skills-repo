# Definition of Done: Wire Scenario A as a CI-blocking gate

**PR:** https://github.com/heymishy/skills-repo/pull/566 (supersedes closed PR #563) | **Merged:** 2026-07-23
**Story:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/a5-ci-gate-scenario-a-blocking.md
**Test plan:** artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/a5-ci-gate-scenario-a-blocking-test-plan.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1/AC2 (Scenario A is a required, merge-blocking status check) | ✅ | `check-a5-ci-gate-config.js`, 14/14 assertions, including T12: live confirmation via `gh api repos/heymishy/skills-repo/rulesets/14979696` that `"Scenario A E2E (staging)"` IS in `required_status_checks` | Automated test, re-run fresh 2026-08-17 (test itself makes a live GitHub API call) | None |

14/14 assertions pass fresh, with the live ruleset check confirming genuinely-current enforcement, not just a point-in-time assumption.

---

## Scope Deviations

None identified. Note: an earlier PR (#563) for this same story was closed/superseded by #566 — the actual merged implementation is #566, confirmed via `gh pr view`.

---

## Test Plan Coverage

**Tests passing in CI:** 14/14, re-run fresh 2026-08-17, including a live external-state check.
**Gaps:** None identified.

---

## NFR Status

No red flags found in this pass.

---

## Metric Signal

No formal benefit-metric artefact exists for this feature. No metric signal to record.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. **This story's own equivalent for Scenario B (`b2`) does NOT hold up under the same live check** — see `b2-ci-gate-scenario-b-coverage-mapping-dod.md`. `a5` correctly wired Scenario A as required; `b2`'s attempt to do the same for Scenario B did not actually land in the ruleset. Worth noting this asymmetry as a genuine finding, now tracked via follow-up story `sbrc-s1` (`2026-08-17-scenario-b-not-required-check`).
2. ~4 weeks live, correctly enforced the entire time per the live ruleset check.
