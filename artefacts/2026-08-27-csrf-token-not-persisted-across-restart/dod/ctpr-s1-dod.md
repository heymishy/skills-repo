# Definition of Done: ctpr-s1 — Persist a newly-generated CSRF token to Redis immediately, not never

**PR:** https://github.com/heymishy/skills-repo/pull/772 | **Merged:** 2026-08-26T19:59:36Z (commit `21413f5a`)
**Story:** `artefacts/2026-08-27-csrf-token-not-persisted-across-restart/stories/ctpr-s1-persist-csrf-token-on-generation.md`
**Test plan:** `artefacts/2026-08-27-csrf-token-not-persisted-across-restart/test-plans/ctpr-s1-test-plan.md`
**DoR:** `artefacts/2026-08-27-csrf-token-not-persisted-across-restart/dor/ctpr-s1-dor.md`
**Assessed by:** Claude (agent)
**Date:** 2026-08-27

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | New-token mint triggers exactly one `persistSession` write, confirmed via spy adapter; spec-compliance review traced the code path directly | Automated test + code-path trace | None |
| AC2 | ✅ | `persistSession` call confirmed inside the `if (!req.session.csrfToken)` branch, not after it; 2 calls produce 1 write | Automated test + code-path trace | None |
| AC3 | ✅ | No-adapter case traced through `persistSession`'s own `if (!adapter) return;` — no new failure mode | Automated test + code-path trace | None |
| AC4 | ✅ | Real end-to-end test: genuine Map-backed fake Redis, real `_clearForTesting()`, real `sessionMiddleware` re-invocation exercising the actual rehydration path — confirmed NOT a spy-only shortcut by both reviewers independently | Automated test + code-path trace | None |
| AC5 | ✅ | All 9 pre-existing CSRF-focused suites re-run individually by 4 independent parties (implementer, spec-compliance reviewer, code-quality reviewer, me) — 0 regressions in every run | Automated test | None |

**Test file:** `tests/check-ctpr-s1-csrf-token-persistence.js` — 4/4 passing, re-confirmed fresh on merged master (2026-08-27).

---

## Scope Deviations

None. Diff confirmed to touch exactly `src/web-ui/middleware/csrf.js` (2 lines added) and one new test file — matching the DoR contract exactly.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 AC groups / 4 individual tests (AC5 is a re-run of existing suites, not a new test).
**Tests passing:** 4/4, confirmed fresh on merged master; all 9 existing CSRF suites also re-confirmed clean.

**Gaps:** None per the test plan's own "Test Gaps and Risks" table ("None").

**Full-suite result:** 557 files run. Note a genuinely observed flake: the implementer's full-suite run showed 1 failure (`tests/check-p3.5-validate-trace.js`), which passed 5/5 when re-run standalone immediately after; my own independent full-suite run showed 0 failures (557/557). This file's flakiness under full-suite load (not under standalone execution) is a pre-existing environment characteristic unrelated to this change — logged as an observation, not a new defect this story introduced.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | Rated "negligible" — confirmed: the new Redis write only fires on the already-rare first-mint path, never on idempotent reuse (AC2) |
| Security | ✅ | Code-quality review explicitly assessed persisting `csrfToken` to Redis: not a bearer credential like `accessToken` (which remains excluded via `_sanitiseForRedis`); `SameSite=Lax` cookie policy already blocks the cross-site-POST attack vector a leaked token alone would require; a Redis compromise scenario already exposes strictly more sensitive fields (`userId`, `login`, `oauthState`) regardless. No regression identified. |
| Accessibility | ✅ N/A | No UI change |
| Audit | ✅ N/A | No existing audit-log call affected |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| None declared | N/A | N/A | Short-track direct correctness fix, no formal benefit-metric artefact — same treatment as `avpf-s1`/`alrf-s4`/`jspf-s1`. |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. (Out of scope, noted in story) A friendlier client-side recovery experience for a genuine (now much rarer) CSRF mismatch — e.g. detecting a 403 on gate-confirm and offering an inline retry rather than a raw "Forbidden" page — was explicitly deferred as a separate, smaller follow-up if ever judged worth doing.
2. (Out of scope, noted in story) `fly.toml`'s `min_machines_running = 0` auto-suspend configuration was not changed. This fix makes a restart, whenever it happens, no longer break in-flight CSRF-protected forms — it does not reduce how often restarts happen. That remains an infrastructure/cost trade-off decision for the operator.
3. (Process note, not a defect) Two real `gate-advance` CLI gaps were found and worked around during this story's DoR sign-off (logged in `workspace/learnings.md` 2026-08-27): the `**Story reference:**`/`**Test plan reference:**` header-parsing regex breaks on backtick-wrapped paths, and the `dor-signed-off`/`definition-of-ready` gate's H7 check has no short-track exemption despite CLAUDE.md's own documented routing table. Worth fixing the tooling itself in a future session so `gate-advance` becomes usable for short-track DoR sign-off again.

---

## DoD Observations

1. **This is the second story this session (after `jspf-s1`) where `gate-advance`'s DoR validation proved unusable for a short-track story**, for two distinct, now-documented reasons. Both stories fell back to plain `advance` for DoR sign-off. This is a real, recurring tooling gap worth a dedicated fix, not just a one-off workaround — three short-track stories in one session (`pncg-s1`, `jspf-s1`, `ctpr-s1`) have now all hit the same wall.
2. **The `track: standard` vs `short` mistake from `jspf-s1` did not recur here** — `feature.track=short` was set correctly from the very first `advance` call after `bin/skills init`, and CI's trace-validation check passed clean on the first PR run (no second CI cycle needed, unlike `jspf-s1`). Direct evidence the earlier learning was successfully applied.
3. **Root-cause depth paid off.** The investigation traced the exact mechanism (restart → Redis rehydration → missing `csrfToken` → deterministic 403) using real evidence (`fly logs` showing two actual machine restarts in the session window) rather than stopping at a plausible-sounding guess. This produced a 2-line fix with very high confidence, rather than a broader, riskier change (e.g., changing the 403 response UX, or touching `fly.toml`) that would have treated a symptom instead of the cause.
