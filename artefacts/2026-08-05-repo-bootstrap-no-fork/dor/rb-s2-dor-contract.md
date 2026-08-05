# Contract Proposal: Install the full skill set with a lightweight outer/inner/ancillary registry

**Story reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s2-full-skill-set-and-registry.md
**Date:** 2026-08-05

## What will be built

Extend the CLI wrapper's install step (from `rb-s1`) to copy the *full* skill set — not a placeholder — and generate a `skills-registry.json` manifest categorizing every skill as `outer-loop`, `inner-loop`, or `ancillary`, cross-referenced against the instruction file's pipeline diagram.

## What will NOT be built

- Harness-agnostic instructions — `rb-s3`
- `platform:fetch`/`platform:pin`/`platform:verify` — already exist, already travel via `rb-s1`'s wrap of `platform-init.js`'s `COPY_DIRS`
- Any modification to skill file content itself

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Assert full skill count matches source, not a reduced set | Unit |
| AC2 | Parse registry, assert every skill has a valid category | Unit |
| AC3 | Representative instance: add one new category, confirm no code change needed | Unit (documented as representative, not general proof) |
| AC4 | Cross-reference registry against fixture diagram, assert no orphans | Unit |

## Assumptions

- Fixture instruction file's diagram structure is stable and parseable
- The real `skills/` tree is available to bundle in the npm package via `rb-s1`'s existing bundling

## Estimated touch points

- **Files:** new registry-generation module, `skills-registry.json` output schema
- **Services:** none
- **APIs:** none

## Schema dependency declaration (H8-ext)

**schemaDepends:** `[]`

This story's Dependencies block names `rb-s1` as upstream, but the dependency is code-level (this story extends `rb-s1`'s CLI wrapper directly, composing in the same process) — it does not consume any `pipeline-state.json` schema field `rb-s1` writes. No schema fields are declared as depended-upon.

**Contract review:** ✅ PASSED — proposed implementation aligns with all 4 ACs.
