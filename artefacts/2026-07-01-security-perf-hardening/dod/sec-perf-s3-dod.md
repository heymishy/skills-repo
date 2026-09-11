# Definition of Done: CSRF tokens on server-rendered form POST endpoints

**PR:** https://github.com/heymishy/skills-repo/pull/476 | **Merged:** 2026-07-01
**Story:** artefacts/2026-07-01-security-perf-hardening/stories/sec-perf-s3.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — admin credit adjustment protected, round trip via `/admin/credits` | ✅ | `check-sec-perf-s3-admin-credits-csrf.js` (3/3, incl. AC1d full round trip) | Automated test, re-run fresh 2026-08-17 | None |
| AC2 — team member add/role-assign protected, round trip via `/team/members` | ✅ | `check-sec-perf-s3-team-members-csrf.js` (4/4) | Automated test, re-run fresh | None |
| AC3 — billing checkout protected, round trip via `/welcome` | ✅ | `check-sec-perf-s3-billing-checkout-csrf.js` (3/3, incl. AC3c full round trip) | Automated test, re-run fresh | None |
| AC4 — email signup/login protected, round trip via `/` | ✅ | `check-sec-perf-s3-auth-email-csrf.js` (17/17) | Automated test, re-run fresh | None |
| AC5 — token is per-session, not global (cross-session rejection) | ✅ | `check-sec-perf-s3-auth-email-csrf.js`, "a token from a different session must be rejected, got 403" | Automated test, re-run fresh | None |
| AC6 — every AC1–AC4 has a genuine end-to-end round-trip test (render → extract from HTML → submit → validate), not just guard-in-isolation | ✅ | AC1d/AC3c explicitly named; middleware-level coverage in `check-sec-perf-s3-csrf-middleware.js` (8/8) | Automated test, re-run fresh | None |

---

## Scope Deviations

None identified in this retroactive pass. All Out of Scope items confirmed still correctly excluded and explicitly named in the story (JSON/fetch-only POST endpoints, `/webhook/stripe`, test-only seed endpoints, the remaining unlisted server-rendered POST forms, and the legacy `renderLoginPage()` fallback shell) — the story itself flags these as a visible, deliberate gap deferred to a follow-up story, not silently dropped. No follow-up story for the remaining unprotected forms has been created as of this DoD pass — noted below.

---

## Test Plan Coverage

**Tests passing:** 35/35 total across 5 test files, re-run fresh 2026-08-17:
- `check-sec-perf-s3-admin-credits-csrf.js`: 3/3
- `check-sec-perf-s3-auth-email-csrf.js`: 17/17
- `check-sec-perf-s3-billing-checkout-csrf.js`: 3/3
- `check-sec-perf-s3-csrf-middleware.js`: 8/8
- `check-sec-perf-s3-team-members-csrf.js`: 4/4

**Gaps:** None identified in the delivered scope. The remaining unprotected server-rendered forms named in the story's own Out of Scope (e.g. `POST /journey/wizard`, `POST /api/journey`, `POST /products/confirm`, `POST /products/:id/features`) are a real, visible, self-documented gap — not covered by any test since they were never in scope for this story.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: token generation is a single cached `crypto.randomBytes(32)` call per session | ✅ | By construction, per story's own NFR framing |
| Security: token comparison intent, never logged | ✅ | Story's own framing, consistent with existing `validateOAuthState` precedent |
| Accessibility: hidden input, no visible UI change | ✅ | Not applicable — no new visible surface |
| Audit: CSRF rejection intentionally not separately audit-logged, matching existing `oauthState` mismatch handling | ✅ | Story's own explicit framing — a deliberate consistency choice, not an oversight |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track feature. Closes the CSRF gap explicitly deferred at the parent `sec-perf` story's own DoR sign-off (2026-07-01) — this story is itself the fulfillment of that deferred item, not a new discretionary addition.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:** ~~The story's own Out of Scope section names a real, unprotected remainder of server-rendered POST forms...~~ — done, `rcfc-s1` (PR #760, merged 2026-08-24). Closed 8 of the 9 named routes (the 9th, the annotations route, was investigated and correctly removed from scope — confirmed JSON/fetch-only, its only matching `<form>` was dead code) with 23/23 new tests plus a collateral-repair pass across ~40 pre-existing test files. `workspace/dod-backlog-findings.md`'s F4 entry already shows this resolution recorded. See DoD Observation #3.

---

## DoD Observations

1. ~6 weeks live in production, no incidents reported for the protected routes.
2. The unprotected-forms gap named in Out of Scope is the same "self-documented deferred gap, never actually followed up" pattern already seen in this DoD backlog pass for `r-canvas-render-and-story-extraction-fix`'s AC3 (which became `csgc-s1`) — worth naming as a recurring delivery pattern if `/improve` is ever run: stories that explicitly defer a sub-scope to "a follow-up story" in their own text should get that follow-up story created at DoD time, not left as a dangling intention. (This particular instance did eventually get a follow-up story, `rcfc-s1` — see Observation #4 — so the pattern held here even if the timing was 6+ weeks late.)
3. Closes the 2-story `2026-07-01-security-perf-hardening` cluster (`sec-perf-s2`/`sec-perf-s3`, both DoDs written in this same session pass).
4. **Backfilled 2026-09-11, following a repo-wide DoD-verification-method stocktake.** The deferred-forms gap this DoD's own Follow-up action flagged as still open was in fact closed by `rcfc-s1` (PR #760, merged 2026-08-24) — a proper follow-up story that did eventually get created, just later than this DoD's original 2026-08-17 write date. `workspace/dod-backlog-findings.md`'s F4 entry already correctly records this resolution; only this DoD artefact's own text was stale. No fresh Chrome or code work was needed — `rcfc-s1`'s own DoD already contains complete, re-verified-fresh evidence (23/23 tests against merged master).
