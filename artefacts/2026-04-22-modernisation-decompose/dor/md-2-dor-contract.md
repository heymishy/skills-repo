# DoR Contract: Register `/modernisation-decompose` in `check-skill-contracts.js` (md-2)

**Story:** md-2 — Register `/modernisation-decompose` in `check-skill-contracts.js`
**Feature:** 2026-04-22-modernisation-decompose
**Produced by:** /definition-of-ready — 2026-04-22
**Status:** Approved

---

## What will be built

A single updated file: `scripts/check-skill-contracts.js` (confirm exact path at implementation time — may be under `tests/`).

Change required: add a contract entry for `modernisation-decompose` following the existing pattern. The entry must include at minimum a required structural marker for `## State update — mandatory final step`. Additional markers matching the sections committed in md-1 (entry condition, completion output, triggers) should also be registered.

---

## What will NOT be built

- Changes to any other governance check scripts
- Changes to `check-pipeline-artefact-paths.js`
- Changes to any SKILL.md file
- New npm dependencies

---

## File touch points

| File | Action | Notes |
|------|--------|-------|
| `scripts/check-skill-contracts.js` | MODIFY | Add one contract entry for modernisation-decompose |

All other files are out of scope. Any modification to files not listed here is a violation of this contract.

---

## AC → test mapping

| AC | Test ID(s) in test plan | Type |
|----|------------------------|------|
| AC1 — npm test passes with 38 skills | T1 (integration) | Integration |
| AC2 — Remove State update → named failure | T2 (integration) | Integration |
| AC3 — 0 regressions to prior 37 skills | T3 (integration) | Integration |

---

## Assumptions

- md-1 SKILL.md is committed before this story begins coding
- The existing contract pattern is the established approach and will not be refactored in this story

---

## schemaDepends

`schemaDepends: []` — dependency on md-1 is delivery-order only (SKILL.md markers must be finalised before the contract entry can reference them accurately). No pipeline-state.json fields are read from md-1's output. No schema check required.

---

## Explicit exclusions (out-of-scope guard)

- Do not modify `.github/skills/modernisation-decompose/SKILL.md`
- Do not modify `scripts/check-pipeline-artefact-paths.js`
- Do not modify any other test or script file
- Do not create or modify `artefacts/` files
- Do not add any npm dependency
