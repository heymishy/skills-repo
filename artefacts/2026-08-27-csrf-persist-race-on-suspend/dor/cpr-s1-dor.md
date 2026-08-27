# Definition of Ready: cpr-s1 — Close the race between persisting a new CSRF token and the process suspending mid-write

**Story reference:** artefacts/2026-08-27-csrf-persist-race-on-suspend/stories/cpr-s1-await-csrf-persist-before-response.md
**Test plan reference:** artefacts/2026-08-27-csrf-persist-race-on-suspend/test-plans/cpr-s1-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-27
**Track:** Short-track (follow-up bug fix, root-caused via live restart testing of `ctpr-s1` on `wuce-staging`)

---

## Contract review

Option A (make the write path awaited end-to-end) confirmed via `decisions.md`. Pre-implementation investigation (recorded in the test plan) precisely enumerated the full blast radius: 27 production call sites across 12 files (26 already `async`, 1 conversion needed in `dashboard.js`) and 3 existing test files needing migration to `await`. **✅ Contract review passed** — no ambiguity remains about scope.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As an operator whose session survives a Fly machine restart" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1-AC4, AC6: 1 test each; AC5: existing-suite re-run (migrated to async) |
| H4 | Out-of-scope section is populated | ✅ | 3 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ N/A (short-track direct correctness fix) | No formal benefit-metric artefact |
| H6 | Complexity is rated | ✅ | Complexity 3, Scope stability Stable (de-risked by pre-implementation investigation confirming 26/27 sites are mechanical) |
| H7 | No unresolved HIGH findings from the review report | ✅ (short-track exemption) | No `/review` was run — short-track |
| H8 | Test plan has no uncovered ACs | ✅ | Test plan's own "Coverage gaps" section explicitly names and mitigates the one gap (AC6's live-restart-vs-injected-latency proxy) |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Full call-site enumeration, dashboard.js conversion reasoning, timeout-cap requirement all detailed |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC is CSS-layout-dependent |
| H-NFR | NFR profile or explicit `NFRs: None — reviewed [date]` | ✅ | Story's NFR section fully populated |
| H-GOV | Governance approval (`## Approved By` in discovery artefact) | ✅ (short-track exemption) | No discovery artefact — short-track |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | Reuses `session.js`'s existing `setRedisAdapterForTesting` seam |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass. 14/14.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or explicitly "None — confirmed" | ✅ | — | N/A — satisfied |
| W2 | Scope stability declared | ✅ | — | N/A — satisfied |
| W4 | Verification script reviewed by a domain expert | ⚠️ Acknowledged | This story touches 12 production files (27 call sites) — the widest blast radius of any story this session. The pre-implementation investigation substantially de-risked this (26/27 sites are a pure mechanical `await` addition; only `dashboard.js` needs a real function-signature change), and the operator already selected Option A with full knowledge of this scope. | Hamish King (operator) — explicit "do 1" (Option A) direction, given full tradeoff context beforehand |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ Acknowledged | The one named gap (a future 28th call site forgetting `await`) is explicitly out of this test plan's reach and flagged as a story-level revisit trigger, not silently dropped | N/A — explicitly mitigated |

All warnings resolved or acknowledged. RISK-ACCEPT for W4 logged in `decisions.md`.

---

## Oversight level

**Medium** — security-adjacent (CSRF token durability) and the widest file/call-site footprint this session, but the mechanism itself is a well-proven pattern (`await` a promise chain) with no new architectural surface, and 26 of 27 call sites require zero judgment (pure mechanical addition).

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

No section of this file is directly implicated — this story touches session/CSRF infrastructure across many route files, not shared-shell rendering or HTML-render-function testing conventions.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: cpr-s1 — Close the race between persisting a new CSRF token and the process suspending mid-write
  — artefacts/2026-08-27-csrf-persist-race-on-suspend/stories/cpr-s1-await-csrf-persist-before-response.md
Test plan: artefacts/2026-08-27-csrf-persist-race-on-suspend/test-plans/cpr-s1-test-plan.md
Decision: Option A locked in (decisions.md) -- await end-to-end, not a
central pending-writes flush.

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Task order:
1. src/web-ui/middleware/session.js: change persistSession to RETURN
   the promise from adapter.writeSession(...).catch(...) instead of
   fire-and-forget (still catches its own errors internally -- keep
   the existing .catch() so a failed write resolves, not rejects).
   Add a short timeout cap (e.g. Promise.race against a ~500ms timer)
   so a hung/slow adapter can never block the response indefinitely --
   this satisfies AC4.
2. src/web-ui/middleware/csrf.js: make generateCsrfToken async; await
   persistSession(req.sessionId) inside the token-minting branch
   (same placement as today, just awaited now).
3. Update all 27 call sites of generateCsrfToken(req) across:
   admin-credits.js, admin-mock-gateway.js, dashboard.js, features.js,
   impersonation.js, journey.js (9 sites), org-conversion.js,
   products.js (3 sites), public.js (2 sites), settings.js (2 sites),
   skills.js (3 sites), team-management.js (2 sites) -- add `await`
   at each call site. 26 of 27 enclosing functions are already async;
   ONLY dashboard.js's handleDashboard needs converting from
   `function handleDashboard(req, res)` to
   `async function handleDashboard(req, res)` (its one caller in
   server.js does not await it and does not rely on synchronous
   completion -- confirmed safe during pre-implementation investigation).
4. Update the 3 existing test files that call generateCsrfToken(
   synchronously: tests/check-sec-perf-s3-csrf-middleware.js (M1, M2),
   tests/check-sec-perf-s3-admin-credits-csrf.js, and
   tests/check-ctpr-s1-csrf-token-persistence.js (5 call sites) --
   add `await` at each.
5. Write tests/check-cpr-s1-csrf-persist-race.js covering AC1-AC4/AC6
   per the test plan, including the critical injected-latency test
   (AC2/AC6) -- verify it genuinely fails against the pre-fix logic
   before trusting it passes post-fix.
6. Re-run all 9 CSRF-focused test files (the 3 updated in step 4 plus
   the 6 untouched ones), then every route file's own existing test
   suite for the 12 files touched in step 3 (to catch any incidental
   breakage from the dashboard.js async conversion or any missed
   await), then the full suite.

Constraints:
- No new npm dependencies.
- Do not touch csrfGuard, csrfField, or the 403 "Forbidden" response.
- Do not change csrfGuard's validation logic or persistSession's
  existing best-effort philosophy (errors still degrade silently, now
  just awaited-then-degraded rather than fire-and-forget).
- Do not add a timeout so short it defeats the fix's own purpose on a
  real (if slightly slow) network -- 500ms is a reasonable starting
  point, adjust with reasoning if a shorter/longer cap makes more
  sense once you're in the code.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or
  violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass -- do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests (e.g.
  a 28th call site not enumerated here, or a route file's own test
  suite failing in a way unrelated to the await addition): add a PR
  comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal named sign-off — tech-lead/operator awareness (satisfied: operator directed the live-bug investigation, chose Option A explicitly with full tradeoff context)
**Signed off by:** Claude (agent), on explicit operator direction ("do 1")
**Date:** 2026-08-27
**Proceed:** Yes — all hard blocks pass, all warnings resolved or acknowledged
