# Definition of Done: Rate-limit the capture-trigger endpoint per tenant user

**PR:** https://github.com/heymishy/skills-repo/pull/1015 | **Merged:** 2026-10-23
**Story:** `artefacts/2026-10-20-production-playback-capture/stories/ppc-s3.md`
**Test plan:** `artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s3-test-plan.md`
**DoR artefact:** `artefacts/2026-10-20-production-playback-capture/dor/ppc-s3-dor.md`
**Assessed by:** Claude (session)
**Date:** 2026-10-23

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `tests/check-ppc-s3-capture-rate-limit.js`: "the second trigger within 60s is rejected with a clear rate-limit message" and the cross-endpoint test "the rate-limit bucket is shared across single-AC capture and capture-all -- triggering one blocks the other for the same user" | integration-real-code (exercises the real `handlePostCaptureTrigger`/`handlePostCaptureAll` route handlers, shared `_captureRateLimiter` instance) | None |
| AC2 | ✅ | `tests/check-ppc-s3-capture-rate-limit.js`: "two different Product Owners in the same tenant are rate-limited independently -- user B is never blocked by user A's usage" | integration-real-code | None |
| AC3 | ✅ | `tests/check-ppc-s3-capture-rate-limit.js`: window-expiry test, real `Date.now` monkeypatch with `finally`-restore (not skipped, not mocked-only) | integration-real-code | None |
| NFR-Accessibility | ✅ | Unit tests confirm `role="alert"` HTML for form submissions and a parsed JSON error body for API callers (`tests/check-ppc-s3-capture-rate-limit.js`); independently confirmed `live-verified` during `/verify-completion` via a real Chrome session against the exact production HTML string, inspecting both the rendered page and its accessibility tree | unit + live-verified (UI-evidence gate satisfied via `/verify-completion`'s own live browser render check -- cited directly, nothing has changed in `playback-evidence.js` since) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. Checked against the story's own Out of Scope section: no system-wide/global concurrency cap was added, and limiting remains strictly per-user (not per-tenant), consistent with AC2.

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9 (test plan specified 4 unit + 2 integration + 2 NFR scenarios; implemented as 3 tests in `tests/check-ppc-s3-rate-limiter-keyfn.js` + 6 tests in `tests/check-ppc-s3-capture-rate-limit.js`, covering the same AC/NFR surface)
**Tests passing in CI:** 9 / 9, re-run directly against merged `master` (commit `cece002b`) post-merge, not just pre-merge branch state

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `check-ppc-s3-rate-limiter-keyfn.js` (regression, keyFn, onLimited — 3 tests) | ✅ | ✅ | Re-run on master post-merge |
| `check-ppc-s3-capture-rate-limit.js` (AC1, AC3, 2x NFR-Accessibility, AC1-cross-endpoint, AC2 — 6 tests) | ✅ | ✅ | Re-run on master post-merge |
| Full repo suite | ✅ | 776/779 (3 pre-existing, confirmed-unrelated failures: `check-pcr-s1-test-runner.js`, `check-pflx-s2-default-active-only-filter.js`, `check-spc5-capture-completeness-script.js`) | Evidence reused from the same-session `/verify-completion` run — no code changes occurred between that run and the fast-forward merge, so it remains valid; individually re-confirmed on master post-merge: all 3 of ppc-s3's own test files plus the 3 previously-regressed-and-fixed fixture files (`check-ppc-s1-playback-evidence-route.js`, `check-ppc-s2-capture-all-route.js`, `check-ppc-s1-ui-layer.js`) still pass |

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance (negligible rate-limiter overhead) | ✅ | Reuses the existing, already-proven `createRateLimiter` implementation unchanged in its default path; only two new optional, backward-compatible parameters (`keyFn`, `onLimited`) added. No new infrastructure, consistent with `sign-off.js`'s existing usage. Not independently re-benchmarked, as stated explicitly in the test plan — no claim is made that would require it. |
| Security (mitigates basic resource exhaustion only) | ✅ | Scoped explicitly: this story does not claim to prevent sophisticated or distributed abuse (out of scope per `discovery.md`'s Constraints section, and per the product's own distributed-rate-limiting roadmap note inherited unchanged, not a regression this story introduces). No test asserts a property not claimed. |
| Accessibility (rate-limit message exposed to assistive technology) | ✅ | `role="alert"` HTML for form submissions, confirmed both by unit test and by a live Chrome accessibility-tree check during `/verify-completion`; JSON error body for API callers. |
| Audit | ✅ (N/A) | Story states "None identified" explicitly — consistent with the feature-level NFR profile's own Audit logging row ("not yet scoped as a story," applies to all stories, not a blocking gap for this one). |

**NFR profile status:** All three stories in this feature (`ppc-s1`, `ppc-s2`, `ppc-s3`) have now independently addressed and evidenced every NFR row in `nfr-profile.md` that names them. `nfr-profile.md`'s own `Status` field updated from `Active` to `Verified at 2026-10-23` in this DoD run.

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Self-service DoD validation adoption | ✅ (0%) | Not yet — no live paying tenants exist for `wuce` yet | `contributingStories` for this metric did not previously include `ppc-s3` despite this story's own Benefit Linkage section and the benefit-metric artefact's own Coverage Matrix both naming it — corrected post-merge by `/trace` (2026-10-23); this is the second occurrence of the same `contributingStories`-sync gap class, `ppc-s1` having needed the identical correction at its own DoD. See DoD Observations. |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. (Already logged, out of this story's scope) `/capture` signal for `sign-off.js`'s inaccurate "per user" doc comment, to be actioned once convenient — not blocking.
2. (Already logged, out of this story's scope) Consider a shared test-fixture helper module (or a lint/grep-based pre-commit check) for the `session.userId`-in-fixture gap, independently rediscovered and fixed 3 times in this one story (`check-ppc-s1-playback-evidence-route.js`, `check-ppc-s2-capture-all-route.js`, `check-ppc-s1-ui-layer.js`) — judged a future-improvement candidate by code review, not an Important blocking finding.
3. The automatic feature-playback capture run (per the DoD skill's `rpca-s5` mandate, now that all 3 stories in this feature show `dodStatus: "complete"`) could not be attempted: `E2E_STAGING_AUTH_STUB_SECRET` is not configured in this session. Per the skill's own instruction, this does not affect this story's DoD verdict (determined above from its own ACs/tests/NFRs) and is not retried automatically. Logged as a named pending action in `workspace/state.json` for a future session with the secret configured.

---

## DoD Observations

1. **Feature-completion reached.** With `ppc-s3` now `dodStatus: "complete"`, all 3 stories in the `ppc-self-service-capture` epic (the only epic in this feature) are DoD-complete. This is the first time this feature has reached that state — no `/trace` report exists yet for `2026-10-20-production-playback-capture` (confirmed: `artefacts/2026-10-20-production-playback-capture/trace/` does not exist). Per this skill's own mandatory check, `/trace` should be run before `/release`.
2. **W4 RISK-ACCEPT carried through to completion without incident.** The `decisions.md` 2026-10-21 RISK-ACCEPT entry (verification scripts not independently reviewed by a domain expert, across `ppc-s1`/`ppc-s2`/`ppc-s3`) named its own mitigation as "double-check each verification scenario's actual outcome carefully at `/verify-completion` time." That check was carried out for `ppc-s3` (live Chrome browser/accessibility-tree check against the real production HTML string) and found no discrepancy between the verification script's plain-language scenarios and actual running behaviour.
3. **A genuine, non-trivial cross-story regression was found and fixed mid-build, not deferred.** Wiring a new per-user-keyed rate limiter into two already-shipped `ppc-s1`/`ppc-s2` handlers broke 3 pre-existing test files' fixtures (16 test failures total) because those fixtures predated `req.session.userId` as a session field. Each was root-caused independently (confirmed via direct code reading of `authGuard` and every real login path) and fixed narrowly (a module-level call counter in the shared `makeReq` test helper, touching only the fixture, never production code or call sites) — not by loosening the rate limiter. Tag: `/improve` candidate — see follow-up action 2 above.
4. **`contributingStories` sync gap, second occurrence.** `/trace` (2026-10-23) found `pipeline-state.json`'s Metric 1 `contributingStories` array was missing `ppc-s3`, despite this story's own Benefit Linkage section and `benefit-metric.md`'s Coverage Matrix both naming it. This is the identical gap class `ppc-s1` corrected at its own DoD (see `ppc-s1-dod.md`'s own DoD Observations) — a metric a story explicitly claims to move was never added to the state array that `/definition-of-done`'s own Step 6 reads, so the metric assessment was silently skipped for that story until caught downstream. Now corrected for `ppc-s3` too (array updated, Metric Signal row above revised from "N/A" to `not-yet-measured`). Tag: `/improve` candidate — worth a mechanical check (at `/definition` or `/definition-of-ready`) that confirms every story's own `Metric moved` reference is mirrored in `pipeline-state.json`'s `contributingStories` array before the story reaches `/definition-of-done`, rather than relying on each DoD (or a later `/trace`) to notice independently.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Rate-limit the capture-trigger endpoint per tenant user" (ppc-s3).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
