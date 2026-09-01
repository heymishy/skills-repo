## Story: Split the Web UI's consolidated definition and review artefacts into individual files matching the CLI convention

**Epic reference:** None — short-track (no epic; single bounded story)
**Discovery reference:** artefacts/2026-09-01-artefact-commit-durability-gap/discovery.md (the investigation that surfaced this gap while backfilling `af17f555`)
**Benefit-metric reference:** None — short-track
**Domain:** [web-ui]

## User Story

As a **platform owner running features across both the CLI (Claude Code) and the web UI**,
I want to **have `/definition` and `/review` produce the same individual per-epic/per-story/per-review file shape regardless of which surface I ran them from**,
So that **artefacts are consistently available, discoverable, and readable across both channels — the exact goal `af17f555` ("Cross-Channel Feature Continuity") itself was built to achieve, but never fully realised.**

## Bug found (confirmed this session, while backfilling `af17f555`)

Checked every stage's actual save convention on both the CLI (`skills/*/SKILL.md`) and the Web UI (`skills.js`'s per-skill protocol blocks) sides:

| Stage | CLI convention | Web UI convention (before this story) |
|---|---|---|
| discovery / benefit-metric / design | one flat file | one flat file — match |
| **definition** | individual `epics/[slug].md` + `stories/[slug].md` | **one** consolidated `definition.md` — diverges |
| **review** | individual `review/[story]-review-[N].md` | **one** consolidated `review.md` — diverges |
| test-plan / definition-of-ready | individual per-story files | individual per-story files (fixed by `wsap-s1`, this session) — match |

`definition` and `review` are the two remaining stages where the Web UI still bundles everything into one file while the CLI splits by epic/story. This is architecturally significant, not cosmetic: `af17f555`'s own `design.md` (the feature meant to fix exactly this kind of cross-channel gap) models each stage's artefact as a **singular** path field (`storyArtefact`, `reviewArtefact`, etc.) in `pipeline-state.json` — an assumption that was already wrong for the CLI side before this story, and remains a separate, real problem for `ep1-s2`'s own design regardless of this fix (tracked separately — see the "Immediate, separate action item" in this story's Out of Scope).

## Architecture Constraints

