# Definition of Ready Checklist

## Definition of Ready: Slash command router for freeform skill invocation (wucp.2)

**Story reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/stories/wucp.2.md
**Test plan reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/test-plans/wucp.2-test-plan.md
**Verification script:** artefacts/2026-05-08-web-ui-copilot-chat-parity/verification-scripts/wucp.2-verification.md
**Assessed by:** GitHub Copilot
**Date:** 2026-05-09

---

## Contract Proposal — Slash command router for freeform skill invocation

**What will be built:**
A slash command router added to `src/web-ui/routes/journey.js`. When the operator submits a message beginning with `/`, the server extracts the skill name, validates it against the `fs.readdirSync('.github/skills')` allowlist (rejecting names containing `/`, `..`, or path separators with HTTP 400), loads `.github/skills/[skill-name]/SKILL.md`, and includes its full content in `buildSystemPrompt()` for that turn, replacing the current journey-stage skill.

A static `SLASH_CAPABILITY_MAP` constant classifies all skills present at implementation time by the surface capabilities they require (e.g. `branch-setup` requires `git worktree`). When the requested skill is in the map with non-empty capability requirements, a capability notice is added to the system prompt: `"NOTE: This skill requires [capability list]. Some outputs may be limited or unavailable in the web UI."` When no slash command is present on the next turn, the session resumes journey stage mode at the same position.

**What will NOT be built:**
Capability annotation stored in SKILL.md files. Fuzzy matching or autocomplete. Slash command history or bookmarks. Sub-commands with parameters. Any write-mode skill invocation.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|--------------|------|
| AC1: slash command loads SKILL.md, included in buildSystemPrompt() | T2.1 (SKILL.md loaded), T2.2 (content in prompt) | Unit |
| AC2: new skill directory immediately available, no code change | T2.6 (dynamic discovery — readdirSync returns new skills) | Unit |
| AC3: capability notice for surface-limited skills | T2.7 (skill in map with capabilities → notice), T2.8 (skill not in map → no notice) | Unit |
| AC4: journey stage position not mutated by slash command; resumes after | T2.9 (stageIndex not mutated), T2.12 (session resumes after) | Unit |
| AC5: unknown skill → informational message + available skills list | T2.13 (unknown name → 400 + skill list), T2.14 (list present in response) | Unit |
| AC6: skill name validated against allowlist BEFORE any file read | T2.10 (path injection → false), T2.11 (invalid → HTTP 400, no file read) | Unit |

**Assumptions:**
`buildSystemPrompt()` in skills.js accepts a skill SKILL.md content string. The journey handler in journey.js intercepts the slash command before passing to the model. Session state (`stageIndex`, `currentStage`) is preserved across slash command turns. The `.github/skills/` directory exists and is readable.

**Estimated touch points:**
Files: `src/web-ui/routes/journey.js` (new slash router exports), `src/web-ui/server.js` (route wiring if a new POST handler is needed for slash commands, or integration into existing POST /journey).
Services: none. APIs: none.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with named persona | ✅ PASS | "As a platform operator using the web UI" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS | 6 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ PASS | AC1: T2.1–T2.2; AC2: T2.6; AC3: T2.7–T2.8; AC4: T2.9+T2.12; AC5: T2.13–T2.14; AC6: T2.10–T2.11 |
| H4 | Out-of-scope section populated | ✅ PASS | Capability annotation in SKILL.md, fuzzy matching, sub-commands all named |
| H5 | Benefit linkage references a named metric | ✅ PASS | M3 (outer loop completeness) |
| H6 | Complexity is rated | ✅ PASS | Rating: 2 |
| H7 | No unresolved HIGH findings from review | ✅ PASS | Review PASS — 0 HIGH, 3 MEDIUM, 1 LOW |
| H8 | Test plan has no uncovered ACs | ✅ PASS | All 6 ACs covered; zero gaps (gap table: "None") |
| H8-ext | Cross-story schema dependency check | ✅ PASS | Dependencies: None — schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ PASS | Zero npm deps, no SKILL.md modification, D37 conditional, journey coexistence, path injection guard (note: guard is in NFRs, not Architecture Constraints — MEDIUM finding 2-M3 acknowledged in decisions.md) |
| H-E2E | CSS-layout-dependent ACs with no E2E and no RISK-ACCEPT | ✅ PASS | No CSS-layout-dependent ACs — all ACs are server-side behaviour |
| H-NFR | NFR profile exists | ✅ PASS | artefacts/2026-05-08-web-ui-copilot-chat-parity/nfr-profile.md |
| H-NFR2 | Compliance NFRs with regulatory clauses have human sign-off | ✅ PASS | No compliance regulatory clauses |
| H-NFR3 | Data classification field not blank | ✅ PASS | "Public / Internal — no personal data" |
| H-NFR-profile | NFR profile present for story with NFRs | ✅ PASS | Profile covers wucp.2 skill-load performance and path injection guard |
| H-GOV | Approved By section in discovery artefact | ✅ PASS | "Hamish King — Platform Owner — 2026-05-09" |
| H-ADAPTER | Injectable adapter wiring check (D37) | ✅ PASS | D37 is conditional ("If the skill-loader is extracted as an adapter"). The story does not mandate an injectable adapter. If the coding agent chooses to implement the skill-loader as an injectable adapter, the stub MUST throw (not return null) and the production wiring must be present in server.js. If a plain function is used instead, D37 does not apply. See coding agent instructions. |

