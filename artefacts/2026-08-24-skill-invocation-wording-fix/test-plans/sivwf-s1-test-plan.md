## Test Plan: sivwf-s1 — Clarify the real skill-invocation mechanism in CLAUDE.md

**Story reference:** `artefacts/2026-08-24-skill-invocation-wording-fix/stories/sivwf-s1-clarify-skill-invocation-mechanism-in-claude-md.md`
**Test file:** `tests/check-sivwf-s1-skill-invocation-wording.js`

Content-assertion pattern (same family as `check-vtc-s1`, `check-s3fw-s1`): read `CLAUDE.md` and assert the new clarifying passage is present with the required content, and that no existing `/name` notation elsewhere in the document was altered.

### Tests

**T1 — claudeMdStatesRealInvocationMechanism (AC1)**
Assert `CLAUDE.md` contains an explicit statement (near the top, before or at the Pipeline overview table) that skills are not registered Claude Code skills, and that invoking one means reading `skills/[name]/SKILL.md` directly.

**T2 — existingNotationUnchanged (AC2, non-regression)**
Byte-for-byte presence check on the existing Pipeline overview table content and the Short-track section's `/name` references — confirms nothing was renamed or restructured.

**T3 — citesConcreteFailureMode (AC3)**
Assert the clarifying passage mentions the real observed failure ("Unknown skill" / Skill tool call failure), not a generic unsourced caveat.

**T4 — referencesDiscoveryArtefact (AC4)**
Assert the clarifying passage references `artefacts/2026-08-24-skill-tool-invocability-pilot/discovery.md` by path.

**T5 — noNativeRegistrationArtifactsIntroduced (non-regression, Architecture Constraints)**
Assert no `.claude/skills/` directory or `.claude-plugin/plugin.json` was created as part of this change (confirms the fix stayed documentation-only).

**T6 — checkSkillContractsUntouched (non-regression, Architecture Constraints)**
Assert `.github/scripts/check-skill-contracts.js` was not modified — this story is `CLAUDE.md`-only, and that script is explicitly out of scope per its own SKILL.md-only docstring.
