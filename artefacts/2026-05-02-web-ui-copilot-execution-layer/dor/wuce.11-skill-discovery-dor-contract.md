# Contract Proposal: SKILL.md discovery and skill routing

**Story:** wuce.11
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-02

---

## Components built by this story

- Skill discovery adapter: `src/adapters/skill-discovery.js` — `listAvailableSkills(repoPath) -> [{name, path}]` (ADR-012)
  - Scans `repoPath/<skillsDir>/` for subdirectories containing a `SKILL.md` file
  - `skillsDir` defaults to `.github/skills/`; overridden by `COPILOT_SKILLS_DIRS` env var
  - Skill name = subdirectory name; must match `[a-z0-9-]` pattern to be included
  - Returns empty array with warning log when directory is missing or empty — never throws
  - Returned list is the authoritative allowlist: only skills in this list may be passed to wuce.9 `executeSkill`

## Components NOT built by this story

- Dynamic skill installation or download at runtime
- Parsing skill metadata beyond name and path (description, version, tags)
- Remote or cloud-based skill discovery
- Any UI rendering of the skill list (that is wuce.13)

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | `listAvailableSkills(repoPath)` returns `[{name, path}]` per SKILL.md-containing dir | `dir with 3 subdirs with SKILL.md → 3 entries`, `each entry has name and path properties`, `path is absolute path to SKILL.md-containing dir` |
| AC2 | `COPILOT_SKILLS_DIRS` env var overrides default `.github/skills/` | `custom COPILOT_SKILLS_DIRS → skills loaded from custom dir`, `default used when env var not set` |
| AC3 | Subdirs without SKILL.md excluded | `subdir with no SKILL.md → excluded from list`, `subdir with SKILL.md → included`, `mix of both → only SKILL.md-containing dirs returned` |
| AC4 | Empty/missing dir → empty array + warning | `missing dir → empty array returned`, `empty dir → empty array returned`, `warning logged for both cases` |
| AC5 | Returned list is complete bounded allowlist | `skill name "discovery" → allowed`, `skill name "my skill!" → excluded (invalid chars)`, `skill name "../etc" → excluded (path traversal pattern)` |

## Assumptions

- Skill discovery runs synchronously (filesystem `readdirSync`/`existsSync`) as it is invoked infrequently — no async required in v1
- The allowlist is re-derived on each request; no caching in Phase 1

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/adapters/skill-discovery.js` | Create | `listAvailableSkills` adapter |
| `tests/skill-discovery.test.js` | Create | 18 Jest tests for wuce.11 |
| `tests/fixtures/skills/` | Create | Directory structure with mock SKILL.md files for test cases |

## Contract review

**APPROVED** — all components are within story scope, skill name allowlist validation is explicit, adapter is correctly scoped per ADR-012, no scope boundary violations identified.
