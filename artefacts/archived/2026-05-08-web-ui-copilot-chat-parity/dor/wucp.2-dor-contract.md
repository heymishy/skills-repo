# DoR Contract — wucp.2: Slash command router for freeform skill invocation

**Feature:** 2026-05-08-web-ui-copilot-chat-parity
**Story:** wucp.2
**Contract date:** 2026-05-09

---

## Scope boundary

### Files the coding agent MUST touch

| File | Change |
|------|--------|
| `src/web-ui/routes/journey.js` | Add: SLASH_CAPABILITY_MAP, getAvailableSkills(), validateSlashSkillName(), buildSlashCommandPrompt(), applySlashCommand(), clearSlashCommand(), handleSlashCommand(). All to second module.exports block (line ~1298). |
| `src/web-ui/server.js` | If a new route is required for slash command entry (e.g. POST /journey/slash). If handleSlashCommand() can be reached via the existing POST /journey flow without a new route, this file may not need touching. Agent to confirm — if route registration is needed, server.js is a required touch. |

### Files the coding agent MUST NOT touch

| File | Reason |
|------|--------|
| `src/web-ui/routes/skills.js` | Not in scope — wucp.1 owns skills.js |
| Any `.github/skills/` file | Modifying SKILL.md is out of scope per discovery constraints |
| `artefacts/` (read-only) | Pipeline inputs — no modifications |
| Any test file | Tests are the spec |
| `package.json` | Already updated |

### Duplicate exports boundary

journey.js contains two `module.exports = {}` blocks:
- First block (~line 1261–1295): dead code — overridden by the second block
- **Second block (~line 1298–1332): the live block — add all new exports here**

This is a known bug in journey.js tracked by wsm.4 (PR #339). The coding agent MUST NOT fix the duplicate — wsm.4 is not in scope for this story. Adding to the second block is sufficient.

---

## Required implementation detail

### SLASH_CAPABILITY_MAP schema

Static constant in journey.js. Must be exported. Keys: skill name strings (matching directory names under `.github/skills/`). Values: string arrays of required capabilities, or `[]` for skills with no surface limitations.

Skills with no web-UI limitations map to `[]`. At minimum, the following classification must be correct for T2.7 and T2.8:
- Skills with capability requirements (examples): `branch-setup`, `branch-complete`, `tdd`, `verify-completion`, `systematic-debugging` — require `git-worktree`, `bash-scripts`, or similar
- Skills with no limitations: `discovery`, `benefit-metric`, `definition`, `review`, `decisions`, etc.

The coding agent must inspect `.github/skills/` at implementation time to classify all present skills. The "44 skills" count in AC3 is informational — do not hard-code a count check.

### validateSlashSkillName() rejection rules (AC6)

Must reject (return false) for ALL of the following:
1. Name containing `/`
2. Name containing `..`
3. Name containing `\`
4. Name not present in `getAvailableSkills(skillsDir)` result

The rejection must happen BEFORE any `fs.readFileSync` call. Rejection triggers HTTP 400 response with available skills list.

### Session state invariants (AC4)

`applySlashCommand()` sets `session.slashCommandSkill` only. It MUST NOT modify:
- `session.stageIndex`
- `session.currentStage`
- Any other journey position field

After `clearSlashCommand()`, journey resumes from the same position as before the slash command was issued.

---

## H8-ext declaration

`schemaDepends: []` — Dependencies: None. No upstream story dependencies. No pipeline-state.json schema fields depended upon.

---

## Required security constraints

1. **Path injection guard (AC6, NFR):** `validateSlashSkillName()` MUST reject names with path separators before any file read. This is the primary security constraint for this story. Implementation before any handler logic.
2. **No SKILL.md modification:** Building the capability classification requires reading, not writing, `.github/skills/`. Read operations are safe.
3. **No credential leakage:** SKILL.md files are loaded into the system prompt. They must not contain credential values. (SKILL.md files are developer-authored skill instructions — no credentials expected, but agent should confirm during implementation.)

---

## D37 declaration

D37 is conditional for this story. Two valid implementation approaches:

**Option A — Plain function (D37 does not apply):**
`buildSlashCommandPrompt()` calls `fs.readFileSync()` directly. No injectable adapter. D37 not triggered.

**Option B — Injectable adapter (D37 fully applies):**
`let _loadSkillContent = defaultLoadSkillContent; function setSkillLoader(fn) { _loadSkillContent = fn; }` where `defaultLoadSkillContent` MUST throw if called without wiring: `throw new Error('Adapter not wired: loadSkillContent. Call setSkillLoader() with a real implementation before use.')`. Production wiring in server.js. Wiring verified by test or smoke check. Both exports (`setSkillLoader`, `_loadSkillContent` usage) confirmed in tests.

The coding agent may choose either approach. Option B provides better testability for the file-load path. Option A is simpler. The choice should be consistent with the rest of journey.js (check what pattern is already used in the second exports block).
