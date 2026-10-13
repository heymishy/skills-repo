# Definition of Done: Fix persona-save route rejecting the client's real POST request

**PR:** https://github.com/heymishy/skills-repo/pull/983 | **Merged:** 2026-10-13
**Story:** short-track bug fix (production functional bug)
**Test plan:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-hotfix2-test-plan.md
**DoR artefact:** artefacts/2026-10-11-journey-cx-redesign/dor/jcx-hotfix2-dor.md
**Assessed by:** Claude Sonnet 5 (session continuation)
**Date:** 2026-10-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | The persona-save route accepts the client's real POST request and reaches the real handler. `check-jcx-hotfix2-persona-route-method.js`: confirmed RED against the bug (200 + HTML catch-all body) and GREEN against the fix (real 404 from `handlePatchJourneyPersona` on an unknown journey id) | `integration-real-code` (real `server.js` router dispatch) | None |

### Verification strength summary
- `integration-real-code`: 1 (real server dispatch, RED/GREEN confirmed against the actual bug)
- `live-verified`: pending — see Follow-up actions below

---

## Scope Deviations

None in the intended fix itself (a single route-condition change, `PATCH` → `POST`). One process note, not a scope deviation: an earlier local debugging step (a blanket `sed` edit used to confirm the RED case) briefly introduced unrelated corruption across many other unrelated `POST` route conditions in the same file. This was caught before committing — `git diff HEAD` was checked line-by-line and the corruption was fully reverted via `git checkout HEAD -- src/web-ui/server.js` followed by a clean, single, intentional `Edit`. The committed PR diff is exactly the one intended change (confirmed in the PR itself: `src/web-ui/server.js`, 6 lines net). Logged here because the corruption briefly caused ~19 unrelated test files to fail locally during investigation, which could otherwise read as a separate, alarming regression if not explained.

---

## Test Plan Coverage

**Tests from plan implemented:** 1/1
**Tests passing in CI:** confirmed via PR #983 — all checks green

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (real-dispatch route-method fix) | ✅ | ✅ | RED/GREEN confirmed locally before pushing |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ N/A | Single string-literal change, no new code path |
| Security | ✅ | No change to `requireNonViewer`/CSRF/tenant-scoping — those checks are unaffected by which HTTP method the route matches on |
| Accessibility | ✅ N/A | No UI change |
| Audit | ✅ N/A | No change to logging |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Operator CX judgment vs. the reference bar | ✅ (baseline: "Not matching") | Not yet | This fix restores the actual functional correctness of `jcx-s4`'s own persona-save feature, which M1 depends on being genuinely usable, not just rendered |

**Measurement-ready gate:** Not yet.
**Evidence note:** The fix is confirmed functionally correct via a real server-dispatch regression test; the live-browser re-confirmation (below) is the remaining step before this can be folded into an M1 judgment.
**Signal:** `not-yet-measured`
**Date measured:** null

---

## Outcome

**COMPLETE WITH DEVIATIONS**

(Deviation class: a corrective fix to an already-merged, DoD-complete story (`jcx-s4`), found by live Chrome verification after the operator logged into staging — no RISK-ACCEPT needed, since the fix itself is fully verified by a real-dispatch regression test; one process note about a transient local debugging mistake, caught and corrected before commit.)

**Follow-up actions:**
1. **Owner: next session action, high priority.** Re-verify live on `wuce-staging.fly.dev` once this fix deploys: fill the persona editor form, save, reload, confirm the saved persona renders as a read-only card (not a blank form). This is the exact scenario that surfaced the bug — closing the loop on it live is the real confirmation, not just the regression test.
2. **Owner: future session.** The silent-failure UX gap is separate and NOT fixed here: `jcxShowError`'s own cross-script-scope reference bug (`jcxReorderError` is scoped to a different `<script>` IIFE block than the persona form's own submit handler) means a genuinely failed save still shows no visible error to the user. Worth a dedicated follow-up: every `jcxSubmitJson` caller's `.catch()` should surface a visible error through a handler reachable from its own script block.
3. **Owner: future session, process.** Consider whether `check-jcx-s5-authorization.js`'s own regression-test pattern (real server-dispatch, happy-path save plus denial paths) should become the DEFAULT expectation for any route wired through this app's manual if/else router dispatch, not just an occasional addition — this bug class (client/server HTTP-method mismatch) is structurally invisible to every handler-level or jsdom-mocked-fetch test in this codebase, and was only caught by live, real-browser verification, not by any of the 11 automated tests `jcx-s4` shipped with.

---

## DoD Observations

1. This is the first bug this session caught by *exercising a shipped feature as the actual end user would* (filling a real form, clicking save, reloading) rather than by reading code or running automated tests — and it slipped past 11 passing tests, a full green CI run, and 2 prior DoD sign-offs (`jcx-s4`, then indirectly `jcx-s5`). This strongly reinforces the value of the "operator logs into staging and clicks through the real feature" step that unblocked this whole investigation — worth treating as a mandatory step before calling any UI-interactive story's RISK-ACCEPT "resolved," not just a nice-to-have once infrastructure allows it.
2. A real, if transient, process risk surfaced during this story's own implementation: a broad `sed` substitution used for a quick manual check corrupted far more of the file than intended, and was only caught by a disciplined `git diff HEAD` review before committing — not by the test suite itself (since the corrupted state was never actually run through `npm test` as a committed/pushed artifact). Worth reinforcing broadly: prefer the `Edit` tool's exact-string matching over shell-level `sed`/regex substitution for any code change, specifically because `sed`'s line-based matching has no equivalent of `Edit`'s uniqueness requirement and will silently apply to every structurally-similar line in the file.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for jcx-hotfix2 (persona-save POST/PATCH fix).
Check:
1. Does the AC row have a concrete evidence reference (test name, RED/GREEN confirmation)?
2. Is the Scope Deviations note about the transient sed corruption clear enough that a cold reader
   understands it was caught and fully reverted before commit, not shipped?
3. Is follow-up action #1 (live re-verification once deployed) tracked clearly enough to not be lost?
4. Is the DoD Observation about preferring Edit over sed worth promoting into CLAUDE.md's own
   Coding standards section, given it's a concrete, repeatable risk?
Report findings as HIGH / MEDIUM / LOW.
```
