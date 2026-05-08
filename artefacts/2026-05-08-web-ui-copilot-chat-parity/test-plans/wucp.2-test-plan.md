# Test Plan: wucp.2 — Slash command router for freeform skill invocation

**Story reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/stories/wucp.2.md
**Epic reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/epics/wucp-runtime-capabilities.md
**Test plan author:** Copilot
**Date:** 2026-05-08

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | /[skillname] loads SKILL.md for that turn, replacing journey-stage skill | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | Skill list derived dynamically from readdirSync; new skill immediately available | 2 tests | — | — | — | — | 🟢 |
| AC3 | Capability notice included for surface-limited skills | 2 tests | — | — | — | — | 🟢 |
| AC4 | Journey stage (stageIndex, currentStage) preserved; resumes after slash command turn | 3 tests | — | — | — | — | 🟢 |
| AC5 | Unknown skill → informational message + available skills list; buildSystemPrompt not modified | 2 tests | — | — | — | — | 🟢 |
| AC6 | Skill name validated against allowlist before any file read; injection names → HTTP 400 | 4 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| None | — | — | All ACs covered by unit and integration tests | No gaps |

---

## Test Data Strategy

**Source:** Synthetic — tests create temp `.github/skills/` directories with probe skill directories and minimal `SKILL.md` files; cleaned up after each test
**PCI/sensitivity in scope:** No
**Availability:** Available now — test setup generates all required skill directories
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Temp `.github/skills/workflow/SKILL.md` with known unique content string | Test setup | None | Tests against known string in assembled prompt |
| AC2 | Temp `.github/skills/` directory with two probe skills; second added mid-test | Test setup | None | Confirms readdirSync re-reads on each request |
| AC3 | Capability map constant from the router module | Module export | None | Tests map entry existence for known surface-limited skills |
| AC4 | Mock session object with `{ stageIndex: 2, currentStage: 'definition' }` | Test setup | None | Verifies object not mutated after slash command |
| AC5 | Temp `.github/skills/` directory with no `nonexistent` skill; known probe skills present | Test setup | None | Verifies available list includes probe skills |
| AC6 | No file system setup required — validation occurs before any file read | N/A | None | Tests validate the guard function directly |

### PCI / sensitivity constraints

None.

### Gaps

None — all test data is synthetic and self-contained.

---

## Unit Tests

### T2.1 — Slash command turns load the requested skill's SKILL.md content

- **Verifies:** AC1
- **Precondition:** Temp `.github/skills/workflow/SKILL.md` exists with content `WORKFLOW-UNIQUE-7x3y`. Session has `stageIndex: 1`, `currentStage: 'benefit-metric'`. Slash command router has injectable repoRoot adapter set to temp dir.
- **Action:** Call `buildSlashCommandPrompt('workflow', tempDir)` (or equivalent router function)
- **Expected result:** Returned prompt string contains `WORKFLOW-UNIQUE-7x3y`
- **Edge case:** No

### T2.2 — Slash command prompt replaces journey-stage skill, not appends

- **Verifies:** AC1
- **Precondition:** Temp dir with `workflow/SKILL.md`. Regular session prompt for `benefit-metric` stage would include `BENEFIT-METRIC-SKILL` content.
- **Action:** Call `buildSlashCommandPrompt('workflow', tempDir)`
- **Expected result:** Returned prompt includes workflow SKILL.md content; does NOT include the benefit-metric journey-stage system prompt content from the regular stage flow
- **Edge case:** No

### T2.3 — Skill list derived dynamically from readdirSync (injectable adapter)

- **Verifies:** AC2
- **Precondition:** Injectable `_readdirSkills` adapter set to a function returning `['workflow', 'decisions', 'probe-skill']`
- **Action:** Call `getAvailableSkills()` (or equivalent export)
- **Expected result:** Returns `['workflow', 'decisions', 'probe-skill']` — exactly the adapter's return value
- **Edge case:** No

### T2.4 — New skill directory immediately visible without code change

- **Verifies:** AC2
- **Precondition:** Temp `.github/skills/` with two skills. First call to `getAvailableSkills()` returns those two.
- **Action:** Create `tempDir/.github/skills/new-skill/SKILL.md`. Call `getAvailableSkills()` again (without restarting or re-requiring).
- **Expected result:** Second call returns three skills including `new-skill`
- **Edge case:** No

### T2.5 — Capability notice included for surface-limited skill

- **Verifies:** AC3
- **Precondition:** `SLASH_CAPABILITY_MAP` exported from router module. Map entry for `branch-setup` includes `git worktree`. Temp dir with `branch-setup/SKILL.md`.
- **Action:** Call `buildSlashCommandPrompt('branch-setup', tempDir)`
- **Expected result:** Returned prompt contains `NOTE: This skill requires` followed by a capability list that includes `git worktree`
- **Edge case:** No

### T2.6 — Capability map entry for surface-limited skill exists in SLASH_CAPABILITY_MAP

- **Verifies:** AC3
- **Precondition:** `SLASH_CAPABILITY_MAP` exported from module
- **Action:** Read `SLASH_CAPABILITY_MAP['branch-setup']` and `SLASH_CAPABILITY_MAP['trace']`
- **Expected result:** Both entries exist and are non-empty arrays (capability lists). `branch-setup` includes `git worktree`; `trace` includes `scripts/validate-trace.sh`
- **Edge case:** No

