# Definition of Ready: aslr-s1 — Route the journey navigator's active-stage link through the existing resume flow

**Story reference:** artefacts/2026-08-27-active-stage-link-stale-session-dead-end/stories/aslr-s1-route-active-stage-link-through-resume.md
**Test plan reference:** artefacts/2026-08-27-active-stage-link-stale-session-dead-end/test-plans/aslr-s1-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-27
**Track:** Short-track (bug fix, root-caused via live resume testing on `skills-framework.fly.dev` production)

---

## Contract review

Fix target confirmed via direct source inspection: `journey.js:891`'s step-nav active-stage link is the only one of 8+ similar `journey.activeSessionId`-derived redirects that has no existence check or fallback. `handleGetJourneyResume` (`journey.js:1413-1580`) already implements the complete recovery chain needed and is already tested. The fix is a single `href` construction change. **✅ Contract review passed** — no ambiguity remains about scope.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As an operator returning to an in-progress journey..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1-AC6 each have 1+ dedicated test (test plan numbers them AC1-AC7, one extra regression-suite test) |
| H4 | Out-of-scope section is populated | ✅ | 3 explicit exclusions, each with reasoning |
| H5 | Benefit linkage field references a named metric | ✅ N/A (short-track direct correctness fix) | No formal benefit-metric artefact |
| H6 | Complexity is rated | ✅ | Complexity 1, Scope stability Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ (short-track exemption) | No `/review` was run — short-track |
| H8 | Test plan has no uncovered ACs | ✅ | Test plan's "Coverage gaps" section states none — target endpoint already well-tested |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Explicit "do not modify X/Y" constraints, with reasoning tied to `def-s1`/`frsr-s1` precedent |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC is CSS-layout-dependent |
| H-NFR | NFR profile or explicit `NFRs: None — reviewed [date]` | ✅ | Story's NFR section fully populated |
| H-GOV | Governance approval (`## Approved By` in discovery artefact) | ✅ (short-track exemption) | No discovery artefact — short-track |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | No new adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass. 14/14.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or explicitly "None — confirmed" | ✅ | — | N/A — satisfied |
| W2 | Scope stability declared | ✅ | — | N/A — satisfied |

No warnings raised — this is a Complexity-1, single-call-site fix against an already-tested target endpoint.

---

## Oversight level

**Low** — a single `href` construction change reusing an existing, already-tested, already-production-proven endpoint (`handleGetJourneyResume` is the journey list's own "Continue →" entry point). No new mechanism, no new access-control surface, no new adapter.

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

No section of this file is directly implicated — this story changes one link's href, not a shared-shell rendering pattern or a new HTML-render-function requiring new test conventions.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: aslr-s1 — Route the journey navigator's active-stage link through the existing resume flow
  — artefacts/2026-08-27-active-stage-link-stale-session-dead-end/stories/aslr-s1-route-active-stage-link-through-resume.md
Test plan: artefacts/2026-08-27-active-stage-link-stale-session-dead-end/test-plans/aslr-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Task order:
1. src/web-ui/routes/journey.js: in the step-nav renderer's `isActive`
   branch (around line 890-891), change the emitted href from
   `/skills/' + encodeURIComponent(_activeSkill) + '/sessions/' +
   encodeURIComponent(_activeSid) + '/chat'` to
   `/journey/' + encodeURIComponent(journey.featureSlug) + '/resume'`.
   `journey.featureSlug` is already in scope in this function (used two
   lines earlier for `featureName`, around line 872) -- no new lookup
   needed. Do NOT change the `isDone` branch (lines 887-889) -- it
   already links correctly to the static artefact view.
2. Do NOT modify handleGetJourneyResume (journey.js:1413-1580) or
   handleGetChatHtml's 404 handling (skills.js:4343-4358) -- both are
   correct and tested as-is; this story only changes which endpoint one
   link points to.
3. Write tests/check-aslr-s1-active-stage-link-resume.js covering
   AC1-AC7 per the test plan:
   - AC1: render the step-nav HTML, assert the active stage's href is
     `/journey/<featureSlug>/resume`, not the raw session chat URL.
   - AC2/AC3: re-run (don't duplicate) the existing coverage in
     check-s0.2-resume-existing-session.js and
     check-s0.4-resume-redis-session.js to confirm no regression --
     these exercise the endpoint this story's link now points to.
   - AC4/AC5 (the actual new behaviour): call GET
     /journey/:featureSlug/resume for a journey whose activeSessionId
     exists in NEITHER the in-memory session store NOR the (stubbed)
     Redis adapter. Assert: (a) response is a 303 to a NEW session id's
     chat URL, not a 404; (b) the journey record's activeSessionId now
     equals that new session id, not the original stale one.
   - AC6: render step-nav HTML for a journey with a completed
     (non-active) stage; assert that stage's href is unchanged
     (/journey/:journeyId/stage/:skillName).
4. Re-run check-s0.1-resume-guard.js, check-s0.2-resume-existing-session.js,
   check-s0.4-resume-redis-session.js, and any other test file that
   asserts on journey.js's step-nav rendering (grep for "sn-step" or
   "_renderJourneyStageView" in tests/ to find them) to confirm no
   regression, then the full suite.

Constraints:
- No new npm dependencies.
- Do not touch handleGetJourneyResume's internal logic, its established
  "a done session always starts fresh" contract, or handleGetChatHtml's
  404 page.
- This is a one-line href change plus new tests -- do not refactor the
  surrounding step-nav rendering function beyond that line.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or
  violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a
  PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No formal named sign-off — short-track, Complexity 1
**Signed off by:** Claude (agent), on operator direction ("Yes please" — write up the story)
**Date:** 2026-08-27
**Proceed:** Yes — all hard blocks pass, no warnings raised
