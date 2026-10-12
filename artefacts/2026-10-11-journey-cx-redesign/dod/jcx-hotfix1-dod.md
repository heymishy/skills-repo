# Definition of Done: Fix ambiguous id column crashing the placeholder-feature trigger in production

**PR:** https://github.com/heymishy/skills-repo/pull/977 | **Merged:** 2026-10-12
**Story:** artefacts/2026-10-11-journey-cx-redesign/dor/jcx-hotfix1-dor.md (short-track)
**Test plan:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-hotfix1-test-plan.md
**DoR artefact:** artefacts/2026-10-11-journey-cx-redesign/dor/jcx-hotfix1-dor.md
**Assessed by:** Claude Sonnet 5 (session continuation)
**Date:** 2026-10-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| The trigger route no longer 500s on a real Postgres join | ✅ | Root cause captured directly from real staging logs (`flyctl logs -a wuce-staging`): `error: column reference "id" is ambiguous` at `journeys.js:529` inside `handleTriggerPlaceholderFeature`. Fix qualifies every SELECT column with the `cjs.` alias, directly eliminating the exact ambiguity the error names. Unit tests (9/9) pass with the corrected SQL text. | `production-observed` (the bug) + code review + `unit` (the fix) — see RISK-ACCEPT below for the missing `live-verified` confirmation of the POST-fix state | See RISK-ACCEPT (decisions.md, 2026-10-13) — post-deploy live re-verification was skipped (session logged out after redeploy, re-authenticating requires an OAuth flow this session does not drive; operator explicitly chose to skip rather than sign in) |

---

## Scope Deviations

None. Single-query fix, qualifying column references only — no behavior change beyond removing the SQL error.

---

## Test Plan Coverage

**Tests from plan implemented:** N/A (short-track, no new tests — existing `check-jcx-s1-placeholder-feature.js` suite re-verified against the corrected SQL)
**Tests passing in CI:** 9/9

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| Full `check-jcx-s1-placeholder-feature.js` suite | N/A (pre-existing) | ✅ 9/9 | Mock-pool regex updated to match the qualified column list — the mock never executed real SQL, so it could not itself have caught or now verify the ambiguous-column fix; it only confirms the handler's surrounding logic (404s, response shapes, etc.) still works. |
| Full repo suite | N/A | ✅ | `npm test`, 0 failures |

**Gaps (tests not implemented):** No automated test exercises real SQL execution for this query. Logged as a Follow-up Action below, not fixed in this hotfix (same class of gap already logged in `jcx-hotfix1-test-plan.md`'s own "Known residual gap" section).

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| None applicable — pure bug fix, no new NFR surface | N/A | — |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M2 — Placeholder-feature trigger actually used | ✅ (baseline: 0) | Not yet | This hotfix makes M2 measurement POSSIBLE for the first time (the trigger route was completely non-functional before it — 0 real triggers could ever have succeeded in production). Still not yet measured — no real trigger-to-approval cycle has occurred since the fix deployed. |

**Measurement-ready gate:** Not yet.
**Evidence note:** The trigger route was fully broken (100% failure rate) until this hotfix; this fix is a necessary precondition for M2 to ever move, not itself a measurement event.
**Signal:** `not-yet-measured`
**Date measured:** null

---

## Outcome

**COMPLETE WITH DEVIATIONS**

(Deviation class: one RISK-ACCEPT on post-fix live-browser re-verification — root cause and fix both independently confirmed by other means.)

**Follow-up actions:**
1. **Owner: future session.** If any further `placeholder-features/.../trigger` failures appear in staging/production logs, treat the RISK-ACCEPT above as open and perform the live re-check that was skipped here.
2. **Owner: future session, infra/tooling.** This repo's primary CI gate (`Lint, typecheck, test, build`) never sets `DATABASE_URL`; no automated test anywhere in that gate executes real SQL, so a semantic SQL error (ambiguous column, wrong type, etc.) can ship cleanly through CI as long as a mock-pool regex happens to match. This is the SECOND real bug this session that a mock-pool-only test suite could not have caught (the first was `jcx-s1`'s own CI platform-dependence bug, a different class). Worth a dedicated story to wire a disposable Postgres into the primary CI job for at least the routes that run JOINs.
3. **Owner: future session.** Confirm the staging session's logout-on-redeploy behavior is expected (session store not surviving a Fly.io machine restart) rather than a separate, uninvestigated bug — not confirmed either way this session.

---

## DoD Observations

1. **`/improve` candidate — live-browser verification is not optional window dressing.** This bug (a 100%-failure-rate production defect) passed `jcx-s1`'s own `/verify-completion` cleanly on jsdom evidence alone, and would have shipped undetected if the operator had not directly asked "did we confirm s1 with chrome... on staging" in this follow-up session. The RISK-ACCEPT logged for `jcx-s1`'s own missing live-browser check was the correct process (honest, not silently skipped) — but this incident is the concrete proof of exactly the risk that RISK-ACCEPT named. Worth reinforcing in `/verify-completion`'s own SKILL.md: a RISK-ACCEPT on the UI-evidence gate should carry an explicit "retry once the blocker clears" follow-up action with real urgency, not just a passive note.
2. **`/improve` candidate — mock-pool tests cannot catch real SQL errors.** Documented in Follow-up Action #2 above. This is a structural gap across this entire repo's test suite, not specific to this story.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for jcx-hotfix1 (ambiguous id column fix).
Check:
1. Is the root-cause evidence (the real staging log line) concrete enough to trust the fix addresses the actual reported error?
2. Is the RISK-ACCEPT on skipping post-fix live re-verification reasonable given the OAuth-login constraint, or should this be escalated?
3. Are the two /improve candidates (live-browser verification urgency, mock-pool SQL blind spot) worth acting on now or deferring?
Report findings as HIGH / MEDIUM / LOW.
```
