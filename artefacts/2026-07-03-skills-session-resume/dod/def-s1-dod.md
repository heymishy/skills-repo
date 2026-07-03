# Definition of Done: Restore turns and artefact from Redis when session not in memory

**PR:** https://github.com/heymishy/skills-repo/pull/434 | **Merged:** 2026-07-03
**Story:** artefacts/2026-07-03-skills-session-resume/stories/def-s1-session-resume.md
**Test plan:** artefacts/2026-07-03-skills-session-resume/test-plans/def-s1-test-plan.md
**DoR artefact:** artefacts/2026-07-03-skills-session-resume/dor/def-s1-dor.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-07-03

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Redis restore on cache miss → 200 | ✅ | T1.1 chat-page-200-when-session-in-redis-not-in-memory | Automated unit test | None |
| AC2 — 404 preserved for genuinely unknown sessions | ✅ | T2.1 chat-page-404-when-session-absent-everywhere | Automated unit test | None |
| AC3 — Prior turns rendered; current Q shown; auto-fire suppressed | ✅ | T3.1 restored-session-renders-prior-qa-in-html + T3.2 restored-session-has-non-empty-chat-thread | Automated unit tests | None |
| AC4 — artefactContent → `__SW_INITIAL_ARTEFACT__` in HTML | ✅ | T4.1 restored-session-with-artefact-includes-init-script | Automated unit test | None |
| AC5 — journeyId restored explicitly | ✅ | T5.1 restored-session-has-journey-id-from-redis; explicit restoration in handler after mergeRedisSessionData | Automated unit test | None |
| AC6 — Hot path: no Redis call when session in memory | ✅ | T6.1 hot-path-skips-redis-when-session-in-memory; NFR1 redis-read-count-zero-for-hot-path | Automated unit tests | None |

---

## Scope Deviations

None. PR touched exactly three files: `src/web-ui/routes/skills.js` (+12 lines in `handleGetChatHtml` only), `tests/check-def-s1-session-resume.js` (new), `package.json` (+1 line). `handleResumeSession`, `journey.js`, and all UI files were not touched, consistent with the out-of-scope section.

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9 total
**Tests passing in CI:** 9 / 9

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1.1 — AC1: cache miss + Redis hit → 200 | ✅ | ✅ | |
| T2.1 — AC2: cache miss + Redis miss → 404 | ✅ | ✅ | |
| T3.1 — AC3(a)(b): prior turns + current Q in HTML | ✅ | ✅ | |
| T3.2 — AC3(c): #chat-messages non-empty (auto-fire guard) | ✅ | ✅ | |
| T4.1 — AC4: artefactContent → __SW_INITIAL_ARTEFACT__ | ✅ | ✅ | |
| T5.1 — AC5: journeyId restored | ✅ | ✅ | |
| T6.1 — AC6: hot path skips Redis | ✅ | ✅ | |
| IT1 — graceful fallback when Redis adapter null | ✅ | ✅ | |
| NFR1 — hot-path Redis read count = 0 | ✅ | ✅ | |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no extra Redis reads for sessions already in memory | ✅ | T6.1 and NFR1: Redis read count = 0 when session in `_sessionStore` |
| Availability — graceful Redis unavailability | ✅ | IT1: returns 404 (not crash) when `_skillSessionRedis` is null |

NFR section in story: "None — confirmed 2026-07-03." The performance and availability constraints above are derived from Architecture Constraints in the story and are verified by the test plan.

---

## Metric Signal

**M1 — Self-serve signup conversion (indirect)**
Signal: not-yet-measured
Evidence note: This fix removes the session-resume crash blocker on Fly.io deploys; no real user sessions have run against the deployed fix yet so conversion impact cannot be measured. M1 becomes measurable after the landing-auth-billing feature ships and real users complete skill sessions post-deploy.
Date measured: null

---

## Outcome

**COMPLETE**

**Follow-up actions:**
- Manual post-deploy smoke test (scenarios 3–5 in verification script): start a session, progress 2+ turns, restart server, navigate back — confirm prior turns visible. Owner: Hamish King.
- M1 signal to be checked after landing-auth-billing ships and accumulates real session data.

---

## DoD Observations

1. The `track: "short-track"` value in pipeline-state.json failed the trace schema check on the first CI run. The valid enum is `"short"`. The value was set during /branch-setup when the CLAUDE.md label ("short-track") was transcribed verbatim rather than the schema enum. /improve candidate: DoR or branch-setup should validate `track` against the schema enum before writing pipeline-state.