### T2.7 — Slash command does not mutate session stageIndex

- **Verifies:** AC4
- **Precondition:** Session object `{ stageIndex: 2, currentStage: 'definition', activeSlash: null }`. Temp dir with `decisions/SKILL.md`.
- **Action:** Call `applySlashCommand(session, 'decisions', tempDir)` (or equivalent state mutation function)
- **Expected result:** `session.stageIndex` remains `2`; `session.currentStage` remains `'definition'`; only `session.activeSlash` (or equivalent turn-level field) is set
- **Edge case:** No

### T2.8 — Journey stage resumes after slash command turn

- **Verifies:** AC4
- **Precondition:** Session with `activeSlash: 'decisions'` (set by previous slash command turn)
- **Action:** Call `clearSlashCommand(session)` (or process a turn with no slash command prefix)
- **Expected result:** `session.activeSlash` is null/undefined; `session.stageIndex` and `session.currentStage` are unchanged
- **Edge case:** No

### T2.9 — Slash command position preserved across two consecutive slash turns

- **Verifies:** AC4
- **Precondition:** Session `{ stageIndex: 3, currentStage: 'review' }`. Apply slash `decisions` then slash `estimate`.
- **Action:** Apply two consecutive slash commands then clear
- **Expected result:** After both clears, `stageIndex` is still `3` and `currentStage` is still `'review'`
- **Edge case:** Yes — consecutive slash commands

### T2.10 — Unknown skill returns informational message

- **Verifies:** AC5
- **Precondition:** `_readdirSkills` adapter returns `['workflow', 'decisions']`. Requested skill: `nonexistent`.
- **Action:** Call `buildSlashCommandPrompt('nonexistent', tempDir)` or equivalent unknown-skill handler
- **Expected result:** Returns an informational message string (not an error throw). Message includes the text "Available skills:" followed by a list containing `workflow` and `decisions`.
- **Edge case:** No

### T2.11 — Unknown skill does not modify buildSystemPrompt result

- **Verifies:** AC5
- **Precondition:** As T2.10. Regular journey stage is `discovery`.
- **Action:** Call the slash router for an unknown skill; then call the regular `buildSystemPrompt` for `discovery`
- **Expected result:** `buildSystemPrompt('discovery', ...)` returns the unchanged discovery system prompt; the unknown-skill informational message is separate from and does not contaminate the journey-stage prompt
- **Edge case:** No

### T2.12 — Skill name containing "/" rejected before file read (AC6 + NFR security)

- **Verifies:** AC6, NFR security
- **Precondition:** Injectable file-read adapter wired to a probe that records whether it was called. Request with skill name `../../../etc/passwd`.
- **Action:** Call `validateSlashSkillName('../../../etc/passwd', allowlist)` or submit a slash command POST with this name
- **Expected result:** Returns `false` (or HTTP 400 if via HTTP handler). Probe file-read adapter was NOT called.
- **Edge case:** Yes — path injection attempt

### T2.13 — Skill name containing ".." rejected before file read (AC6 + NFR security)

- **Verifies:** AC6, NFR security
- **Precondition:** As T2.12. Skill name: `..`
- **Action:** Call `validateSlashSkillName('..', allowlist)`
- **Expected result:** Returns `false` (rejected). File read adapter not called.
- **Edge case:** Yes — path traversal

### T2.14 — Skill name containing backslash rejected (AC6 + NFR security)

- **Verifies:** AC6, NFR security
- **Precondition:** Skill name: `skills\workflow`
- **Action:** Call `validateSlashSkillName('skills\\workflow', allowlist)`
- **Expected result:** Returns `false` (rejected). File read adapter not called.
- **Edge case:** Yes — Windows path separator injection

### T2.15 — Valid known skill name passes validation

- **Verifies:** AC6
- **Precondition:** Allowlist: `['workflow', 'decisions']`. Skill name: `workflow`.
- **Action:** Call `validateSlashSkillName('workflow', ['workflow', 'decisions'])`
- **Expected result:** Returns `true`
- **Edge case:** No

---

## Integration Tests

### T2.16 — End-to-end: slash command POST loads correct SKILL.md and returns 200

- **Verifies:** AC1, AC6 (integration)
- **Precondition:** Temp `.github/skills/workflow/SKILL.md` with unique content. Injectable repoRoot set to temp dir. Mock session with valid accessToken. POST `/api/journey/slash` with body `{ skillName: 'workflow' }`.
- **Action:** Invoke `handleSlashCommand` handler with mock req/res objects
- **Expected result:** Handler calls the system prompt builder with `workflow`, response status 200 or response contains the skill content, no file-read error
- **Edge case:** No

---

## NFR Tests

### T2.17 — Skill SKILL.md load completes in under 100ms

- **Verifies:** NFR performance
- **Precondition:** Temp dir with a large synthetic SKILL.md (~800 lines, ~24KB — matching current largest skill)
- **Action:** Record `Date.now()` before and after `buildSlashCommandPrompt('large-skill', tempDir)`
- **Expected result:** Elapsed time < 100ms
- **Edge case:** No

---

## Gap Table

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| None | — | — | All ACs covered by automated tests | No gaps |
