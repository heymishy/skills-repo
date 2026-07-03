# AC Verification Script — def-s1 — Skills session resume: Redis restore on cache miss

**Story:** def-s1
**Feature:** 2026-07-03-skills-session-resume
**Verified by:** [Name]
**Date:** [Date]

---

## Purpose

This script serves three moments without modification:
1. **Pre-code sign-off** — confirm the described behaviour is what you want before implementation begins
2. **Post-merge smoke test** — confirm the shipped fix behaves as described
3. **Delivery review** — structured walkthrough for stakeholders

---

## Setup

You need a running local server with Redis configured (Upstash env vars set), or use the automated tests as a proxy for the server-side scenarios.

**To run the automated test suite:**
```powershell
# PowerShell — load .env then run test
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
node tests/check-def-s1-session-resume.js
```
```bash
# bash/zsh
export $(grep -v '^#' .env | xargs) && node tests/check-def-s1-session-resume.js
```

All 9 tests should pass (exit code 0).

**To verify manually (post-merge smoke test):** start the server normally, then run through scenarios 3–5 below using a real browser.

---

## Scenario 1 — Automated: Cache miss + Redis hit → 200 (AC1)

**What to check:** When a session is in Redis but not in the server's memory (e.g. after a restart), navigating to the chat URL returns the page, not a "Session not found" error.

**Automated check:** `node tests/check-def-s1-session-resume.js` — look for `[PASS] T1.1 chat-page-200-when-session-in-redis-not-in-memory`

**Manual check (post-merge):**
1. Start a skill session and progress through at least one turn (so the session is written to Redis)
2. Restart the server (kills in-memory state)
3. Navigate to the same `/skills/discovery/sessions/<id>/chat` URL
4. Expected: the chat page loads (you see the skill interface, not "Session not found")
5. Broken behaviour looks like: a plain "Session not found" error page or a 404

---

## Scenario 2 — Automated: Genuinely unknown session → 404 (AC2)

**What to check:** A URL with a session ID that was never created returns a 404, not a server error. The fix must not make every 404 silently disappear.

**Automated check:** `[PASS] T2.1 chat-page-404-when-session-absent-everywhere`

**Manual check (post-merge):**
1. Navigate to `/skills/discovery/sessions/00000000-0000-0000-0000-000000000000/chat`
2. Expected: "Session not found" page (404) — not a server error, not a blank page
3. Broken behaviour: any response other than a clear "not found" message

---

## Scenario 3 — Manual: Prior conversation history visible on resume (AC3)

**What to check:** After resuming a mid-session skill (e.g. question 3 of 10), the previous questions and your answers are shown above the current question. The skill does not restart from question 1.

**Steps:**
1. Start a `/discovery` skill session through a journey
2. Answer the first two questions the skill asks (type your answers and submit)
3. You should now be at question 3 — the skill has asked you a new question
4. Note the URL (`/skills/discovery/sessions/<id>/chat`) and the content of questions 1 and 2
5. Restart the server (kills in-memory state)
6. Navigate back to the same URL
7. Expected:
   - Question 1 appears at the top of the chat thread (greyed out as history), followed by your answer to it
   - Question 2 appears next as history, followed by your answer to it
   - Question 3 appears as the current prompt — awaiting your answer
   - The input box is ready for you to type
8. Broken behaviour looks like:
   - Blank chat thread — only the initial skill greeting appears (session restarted from Q1)
   - "Session not found" error (Redis restore not working)
   - Question 3 appears twice (duplicate question rendered)

---

## Scenario 4 — Manual: Partial artefact draft shown on resume (AC4)

**What to check:** If you were mid-way through a skill and the right-hand artefact panel had started populating, the draft content reappears when you resume after a server restart.

**Steps:**
1. Run a skill session far enough that the artefact panel on the right shows some draft content (typically after 4–6 questions for `/discovery`)
2. Note what text appears in the right-hand "draft" panel
3. Restart the server
4. Navigate back to the session URL
5. Expected: the right-hand draft panel shows the same partial artefact content from before the restart
6. Broken behaviour looks like: right panel is empty or shows "answer the next questions to draft this section"

---

## Scenario 5 — Manual: Journey navigator and gate-confirm panel work after resume (AC5)

**What to check:** If the session was linked to a journey, the stage navigator at the top of the page and the "Continue to next stage →" button render correctly after a resume.

**Steps:**
1. Start a session via a journey (the URL looks like `/skills/discovery/sessions/<id>/chat` but was reached via the journey page)
2. Progress to a point where the skill shows the "Continue to benefit-metric →" gate button at the bottom
3. Restart the server
4. Navigate back to the session URL
5. Expected: the journey navigator strip at the top shows the correct stage progression; the gate-confirm button is still visible
6. Broken behaviour: journey strip is missing; "Continue to next stage" button is gone; the page shows as if no journey was linked

---

## Scenario 6 — Automated: No extra Redis reads for normal (in-memory) sessions (AC6)

**What to check:** Sessions that are already in memory are served as before — no change in behaviour and no unnecessary Redis lookups.

**Automated check:** `[PASS] T6.1 hot-path-skips-redis-when-session-in-memory`

This is a performance regression guard. If this test fails, every chat page load triggers an extra Redis round-trip even when the session is in memory — unacceptable latency.

---

## Scenario 7 — Automated: Graceful fallback when Redis is unavailable (IT1)

**What to check:** If the Redis adapter is not configured (no Upstash env vars, or Redis is down), the server does not crash — it returns a normal 404 for unknown sessions.

**Automated check:** `[PASS] IT1 graceful-fallback-when-redis-adapter-not-wired`

**Manual check (post-merge):** Remove `UPSTASH_REDIS_REST_URL` from the environment and start the server. Navigate to a non-existent session URL. Expected: "Session not found" (404), not a 500 server error.

---

## Pass criteria

All scenarios pass when:
- Automated: `node tests/check-def-s1-session-resume.js` exits 0 with 9 `[PASS]` lines
- Manual (scenarios 3–5): Prior conversation, artefact, and journey panel all appear correctly after a server restart
- No regressions: existing `node tests/check-wsm1-session-persistence.js`, `node tests/check-mfc1-model-first-chat-session.js`, and `node tests/check-wsm3-non-happy-path.js` continue to pass
