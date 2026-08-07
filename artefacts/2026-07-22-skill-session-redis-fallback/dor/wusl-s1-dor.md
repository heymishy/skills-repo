## Definition of Ready: Consistent skill-session Redis fallback

**Story reference:** `artefacts/2026-07-22-skill-session-redis-fallback/stories/wusl-s1-consistent-session-redis-fallback.md`
**Test plan reference:** `artefacts/2026-07-22-skill-session-redis-fallback/test-plans/wusl-s1-test-plan.md`
**Assessed by:** Claude (agent)
**Date:** 2026-07-22

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | "a user in the middle of an active skill session" |
| H2 | At least 3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has at least one test | ✅ | AC1-AC4 covered |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | Resilience consistency |
| H6 | Complexity rated | ✅ | Rating 2 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H9 | Architecture Constraints populated | ✅ | Names exact reused/excluded functions |
| H-E2E | N/A | ✅ N/A | No layout concern |
| H-NFR | Story NFR field populated | ✅ | Performance, resilience, security |

**All hard blocks pass.**

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Consistent skill-session Redis fallback — artefacts/2026-07-22-skill-session-redis-fallback/stories/wusl-s1-consistent-session-redis-fallback.md
Test plan: artefacts/2026-07-22-skill-session-redis-fallback/test-plans/wusl-s1-test-plan.md

Constraints:
- Extract handleGetChatHtml's existing inline Redis-restore logic (read
  compact Redis record -> registerHtmlSession -> mergeRedisSessionData ->
  re-attach journeyId) into a shared async _getSessionOrRestore(sessionId)
  helper. handleGetChatHtml itself must call this helper too (dedupe, not
  duplicate).
- Apply the helper (await _getSessionOrRestore(sessionId) instead of a raw
  _sessionStore.get(sessionId)) at exactly these 9 call sites, all already
  in async functions: handlePostAnswer, handleGetSessionState,
  handleCommitArtefact, handlePostCanvasEditHtml, handlePostTurnHtml,
  handlePostTurnStreamHtml, handlePostAssumptionConfirm, htmlSubmitTurn,
  htmlRecordAnswer.
- Do NOT touch _getHtmlSession, htmlGetNextQuestion, htmlGetCompletePage,
  htmlGetPreview, or linkSessionToJourney -- explicitly out of scope.
- Read .github/architecture-guardrails.md before implementing.
- Open a draft PR when tests pass.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Signed off by:** Hamish King (Founder/Operator) — direct instruction this session to harden persistence as its own short-track story
