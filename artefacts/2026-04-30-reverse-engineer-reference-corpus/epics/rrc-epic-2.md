# Epic: `/reference-corpus-update` companion skill

**Feature reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/discovery.md`
**Epic ID:** rrc-epic-2
**Slug:** rrc-epic-2
**Human oversight level:** Low

## Summary

Create a new `/reference-corpus-update` companion SKILL.md that, after a feature delivery touching a legacy system, accepts a list of changed source files and produces a scoped DEEPEN pass instruction for any rules whose source files were modified. Updates `corpus-state.md` with `lastRunAt` and a change note. Prevents the reference corpus from silently becoming stale after each delivery cycle.

## Stories in this Epic

- `rrc.4` — Create `/reference-corpus-update` SKILL.md (new skill file, governance checks, CHANGELOG)
