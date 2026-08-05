# Contract Proposal: Generate harness-agnostic instruction files from one source

**Story reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s3-harness-agnostic-instructions.md
**Date:** 2026-08-05

## What will be built

Extend `scripts/assemble-copilot-instructions.sh` (existing, ADR-005) to additionally emit `CLAUDE.md`, `AGENTS.md`, and `.cursorrules` — all byte-identical to `.github/copilot-instructions.md`, generated from one source. A new drift-check validator (`scripts/check-instructions-drift.js`, matching the existing `check-*.js` pre-commit pattern) verifies all four match.

## What will NOT be built

- Any new harness beyond the three named in discovery (VS Code+Copilot, Cursor, Claude Code)
- Ongoing update-sync of instruction content reaching back to the upstream platform
- Symlinks — explicitly rejected at `/definition` given this repo's Windows dev environment (see `decisions.md`)

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Assert all four files generated, byte-identical to source | Unit |
| AC2 | Assert drift-check passes clean / fails naming the divergent file | Unit |
| AC3 | Manual — one-time cross-harness verification, documented in PR | Manual |
| AC4 | Assert source change propagates to all four files on re-run | Unit |

## Assumptions

- `assemble-copilot-instructions.sh`'s existing GitHub-path behaviour (emitting `.github/copilot-instructions.md`) is unaffected by this extension — verified by a regression test
- Cursor's `.cursorrules` and Claude Code's `CLAUDE.md` accept the same content shape as `.github/copilot-instructions.md` without per-harness reformatting

## Estimated touch points

- **Files:** `scripts/assemble-copilot-instructions.sh` (extended, not rewritten), new `scripts/check-instructions-drift.js`
- **Services:** none
- **APIs:** none

**Contract review:** ✅ PASSED — proposed implementation aligns with all 4 ACs.
