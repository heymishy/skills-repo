## Story: Generate harness-agnostic instruction files from one source

**Epic reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/epics/rb-e1-no-fork-bootstrap-core.md
**Discovery reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/discovery.md
**Benefit-metric reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/benefit-metric.md
**Domain:** None identified — checked against `.github/standards/index.yml`.

## User Story

As an **engineering-capable evaluator using VS Code with GitHub Copilot, Cursor, or Claude Code**,
I want to **have the init command produce identical instruction content for whichever harness I use**,
So that **my choice of tool doesn't determine whether the bootstrapped repo actually governs my agent's behaviour**.

## Benefit Linkage

**Metric moved:** Fork/clone avoidance rate among new adopters
**How:** If the bootstrapped instructions only work for one harness, evaluators on a different tool get a broken or incomplete experience and are more likely to fall back to a full clone to "get it right" — defeating the point of this initiative for a meaningful share of adopters.

## Architecture Constraints

- **ADR-005** (Agent instructions format is a surface adapter concern) — this story extends the existing `scripts/assemble-copilot-instructions.sh`, which already emits `.github/copilot-instructions.md` or `AGENTS.md` from one source based on `vcs.type`. This story does not introduce a second mechanism (no symlinks) — decided explicitly during this /definition session given this repo's own Windows dev environment and git's inconsistent symlink support there.
- **New drift-check validator required**, matching the existing pattern of `.github/scripts/check-*.js` pre-commit validators (e.g. `check-viz-syntax.js`) — verifies all generated instruction-file copies match the source content byte-for-byte.
- **ADR-004** (`context.yml` single source of truth) — target-harness detection reads/writes `context.yml`, not a new parallel config file.

## Dependencies

- **Upstream:** rb-s1 (init command must exist); rb-s2 (the full skill set this instruction content describes must be in place first, so the generated instructions reference real skills, not placeholders)
- **Downstream:** None within this feature

## Acceptance Criteria

**AC1:** Given a bootstrapped repo with `context.yml` declaring no specific harness preference, When the init command runs the extended assembly step, Then it generates `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, and `.github/copilot-instructions.md`, each containing byte-identical content derived from one source.

**AC2:** Given all four instruction files have been generated, When the drift-check validator runs (as part of the init command or a subsequent commit), Then it confirms all four files match the source content and exits successfully; if any file has been hand-edited independently, it fails with a message naming which file diverged.

**AC3:** Given a developer opens the bootstrapped repo in VS Code with GitHub Copilot, When Copilot reads its instruction file, Then it receives the same governing content a Claude Code or Cursor user in the same repo would receive — verified by comparing the rendered instruction content across all three, not just confirming a file exists.

**AC4:** Given the source instruction content changes after bootstrap (e.g. a future story updates it), When the assembly step is re-run, Then all four generated files update to match — no file is left stale relative to the source.

## Out of Scope

- Any new harness beyond the three named in discovery (VS Code+Copilot, Cursor, Claude Code) — adding a fourth harness format is a separate future story if ever needed.
- Ongoing update-sync of instruction content after initial bootstrap in a way that reaches back to the upstream platform — explicitly deferred per discovery Out of Scope.

## NFRs

- **Performance:** Instruction-file generation and drift-check together add no more than 2 seconds to the init command's total run time.
- **Security:** None identified.
- **Accessibility:** Not applicable.
- **Audit:** Not applicable at this story's scope.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
