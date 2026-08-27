# Definition of Done: cpr-s1 — Close the race between persisting a new CSRF token and the process suspending mid-write

**PR:** https://github.com/heymishy/skills-repo/pull/775 | **Merged:** 2026-08-27T05:23:27Z (commit `1b8c5980`)
**Story:** `artefacts/2026-08-27-csrf-persist-race-on-suspend/stories/cpr-s1-await-csrf-persist-before-response.md`
**Test plan:** `artefacts/2026-08-27-csrf-persist-race-on-suspend/test-plans/cpr-s1-test-plan.md`
**DoR:** `artefacts/2026-08-27-csrf-persist-race-on-suspend/dor/cpr-s1-dor.md`
**Decisions:** `artefacts/2026-08-27-csrf-persist-race-on-suspend/decisions.md`
**Assessed by:** Claude (agent)
**Date:** 2026-08-27

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `generateCsrfToken` is `async` and `await persistSession(req.sessionId)` before returning; `persistSession` returns `Promise.race([write, timeout])`, not fire-and-forget | Automated test (`check-cpr-s1-csrf-persist-race.js` AC1) + independent spec-compliance review | None |
| AC2 | ✅ | Injected-latency test: a fake adapter delays 50ms, token generated, session cleared immediately (simulated restart), rehydrated session's token matches. Reviewer independently reverted the core `await` and confirmed the test genuinely fails pre-fix | Automated test + spec-compliance reviewer's revert-and-fail experiment | None |
| AC3 | ✅ | No-adapter case resolves immediately, no throw, no hang | Automated test | None |
| AC4 | ✅ | Rejecting-write and hanging-write cases both resolve within the 500ms timeout cap, never throw, never hang indefinitely | Automated test (AC4a/AC4b) | None |
| AC5 | ✅ | All 9 pre-existing CSRF-focused test files + `check-ctpr-s1-csrf-token-persistence.js` re-run clean; `csrfGuard`/`csrfField` untouched (confirmed via diff) | Automated test re-run, independently re-verified by both reviewers | None |
| AC6 | ✅ | Same test as AC2 — the injected-latency + simulated-restart scenario is the direct proxy for the live restart condition that originally surfaced this bug | Automated test | Live Fly-restart reproduction not attempted for this specific AC per the story's own Out of Scope (not automatable); injected latency is the accepted proxy |

**Test file:** `tests/check-cpr-s1-csrf-persist-race.js` — 5/5 passing, re-confirmed on merged master.

---

## Scope Deviations

**Expanded from 1 to 28 call sites during implementation**, all within the story's own anticipated blast radius: the DoR enumerated 27 production call sites of `generateCsrfToken(req)`; a 28th (`html-shell.js`'s `renderLoginPage`) was self-caught by the implementer via a real test failure (`check-rcfc-s1-legacy-login-csrf.js`), not silently guessed at — flagged, then independently investigated and fixed. Two review findings were also fixed post-implementation, before merge: an unawaited `handleDashboard` dispatch in `server.js` (found independently by both dispatched reviewers) and a dangling, uncleared `setTimeout` in `persistSession`'s `Promise.race` (LOW, code-quality reviewer). A further independent full-suite run surfaced 5 test files broken by `handleDashboard`/`handleGetJourney` becoming genuinely async (previously had no real suspension point) — all fixed and re-verified before merge. All deviations are documented in the branch's commit history and were resolved before the PR was marked ready.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 AC groups, all covered (5 new unit tests in the dedicated regression file + a full existing-suite re-run for AC5).
**Tests passing:** 5/5 in the new file; all 10 CSRF-focused files clean; full suite 560 files run, 0 real failures (1 known pre-existing flaky file, `check-p3.5-validate-trace.js`, confirmed passing standalone).
**Gaps:** None per the test plan's own "Coverage gaps" section (AC6's live-restart-vs-injected-latency gap explicitly accepted and mitigated, matching `ctpr-s1`'s own precedent).

**Process note:** This was the widest-blast-radius story of the session (27+1 call sites across 12+ files). Two independent reviewer subagents were dispatched given the scope — spec-compliance (re-derived the full call-site list independently, performed a live revert-and-fail experiment on the critical AC2/AC6 test) and code-quality (scrutinized the timeout/cleanup mechanism, spot-checked call sites). Both converged independently on the same HIGH finding (`handleDashboard` dispatch), which was fixed before merge — a genuine cross-validation, not a formality.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | One additional network round-trip to Upstash Redis per session's first CSRF-token-needing render, capped at 500ms — confirmed one-time-per-session, not per-request |
| Security | ✅ | Tightens an existing security-adjacent guarantee (CSRF token durability); `csrfGuard`'s validation logic confirmed untouched by diff |
| Accessibility | ✅ N/A | No UI change |
| Audit | ✅ N/A | No audit-log call affected |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| None declared | N/A | N/A | Short-track direct correctness fix, no formal benefit-metric artefact. Live validation: post-merge, deployed to `wuce-staging` (v805), confirmed via `fly ssh console` that the fix is present in the running container. |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None from this story directly. Its own live validation led to a separate, follow-up discovery (`aslr-s1`) — a stale-session dead-end bug in the journey navigator, unrelated to CSRF, found while testing this fix's live restart-recovery behaviour.

---

## DoD Observations

1. **Pipeline-state bookkeeping was missed at merge time.** This story's `prStatus`/`stage`/`dodStatus` fields were never advanced past `dor-signed-off` despite the PR merging same-day — caught and corrected retroactively while writing this DoD, alongside `aslr-s1`'s identical gap. Both are being advanced together in this same bookkeeping pass.
2. **Two-reviewer dispatch paid off concretely** — both reviewers independently found the same real, non-trivial gap (`handleDashboard`'s unawaited dispatch) via different investigation paths, which is a stronger signal than either finding it alone.
3. **A pre-existing, unrelated CI blocker** (`ssp.1`'s missing test-plan artefact, `2026-06-20-skill-session-precomp`) was discovered and fixed while shipping the *next* story (`aslr-s1`), not this one — noted here only because it briefly affected this feature's own trace-validation status by association (same `pipeline-state.json` file).
