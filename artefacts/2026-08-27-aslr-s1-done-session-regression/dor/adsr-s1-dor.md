# Definition of Ready: adsr-s1 — Stop churning fresh sessions for an already-done stage

**Story reference:** artefacts/2026-08-27-aslr-s1-done-session-regression/stories/adsr-s1-preserve-direct-link-for-done-sessions.md
**Test plan reference:** artefacts/2026-08-27-aslr-s1-done-session-regression/test-plans/adsr-s1-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-27
**Track:** Short-track (urgent regression fix, live on `wuce-staging` minutes after `aslr-s1` deployed)

---

## Contract review

Root cause confirmed via direct code inspection and live log evidence (two distinct session IDs firing full turn cycles ~70s apart on the same journey). Fix is a direct, minimal application of `handleGetJourneyById`'s own already-proven `kcrs-s1` pattern to `aslr-s1`'s 4 call sites. **✅ Contract review passed.**

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As an operator who has just completed a stage's turn..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 7 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1-AC7 each have 1+ test or re-run |
| H4 | Out-of-scope section is populated | ✅ | 2 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ N/A (short-track direct correctness fix) | Live regression, direct evidence cited |
| H6 | Complexity is rated | ✅ | Complexity 2, Scope stability Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ (short-track exemption) | No `/review` was run — short-track |
| H8 | Test plan has no uncovered ACs | ✅ | Test plan's "Coverage gaps" section states none |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Exact fix pattern specified per call site, with an existing precedent cited |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC is CSS-layout-dependent |
| H-NFR | NFR profile or explicit `NFRs: None — reviewed [date]` | ✅ | Story's NFR section fully populated |
| H-GOV | Governance approval (`## Approved By` in discovery artefact) | ✅ (short-track exemption) | No discovery artefact — short-track |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | No new adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass. 14/14.**

---

## Warnings

None raised — the fix pattern is copied directly from an existing, proven, in-file precedent (`handleGetJourneyById`'s `kcrs-s1` logic).

---

## Oversight level

**Medium** — this is a fix to a live regression this session itself introduced (`aslr-s1`), touching the same 4 call sites; the pattern is proven elsewhere but must be applied correctly at each of the 4 slightly-different call sites, and the live evidence (session churn, 403 on gate-confirm) must be confirmed resolved, not just theoretically addressed.

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

No section directly implicated — this is a targeted correction to `journey.js`'s own existing routing logic, not a new pattern.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: adsr-s1 — Stop churning fresh sessions for an already-done stage
  — artefacts/2026-08-27-aslr-s1-done-session-regression/stories/adsr-s1-preserve-direct-link-for-done-sessions.md
Test plan: artefacts/2026-08-27-aslr-s1-done-session-regression/test-plans/adsr-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Task order:
1. src/web-ui/routes/journey.js: at each of the 4 aslr-s1 call sites,
   add an existence check before falling through to /resume, matching
   handleGetJourneyById's own kcrs-s1 pattern (journey.js:2904-2911)
   exactly:
   a. Step-nav isActive branch (~891): before building the /resume
      href, call getGetHtmlSession()(_activeSid). If it resolves,
      build the direct /skills/:skill/sessions/:id/chat href instead.
   b. currentChatUrl (~931-933): same check, same direct-link fallback.
   c. handleGetStageReview (~628-632): split the existing
      `if (!session || !session.done || !session.artefactContent)`
      fallback into two branches -- `!session` -> /resume;
      `session exists but not done/no artefact` -> direct link to
      that session's own chat URL (session.skillName || journey.activeSkill).
   d. handleGetJourneyStageView's no-artefact-yet fallback (~775-779):
      add the same getGetHtmlSession() existence check before falling
      through to /resume; if it resolves, direct-link instead.
2. Do NOT modify handleGetJourneyResume or handleGetJourneyById --
   both are correct and proven as-is.
3. Update tests/check-aslr-s1-active-stage-link-resume.js in place:
   add fixture cases where getGetHtmlSession resolves a real (done and
   not-done) session for each of the 4 sites, asserting the direct-link
   behaviour (AC1-AC4). Keep the existing "session missing" fixture
   cases unmodified (AC5 regression guard). Add AC6's
   view-then-gate-confirm no-churn test.
4. Re-run check-s0.1/s0.2/s0.4, check-jsvr-s1-wire-stage-view-route.js,
   check-frsr-s1-feature-row-session-resume.js,
   check-dsh-s4-fix-resume-conversation-link.js, then the full suite.

Constraints:
- No new npm dependencies.
- Reuse getGetHtmlSession() exactly as handleGetJourneyById already
  does -- do not invent a new lookup mechanism.
- Do not touch handleGetJourneyResume's or handleGetJourneyById's own
  logic.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Open a draft PR when tests pass -- do not mark ready for review.
- Given this is an active live regression, prioritize correctness and
  speed of verification over any further scope expansion.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal named sign-off — short-track, urgent regression fix, direct live evidence
**Signed off by:** Claude (agent), on operator direction (live reproduction confirmed together)
**Date:** 2026-08-27
**Proceed:** Yes — all hard blocks pass, no warnings raised
