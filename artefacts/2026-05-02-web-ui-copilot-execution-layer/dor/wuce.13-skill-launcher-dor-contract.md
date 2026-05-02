# Contract Proposal: Skill launcher and guided question flow

**Story:** wuce.13
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-02

---

## Components built by this story

- Express route handler: `GET /skills` — returns skill list from `listAvailableSkills` (wuce.11); includes session list for in-progress sessions (wuce.16 integration point)
- Express route handler: `POST /skills/:skillName/launch` — validates skill name against allowlist, creates session (wuce.10), returns first question
- Express route handler: `POST /skills/:skillName/answer` — accepts answer, validates length (≤1000 chars), sanitises metacharacters, returns next question or triggers execution
- `SkillContentAdapter`: `src/adapters/skill-content-adapter.js` — scoped to wuce.13; parses SKILL.md for question blocks; returns ordered list of questions for a skill
- Server-side prompt sanitisation: strips shell metacharacters before constructing CLI prompt passed to `executeSkill`
- "No Copilot licence" detector: detects specific CLI exit code/message and returns structured error with user-facing message (not raw CLI output)
- Test fixtures: `tests/fixtures/skills/discovery-skill-content.md`

## Components NOT built by this story

- Bulk/batch skill execution
- Skill authoring or editing SKILL.md via UI
- PDF/DOCX output rendering
- Full ACP multi-turn protocol (v1 uses `-p` flag subprocess)
- Sharing or exporting a skill session

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | `/skills` shows skill list from wuce.11 discovery | `GET /skills returns skills from listAvailableSkills`, `skill names match filesystem discovery`, `no hardcoded skill names in response` |
| AC2 | "Launch" on /discovery → first question as labelled input | `POST /skills/discovery/launch → first question rendered`, `question has label and input field`, `question sourced from SkillContentAdapter parsing SKILL.md` |
| AC3 | Answer ≤1000 chars → validated + sanitised → next question | `answer under limit → accepted, next question returned`, `answer over 1000 chars → 400 server-side`, `client-side limit alone is not sufficient` |
| AC4 | Prompt injection content → metacharacters stripped before CLI prompt | `answer with backtick → stripped`, `answer with semicolon → stripped`, `sanitised answer passed to executeSkill` |
| AC5 | No Copilot licence → clear message + launcher disabled | `CLI licence error → "No active Copilot licence" message`, `launcher disabled when licence error detected`, `raw CLI error not exposed to browser` |

## Assumptions

- SKILL.md question blocks follow the convention established in the skills repo: each question is a distinct markdown section or bullet that can be reliably parsed
- `SkillContentAdapter` is used only within wuce.13 — not exported to or used by wuce.14, wuce.15, or wuce.16 in this story's scope

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/routes/skills.js` | Create | Skill launcher route handlers |
| `src/adapters/skill-content-adapter.js` | Create | `SkillContentAdapter` — scoped to wuce.13 |
| `src/utils/prompt-sanitiser.js` | Create | Server-side metacharacter stripping |
| `src/app.js` | Extend | Mount skills routes |
| `tests/skill-launcher.test.js` | Create | 22 Jest tests for wuce.13 |
| `tests/fixtures/skills/discovery-skill-content.md` | Create | Mock SKILL.md content for test cases |

## Contract review

**APPROVED** — all components are within story scope, HIGH finding 13-H1 resolved in review-2 (SkillContentAdapter isolation confirmed), server-side validation and sanitisation are explicit, no scope boundary violations identified.
