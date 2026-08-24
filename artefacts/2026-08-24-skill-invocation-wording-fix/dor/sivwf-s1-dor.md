# Definition of Ready: sivwf-s1 — Clarify the real skill-invocation mechanism in CLAUDE.md

**Story:** artefacts/2026-08-24-skill-invocation-wording-fix/stories/sivwf-s1-clarify-skill-invocation-mechanism-in-claude-md.md
**Test plan:** artefacts/2026-08-24-skill-invocation-wording-fix/test-plans/sivwf-s1-test-plan.md
**Track:** Short-track

---

## Hard Blocks

| Check | Status |
|-------|--------|
| ACs are testable | ✅ |
| Test plan exists and maps to ACs | ✅ |
| No unresolved architectural decision | ✅ N/A — the architectural decision (not pursuing native registration) is already recorded in the discovery artefact's Clarification log; this story is a documentation-wording fix, not itself an architectural choice |
| No CSS-layout-dependent ACs | ✅ N/A |
| No injectable adapter introduced | ✅ N/A |
| Contract does not exclude a file the test plan requires touchpoints in | ✅ — `CLAUDE.md` is the story's sole in-scope file, named in both story and test plan |

## Warnings

None.

---

## Oversight level

**Medium** — this is the superseding fix identified by discovery's own Clarification log outcome ("kill the pilot, do documentation-only fix"), explicitly chosen by the operator during the discovery/clarify session. Proceeding directly per that decision.

---

## Standards injection

None — no `pipeline-infrastructure` entry exists in `.github/context.yml`'s standards registry.

---

## Coding Agent Instructions

1. Edit `CLAUDE.md`: insert a short clarifying passage after `## Active context` and before `## Skills pipeline maintenance` (or another location that reads naturally before the `/name` notation is first used in the Pipeline overview table) — a new section such as `## How skills are invoked` stating: these are not registered Claude Code skills; the `/name` notation is this repo's own shorthand referring to `skills/[name]/SKILL.md`; invoking a skill means reading that file directly and following its instructions; confirmed this session — a Skill tool call with `skill="workflow"` fails with "Unknown skill"; full investigation and rationale at `artefacts/2026-08-24-skill-tool-invocability-pilot/discovery.md`.
2. Do not alter any other `/name` reference anywhere else in the document.
3. Write `tests/check-sivwf-s1-skill-invocation-wording.js` per the test plan (6 tests), run it standalone, then run the full suite to confirm no regressions.
4. Follow this session's established worktree-file-transfer pattern: write files in the main checkout, create a new worktree+branch from master (`git worktree add .worktrees/sivwf-s1 -b feature/sivwf-s1 master`), copy files across, diff-verify, discard main-checkout duplicates, commit only in the worktree.

---

## Sign-off

**Decision:** Proceed: Yes
**Signed off by:** Claude (agent), on standing operator instruction (discovery/clarify decision: "Kill the pilot, do documentation-only fix")
**Date:** 2026-08-24
