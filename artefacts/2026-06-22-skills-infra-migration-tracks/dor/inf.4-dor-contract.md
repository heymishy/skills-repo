# DoR Contract: inf.4 — Add H-INF hard block to `/definition-of-ready` SKILL.md

**Approved:** 2026-06-25
**Operator:** Hamish King

---

## What will be built

H-INF hard block added to `.github/skills/definition-of-ready/SKILL.md`. The block fires when story pipeline-state carries `hasInfraTrack: true`, checks that `infraPlanPath` is set and the artefact at that path contains status PASS, and shows FAIL with the expected path named in the finding text. When `hasInfraTrack` is absent or false, H-INF does not appear — all existing blocks unaffected.

## What will NOT be built

Automatic `hasInfraTrack` detection. H-MIG gate (mig.3). Any UI, src/, or schema changes.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | SKILL.md contains H-INF block text with hasInfraTrack trigger | Unit |
| AC2 | Instruction text specifies FAIL for absent/no-PASS infraPlanPath | Unit |
| AC3 | Instruction text specifies PASS for valid sign-off path | Unit |
| AC4 | Instruction text specifies H-INF is conditional on hasInfraTrack | Unit |

## Assumptions

Tests check SKILL.md text content, not Claude's runtime execution. H-INF instruction text follows existing H-block format in the DoR SKILL.md.

## Estimated touch points

Files: `.github/skills/definition-of-ready/SKILL.md`
Services: None
APIs: None

## schemaDepends

[hasInfraTrack, infraPlanPath] — BOTH present in `pipeline-state.schema.json` (shr.1 merged ✅)
