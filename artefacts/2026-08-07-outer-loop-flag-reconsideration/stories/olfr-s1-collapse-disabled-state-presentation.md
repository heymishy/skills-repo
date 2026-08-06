## Story: Collapse the disabled-state outer-loop listing into one line in both instruction-file sections

**Epic reference:** None — single-story scope, discovery+definition pass only (explicitly lighter process weight chosen for this reconsideration)
**Discovery reference:** artefacts/2026-08-07-outer-loop-flag-reconsideration/discovery.md
**Benefit-metric reference:** None — skipped by explicit choice for this item; benefit linkage stated directly below
**Domain:** None identified — checked against `.github/standards/index.yml` (CI-assembly script, no clear domain match).

## User Story

As an **operator or evaluator bootstrapping a repo without the outer loop enabled**,
I want **the assembled instruction file to summarize the installed-but-inactive outer loop in one line instead of listing all 8 skills twice across two separate sections**,
So that **the disabled state actually delivers the context-budget saving progressive disclosure exists to provide, and I immediately see the exact command to enable it if I want to**.

## Benefit Linkage

**Metric moved:** Instruction-file token reduction in the disabled state (Discovery's own directional success indicator — measured, not assumed, per this story's AC4).
**How:** Direct source-code inspection of `scripts/assemble-copilot-instructions.sh` confirms the disabled state currently lists each of the 8 outer-loop skills on its own line **twice** — once in the "Progressive Skill Disclosure" section (lines ~244–246) and again, independently, in the "Core Platform Layer" section (lines ~317–319) — plus two repeated explanatory paragraphs. Collapsing both listings into one line each closes a real, measurable token-volume gap, not a marginal one.

## Architecture Constraints

- **Sequencing constraint with `scr-s1`:** both stories touch `assemble-copilot-instructions.sh`'s outer-loop presentation logic in the same file region. This story's changes are scoped to the `else` (disabled) branches only; `scr-s1`'s changes are scoped to the `if [[ "$OUTER_LOOP_ENABLED" == true ]]` (enabled) branches' redundant `get_skill_triggers` call. The two should be sequenced (not necessarily blocking, but coordinated) to avoid a merge conflict in the same function.
- **No D37/adapter concern:** this is a build-time/CI-time bash script change, no runtime external service calls.
- **Reuse `scr-s1`'s single-source-of-truth categorization** for the skill count named in the collapsed message (e.g. `${#OUTER_LOOP_SKILLS[@]}`) rather than hardcoding the number `8`, so the message stays correct if a skill is later added or removed from the outer-loop category.

## Dependencies

- **Upstream:** `scr-s1` (`2026-08-07-skill-categorization-reconciliation`) — not a hard blocker, but should be sequenced to avoid touching the same script region independently. `[External: scr-s1 lives in a different feature folder — DoR-signed-off, not yet implemented as of this story's writing, 2026-08-07]`
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `outerLoop.enabled: false`, When the instruction file's "Progressive Skill Disclosure" section is assembled, Then the current per-skill listing ("- /$skill (installed, not enabled)" repeated 8 times) is replaced by a single line naming the skill count and the exact re-enable command (e.g. "Outer loop (8 skills: discovery through decisions) is installed but not active. Run `skills-repo init . --with-outer-loop` to enable it.").

**AC2:** Given `outerLoop.enabled: false`, When the instruction file's "Core Platform Layer" section is assembled, Then its own independent per-skill listing (currently duplicating the Progressive Disclosure section's list) is collapsed the same way — one line, not a second per-skill list repeating the same 8 names.

**AC3:** Given `outerLoop.enabled: true`, When the instruction file is assembled, Then both sections' enabled-branch behaviour (full per-skill descriptions and triggers) is completely unchanged by this story — this story touches only the disabled (`else`) branches.

**AC4:** Given the collapsed disabled-state message, When the assembled instruction file's token count is measured before and after this change, Then the measured reduction is reported explicitly in the PR/decisions.md — resolving the discovery's own open `[ASSUMPTION]` about whether the saving is non-trivial, reported honestly either way.

## Out of Scope

- **Any change to the enabled-state (`OUTER_LOOP_ENABLED == true`) branches** — those are `scr-s1`'s scope (the redundant `get_skill_triggers` call), not this story's.
- **Any change to `rb-s2`'s unconditional file-copy guarantee** — every skill file remains present on disk regardless of this flag's state.
- **Removing the `--with-outer-loop` flag** — explicitly considered and rejected in discovery; this story keeps the flag and improves its disabled-state presentation.

## NFRs

- **Performance:** The collapsed message removes work (fewer lines generated, no per-skill loop needed in either disabled branch) — a strict improvement, not a new cost.
- **Security:** None identified.
- **Accessibility:** Not applicable — no UI surface, a generated markdown/text file.
- **Audit:** Not applicable.

## Complexity Rating

**Rating:** 1 — well-understood, isolated change to two clearly-identified branches in one existing script.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
