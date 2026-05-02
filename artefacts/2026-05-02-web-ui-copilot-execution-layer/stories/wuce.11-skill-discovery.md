## Story: SKILL.md discovery and skill routing

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e3-phase2-execution-engine.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **platform operator configuring the execution engine**,
I want the backend to discover available skills from the repository's `.github/skills/` directory and surface a validated list to the UI layer,
So that the guided skill launcher (Epic 4) only presents skills that are actually present and invocable — without hardcoding skill names in application code.

## Benefit Linkage

**Metric moved:** M1 — Copilot CLI/API feasibility (spike verdict: PROCEED)
**How:** The spike confirmed that SKILL.md files are auto-discovered by the CLI when `CWD` is the repo root or `COPILOT_SKILLS_DIRS` is set; this story operationalises that discovery as a backend service — a necessary pre-condition for the guided UI to present a correct and current skill list.

## Architecture Constraints

- ADR-004: the path to the skills directory must be configurable via `COPILOT_SKILLS_DIRS` env var (default: `.github/skills/`) — not hardcoded in application code
- ADR-012: skill discovery must use an adapter pattern — `listAvailableSkills(repoPath)` returns a normalised skill list; the discovery mechanism (filesystem scan, GitHub Contents API, or `COPILOT_SKILLS_DIRS` env var) must be swappable without changing callers
- Mandatory security constraint: the skill name returned by discovery is the only allowlist for subprocess invocation in wuce.9 — skill names that do not appear in the discovered list must be rejected before spawning any subprocess

## Dependencies

- **Upstream:** wuce.9 (skill discovery provides the allowlist that wuce.9 validates against)
- **Downstream:** wuce.13 (skill launcher presents the discovered skill list)

## Acceptance Criteria

**AC1:** Given a repository has a `.github/skills/` directory containing `discovery/SKILL.md`, `review/SKILL.md`, and `test-plan/SKILL.md`, When `listAvailableSkills(repoPath)` is called, Then it returns an array of skill objects `[{name: "discovery", path: ".github/skills/discovery/SKILL.md"}, ...]` — one entry per directory that contains a `SKILL.md` file.

**AC2:** Given the `COPILOT_SKILLS_DIRS` environment variable is set to a custom path, When `listAvailableSkills(repoPath)` is called, Then it scans the custom path instead of the default `.github/skills/` — no code change required to use a different skills location.

**AC3:** Given a skills directory contains a subdirectory without a `SKILL.md` file (e.g. a draft or assets folder), When the discovery runs, Then that subdirectory is excluded from the returned skill list.

**AC4:** Given the skills directory does not exist or is empty, When `listAvailableSkills(repoPath)` is called, Then it returns an empty array and logs a warning — it does not throw or crash the server.

**AC5:** Given `COPILOT_SKILLS_DIRS` points to `.github/skills/` containing `discovery/SKILL.md` and `ideate/SKILL.md`, When `listAvailableSkills(repoPath)` is called, Then the returned array contains entries for `discovery` and `ideate` and does not contain any entry whose path resolves outside the configured skills directory — confirming the returned list is the complete and bounded allowlist for subprocess invocation.

## Out of Scope

- Parsing or validating the content of SKILL.md files — discovery only checks presence, not content
- Dynamically hot-reloading the skill list on filesystem change — the list is resolved per-session; a server restart is acceptable to pick up new skills
- Presenting skill metadata (description, required parameters) to the UI — the UI in wuce.13 reads skill names only; metadata display is post-MVP

## NFRs

- **Security:** Skill name allowlist enforced before any subprocess spawn. No path traversal via skill names (validate against `[a-z0-9-]` pattern only).
- **Performance:** Skill discovery (filesystem scan) completes in under 200ms for up to 50 skills.
- **Audit:** Skill list resolution logged at server startup and on each session creation.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
