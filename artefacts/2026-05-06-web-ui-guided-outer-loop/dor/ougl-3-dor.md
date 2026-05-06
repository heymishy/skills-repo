# Definition of Ready: Journey entry screen and start endpoint (ougl.3)

**Story reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/stories/ougl-3-journey-entry-and-start.md
**Test plan reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/test-plans/ougl-3-test-plan.md
**Verification script:** artefacts/2026-05-06-web-ui-guided-outer-loop/verification-scripts/ougl-3-verification.md
**Review report:** artefacts/2026-05-06-web-ui-guided-outer-loop/review/ougl-3-review-1.md
**Epic:** artefacts/2026-05-06-web-ui-guided-outer-loop/epics/ougl-epic-2-guided-journey-stages.md
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-14

---

## Contract Proposal

**What will be built:**
1. New file `src/web-ui/routes/journey.js` — two handlers: `handleGetJourneyEntry(req, res)` (renders an HTML form at `GET /journey` using `renderShell`/`escHtml`) and `handlePostJourneyStart(req, res)` (handles `POST /api/journey`, creates a journey via `createJourney`, creates a discovery session via `registerHtmlSession`, links it via `linkSessionToJourney`, redirects to the discovery chat URL).
2. Modify `src/web-ui/server.js` — wire `GET /journey` and `POST /api/journey` routes, importing handlers from `routes/journey.js`.

**What will NOT be built:**
- Journey listing or resume flow
- Feature slug shown on the form (operator types it)
- Licence/auth integration beyond the existing `req.session.accessToken` check
- Any changes to `routes/skills.js`

**MEDIUM finding resolution note:**
Review finding 1-M1 (AC7 referenced `sessionManager.createSession`) was fixed in commit `ca6f644` — the story AC7 now reads "Given `registerHtmlSession` throws an error, returns HTTP 500". W3 does not apply (finding resolved, not just acknowledged).

**AC verification table:**

| AC | Test | Verification approach |
|----|------|-----------------------|
| AC1 | T3.1 | `GET /journey` → 200, `Content-Type: text/html`, `<form action="/api/journey"` present |
| AC2 | T3.2 | `GET /journey` unauth → 302 `/auth/github` |
| AC3 | T3.3 | `POST /api/journey` with featureSlug → 303, `Location` matches `/skills/discovery/sessions/[sid]/chat` |
| AC4 | T3.4 | `getJourney(journeyId)` after POST → `activeSkill === 'discovery'` |
| AC5 | T3.5 | `getJourneyBySession(sid)` → returns journey with matching journeyId |
| AC6 | T3.6 | Redirect target contains sid, NOT journeyId or raw sessionId |
| AC7 | T3.7 | `registerHtmlSession` throws → 500 |
| T3.INT.1 | Integration | `GET /journey` route wired in real server.js (smoke) |

---

## Contract Review

✅ **Contract review passed** — MEDIUM finding resolved prior to DoR. Entry screen is a new route pair with clear separation from existing routes. Test-isolation setters in journey.js are test scaffolding (default = real implementation); no D37 issue.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format | ✅ PASS | "As a **non-engineer operator**" |
| H2 | ≥3 ACs in GWT format | ✅ PASS | 7 ACs, all GWT |
| H3 | Every AC has ≥1 test | ✅ PASS | T3.1–T3.7 + T3.INT.1 |
| H4 | Out-of-scope populated | ✅ PASS | Journey listing, resume, feature slug on form, licence check excluded |
| H5 | Benefit linkage — named metric | ✅ PASS | M2 (operator time to first session named) |
| H6 | Complexity rated | ✅ PASS | Epic 2: Complexity 2, Stable (story omits — epic rating adopted) |
| H7 | No unresolved HIGH findings | ✅ PASS | 0 HIGH; MEDIUM 1-M1 resolved in ca6f644 |
| H8 | No uncovered ACs | ✅ PASS | All 7 ACs covered |
| H8-ext | Cross-story schema dependency | ✅ PASS | Upstream: ougl.2 (code dep). `schemaDepends: []` |
| H9 | Architecture constraints | ✅ PASS | `renderShell`/`escHtml` for HTML output, `req.session.accessToken`, no user state in redirect, ADR-011. |
| H-E2E | CSS-layout ACs | ✅ PASS (N/A) | No visual alignment or responsive layout ACs |
| H-NFR | NFR profile | ✅ PASS | NFR-sec-nohiddenstate, NFR-perf-journey-entry, NFR-nodeps in nfr-profile.md |
| H-NFR2 | Compliance NFRs | ✅ PASS | None |
| H-NFR3 | Data classification | ✅ PASS | Internal tooling, no PII |
| H-NFR-profile | NFR profile exists | ✅ PASS | nfr-profile.md created |
| H-GOV | Approved By | ✅ PASS | Hamis — 2026-05-06 |
| H-ADAPTER | Injectable adapters | ✅ PASS (N/A) | Test-isolation setters in journey.js: default IS the real production implementation. D37 does not apply. No separate server.js wiring AC needed for setters. |

