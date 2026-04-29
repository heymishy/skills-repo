# Epic: Reference corpus outputs in `/reverse-engineer`

**Feature reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/discovery.md`
**Epic ID:** rrc-epic-1
**Slug:** rrc-epic-1
**Human oversight level:** Low

## Summary

Extend the `/reverse-engineer` SKILL.md to produce two new machine-readable reference output files — a `/discovery` pre-population seed (Output 9) and a constraint index (Output 10) — at the end of any INITIAL or DEEPEN pass. These outputs make the extraction corpus immediately consumable by downstream pipeline skills and coding agents without manual reformatting.

## Stories in this Epic

- `rrc.1` — Add Output 9: `/discovery` pre-population seed (`discovery-seed.md`)
- `rrc.2` — Add Output 10: Constraint index (`constraint-index.md`)
- `rrc.3` — Integrate `constraint-index.md` reading into `/discovery`
