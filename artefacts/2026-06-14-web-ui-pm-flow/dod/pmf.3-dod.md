## Definition of Done: Context-aware orientation wizard — three-step session start

**Story:** pmf.3
**Feature:** 2026-06-14-web-ui-pm-flow
**DoD completed:** 2026-06-15
**Verified by:** Copilot (Claude Sonnet 4.6)

---

## Implementation Summary

`src/web-ui/routes/journey.js` — `handleGetWizard` upgraded to three-step routing via `req.query.view`:
- **Step 1** (no view param): three option cards — "Start something new", "Continue an existing feature", "Resume active session"
- **Step 2** (`view=existing`): active features rendered as cards (`wiz-feature-card` class) with health-dot + title + slug + stage, filtered to exclude `released`/`archived`. Preserves existing wucp.4 `view=existing` contract.
- **Step 3** (`view=resume`): lists sessions where `done !== true` and `lastActivity ≤ 24h`; empty-state message if none found.

`handlePostWizardSelection` extended:
- `selection: 'from-idea'` → redirect to `/skills/discovery/sessions?idea=<ideaId>` (`ideaId` as URL param only — not used as file path)
- `selection: 'resume-session'` → validates `skillName` and `sessionId` against `/^[a-z0-9-]+$/`; HTTP 400 if invalid; redirect to `/skills/<skill>/sessions/<id>/chat`

`src/web-ui/routes/skills.js` — `_listHtmlSessions()` added and exported. `setListHtmlSessions` adapter setter added to `journey.js`.

---

## AC Verification

| AC | Verified by | Result |
|----|-------------|--------|
| AC1 — Step 1 three named options | T3.1, T3.2 | ✅ PASS |
| AC2 — "Start new" preserved | wucp.4 T4.3, T4.4 | ✅ PASS |
| AC3 — "from-idea" redirect | T3.4 | ✅ PASS |
| AC4 — Step 2 feature cards | wucp.4 T4.6, T4.7, T4.8 + T3.3 | ✅ PASS |
| AC5 — Feature selection preserved | wucp.4 T4.12, T4.13, T4.14 | ✅ PASS |
| AC6 — Step 3 active sessions | T3.5, T3.6, T3.7 | ✅ PASS |
| AC7 — resume-session redirect | T3.8 | ✅ PASS |
| AC8 — Returning session skips wizard | wucp.4 T4.17 | ✅ PASS |
| AC9 — All 20 wucp.4 tests pass | npm test suite | ✅ PASS |

---

## Test Results

| Test suite | Tests | Result |
|------------|-------|--------|
| `tests/check-pmf3-orientation-wizard.js` | 8/8 | ✅ PASS |
| `tests/check-wucp4-session-wizard.js` | 20/20 | ✅ PASS |
| `tests/check-kanban-view.js` | 30/30 | ✅ PASS |
| Pre-commit hook (governance-sync, pipeline-paths, viz-behaviour) | all | ✅ PASS |

---

## Out-of-Scope Check

- No SKILL.md files modified ✅
- No new server routes added ✅
- No drag-and-drop or session search ✅
- `ideaId` not used as file path ✅

---

## Security NFR Check

- `resume-session`: `skillName` and `sessionId` validated against `/^[a-z0-9-]+$/` before use in redirect path. Non-matching values return HTTP 400. ✅
- `from-idea`: `ideaId` passed through `encodeURIComponent` as URL query param only. ✅
- All rendered content escaped via `escHtml`. ✅

---

## Commit

**Commit:** `8e4e0bf` — feat(pmf): complete pmf.1+pmf.2 retroactive artefacts, implement pmf.3 orientation wizard, full DoR batch
