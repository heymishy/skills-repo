# DoR Contract: Context-aware orientation wizard

**Story:** pmf.3 — Context-aware orientation wizard — three-step session start
**Feature:** 2026-06-14-web-ui-pm-flow
**Approved:** 2026-06-15

---

## What will be built

Upgrade `handleGetWizard` and `handlePostWizardSelection` in `src/web-ui/routes/journey.js`.

Step routing via `req.query.view`:
- No param / `''` → Step 1: three named option cards
- `'existing'` → Step 2: feature cards (health-dot + title + slug + stage)
- `'resume'` → Step 3: active session list (done:false, lastActivity ≤24h)

New POST selections:
- `from-idea` with `ideaId` → redirect to `/skills/discovery/sessions?idea=<ideaId>`
- `resume-session` with `sessionId` + `skillName` → redirect to `/skills/<skillName>/sessions/<sessionId>/chat`

New test file: `tests/check-pmf3-orientation-wizard.js` (T3.1–T3.8).

## What will NOT be built

- Drag-and-drop reordering of options
- Session search or filter
- Any SKILL.md modifications
- New server routes

## AC verification mapping

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T3.1, T3.2 | Unit (new) |
| AC2 | wucp.4 T4.3, T4.4 | Unit (existing) |
| AC3 | T3.4 | Unit (new) |
| AC4 | wucp.4 T4.6, T4.7, T4.8 + T3.3 | Unit (mixed) |
| AC5 | wucp.4 T4.12, T4.13, T4.14 | Unit (existing) |
| AC6 | T3.5, T3.6, T3.7 | Unit (new) |
| AC7 | T3.8 | Unit (new) |
| AC8 | wucp.4 T4.17 | Unit (existing) |
| AC9 | npm test — all 20 wucp.4 tests pass | Regression |

## Assumptions

- Session store mockable via the same adapter used in wucp.4 tests.
- `lastActivity` is an ISO timestamp string on session objects.
- `skillName` validated against `/^[a-z0-9-]+$/` — HTTP 400 if invalid.
- `ideaId` passed as URL query param only — never used as file path.

## schemaDepends

`schemaDepends: ['pmf.2']` — "Start from an idea" sub-option reads from workspace/ideas.json (pmf.2 must be at definition-of-done before pmf.3 implementation proceeds).

## Estimated touch points

`src/web-ui/routes/journey.js` (modified — handleGetWizard + handlePostWizardSelection), `tests/check-pmf3-orientation-wizard.js` (new), `package.json` (test chain append).
