# DoR Contract: Create `/reference-corpus-update` companion skill

**Story:** rrc.4
**Story artefact:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/stories/rrc.4-reference-corpus-update-skill.md`
**Prepared by:** Copilot
**Date:** 2026-04-30

---

## What will be built

A new file `.github/skills/reference-corpus-update/SKILL.md` containing:

1. **YAML frontmatter** with all 4 required contract markers: `name: reference-corpus-update`, `description:` (accurate purpose description), `triggers:` (including "update corpus", "corpus refresh", "did this feature break legacy rules" or close approximations), and an outputs section.
2. **Corpus-state.md input step:** skill asks for (a) path to `artefacts/[system-slug]/corpus-state.md`, and (b) list of changed source files from the merged feature (not the full report).
3. **DEEPEN scope output:** a list of rule IDs (format `L<layer>-<seq>` per DEC-001) from `corpus-state.md` whose `source-file` field matches one or more changed files, annotated with change type (modified / deleted / moved).
4. **No-match message:** "No corpus rules affected by these changes — corpus remains current" — produced when no `corpus-state.md` rule source-file matches any changed file.
5. **lastRunAt instruction:** after completing, instruct the operator to update `corpus-state.md` with `lastRunAt` set to today's date and a brief `changeNote` describing what was reviewed.
6. **Total size:** ≤ 100 lines.

## What will NOT be built

- Automated CI invocation — skill is manually operator-invoked at MVP.
- Confidence decay / `[PROBABLE-STALE]` flag tracking — deferred.
- Updates to the reverse-engineering report itself — only `corpus-state.md` is updated.
- Git history auto-querying — operator supplies changed files manually.
- Any changes to any existing SKILL.md or other file.

## How each AC will be verified

| AC | Test approach | Type | Test ID |
|----|---------------|------|---------|
| AC1: file exists + 4 contract markers + name matches directory | Assert file exists; assert name:, description:, triggers:, outputs section present; assert name value = "reference-corpus-update" | Unit (file existence + content) | T4.1–T4.2 |
| AC2: asks for corpus-state.md path + changed file list (not full report) | Assert skill asks for corpus-state.md and changed files; assert no instruction to supply full report | Unit (file content) | T4.3–T4.5 |
| AC3: DEEPEN scope output with matching rule IDs and change type | Assert skill references rule IDs in `L<layer>-<seq>` format, source-file matching, and change type notation | Unit (file content) | T4.6–T4.8 |
| AC4: no-match message when no rules affected | Assert skill contains the exact phrase "No corpus rules affected" | Unit (file content) | T4.9–T4.10 |
| AC5: lastRunAt + changeNote update instruction | Assert skill instructs updating corpus-state.md with lastRunAt and changeNote | Unit (file content) | T4.11–T4.13 |
| AC6: trigger phrases accurately describe purpose | Assert triggers include entries approximating "update corpus", "corpus refresh", "legacy rules" | Unit (file content) | T4.14 |
| NFR (≤ 100 lines) | Assert line count ≤ 100 | Unit (line count) | T4.14 |

## Assumptions

- `corpus-state.md` (Output 8 from `/reverse-engineer` v2) uses `source-file` entries that can be matched against git-changed file paths.
- Rule-id format `L<layer>-<seq>` (DEC-001) is the canonical format — rrc.4 adopts it without modification.
- The skill can be dispatched in parallel with rrc.1 and rrc.2; the DEC-001 format definition removes the blocking dependency.
- The 41-skill count assertion (T4.1) is validated against the implementation branch; master baseline is 40.

## Estimated touch points

**Files created:** `.github/skills/reference-corpus-update/SKILL.md` (only — new file)
**Files modified:** None
**Services:** None
**APIs:** None
**Test script (read-only after implementation):** `tests/check-rrc4-corpus-update-skill.js`
