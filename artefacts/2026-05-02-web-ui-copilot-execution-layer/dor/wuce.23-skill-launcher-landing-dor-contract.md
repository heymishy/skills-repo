# Contract: Skill launcher landing

**Story:** wuce.23
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-03

---

## Components built by this story

- `src/web-ui/routes/skills.js` — new file with:
  - `handleGetSkillsHtml()` — named export; handles `GET /skills` → HTML skill list via `renderShell`
  - POST handler for `POST /api/skills/:name/sessions` → creates session; 303 redirect to `/skills/:name/sessions/:id`
- Skill list HTML: one entry per skill with name, description, and `<form method="POST" action="/api/skills/:name/sessions">` with submit button — plain HTML, no JavaScript
- Non-2xx POST response → `renderShell` HTML error page (not raw JSON)
- Nav "Run a Skill" link in `renderShell` points to `/skills`
- Audit log: `{ userId, route: '/skills', timestamp }`

## Components NOT built by this story

- `GET /skills/:name/sessions/:id/next` question form (wuce.24 scope)
- Any commit or result page (wuce.25 scope)
- Any existing JSON API endpoint changes
- Any JavaScript-dependent interaction on the skills page
- Any change to `src/web-ui/utils/html-shell.js` beyond the nav link addition

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | GET /skills → 200 HTML with renderShell wrapper and skill list | T1: 200 status, T2: Content-Type text/html, T3: skill name in body, T4: skill description in body |
| AC2 | Each skill has a form POST button pointing to /api/skills/:name/sessions | T5: <form method="POST"> present, T6: action attribute correct, T7: submit button present, T14: no JavaScript required |
| AC3 | Non-2xx POST → HTML error page via renderShell | T8: 500 adapter error → HTML error page |
| AC4 | Successful POST → 303 redirect to /skills/:name/sessions/:id | T9: 303 status, T10: Location header set correctly |
| AC5 | Unauthenticated → 302 on both GET and POST | T11: GET no session → 302, T12: POST no session → 302 |
| AC6 | renderShell nav "Run a Skill" link points to /skills | T13: nav "Run a Skill" href=/skills |

## Assumptions

- `listSkills(token)` adapter exists or is created as part of this story
- `createSession(skillName, token)` adapter exists or is created as part of this story
- `renderShell` and `escHtml` exist from wuce.18 — imported, not created here
- Session ID is returned by `createSession()` adapter — this story does not define the session data model

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/web-ui/routes/skills.js` | Create | handleGetSkillsHtml and POST session handler |
| `src/web-ui/adapters/skills.js` | Create | listSkills() and createSession() if not already existing |
| `src/web-ui/utils/html-shell.js` | Extend | Add "Run a Skill" nav link pointing to /skills |
| `src/web-ui/server.js` | Extend | Mount GET /skills and POST /api/skills/:name/sessions routes |
| `tests/check-wuce23-skill-launcher-landing.js` | Create | 16 tests |

## Out of scope — files that MUST NOT be touched

- `GET /skills/:name/sessions/:id/next` — wuce.24 scope
- Any existing route handler in `src/web-ui/routes/` other than the nav link update
- Any test file other than `tests/check-wuce23-skill-launcher-landing.js`
- Any file under `artefacts/`

## Contract review

**APPROVED** — all components are within story scope, AC → test mapping is complete, no scope boundary violations identified.
