# Definition of Done: adsr-s1 — Stop churning fresh sessions for an already-done stage

**PR:** https://github.com/heymishy/skills-repo/pull/778 | **Merged:** 2026-08-27T08:48:57Z (commit `7bd27cc9`)
**Story:** `artefacts/2026-08-27-aslr-s1-done-session-regression/stories/adsr-s1-preserve-direct-link-for-done-sessions.md`
**Test plan:** `artefacts/2026-08-27-aslr-s1-done-session-regression/test-plans/adsr-s1-test-plan.md`
**DoR:** `artefacts/2026-08-27-aslr-s1-done-session-regression/dor/adsr-s1-dor.md`
**Assessed by:** Claude (agent)
**Date:** 2026-08-27

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Step-nav active-stage link points directly at an existing done session, not `/resume` | Automated test (`check-aslr-s1-active-stage-link-resume.js`, "adsr-s1 AC1") | None |
| AC2 | ✅ | "Current stage" button (`currentChatUrl`) same direct-link behaviour | Automated test ("adsr-s1 AC2") | None |
| AC3 | ✅ | `handleGetStageReview` links directly to an existing not-done session, not `/resume` | Automated test ("adsr-s1 AC3") | None |
| AC4 | ✅ | `handleGetJourneyStageView`'s own no-artefact-yet fallback links directly when the session exists | Automated test ("adsr-s1 AC4") | None |
| AC5 | ✅ | All 4 sites still fall through to `/resume` when the session is genuinely missing — original `aslr-s1` AC6/AC7 tests re-confirmed unmodified | Automated test re-run | None |
| AC6 | ✅ | View-then-stage-review sequence registers zero new sessions; `journey.activeSessionId` unchanged across both calls | Automated test ("adsr-s1 AC6", no-churn) | None |
| AC7 | ✅ | Full existing resume/stage-view suite (`check-s0.1/s0.2/s0.4`, `check-jsvr-s1`, `check-frsr-s1`, `check-dsh-s4`, `check-ougl3/5/6/7`) all pass unchanged | Automated test re-run | None |

**Test file:** `tests/check-aslr-s1-active-stage-link-resume.js` — 19/19 passing (extended in place from `aslr-s1`'s original 9), re-confirmed on merged master.

---

## Scope Deviations

None. Diff confirmed to touch exactly `src/web-ui/routes/journey.js` (the 4 call sites named in the story) and the existing `aslr-s1` test file (extended, not replaced).

---

## Test Plan Coverage

**Tests from plan implemented:** 7 AC groups, all covered (5 new tests + 2 regression-guard re-runs).
**Tests passing:** 19/19 in the extended test file; full existing resume/stage-view suite clean; full suite 561 files run, 0 real failures (1 known pre-existing flaky file, `check-p3.5-validate-trace.js`).
**Gaps:** None per the test plan's own "Coverage gaps" section.

**Process note:** This was an urgent, same-session regression fix — the bug was live-reproduced together with the operator (watching real-time staging logs) before any code was written, giving direct evidence (two distinct session IDs firing full turn cycles ~70s apart) rather than a hypothesized root cause. Two test-writing mistakes were caught and corrected during implementation: (1) a new fixture initially omitted creating the viewed stage's own artefact, causing it to hit the wrong code branch; (2) a "no-churn" test initially asserted a redirect where the real (correct, unchanged) handler behaviour for a done+drafted session is a full page render, not a redirect — both corrected before commit by actually running the tests, not just reasoning about expected behaviour.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | Removes an unnecessary session-creation round-trip and duplicate mock-turn execution for the common case (viewing a done, unconfirmed stage) |
| Security | ✅ | No new surface — reuses `getGetHtmlSession()`, an existing read-only lookup already used identically by `handleGetJourneyById` |
| Accessibility | ✅ N/A | Not applicable |
| Audit | ✅ | Removes a spurious `stage_started` PostHog event per unnecessary fresh-session creation this bug was causing |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| None declared | N/A | N/A | Short-track urgent regression fix, no formal benefit-metric artefact. |

**Live validation (post-merge, 2026-08-27):** Deployed to `wuce-staging` (v812). Confirmed via `fly ssh console` that the fix (`getGetHtmlSession()(_activeSid)` existence checks at all 4 sites) is present in the running container. **Reproduced the operator's exact original failure end-to-end**: navigated to the same journey (`5d3fce13-3068-4bc3-9616-c5e737ce2416`) that had previously hit `403 Forbidden`, and clicking "Confirm & continue to complete" now succeeds cleanly — the journey advanced to "JOURNEY COMPLETE" with no error. The journey's own stage history visibly shows 4 prior failed "Def of Ready" attempts from before this fix (session churn from the `aslr-s1` regression), followed by one final successful confirmation after the fix deployed.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None. This closes the live regression the operator hit immediately after `aslr-s1` deployed.

---

## DoD Observations

1. **A same-session, same-day regression was caught within minutes of deployment and fixed within the hour** — the operator's own live usage (not automated monitoring) surfaced it, and the fix followed the exact same governed pipeline (story → test-plan → DoR → implementation → PR → DoD) as any other change, just compressed in wall-clock time given the urgency. No pipeline steps were skipped despite the urgency.
2. **The root cause was a documented-but-unapplied precedent within the same file.** `handleGetJourneyResume`'s "always fresh for a done session" contract and `handleGetJourneyById`'s `kcrs-s1` workaround for it were both already written down in code comments — the gap was that `aslr-s1`'s own investigation read the *symptom* (raw URLs dead-ending) without cross-referencing the *other* existing fix for the *same underlying endpoint's* known limitation. Worth a general lesson: when reusing an endpoint, grep the codebase for prior callers of that same endpoint first, not just for prior instances of the bug pattern being fixed.
3. **Direct live reproduction with the operator (watching logs together in real time) was decisively more effective than working from a bug report alone** — it surfaced the exact mechanism (session churn, timing, correlationIds) in a few minutes that would have been much harder to diagnose from a static "I got Forbidden" report.
