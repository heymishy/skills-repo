# Definition of Ready — def-s1 — Skills session resume: Redis restore on cache miss

**Story:** def-s1
**Feature:** 2026-07-03-skills-session-resume
**DoR run:** 1
**Date:** 2026-07-03
**Assessed by:** Claude Sonnet 4.6
**Oversight level:** Low (personal, non-regulated)

---

## Hard block results

| Block | Check | Result |
|-------|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS (6 ACs) |
| H3 | Every AC has ≥1 test | ✅ PASS |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage references named metric | ✅ PASS (M1) |
| H6 | Complexity rated | ✅ PASS (2) |
| H7 | No unresolved HIGH findings | ✅ PASS (review waived — short-track) |
| H8 | No uncovered ACs | ✅ PASS |
| H8-ext | Schema dependency check | ✅ PASS (no upstream dependencies) |
| H9 | Architecture Constraints populated, no Category E | ✅ PASS |
| H-E2E | No CSS-layout-dependent ACs without tooling or RISK-ACCEPT | ✅ PASS |
| H-NFR | NFR section "None — confirmed 2026-07-03" | ✅ PASS |
| H-NFR2 | No compliance NFRs with regulatory clauses | ✅ PASS (N/A) |
| H-NFR3 | Data classification not blank | ✅ PASS (N/A — no NFR profile) |
| H-NFR-profile | NFR section "None" — profile check skipped | ✅ PASS |
| H-GOV | discovery.md Approved By: Hamish King — Operator — 2026-07-03 | ✅ PASS |
| H-ADAPTER | No new injectable adapters introduced | ✅ PASS |
| H-INF | hasInfraTrack absent — check skipped | ✅ PASS |
| H-MIG | hasMigrationTrack absent — check skipped | ✅ PASS |

**Hard blocks: 19/19 PASS**

---

## Warnings

None — all warnings clear.

---

## Contract review

Proposed implementation aligns with all ACs. Key constraint acknowledged: `journeyId` is not in `mergeRedisSessionData`'s `stateFields` — handler must restore it explicitly after `mergeRedisSessionData`.

---

## Verdict

✅ **Definition of ready: PROCEED**

---

## Coding Agent Instructions

### Story
`artefacts/2026-07-03-skills-session-resume/stories/def-s1-session-resume.md`

### Test plan
`artefacts/2026-07-03-skills-session-resume/test-plans/def-s1-test-plan.md`

### Verification script
`artefacts/2026-07-03-skills-session-resume/verification-scripts/def-s1-verification.md`

### What to build

**Primary change — `src/web-ui/routes/skills.js` (`handleGetChatHtml`, ~line 3569):**

Current code:
```js
var session = _sessionStore.get(sessionId);
if (!session) {
  var notFoundHtml = renderShell({ title: 'Not Found', bodyContent: '<p>Session not found.</p>', user: { login: '' } });
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(notFoundHtml);
  return;
}
```

Required change — insert Redis restore between the `_sessionStore.get` check and the 404:
```js
var session = _sessionStore.get(sessionId);
if (!session) {
  var _redisData = await readSessionFromRedis(sessionId);
  if (_redisData) {
    registerHtmlSession(sessionId, _redisData.sessionPath, _redisData.skillName, { featureSlug: _redisData.featureSlug });
    mergeRedisSessionData(sessionId, _redisData);
    // journeyId is not in mergeRedisSessionData stateFields — restore explicitly
    var _restored = _sessionStore.get(sessionId);
    if (_restored && _redisData.journeyId) _restored.journeyId = _redisData.journeyId;
    session = _restored;
  }
}
if (!session) {
  var notFoundHtml = renderShell({ title: 'Not Found', bodyContent: '<p>Session not found.</p>', user: { login: '' } });
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(notFoundHtml);
  return;
}
```

**New test file — `tests/check-def-s1-session-resume.js`:**

Write 9 tests (T1.1, T2.1, T3.1, T3.2, T4.1, T5.1, T6.1, IT1, NFR1) as specified in the test plan. Use `freshRequire` to clear module cache between tests. Reset `setSkillSessionRedisAdapter(null)` after each test to avoid cross-contamination.

**`package.json` — add to test chain:**

Append `&& node tests/check-def-s1-session-resume.js` to the `"test"` script.

### MUST NOT touch

Any handler other than `handleGetChatHtml`. Do not modify `mergeRedisSessionData` signature or `stateFields` list. Do not modify `readSessionFromRedis`. Do not modify `registerHtmlSession`.

### Acceptance criteria required to pass
All 6 ACs in the story — verified by running `node tests/check-def-s1-session-resume.js` (all 9 tests pass) and confirming scenarios 1–7 in the verification script.

### Regression guard
After implementation, run: `node tests/check-wsm1-session-persistence.js && node tests/check-mfc1-model-first-chat-session.js && node tests/check-wsm3-non-happy-path.js` — all must still pass.

### DoR: Proceed — Low oversight
Assign directly to coding agent. No tech-lead sign-off required.
