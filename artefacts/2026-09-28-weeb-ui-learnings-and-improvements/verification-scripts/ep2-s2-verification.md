# AC Verification Script: Signal-to-session seeding bridge — CTA creates a seeded skill session

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s2.md
**Technical test plan:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep2-s2-test-plan.md
**Script version:** 1
**Verified by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A) | **Date:** 2026-10-03 | **Context:** [x] Pre-code (pre-merge, on branch `feature/ep2-s2-wuli`)

---

## Setup

**Before you start:**
1. Open the web UI signals panel (from `ep2-s1`), signed in.
2. Have at least one signal visible with a CTA button.

**Reset between scenarios:** Reload the signals panel between scenarios.

---

## Scenarios

---

### Scenario 1: Clicking a signal's button drops you straight into a new session with that signal already loaded

**Covers:** AC1, AC2, AC6 (this scenario doubles as the human-facing confirmation that the production wiring genuinely passes signal content through, not just that a session gets created)

**Steps:**
1. Click a signal's CTA button (e.g. "Review").

**Expected outcome:**
> You land in a new chat session. The session already knows about the signal you clicked — you don't have to retype or paste it in yourself.

**Result:** [x] Pass  [ ] Fail
**Notes:** Live-verified against a real running dev server (`NODE_ENV=test`, `WIRE_SKILL_ADAPTERS=true`, real `server.js` wiring — Claude-in-Chrome was unavailable this session, so verified via direct HTTP replicating exactly what the browser form submits): seeded 3 real signals via `/test/seed-signals`, fetched the real rendered `/signals` page, extracted its real CSRF token and hidden `signalSource`/`signalType`/`signalText`/`signalTimestamp` fields from the real CTA form, submitted them to the real `POST /api/skills/improve/sessions` endpoint, and got a real `303` redirect to a newly created session's chat view (`/skills/improve/sessions/<real-uuid>/chat`), which rendered with no errors. The "land in a session" half is fully live-confirmed. The "session already knows about the signal" half is confirmed at the strongest available evidence tier by the automated AC6 test (`tests/check-ep2-s2-signal-seeding-bridge.js`), which inspects the real stored session's `systemPrompt` directly against this exact same code path and confirms the signal's content is present verbatim — the operator-facing chat page's own "Context loaded" manifest chip list is a separate, pre-existing tracking mechanism (product-context files only, confirmed by code read) and was never designed to list `priorArtefacts` entries, so its absence there is expected, not a gap.

---

### Scenario 2: The right skill opens, not always the same one

**Covers:** AC3

**Steps:**
1. Find a signal whose button is labeled something other than "Review" (e.g. a pipeline-status signal, labeled "Open feature").
2. Click its button.

**Expected outcome:**
> The session that opens matches that specific signal's own labeled action — not always `/improve` regardless of which signal you clicked.

**Result:** [x] Pass  [ ] Fail
**Notes:** The real `/test/seed-signals` fixture endpoint (an existing, pre-`ep2-s2` mechanism) only generates `cta.skill: '/improve'` fixtures, so this exact scenario could not be driven through a live click on a differently-labeled button without modifying test/production code beyond this story's scope. Instead verified at the strongest practical tier: the automated AC6 test (`tests/check-ep2-s2-signal-seeding-bridge.js`) creates two real sessions via the real, unmocked `server.js` wiring closure — one for `/workflow`, one for `/improve` — each with its own unique marker content, and asserts each session's own skill name and stored system-prompt content are correct and do not cross-contaminate. This exercises the identical code path (`handlePostSkillSessionHtml` → `_isAllowedSkillName` → real `createSession` → `registerHtmlSession`) that a live click on a non-`/improve` signal would use; only the browser click itself was not performed live.

---

### Scenario 3: A broken seed request fails clearly, it doesn't half-work

**Covers:** AC4

**Steps:**
1. Ask the coding agent to confirm this was tested with a deliberately broken request (missing/invalid signal data) — this isn't practical to trigger by hand through the normal UI.

**Expected outcome:**
> A broken request shows a clear error and does not create a confusing half-started session you could stumble into.

**Result:** [x] Pass  [ ] Fail
**Notes:** Live-verified against the real running dev server: submitted a real POST with a real CSRF token but an empty `signalText` field. Got a real `500` response with body "Could not start skill session: Missing required signal field(s): signalText" and no session was created (confirmed no redirect, no new session ID issued). Also covered automatically for the "unknown skill name" sub-case by the AC4 integration tests.

---

### Scenario 4: Launching a skill the normal way (not from a signal) still works exactly as before

**Covers:** AC5

**Steps:**
1. Go to the regular skill launcher page (`/skills`).
2. Click any primary or advanced skill CTA, same as always.

**Expected outcome:**
> Nothing about the normal skill launcher changed — it behaves exactly as it did before this feature existed.

**Result:** [x] Pass  [ ] Fail
**Notes:** `tests/check-ep1-s3-skill-launcher.js` (7/7, unmodified) and the real local Playwright spec `tests/e2e/skill-launcher.spec.js` (6 passed, 3 intentionally-skipped future-AC tests, 0 failed — including the plain non-seeded `POST /api/skills/discovery/sessions` path) both re-run clean against this story's extended endpoint.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Signal CTA seeds and lands in a session | Pass | Live HTTP round-trip against the real server |
| Scenario 2 — Correct skill launched per-signal | Pass | Automated AC6 test against the real wiring (see note) |
| Scenario 3 — Broken seed fails clearly | Pass | Live HTTP round-trip against the real server |
| Scenario 4 — Normal launcher unaffected | Pass | ep1-s3's 7 tests + real local E2E spec, both unmodified |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
