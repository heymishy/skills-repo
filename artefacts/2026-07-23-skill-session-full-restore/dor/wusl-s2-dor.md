## Definition of Ready: Full session-state restore from Redis

**Story reference:** `artefacts/2026-07-23-skill-session-full-restore/stories/wusl-s2-full-session-state-restore.md`
**Assessed by:** Claude (agent)
**Date:** 2026-07-23

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | "an operator resuming an in-flight feature/skill session" |
| H2 | At least 3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has at least one test | ✅ | Covered below |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | Maintainability + correctness of session restore |
| H6 | Complexity rated | ✅ | Rating 1 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS |
| H9 | Architecture Constraints populated | ✅ | Exact mechanism (allowlist → denylist) specified |

**All hard blocks pass.**

---

## Test Plan (folded into this contract, per this session's established short-track pattern)

| AC | Test approach |
|----|----------------|
| AC1 | Unit test: `mergeRedisSessionData` with a Redis-data fixture containing `canvasBlocks`, `conditionItems`, `dynamicQuestions`, `sectionDrafts`, `pendingConfirmation`, `pendingSectionDraft`, `currentSectionIndex`, `modelResponses`, `auditLog` — assert every one is present on the restored session |
| AC2 | Unit test: the original 8 allowlisted fields, unchanged behavior |
| AC3 | Unit test: Redis-data fixture deliberately includes `systemPrompt`/`contextFiles`/`precomputedStep1` with obviously-wrong sentinel values; assert the session's own freshly-built values (from `registerHtmlSession`) survive, not the sentinel values |
| AC4 | Unit test: Redis-data fixture includes an invented field name (`_futureFieldNotYetInvented`); assert it is present on the restored session |

## Coding Agent Instructions

```
Proceed: Yes
Story: Full session-state restore from Redis — artefacts/2026-07-23-skill-session-full-restore/stories/wusl-s2-full-session-state-restore.md

Constraints:
- Replace mergeRedisSessionData's hardcoded stateFields allowlist with a
  denylist-based copy: iterate Object.keys(redisData), skip 'accessToken',
  'systemPrompt', 'contextFiles', 'precomputedStep1', copy everything else
  onto session. Keep the existing special-cased `turns` handling (or fold
  it into the same loop -- either is fine as long as turns still restores
  correctly).
- Do not touch skill-session-redis.js (the write side) -- already correct.
- Do not touch the 9 handler call sites wusl-s1 already fixed.
- Open a draft PR when tests pass.
```

## Sign-off

**Signed off by:** Hamish King (Founder/Operator) — direct instruction this session, raised before starting Client/org discovery
