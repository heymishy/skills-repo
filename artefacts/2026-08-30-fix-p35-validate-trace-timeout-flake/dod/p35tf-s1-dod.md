# Definition of Done: Increase check-p3.5-validate-trace.js's pwsh spawn timeout

**PR:** https://github.com/heymishy/skills-repo/pull/787 | **Merged:** 2026-08-29 (`a90da111efa907b830a23015109f22be9174c684`)
**Story:** artefacts/2026-08-30-fix-p35-validate-trace-timeout-flake/stories/p35tf-s1-increase-pwsh-spawn-timeout.md
**Test plan:** artefacts/2026-08-30-fix-p35-validate-trace-timeout-flake/test-plans/p35tf-s1-increase-pwsh-spawn-timeout-test-plan.md
**DoR artefact:** artefacts/2026-08-30-fix-p35-validate-trace-timeout-flake/dor/p35tf-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `PWSH_SPAWN_TIMEOUT_MS = 90000` defined once, referenced at both `spawnSync` call sites | Source inspection, re-confirmed against merged `master` | None |
| AC2 | ✅ | `check-p3.5-validate-trace.js` standalone: 5/5 passing | Re-run against merged `master` | None |
| AC3 | ✅ | 2 consecutive full-suite runs (568/568 each), no `exited null` failure | Manual/operator-run smoke check, per the test plan's own declared gap | None |

---

## Scope Deviations

None. No change to `validate-trace.ps1` or `run-all-tests.js`'s own outer timeout, matching the story's Out of Scope section.

---

## Test Plan Coverage

**Tests from plan implemented:** 2/2 (AC1 source check, AC2 standalone regression) + 1 manual scenario (AC3)
**Tests passing in CI:** 5/5 (the file's own existing test suite, unchanged in count)

**Gaps (tests not implemented):** AC3's manual verification (declared 🔴 Untestable-by-nature at test-plan time) — executed twice during implementation (2 consecutive full-suite runs) rather than deferred to a separate post-merge smoke test, since the fix itself is only meaningfully verifiable under the exact load condition a full suite run creates. No further post-merge action required.

**Layout gap audit:** N/A.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — new timeout stays within the outer 120s per-file budget | ✅ | 90000 < 120000, confirmed by code review of `run-all-tests.js`'s own `spawnSync` timeout at implementation time |

---

## Metric Signal

No formal benefit-metric artefact — short-track. Operational-efficiency benefit stated in the story: this is the 8th and (pending confirmation) final occurrence of this specific RISK-ACCEPT ceremony across the session. First real signal: no further `check-p3.5-validate-trace.js` RISK-ACCEPT entries should appear in any future `/branch-setup` baseline for this repo. Not yet measured — the next worktree baseline (S4's, already run once before this fix and already logged) will be the first real observation post-fix.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required. Resume S4's inner loop, which had already reached a clean-enough baseline (1 known flake, now fixed) before this short-track detour began.

---

## DoD Observations

1. **This closes a genuine, 8-times-recurring operational cost** rather than deferring it a further time — worth citing in a future `/improve` pass as an example of escalating a repeated RISK-ACCEPT to root-cause investigation once the pattern (full-suite-only, never standalone, consistent error shape) provided enough signal to investigate cheaply, rather than waiting for a formally scheduled root-cause story.
2. **H-GOV's discovery-artefact dependency is now a confirmed, repeatable gap for short-track stories** — hit twice in this repo's history (`pcr-s1`, now `p35tf-s1`), both times resolved identically via a transparent GAP note rather than fabricating a discovery artefact. Per the standing revisit trigger logged in this feature's own `decisions.md`, a third occurrence should prompt an actual `/definition-of-ready` SKILL.md revision adding an explicit short-track branch to H-GOV, rather than a third ad-hoc GAP note.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Increase check-p3.5-validate-trace.js's pwsh spawn timeout (p35tf-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
4. Is the H-GOV gap note handled consistently with its pcr-s1 precedent, not silently different?
Report findings as HIGH / MEDIUM / LOW.
```
