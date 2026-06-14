## Test Plan: Context-aware orientation wizard — three-step session start

**Story reference:** artefacts/2026-06-14-web-ui-pm-flow/stories/pmf.3.md
**Test plan author:** Copilot (Claude Sonnet 4.6)
**Date:** 2026-06-15

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Step 1 renders three named options | 1 unit test | — | — | — | — | 🟢 |
| AC2 | "Start new" → no activeFeatureSlug, stageIndex=0, redirect /journey | Existing T4.3, T4.4 (wucp.4) | — | — | — | — | 🟢 |
| AC3 | "Start from idea" → redirect to /skills/discovery/sessions?idea=<id> | 1 unit test | — | — | — | — | 🟢 |
| AC4 | Step 2 (view=existing) renders feature cards with health-dot, title, slug, stage | Existing T4.6, T4.7, T4.8 (wucp.4) + 1 new test | — | — | — | — | 🟢 |
| AC5 | Feature card selection sets activeFeatureSlug + stageIndex, redirect | Existing T4.12, T4.13, T4.14 (wucp.4) | — | — | — | — | 🟢 |
| AC6 | Step 3 (view=resume) renders active sessions (done:false, ≤24h) or empty message | 2 unit tests | — | — | — | — | 🟢 |
| AC7 | "Resume session" POST → redirect to /skills/<skillName>/sessions/<id>/chat | 1 unit test | — | — | — | — | 🟢 |
| AC8 | Returning session (activeFeatureSlug set) → wizard skipped | Existing T4.17 (wucp.4) | — | — | — | — | 🟢 |
| AC9 | All 20 wucp.4 tests pass | 20 existing tests in check-wucp4-session-wizard.js | — | — | — | — | 🟢 |

---

## Test File

**New test file to create:** `tests/check-pmf3-orientation-wizard.js`

**Existing regression baseline:** `tests/check-wucp4-session-wizard.js` (20 tests — must all continue to pass)

### New tests in check-pmf3-orientation-wizard.js

**T3.1 — Step 1: three options present (AC1)**
- `handleGetWizard` called with no `req.query.view`
- Assert HTML includes "Start something new", "Continue an existing feature", "Resume active session"

**T3.2 — Step 1: does NOT show feature list at default (AC1 / wucp.4 T4.2 extended)**
- `handleGetWizard` with no view param
- Assert feature slugs from pipeline-state.json do NOT appear in response body (list is deferred to Step 2)

**T3.3 — Step 2 renders feature CARDS not li slugs (AC4)**
- `handleGetWizard` with `req.query.view = 'existing'`, pipeline has one active feature `feat-pmf3-t3`
- Assert HTML includes `feat-pmf3-t3` AND includes a card element class (not just `<li>`)

**T3.4 — "Start from idea" POST redirects to discovery with idea param (AC3)**
- `handlePostWizardSelection` with `req.body = { selection: 'from-idea', ideaId: 'idea-001' }`
- Assert redirect Location = `/skills/discovery/sessions?idea=idea-001`
- Assert `session.activeFeatureSlug` not set

**T3.5 — Step 3 empty: no active sessions → empty message (AC6)**
- `handleGetWizard` with `req.query.view = 'resume'`, session store has no active sessions
- Assert HTML includes "No active sessions" or equivalent message

**T3.6 — Step 3: active session within 24h appears (AC6)**
- Inject a mock session with `done: false`, `lastActivity` = now - 1h, `skillName: 'discovery'`
- `handleGetWizard` with `req.query.view = 'resume'`
- Assert HTML includes `discovery` session entry

**T3.7 — Step 3: stale session (>24h) NOT shown (AC6)**
- Inject a mock session with `done: false`, `lastActivity` = now - 25h
- Assert session does NOT appear in Step 3 response

**T3.8 — "Resume session" POST redirects to chat (AC7)**
- `handlePostWizardSelection` with `selection: 'resume-session'`, `sessionId: 'sess-abc'`, `skillName: 'discovery'`
- Assert redirect Location = `/skills/discovery/sessions/sess-abc/chat`

---

## Test Data Strategy

**Source:** Synthetic — temp directories, mock sessions injected via `setGetHtmlSession` adapter
**PCI/sensitivity:** No
**Data requirements:** Mock pipeline-state.json files; mock session objects with `done`, `lastActivity`, `skillName` fields; mock ideas.json with one idea entry.

---

## Out of Scope

- Visual appearance of option cards
- E2E browser click-through of all three steps
- wucp.4 behaviour changes — existing tests cover that contract
