# Contract Proposal: Optionally install the full outer loop during bootstrap

**Story reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s5-optional-outer-loop-install.md
**Date:** 2026-08-05

## What will be built

A `--with-outer-loop` CLI flag that, combined with either bootstrap entry point (`rb-s1` fresh-repo or `rb-s4` SaaS-connected), additionally installs every skill the `rb-s2` registry categorizes as `outer-loop`. Add-on mode allows adding the outer loop to an already-bootstrapped repo without discarding existing content, explicitly reconciled against `rb-s1` AC3's refusal-to-overwrite behaviour.

## What will NOT be built

- Any mechanism for removing the outer loop after installation
- Changes to the underlying outer-loop skills' own content/behaviour

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Fresh-repo bootstrap with flag, assert outer-loop skills present | Unit |
| AC2 | SaaS-connected without flag, assert outer-loop skills absent | Unit |
| AC3 | SaaS-connected with flag, assert outer-loop skills present, matching AC1 | Unit + integration |
| AC4 | Add-on mode: pre-existing bootstrap + later flag, assert no data loss + reconciliation with rb-s1 AC3 | Unit |

## Assumptions

- The `rb-s2` registry is available and correctly categorized by the time this story is implemented

## Estimated touch points

- **Files:** CLI flag-parsing logic, reused registry-reading logic from `rb-s2`
- **Services:** none
- **APIs:** none

## Schema dependency declaration (H8-ext)

**schemaDepends:** `[]`

Dependencies on `rb-s1`/`rb-s2`/`rb-s4` are code-level (reads registry and bootstrap output on disk), not `pipeline-state.json` schema fields.

**Contract review:** ✅ PASSED — proposed implementation aligns with all 4 ACs.