- **Purely additive, same low-risk pattern as `das-s1`/`dcuf-s1`:** the existing flat `definition.md`/`review.md` write, Postgres storage, stage-completion tracking (`completedStages`), and story-map panel rendering are all **unchanged** — this story does not touch any of that. It *additionally* splits the same already-produced consolidated artefact into individual files matching `templates/epic.md`, `templates/story.md`, and `templates/review-report.md`, written to disk and committed via the same `dcuf-s1` mechanism (`ownerRepoForFeature` + `commitArtefact`), reused unchanged.
- **Field extraction is genuinely order-independent.** Real definition artefacts (this repo's own production history included) don't reliably put fields in a fixed sequence — a splitter that assumes a fixed neighbour field breaks silently the moment a real session orders them differently. `scanFields()` finds every recognised field's position first, then derives each field's value from the gap to whichever field comes next in *actual* document order.
- **Missing fields degrade gracefully**, filled with the template's own placeholder text (e.g. `"None identified — checked against .github/architecture-guardrails.md"`), never left blank or causing the split to fail — a partially-complete split is far more useful than none.
- **Best-effort, non-blocking:** a parse or write/commit failure in the split step is logged and does **not** block the stage from completing — the flat file (unchanged) already provides a durable, complete record either way.
- **`review` requires a prompt structure change** (grouping findings by story instead of by severity across all stories) since there was no existing per-story boundary to split on — `definition` already had one (`## Epic N` / `### epN-sM`, reused from `daep-s1`'s proven Format-A regex).
- Do not touch `journey.js`, `wsap-s1`'s per-story test-plan/DoR mechanism, or `dcuf-s1`'s own single-file commit logic — all reused/extended, none modified.

## Dependencies

- **Upstream:** `dcuf-s1` (reuses its git-commit mechanism, this session, PR #806), `daep-s1` (reuses its proven Format-A story-boundary regex).
- **Downstream:** The `af17f555` design revision and backfill (this session's separate follow-up work) depend on this story's splitter being correct.

## Acceptance Criteria

**AC1:** Given a `definition` stage completes for a connected-repo journey producing a consolidated `## Epic N` / `### epN-sM` artefact, When the turn finishes, Then the flat `definition.md` is written and committed exactly as before (`dcuf-s1`, unchanged), AND an individual `epics/[epic-slug].md` file per epic and `stories/[story-slug].md` file per story are additionally written to disk and committed.

**AC2:** Given a `review` stage completes producing a consolidated artefact with `## Story: [slug]` sections (the new required structure), When the turn finishes, Then the flat `review.md` is written and committed exactly as before, AND an individual `review/[story-slug]-review-[N].md` file per story is additionally written to disk and committed, with `N` correctly derived from existing files already on disk for that story.

**AC3:** Given real production content whose fields appear in a different order than any one fixed assumption (confirmed against `af17f555`'s own backfilled `definition.md`, which orders `Out of scope → Dependencies → NFR → Architecture Constraints → Complexity`), When split, Then every field (Dependencies, NFR, Architecture Constraints, Out of Scope, Acceptance Criteria) is extracted correctly and completely — not truncated, not swapped, not silently defaulted when real content exists.

**AC4:** Given a product with no connected repo, When a `definition` or `review` stage completes, Then the individual split files are still written to local disk (matching CLI behaviour, which never depended on a repo connection to write files), but `commitArtefact` is never called — no error, no regression, matching `das-s1`'s own AC4.

**AC5:** Given `tests/check-dcuf-s1-github-commit-real-completion-point.js`, `tests/check-das-s1-commit-artefact-git-fallback.js`, `tests/check-daep-s1-format-a-epic-h2-story-h3.js`, `tests/check-wsap-s1-story-scoped-artefact-paths.js`, and `tests/check-srar-s1-idempotent-turn-reconnect.js` (all unmodified), When run against the changed code, Then all still pass — this story adds a new best-effort block after the existing single-file commit, without altering any of their own logic.

## Out of Scope

- **Revising `af17f555`'s own `design.md`/`ep1-s2` to account for multiple artefact paths per stage**, and **backfilling `af17f555`'s own `definition.md`/`review.md` into individual files** — both real, immediate follow-on actions using this story's splitter, tracked and executed as separate work in this same session, not part of this code-change story.
- **Enriching the `definition-of-ready`, `discovery`, `benefit-metric`, or `design` prompts** — none of those stages diverge from the CLI convention; untouched.
- **A fully exhaustive prompt rewrite matching every template comment/example verbatim** — the prompt upgrade adds the specific fields the splitter looks for (Architecture Constraints, Benefit Linkage, epic-level Goal/Oversight/Scope Stability); it does not attempt to reproduce every explanatory comment from `templates/epic.md`/`templates/story.md`.
- **Migrating already-completed stages for any feature other than `af17f555`** — this fix only affects stages completed after it ships; any other pre-existing feature with only a flat `definition.md`/`review.md` is unaffected unless separately backfilled.

## NFRs

- **Performance:** Splitting and writing a handful of small markdown files adds negligible latency to turn completion (same order of magnitude as `dcuf-s1`'s own single extra GitHub API call, already NFR-bounded at ~2s there).
- **Security:** Every new file path is constructed from `slug` + a `toSlug()`-sanitised epic/story identifier and validated against the same `res-s2` path-traversal guard (`resolvedPath.startsWith(repoRoot + path.sep)`) already used elsewhere in this function.
- **Accessibility:** Not applicable.
- **Audit:** Each individual file's GitHub commit is its own audit trail, matching `das-s1`'s existing NFR.

## Complexity Rating

**Rating:** 3 — genuine ambiguity in real-world field ordering required an order-independent parser design (not initially obvious), touching two new parsing modules plus a prompt-structure change for `review`; mitigated by extensive testing against real backfilled production content (`af17f555`'s own `definition.md`) rather than only synthetic fixtures.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description) — short-track, N/A; discovery reference provided instead
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic — short-track, operator confirmed directly in-session, explicitly requesting both this fix and the `af17f555` design revision ("Yes do both 1 and 2")
