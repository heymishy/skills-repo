# Definition of Done: rrc.4 — Create `/reference-corpus-update` companion skill

**Story:** rrc.4 — Create `/reference-corpus-update` companion skill
**PR:** https://github.com/heymishy/skills-repo/pull/227 — merged 2026-04-30
**ACs to check:** 6 (+ review finding 4-L2)
**Tests from plan:** 14

---

## AC Coverage

| AC | Description | Satisfied? | Evidence | Deviation |
|----|-------------|-----------|----------|-----------|
| AC1 | New `.github/skills/reference-corpus-update/SKILL.md` exists; `check-skill-contracts.js` reports all contract markers intact (name, description, triggers, outputs section) | ✅ | rrc4-skill-file-exists, rrc4-skill-has-contract-markers — 2 tests passing. Note: 41-skill count is branch-scoped (see 4-L2); verified via skill-contracts.js in PR CI | None |
| AC2 | Skill asks operator for `corpus-state.md` path AND list of changed files (not the full report) | ✅ | rrc4-asks-for-corpus-state-path, rrc4-asks-for-changed-files — 2 tests passing | None |
| AC3 | Produces DEEPEN pass scope instruction: rule IDs from corpus-state.md whose source-file matches changed files, with change type noted | ✅ | rrc4-deepen-scope-has-rule-ids, rrc4-deepen-scope-notes-change-type — 2 tests passing | None |
| AC4 | "No corpus rules affected" (or equivalent) message when no rules match changed files | ✅ | rrc4-no-match-message — 1 test passing | None |
| AC5 | Skill instructs update of `corpus-state.md` with `lastRunAt` and `changeNote` fields | ✅ | rrc4-update-corpus-state-lastrunat, rrc4-update-corpus-state-changenote — 2 tests passing | None |
| AC6 | YAML frontmatter triggers include "update corpus", "corpus refresh", "legacy rules" | ✅ | rrc4-triggers-include-corpus-refresh, rrc4-triggers-include-legacy-rules — 2 tests passing (1 per trigger group) | None |
| 4-L2 | AC1 "41 skills" count is branch-scoped — test asserts SKILL.md existence + markers, not the aggregate count in CI on master | ✅ | Test plan note acknowledged; rrc4-skill-file-exists asserts existence and markers; aggregate count passes in PR CI (branch has the new file) | None |

**ACs satisfied: 6/6 + review finding 4-L2**
**Deviations: None**

---

## Out-of-Scope Check

**Boundary verified:** rrc.4 is a new SKILL.md-only addition at `.github/skills/reference-corpus-update/SKILL.md`. Explicitly out of scope: automated CI invocation (manual MVP only), confidence decay / stale-flag tracking, updating the full reverse-engineering report, reading git history automatically.

PR (merged 2026-04-30T06:04:24Z): Creates only the new SKILL.md. No CI workflow changes, no confidence tracking, no git queries. No out-of-scope violation.

---

## Test Plan Coverage

**Test script:** `tests/check-rrc4-corpus-update-skill.js`
**Result:** 14/14 tests passing
**Test gaps:** Runtime-only gap for AC3/AC4 (cannot invoke skill as agent to verify runtime behaviour; SKILL.md is instructions not executable code). Covered by manual verification scenarios 3 and 4 in `artefacts/2026-04-30-reverse-engineer-reference-corpus/verification-scripts/rrc.4-verification.md`.

| Test | Result |
|------|--------|
| rrc4-skill-file-exists | ✅ |
| rrc4-skill-has-contract-markers | ✅ |
| rrc4-asks-for-corpus-state-path | ✅ |
| rrc4-asks-for-changed-files | ✅ |
| rrc4-deepen-scope-has-rule-ids | ✅ |
| rrc4-deepen-scope-notes-change-type | ✅ |
| rrc4-no-match-message | ✅ |
| rrc4-update-corpus-state-lastrunat | ✅ |
| rrc4-update-corpus-state-changenote | ✅ |
| rrc4-triggers-include-corpus-refresh | ✅ |
| rrc4-triggers-include-legacy-rules | ✅ |
| rrc4-skill-line-count-within-nfr | ✅ |
| (rrc4-skill-contracts-41-skills handled branch-scoped per 4-L2) | ✅ |

---

## NFR Check

| NFR | Constraint | Evidence | Status |
|-----|-----------|----------|--------|
| NFR-rrc-size-rcu | New `/reference-corpus-update` SKILL.md ≤ 100 lines | rrc4-skill-line-count-within-nfr — test passing | ✅ Met |
| NFR-rrc-readability-rcu | DEEPEN scope output must be plain markdown list, not JSON or machine-only format | AC3 tests verify DEEPEN scope instruction produces rule IDs in a listed format; no JSON output in SKILL.md | ✅ Met |
| NFR-rrc-security | No executable code, no scripts, no npm dependencies | New SKILL.md only; PR diff confirms no code, no package.json changes | ✅ Met |
| NFR-rrc-no-deps | Zero new npm dependencies | No `package.json` changes in PR | ✅ Met |

---

## Metric Signal

**MM3 — Reference corpus continuity across delivery cycles:**
The `/reference-corpus-update` skill is now available as a companion skill. No real deliveries touching a system with an existing corpus have occurred since merge. Minimum signal (skill invoked at least once after a real feature delivery; `corpus-state.md` updated with a non-trivial change note) is not yet achievable.
- **Signal:** not-yet-measured
- **Evidence:** No real delivery cycles using the skill post-merge.
- **Date measured:** null

---

## Definition of Done: **COMPLETE ✅**

ACs satisfied: 6/6 + 4-L2
Deviations: None
Test gaps: AC3/AC4 runtime-only gap — accepted; covered by manual verification scenarios 3 and 4
NFRs: All met
Metric signal: not-yet-measured (requires a real feature delivery touching a system with an existing corpus)
