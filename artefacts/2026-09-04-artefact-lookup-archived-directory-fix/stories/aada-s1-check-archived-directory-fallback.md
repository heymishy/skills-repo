# Story: Feature artefact lookup falls back to the archived directory when the primary path is gone

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the finding below, made while designing a redesign of the feature artefact page
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As a **Platform maintainer viewing the artefact page for a feature that has since been archived**,
I want **the artefact lookup to check the archived directory when the primary one is gone, the same way `validate-trace.sh`/`.ps1` already do**,
So that **"No artefacts found" only ever means the artefacts genuinely don't exist — not that they were moved by a routine archival pass**.

## Benefit Linkage

**Metric moved:** Time to First Actionable Content — the same metric `dashboard-triage`, `ppg-s1`, `fal-s1`, and `pefl-s1` all targeted in this same investigation thread.
**How:** Found while designing a mockup of the feature artefact page for `2026-04-14-skills-platform-phase3` (Phase 3, 7 epics, 21 stories, real per-story artefacts) — confirmed via direct code reading that this feature was moved to `artefacts/archived/2026-04-14-skills-platform-phase3/` by the already-shipped `2026-09-03-pipeline-state-archive-completed-features` story. `listLocalArtefacts` (`src/web-ui/adapters/artefact-list.js`) only ever constructs `path.join(repoRoot, 'artefacts', featureSlug)` — never checks the archived location — so this feature's artefact page (and every other archived feature's) shows "No artefacts found for this feature" even though the real files exist one directory over. `scripts/validate-trace.sh`/`.ps1` already carry this exact fallback (`archived_path = 'artefacts/archived/' + normalized[len('artefacts/'):]`) for trace-validation purposes — this story brings the web UI's own artefact-serving path in line with a convention the codebase has already established elsewhere, not inventing a new one.

## Architecture Constraints

- **Fix — `listLocalArtefacts` (`src/web-ui/adapters/artefact-list.js`):** when `path.join(repoRoot, 'artefacts', featureSlug)` does not exist, check `path.join(repoRoot, 'artefacts', 'archived', featureSlug)` before returning `null`. If the archived path exists, walk it exactly the same way (`walkMdFiles`) and return its contents — the caller (`listArtefacts`) and everything downstream is unaffected, since this function's own return shape doesn't change.
- No change to `listArtefacts`'s own merge-with-Postgres logic, the GitHub-API fallback path, or `deriveTypeFromPath` — this is a single, narrow addition inside `listLocalArtefacts` only.
- No change to how or when a feature gets archived (that mechanism is out of scope, already shipped, working correctly for `pipeline-state.json` and `/trace`).
- No new npm dependencies. No schema or query change — this is a filesystem-only fix.

## Dependencies

- **Upstream:** `2026-09-03-pipeline-state-archive-completed-features` (already shipped — the source of the `artefacts/archived/` convention this story adds awareness of) and `fal-s1` (already shipped — the real-feature-slug resolution this fix's own correctness depends on: without `fal-s1`, an epic-nested story would never even reach this function with the right `featureSlug` to look up).
- **Downstream:** None. This is a prerequisite for the separate, larger "one page per feature" redesign story, but does not depend on it.

## Acceptance Criteria

**AC1:** Given a feature slug whose directory exists at `artefacts/{slug}/` (the common, non-archived case), When `listLocalArtefacts` is called, Then behaviour is unchanged from today — the primary path is used, the archived path is never checked.

**AC2:** Given a feature slug whose directory does NOT exist at `artefacts/{slug}/` but DOES exist at `artefacts/archived/{slug}/`, When `listLocalArtefacts` is called, Then it returns that archived directory's own real files — not `null`.

**AC3 (regression guard):** Given a feature slug that exists at NEITHER `artefacts/{slug}/` NOR `artefacts/archived/{slug}/`, When `listLocalArtefacts` is called, Then it still returns `null` exactly as it does today — the existing "No artefacts found" behaviour for a genuinely nonexistent feature is unchanged.

## Out of Scope

- Any change to the archival mechanism itself (what triggers a feature being archived, or updating `pipeline-state.json`'s own `stage: "archived"` field) — already shipped, working, untouched.
- Any visual indication on the artefact page that a feature is archived (e.g. a badge) — a real, separate enhancement; this story only fixes the lookup finding the files at all.
- The "one page per feature" redesign, and the per-story artefact-grouping/resume-conversation work it depends on — a larger, separately-scoped follow-up story.
- The `p3.3` slug-collision finding — a separate, already-identified follow-up story.

## NFRs

- **Performance:** One additional `fs.existsSync` check, only ever reached when the primary path is already confirmed absent (the common case skips it entirely) — negligible.
- **Security:** None identified — no new external input; `featureSlug` is already used to construct the primary path today, this just constructs a second, analogous path from the same already-trusted value.
- **Accessibility:** None identified — no UI change in this story.
- **Audit:** None identified — no new data write or access path.

## Complexity Rating

**Rating:** 1 — single function, single new branch, mirrors an already-shipped, already-correct convention (`validate-trace.sh`/`.ps1`'s own archived-path fallback) rather than inventing new behaviour.
**Scope stability:** Stable.

## Definition of Ready Pre-check

<!-- Filled in by /definition-of-ready -->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
