# Definition of Done: Provision a Neon staging branch for Postgres

**PR:** https://github.com/heymishy/skills-repo/pull/447 | **Merged:** 2026-07-10
**Story:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.2-neon-staging-branch.md
**Test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.2-neon-staging-branch-test-plan.md
**DoR artefact:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s2.2-neon-staging-branch-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ⚠️ | `server.js` should have no environment-conditional schema fork — regression guard test **currently failing** (see below); real live schema comparison is manual-only | automated test (T1, currently failing due to an unrelated later collision) + manual scenario (unexecuted) | See deviation below — real, current regression |
| AC2 | ⚠️ | No hardcoded Postgres connection string in tracked `src/` | automated test (T2, passing) + manual write/inspect scenario (unexecuted, External-dependency gap) | None on the automated portion |
| AC3 | ✅ | `src/web-ui/adapters/db-ready.js` — `waitForDbReady()`/`DbConnectTimeoutError`, default 10000ms budget | automated test (IT1/IT2, passing, mocked timing); real-world cold-start timing is manual-only, DoR-acknowledged | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

None in this story's own diff. PR #447 touched exactly the declared touchpoints. The AC1 test regression described below originates entirely from a **later, unrelated PR** (bri-s1.2, #446 — merged after bri-s2.2), not from anything in this story's own scope.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5 (test plan and pipeline-state.json both record a 6th item, but the test file itself only contains 5 automated tests — see DoD Observation 2 on bookkeeping)
**Tests passing in CI:** 4 / 5 (re-verified directly against current master, 2026-07-14 — real run, this session)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 (no environment-conditional schema fork) | ✅ | ❌ | **Real, current failure.** Regex `NODE_ENV\s*===?\s*['"]staging['"]|STAGING_SCHEMA|...` now matches `server.js:103`'s `process.env.NODE_ENV === 'staging' ? 'staging' : 'production'` — this line was added by bri-s1.2 (merged 2026-07-10, after bri-s2.2) to select a PostHog project key, not to fork any schema. Confirmed via `grep`: every `CREATE TABLE`/schema-init block in `server.js` is gated solely on `DATABASE_URL`, identically for staging and prod — there is no actual schema fork. This is a **false-positive regex collision between two independently-merged stories' string patterns**, not a real AC1 regression. Already root-caused and RISK-ACCEPTed in `decisions.md`: first at bri-s2.2's own `branch-setup` (2026-07-10, lines 96-101, pre-existing-baseline framing) and then explicitly re-confirmed at bri-s2.4's `verify-completion` (2026-07-11, lines 158-163) — the latter entry states "was 5/5 at bri-s2.2's own merge" and names the exact root cause plus a revisit trigger to tighten the regex. |
| T2 (no hardcoded connection string) | ✅ | ✅ | |
| NFR2 (no literal Neon connection string) | ✅ | ✅ | |
| IT1 (cold-start connection succeeds within budget) | ✅ | ✅ | |
| IT2 (cold-start connection exceeding budget surfaces `DbConnectTimeoutError`) | ✅ | ✅ | |

**Gaps (tests not implemented):** None — all 5 automated tests exist. T1's current failure is a **known, previously-diagnosed cross-story regression**, not an unimplemented test.

**Coverage gap audit (per DoD Step 4) — manual scenarios:**
- DoR contract scopes real-Neon schema/write-isolation/cold-start confirmation as **External-dependency gap** (🟡 risk).
- No evidence anywhere in this repo that these manual scenarios have been executed against a real Neon branch.
- **This is recorded as an open gap.** See Follow-up actions.

**Pipeline-state bookkeeping gap found and corrected by this DoD:** `.github/pipeline-state.json` previously recorded `testPlan.passing: 5, testPlan.totalTests: 6` for bri-s2.2 — both figures are stale. The test file has 5 tests total, and only 4 currently pass (T1 fails, for the reason above). This DoD corrects the pipeline-state entry to `totalTests: 5, passing: 4`, with a note pointing at the RISK-ACCEPT trail. This is exactly the class of drift `scripts/check-pipeline-state-integrity.js`'s C3 (Check 3) rule flags — confirmed via a fresh run of that script before this DoD sweep began.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Neon autosuspend cold-start resolves within 10 seconds | ⚠️ | Mocked timing tests pass (IT1/IT2); **no real-Neon cold-start timing evidence exists yet** — real-world scenario is DoR-acknowledged manual-only, unexecuted |
| Staging Neon connection string set via Fly secrets, never committed | ✅ | T2/NFR2 pass |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — A broken build cannot reach prod | ✅ (0%) | Not yet — this story provides data-layer isolation only; the full gate is bri-s2.6 | |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. **Test-hygiene action (low risk, already root-caused):** tighten T1's regex in `tests/check-bri-s2.2-neon-staging-branch.js` to specifically match a schema-forking pattern (e.g. requiring a nearby `CREATE TABLE`/schema-`require` token) rather than any bare `NODE_ENV === 'staging'` string, per the revisit trigger already named in `decisions.md` (2026-07-11). Until this is done, the automated regression guard for AC1 will continue to false-positive whenever any future story adds a legitimate staging/prod conditional elsewhere in `server.js`.
2. **Action required, no owner yet assigned:** run the DoR-acknowledged manual scenarios (real schema-identity comparison, real write-isolation check, real cold-start timing) against an actual Neon staging branch — same open-action class as bri-s2.1 and bri-s2.3.

---

## DoD Observations

1. **This story's own implementation was correct and complete at merge time (5/5 passing).** The regression is a downstream side effect of an unrelated, independently-scoped story (bri-s1.2) reusing a similar string pattern for an unrelated purpose (PostHog key selection, not schema forking). This is a textbook example of why `/definition-of-done` re-verifies against *current* master rather than trusting the story's own point-in-time test count — the story text and DoR contract are both still accurate about what bri-s2.2 itself built; only the pipeline-state bookkeeping had drifted.
2. **Pipeline-state bookkeeping drift confirmed and corrected.** `pipeline-state.json`'s `testPlan.totalTests: 6, passing: 5` predates the bri-s2.4 RISK-ACCEPT that documented the 4/5 regression — the RISK-ACCEPT entry was written, but the corresponding pipeline-state.json update for bri-s2.2 was never made. **Tag: /improve candidate** — worth confirming that any RISK-ACCEPT entry that changes a story's actual pass count also triggers an update to that story's own `testPlan` fields in pipeline-state.json at the time it's logged, not just at the next DoD sweep.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Provision a Neon staging branch for Postgres" (bri-s2.2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Is the T1 test failure correctly attributed to a cross-story regex collision rather than a real bri-s2.2 defect?
Report findings as HIGH / MEDIUM / LOW.
```
