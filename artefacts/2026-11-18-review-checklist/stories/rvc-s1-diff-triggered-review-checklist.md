## Story: A review checklist, seeded from recorded defects, shows the items a change's diff is likely to need

**Epic reference:** None - short-track (review tooling, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: the recorded defects each checklist item cites (listed in the Benefit Linkage and in `REVIEW.md`), each in a file tracked in this repository.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [tooling] [review]

## User Story

As **the reviewer, or the coding agent, checking a pull request before it is merged**,
I want **the checks that earlier defects showed a change of this kind needs, listed against the lines that triggered them**,
So that **a defect a previous change let through is looked for again whenever a change looks like it**, instead of depending on whoever reviews remembering it.

## Benefit Linkage

**Metric moved:** None formal. Several defects in this repository were found after merge and each had a written rule that would have caught it. Examples: an injectable adapter whose default stub returned a safe-looking value (CLAUDE.md, D37); a test that compared the branch against master, which would fail any later pull request touching the same directories (`artefacts/2026-11-18-chat-continue-bound/decisions.md`, CORRECTION); a pipeline writer that created feature entries without the fields the schema requires (`artefacts/2026-11-18-writer-complete-feature-entries/decisions.md`); a page loop that re-sent hidden turns without a bound (`artefacts/2026-11-18-chat-continue-bound/decisions.md`). The rules existed in prose and nothing pointed at them from the change.
**How:** `REVIEW.md` at the repository root holds one entry per recorded defect. Each entry names the file paths and, optionally, a pattern on added lines that makes it relevant, the check to make, and the artefact that records the defect. A script reads a diff against a base branch and prints the entries whose paths and patterns match, with the file and line that matched.

## Architecture Constraints

- Plain Node, no new dependency. Reads git through `git diff --unified=0 <base>...HEAD` (the base defaults to `master`).
- Advisory: the script prints and exits 0 when it finds items; it fails only when run with `--check` and the checklist itself is invalid (a missing field, or a source path that does not exist). Blocking the merge is a separate decision and is not part of this story.
- Every entry's source must be a tracked file (checked by `--check`), so an entry cannot quietly outlive or invent its basis.
- Glob matching is limited to `*` (within one path segment) and `**` (any number of segments), so no pattern library is needed.

## Dependencies

- **Upstream:** vfy-s1 (the same command style and check file pattern), the defects cited in `REVIEW.md`.
- **Downstream:** none in this story. A CI step that posts the output on pull requests is a follow-up decision.

## Acceptance Criteria

**AC1:** Given `REVIEW.md` with a `## <title>` heading followed by `paths`, optional `match`, `check` and `source` lines, When it is parsed, Then each entry has those fields, and an entry missing `paths`, `check` or `source` is reported.
**AC2:** Given a diff that changes a file matching an entry's `paths` and, where the entry has a `match`, adds a line matching it, When the script runs, Then the entry is listed with that file and line.
**AC3:** Given a diff that changes a matching file but adds no line matching the entry's `match`, When the script runs, Then the entry is not listed.
**AC4:** Given an entry with no `match`, When a matching file changes, Then the entry is listed with the file and no line.
**AC5:** Given `--check`, When an entry's `source` does not exist in git, Then the script exits non-zero and names the entry and the missing path.
**AC6:** Given the committed `REVIEW.md`, When `--check` runs, Then every entry is valid and every source exists in git.
**AC7:** Given a diff that matches no entry, When the script runs, Then it prints that no checklist entry applies and exits 0.

## Out of Scope

- Blocking a merge on a checklist item; a CI step posting the output to a pull request.
- Judging whether a change satisfies an item (the script lists items; the reviewer checks them).
- Seeding from every entry in `workspace/learnings.md` (the set is chosen for defects that a diff can show; the rest stay in learnings).

## NFRs

- **Reliability:** the same diff gives the same listing; no network access.
- **Maintainability:** each entry is short enough to read in full in a review.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