**Hard block result: 17/17 PASS — no blocks.**

---

## Warnings

| # | Check | Status | Risk | Acknowledged by |
|---|-------|--------|------|-----------------|
| W1 | NFRs identified | ✅ | In nfr-profile.md | — |
| W2 | Scope stability | ✅ | Stable | — |
| W3 | MEDIUM finding resolved | ✅ | 1-M1 fixed in ca6f644 — W3 not triggered | — |
| W4 | Verification script reviewed | ✅ | Reviewed by operator (Hamis) | — |
| W5 | No UNCERTAIN gaps | ✅ | None | — |

---

## Oversight Level

**Oversight:** Medium (Epic 2 setting)
**Rationale:** First story to touch `server.js` with new route wiring and to create `routes/journey.js`. Sets the pattern all subsequent ougl stories follow.

⚠️ **Medium oversight** — solo repo: operator self-confirms before dispatch.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Journey entry screen and start endpoint — artefacts/2026-05-06-web-ui-guided-outer-loop/stories/ougl-3-journey-entry-and-start.md
Test plan: artefacts/2026-05-06-web-ui-guided-outer-loop/test-plans/ougl-3-test-plan.md

Goal:
Make every test in tests/check-ougl3-journey-entry-and-start.js pass (all currently fail — module not found).
Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Language: Node.js CommonJS. Zero new npm dependencies.
- Create src/web-ui/routes/journey.js. Exports: handleGetJourneyEntry, handlePostJourneyStart.
- journey.js imports:
    const store = require('../modules/journey-store');
    const { registerHtmlSession, linkSessionToJourney, _getHtmlSession, _setHtmlSession } = require('./skills');
  Use _setHtmlSession / _getHtmlSession only for test-isolation setters.
  For repoRoot: use path.resolve(__dirname, '../../..') — do NOT import _getRepoPath from skills.js (it is not exported).
- handleGetJourneyEntry: auth guard → 302 /auth/github if !req.session.accessToken.
  Render HTML form via renderShell/escHtml. Form action="/api/journey", method="POST".
  Include a text input for featureSlug. Do NOT include hidden journeyId or sessionId fields.
- handlePostJourneyStart: auth guard → 302. Create journey. Call registerHtmlSession for discovery.
  Call linkSessionToJourney to associate session with journey. Set active session on journey.
  Redirect → 303 Location: /skills/discovery/sessions/[sid]/chat.
  If registerHtmlSession throws → 500.
- Modify src/web-ui/server.js: wire GET /journey → handleGetJourneyEntry, POST /api/journey → handlePostJourneyStart.
  Import from './routes/journey' using require.
- Test isolation adapters (setRegisterHtmlSession, setJourneyStoreModule, etc.) exported from journey.js:
  default value IS the real production implementation — no stub that throws, no server.js wiring needed.
- Architecture standards: read .github/architecture-guardrails.md.
- Run: node tests/check-ougl3-journey-entry-and-start.js after each change.
- Run: npm test for full suite regression check.
- Open a draft PR when all tests pass.

Files in scope:
- src/web-ui/routes/journey.js — CREATE
- src/web-ui/server.js — add GET /journey and POST /api/journey routes

Files out of scope:
- src/web-ui/routes/skills.js (no changes)
- Any HTML template files
- Any test files
- Any artefact files

Oversight level: Medium
```

---

## Sign-off

**Signed off by:** Hamis — 2026-05-14
