# DoR Contract: inf.5 — Extend chain-hash trace to emit on infra-plan sign-off

**Approved:** 2026-06-25
**Operator:** Hamish King

---

## What will be built

`_writeTrace` extended (not replaced) to fire a trace record on infra-plan sign-off. Record contains: artefact path, SHA-256 hash from `fs.readFileSync` (disk content). No infra entries when `hasInfraTrack` absent or false. `/trace` SKILL.md updated to reference infra-plan trace entry.

## What will NOT be built

Migration-review trace extension (mig.4). Retroactive emission. Schema or pipeline-state.json changes.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Mock sign-off; assert trace record has path + SHA-256 | Unit |
| AC2 | Feature with code + infra sign-off; assert both appear in trace | Integration |
| AC3 | No hasInfraTrack; assert zero infra trace records; existing events unchanged | Unit |

## Assumptions

SHA-256 via `crypto` + `fs.readFileSync`. `_writeTrace` supports new event type parameter without breaking existing callers.

## Estimated touch points

Files: trace module in `src/` (exact file determined from codebase), `.github/skills/trace/SKILL.md`
Services: None
APIs: None

## schemaDepends

[hasInfraTrack] — PRESENT in `pipeline-state.schema.json` (shr.1 merged ✅)