**Result: ALL HARD BLOCKS PASS ✅**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | Security (path injection) and performance (<100ms) present |
| W2 | Scope stability declared | ✅ | — | "Stable" |
| W3 | MEDIUM review findings acknowledged in /decisions | ⚠️ ACKNOWLEDGED | 3 MEDIUM findings (2-M1: AC2 parenthetical, 2-M2: AC3 skill count, 2-M3: guard in NFRs not Architecture Constraints). All logged as RISK-ACCEPTs in decisions.md. Test plan operationally resolves each. |
| W4 | Verification script reviewed by domain expert | ⚠️ ACKNOWLEDGED | Operator to review verification-scripts/wucp.2-verification.md. Medium oversight — tech lead awareness before assignment. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | Gap table: "None — all ACs covered by automated tests" |

---

## Standards Injection

Domain tags: not declared on story. Web-UI patterns injected proactively because the story modifies `src/web-ui/routes/journey.js` and Architecture Constraints explicitly reference D37 and the path injection guard documented in `web-ui-patterns.md`.

Matched standards files: `.github/standards/web-ui/web-ui-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Slash command router — artefacts/2026-05-08-web-ui-copilot-chat-parity/stories/wucp.2.md
Test plan: artefacts/2026-05-08-web-ui-copilot-chat-parity/test-plans/wucp.2-test-plan.md
Test file: tests/check-wucp2-slash-command-router.js (17 tests, all currently FAILING)
Contract: artefacts/2026-05-08-web-ui-copilot-chat-parity/dor/wucp.2-dor-contract.md

Goal:
Make every test in tests/check-wucp2-slash-command-router.js pass (17 tests, currently all
failing). Do not add scope beyond what the tests and ACs specify.

Primary implementation — add to src/web-ui/routes/journey.js:

New exports required:
  SLASH_CAPABILITY_MAP
    Static object mapping skill names to their required surface capabilities.
    Example: { 'branch-setup': ['git-worktree', 'bash-scripts'], 'trace': ['bash-scripts'] }
    Skills with no surface constraints: map to []
    Classify ALL skills present in .github/skills/ at implementation time.
    NOTE: "The 44 skills" count in AC3 is an implementation-time snapshot and is NOT a
    constraint — implement for all skills present, whatever the count.

  getAvailableSkills(skillsDir)
    Returns string[] — result of fs.readdirSync(skillsDir) filtered to directories only.

  validateSlashSkillName(name, skillsDir)
    Returns false if name contains '/', '..', or '\' (path injection rejection — MANDATORY)
    Returns false if name is not in getAvailableSkills(skillsDir)
    Returns true if name is a valid skill in the allowlist

  buildSlashCommandPrompt(skillName, sessionPath, repoRoot)
    Reads .github/skills/[skillName]/SKILL.md via fs.readFileSync
    Includes full SKILL.md content in the assembled prompt
    If skill is in SLASH_CAPABILITY_MAP with non-empty capabilities:
      prepends: "NOTE: This skill requires [capability list]. Some outputs may be limited
      or unavailable in the web UI."
    Returns the assembled prompt string

  applySlashCommand(session, skillName)
    Sets session.slashCommandSkill = skillName
    Does NOT mutate session.stageIndex, session.currentStage, or any journey position

  clearSlashCommand(session)
    Deletes session.slashCommandSkill
    Journey mode resumes from unchanged stage position

  handleSlashCommand(req, res)
    Entry point for slash command processing
    Validates skill name via validateSlashSkillName — invalid → HTTP 400 + skill list
    Loads prompt via buildSlashCommandPrompt
    Applies slash command via applySlashCommand
    Responds with the prompt (or redirects to the journey with slash mode active)

IMPORTANT — duplicate exports in journey.js:
journey.js currently has TWO module.exports = {} blocks (approximately lines 1261-1295 and
lines 1298-1332). The SECOND block (line ~1298) is the live one — it overrides the first.
Add ALL new exports to the SECOND block only. Do NOT modify the first block. Do NOT fix
the duplicate — that is a separate story (wsm.4, PR #339 — not in scope here).

MANDATORY security (AC6 — implement FIRST):
Skill name from request input MUST be validated against the readdirSync allowlist BEFORE
any file read. Names containing '/', '..', or '\' → HTTP 400 immediately, no file read.
This is AC6 and test T2.11. Implement this before any other code in the slash handler.

Constraints:
- Touch: src/web-ui/routes/journey.js (new exports)
  If a new route is needed: src/web-ui/server.js (route registration only)
- Do NOT touch: skills.js, any other src/ file, test files, artefacts/
- No new npm dependencies
- req.session.accessToken is canonical — never req.session.token
- If you implement the skill-loader as an injectable adapter (let _loadSkill = defaultFn),
  the stub MUST throw, not return null. Wiring must be present in server.js.
  If you use a plain function instead, D37 does not apply.

Architecture standards: read .github/architecture-guardrails.md before implementing.
Open a draft PR when tests pass — do not mark ready for review.
Oversight: Medium — share DoR artefact with tech lead before any milestone.
If you encounter ambiguity: add a PR comment and stop.

## Applicable standards

Source: .github/standards/web-ui/web-ui-patterns.md

### Skill name allowlist validation (directly applicable)
Skill names provided by the user MUST be validated against the filesystem-discovered
skill list before use. Never trust a user-provided skill name as a file path component.
Validation before any file read, CLI invocation, or session creation. Path-traversal
patterns must also be explicitly rejected for defence-in-depth.

### Injectable adapter pattern (D37 — conditional)
If skill-loader is implemented as injectable adapter: stub MUST throw. Setter exported.
Production wiring in server.js as a separate task.

### Session token access
req.session.accessToken is canonical. Never req.session.token.

### Stack constraints
No new npm dependencies. No Express. All session state via req.session.*.
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech lead awareness before assigning to coding agent
**Signed off by:** Pending operator confirmation
