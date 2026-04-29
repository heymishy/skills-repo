# Story rrc.4: Create `/reference-corpus-update` companion skill

**Epic reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/epics/rrc-epic-2.md`
**Discovery reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/discovery.md`
**Benefit-metric reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/benefit-metric.md`

## User Story

As a **platform maintainer**,
I want to run `/reference-corpus-update` after a feature is merged that touched a legacy-adjacent system,
So that I can identify which extracted rules may have drifted from the live system and produce a scoped DEEPEN pass instruction — without having to re-run the full extraction.

## Benefit Linkage

**Metric moved:** MM3 — Reference corpus continuity across delivery cycles
**How:** This story creates the skill that makes MM3 measurable — without `/reference-corpus-update`, there is no lightweight mechanism for corpus refresh and MM3's minimum signal (corpus updated after a feature delivery) cannot be achieved.

## Architecture Constraints

- SKILL.md-only change: a new `.github/skills/reference-corpus-update/SKILL.md` file. No code, no scripts, no new npm dependencies.
- Per platform change policy: new SKILL.md files require a PR through the platform team — this story cannot be committed directly to master. The implementation branch must go through a draft PR.
- `check-skill-contracts.js` must continue to report 40 skills → 41 skills with all contract markers intact after this story. The new SKILL.md must include all four required contract markers: `name`, `description`, `triggers`, and the outputs section.
- Skill name must match directory name: `reference-corpus-update` (kebab-case, no leading `/`).
- Checked against `.github/architecture-guardrails.md` — no additional constraints beyond the standard platform change policy for new skills.

## Dependencies

- **Upstream:** rrc.2 must be complete first — `corpus-state.md` rule ID format is defined by the constraint index; the update skill reads these IDs to match changed files against known rules.
- **Downstream:** None — this is the final story in this feature.

## Acceptance Criteria

**AC1:** Given a new `.github/skills/reference-corpus-update/SKILL.md` file exists, When `check-skill-contracts.js` runs, Then it reports 41 skills and all contract markers intact (the new skill's SKILL.md must contain `name:`, `description:`, `triggers:`, and an outputs section).

**AC2:** Given the `/reference-corpus-update` skill, When an operator invokes it after a feature is merged, Then the skill asks for: (a) the path to `artefacts/[system-slug]/corpus-state.md`, and (b) a list of source files changed in the merge (or a git diff summary). It does not ask for the full reverse-engineering report.

**AC3:** Given the operator has provided the corpus-state.md path and changed file list, When the skill processes the inputs, Then it produces a DEEPEN pass scope instruction: a list of rule IDs from `corpus-state.md` whose `source-file` field matches one or more of the changed files, with the change type noted (modified / deleted / moved).

**AC4:** Given the DEEPEN pass scope instruction is produced, When no rules in `corpus-state.md` have `source-file` entries matching any changed file, Then the skill reports "No corpus rules affected by these changes — corpus remains current" and does not produce a false-positive DEEPEN scope.

**AC5:** Given the skill completes, Then it instructs the operator to update `corpus-state.md` with `lastRunAt` set to today's date and a brief `changeNote` describing what files were reviewed and whether any rules were flagged.

**AC6:** Given the skill file, When it is read by an operator who has not previously used it, Then the skill description and trigger phrases in the YAML frontmatter accurately describe its purpose so it appears in the right context when a user searches for "update corpus", "corpus refresh", or "did this feature break legacy rules".

## Out of Scope

- Automated CI invocation of `/reference-corpus-update` — the skill is a manual operator-invoked tool at MVP. CI automation is deferred.
- Confidence decay / stale-flag (`[PROBABLE-STALE]`) tracking — deferred to a follow-on story as stated in the discovery out of scope.
- Any update to the reverse-engineering report itself — the skill only updates `corpus-state.md` (the lightweight corpus index), not the full report.
- Reading git history automatically — the skill asks the operator to supply changed files rather than querying git directly, keeping it as a SKILL.md-only implementation.

## NFRs

- **Size:** The new SKILL.md must be ≤ 100 lines. If the protocol cannot be expressed within 100 lines, the scope is too large and should be split.
- **Readability:** The DEEPEN scope output must be human-readable — plain markdown list, not a JSON or machine-only format.
- **Security:** None — documentation/instruction change only; no file system access, no credentials.

## Complexity Rating

**Rating:** 1 — new SKILL.md file following established patterns; protocol is straightforward (match changed files to corpus rule source-file entries).
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
