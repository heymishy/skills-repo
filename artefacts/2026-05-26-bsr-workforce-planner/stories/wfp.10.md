## Story: Skill-tag matching for auto-derive allocation mode

**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-reconciliation-engine.md
**Discovery reference:** artefacts/2026-05-26-bsr-workforce-planner/discovery.md
**Benefit-metric reference:** artefacts/2026-05-26-bsr-workforce-planner/benefit-metric.md
**Last revised:** 2026-05-27

**Data model correction applied:** User Story updated (scoring now operates at team level, not squad level); Architecture Constraints updated (`scoreTeamForSlug` replaces `scoreSquadForSlug`; team parameter is a `teams.json` entry; coverage uses union of member skills); all ACs updated — function renamed and scoring logic changed from per-person to team-level union-of-members.

## User Story

As a **Head of Engineering**,
I want `workforce-assign --mode auto` to score candidate teams by skill-tag intersection coverage rather than product-group name matching alone,
So that auto-derived allocation drafts reflect actual capability alignment rather than organisational structure, and the proportion of initiatives that map to a real team before `workforce-map` runs is meaningfully higher.

## Benefit Linkage

**Metric moved:** M2 (Pre-GM Initiative FTE Cross-Check Coverage)
**How:** Product-group name matching (wfp.9 baseline) produces net-new gaps whenever an initiative's `productGroup` does not match a roster squad name exactly — a common case when enterprise fork slugs use initiative-level product group labels that differ from squad-level labels. Skill-tag scoring finds candidate squads by capability coverage regardless of naming alignment, increasing the proportion of initiatives that receive a profile-match entry (rather than a net-new gap) before the operator reviews the draft. Higher pre-review coverage means M2 is measurable sooner and with less manual intervention.

## Architecture Constraints

- Plain Node.js, CommonJS — consistent with all repo scripts (architecture-guardrails.md).
- No external npm dependencies not already in `package.json`. Tag intersection scoring is implemented as pure arithmetic over arrays; no ML or similarity library is required.
- `MIN_COVERAGE_SCORE` threshold is configurable via a top-level constant in `src/workforce/assign.js` (default `0.6`). It is not exposed as a CLI flag in Phase 1 — operator changes the constant directly.
- The `_matchScore` field (a float `0.0–1.0`) is written on every auto-derive entry that goes through tag scoring. Entries produced via product-group fallback (wfp.9 path, no `requiredTags` on the portfolio slug) retain their existing behaviour and do not receive a `_matchScore` field.
- The `_reviewRequired: true` flag from wfp.9 is retained on all auto-derive output regardless of match score. A high `_matchScore` does not remove the review requirement.
- This story extends `src/workforce/assign.js` (introduced in wfp.9). It does not replace or re-implement the product-group matching path — tag scoring is a new code path invoked only when `requiredTags` is present on the portfolio slug.
- The scoring function is named `scoreTeamForSlug(team, requiredTags)` where `team` is a `workforce/teams.json` entry object. Coverage is computed as the intersection of `requiredTags` with the union of all `skills` arrays across the team's non-retired roster members (resolved via `workforce/roster.json`). This function is exported from `src/workforce/assign.js` as a named function. Individual person scoring within a matched team is a secondary drill-down provided by `scorePersonForSlug(person, requiredTags)` — also exported — but is not the primary matching mechanism.

## Dependencies

- **Upstream:** wfp.9 (workforce-assign --mode auto) must be DoD-complete — this story extends the auto-derive path defined there. The `assign.js` module, `--mode auto` CLI entry point, and `_autoderived`/`_reviewRequired` output conventions are all established by wfp.9.
- **Cross-repo dependency (risk):** `portfolio/[slug].json` files must carry a `requiredTags` array field, populated by `initiative-intake` in the enterprise fork. If the enterprise fork has not yet added `requiredTags` to its output schema, auto-derive for those slugs silently falls back to the wfp.9 product-group path. This is not an error — the fallback is explicit and logged. However, the M2 improvement this story targets only materialises once the enterprise fork ships `requiredTags`. This dependency should be tracked as a cross-repo risk at DoR.

## Acceptance Criteria

