# Definition of Ready: aslr-s1 — Route the journey navigator's active-stage link through the existing resume flow

**Story reference:** artefacts/2026-08-27-active-stage-link-stale-session-dead-end/stories/aslr-s1-route-active-stage-link-through-resume.md
**Test plan reference:** artefacts/2026-08-27-active-stage-link-stale-session-dead-end/test-plans/aslr-s1-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-27
**Track:** Short-track (bug fix, root-caused via live resume testing on `skills-framework.fly.dev` production)

---

## Contract review

Fix target confirmed via direct source inspection: 4 of 10+ `journey.activeSessionId`-derived redirects in `journey.js` have no existence check or fallback (step-nav's `isActive` breadcrumb line 891, the "← Current stage" button's `currentChatUrl` line 931-933, `handleGetStageReview`'s fallback line 628-632, `handleGetJourneyStageView`'s own no-artefact-yet fallback line 775-779). `handleGetJourneyResume` (`journey.js:1413-1580`) already implements the complete recovery chain needed and is already tested. The fix is four mechanically-identical `href`/`Location` construction changes. **✅ Contract review passed** — no ambiguity remains about scope.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As an operator returning to an in-progress journey..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 8 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1-AC8 each have 1+ dedicated or re-run test |
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
1. src/web-ui/routes/journey.js: change all FOUR raw
   `/skills/' + skill + '/sessions/' + sid + '/chat'` constructions built
   from `journey.activeSessionId` to `/journey/' +
   encodeURIComponent(journey.featureSlug) + '/resume'`:
   a. The step-nav renderer's `isActive` branch (~line 891).
   b. `currentChatUrl`'s definition (~line 931-933), used by the
      "← Current stage" button at ~lines 1013 and 1326 -- this is the
      literal link clicked during live reproduction.
   c. `handleGetStageReview`'s not-done/no-artefact fallback (~line
      628-632).
   d. `handleGetJourneyStageView`'s own no-artefact-yet fallback (~line
      775-779).
   `journey.featureSlug` is already in scope at every site. Do NOT change
   the `isDone` branch (lines 887-889) -- it already links correctly to
   the static artefact view.
2. Do NOT modify handleGetJourneyResume (journey.js:1413-1580) or
   handleGetChatHtml's 404 handling (skills.js:4343-4358) -- both are
   correct and tested as-is; this story only changes which endpoint these
   four call sites point to.
3. Write tests/check-aslr-s1-active-stage-link-resume.js covering
   AC1/AC5/AC6/AC7 per the test plan (AC2/AC3/AC4 are exercised via
   existing, unmodified coverage in check-s0.2/check-s0.4 -- do not
   duplicate them):
   - AC1/AC5: render handleGetJourneyStageView's full page for a journey
     with one completed non-viewed stage and an active stage with a
     stale activeSessionId. Assert the active stage's step-nav href AND
     the "Current stage" button's href both equal
     /journey/<featureSlug>/resume, the old raw URL appears nowhere in
     the page, and the completed stage's own link is unchanged
     (/journey/:journeyId/stage/:skillName).
   - AC6: call handleGetStageReview directly with a stale/missing active
     session; assert the 302 Location is /journey/<featureSlug>/resume.
   - AC7: call handleGetJourneyStageView for a stage with no artefact
     yet; assert the 302 Location is /journey/<featureSlug>/resume.
     Update check-jsvr-s1-wire-stage-view-route.js's existing "unknown
     stageName" edge-case assertion to match this new target (it
     currently asserts the old raw URL).
4. Re-run check-s0.1-resume-guard.js, check-s0.2-resume-existing-session.js,
   check-s0.4-resume-redis-session.js, check-jsvr-s1-wire-stage-view-route.js,
   check-frsr-s1-feature-row-session-resume.js,
   check-dsh-s4-fix-resume-conversation-link.js, and any other test file
   that asserts on journey.js's step-nav rendering (grep for "sn-step" or
   "_renderJourneyStageView" in tests/ to find them) to confirm no
   regression, then the full suite.

Constraints:
- No new npm dependencies.
- Do not touch handleGetJourneyResume's internal logic, its established
  "a done session always starts fresh" contract, or handleGetChatHtml's
  404 page.
- This is four mechanically-identical href/Location changes plus new
  tests -- do not refactor the surrounding functions beyond that.
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