**AC1 (tag scoring — match above threshold):** Given a portfolio slug has `requiredTags: ["java", "spring", "kafka"]` and a team in `workforce/teams.json` has members whose collective skills union covers "java" and "spring" (coverage score `2/3 = 0.67`), and `MIN_COVERAGE_SCORE` is `0.6`, when I invoke `workforce-assign --mode auto`, then the entry for that slug is written as `allocationMode: "profile-match"` with `teamId` set to the matched team's `teamId`, `_matchScore: 0.67`, and `_reviewRequired: true`.

**AC2 (tag scoring — match below threshold):** Given a portfolio slug has `requiredTags: ["rust", "wasm", "llvm"]` and no team in `workforce/teams.json` covers more than one tag across its collective member skills (max coverage `0.33`), and `MIN_COVERAGE_SCORE` is `0.6`, when I invoke `workforce-assign --mode auto`, then the entry is written as `allocationMode: "net-new"` with `_matchScore: 0.33` and `_reviewRequired: true`. The best-scoring team's `teamId` is included in the entry as `_suggestedTeam` for operator reference.

**AC3 (tag scoring — multiple candidate teams):** Given two teams in `workforce/teams.json` both exceed `MIN_COVERAGE_SCORE` for a portfolio slug, when auto-derive runs, then the team with the higher coverage score is selected. If scores are equal, the team with the larger `members` array count is selected as a tiebreaker.

**AC4 (tag scoring — no requiredTags on slug):** Given a portfolio slug has no `requiredTags` field (or `requiredTags` is an empty array), when auto-derive runs, then the wfp.9 product-group matching path is used for that slug and no `_matchScore` field is written on the resulting entry. The fallback is logged to stdout: "No requiredTags for [slug] — using product-group match."

**AC5 (tag scoring — requiredTags present but roster has no skill tags):** Given `requiredTags` is present on the portfolio slug but no person in `roster.json` has a non-empty `skills` array, when auto-derive runs, then all teams score `0.0`, the entry is written as `allocationMode: "net-new"` with `_matchScore: 0.0`, and a warning is printed: "No skill tags found in roster — populate skills field in roster.json for tag-based matching."

**AC6 (summary output):** Given auto-derive completes with at least one tag-scored entry, when the skill prints its summary, then the output includes a breakdown of tag-scored entries: "Auto-derived [N] direct, [N] profile-match ([N] tag-scored), [N] net-new ([N] below-threshold, [N] no-tags-fallback) entries. Review allocation-input.json before running workforce-map."

## Out of Scope

- Exposing `MIN_COVERAGE_SCORE` as a CLI flag — Phase 1 is constant-only; CLI configurability is a Phase 2 consideration.
- Partial tag scoring for file-import or guided modes — tag scoring applies to auto-derive only.
- Ranking or suggesting multiple candidate teams in the output — the output entry names the single best-scoring team only; the `_suggestedTeam` field in AC2 is for net-new entries only.
- Fuzzy tag matching (e.g. treating "java" and "Java 17" as equivalent) — exact string match only for Phase 1.
- Pulling `requiredTags` from any source other than `portfolio/[slug].json` — no CLI override of portfolio tag data.

## NFRs

- **Performance:** Tag scoring across 30 portfolio slugs and a 200-person roster completes within the wfp.9 auto-derive budget (under 15 seconds total).
- **Correctness:** Coverage score is computed as `coveredTags.length / requiredTags.length` where `coveredTags` is the intersection of `requiredTags` with the union of all `skills` arrays across all non-retired members of the team (resolved via `workforce/roster.json`). Score is `0.0` when `requiredTags` is non-empty and no team member has any matching skill.
- **Observability:** Every tag-scored entry includes `_matchScore` so operators can audit why a team was or was not selected. Net-new entries below threshold include `_suggestedTeam` (best scorer, even if below threshold) so the operator knows which team came closest.

## Complexity Rating

**Rating:** 2
**Rationale:** Single new code path extending an established module; pure arithmetic scoring against team-level skill unions; no new I/O beyond what wfp.9 already reads (teams.json is already a wfp.9 output). The cross-repo dependency adds delivery risk but does not add implementation complexity.
**Scope stability:** Stable — but note the enterprise fork `requiredTags` field as an explicit cross-repo delivery risk. If the enterprise fork does not ship `requiredTags` before this story is implemented, the feature is complete but the M2 improvement will not be measurable until it does.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
