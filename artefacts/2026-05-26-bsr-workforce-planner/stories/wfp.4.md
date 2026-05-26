## Story: Extended workforce-map modes — profile-match and net-new gap

**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-reconciliation-engine.md
**Discovery reference:** artefacts/2026-05-26-bsr-workforce-planner/discovery.md
**Benefit-metric reference:** artefacts/2026-05-26-bsr-workforce-planner/benefit-metric.md
**Last revised:** 2026-05-27

**Data model correction applied:** AC1 updated (profile-match now operates at team level first — finds teams whose collective member skills cover all `requiredTags`; individual person matching within a matched team is a secondary drill-down).

## User Story

As a **Head of Engineering**,
I want to find available people whose skills match a required profile for an initiative, and flag initiatives where no matching capacity exists as explicit hiring gaps with role and skill detail,
So that planning conversations are grounded in real available capacity rather than headcount estimates, and hiring requests are specific enough to act on.

## Benefit Linkage

**Metric moved:** M3 (Hiring Gap Specificity Rate) and M2 (Pre-GM Initiative FTE Cross-Check Coverage)
**How:** The net-new mode structurally enforces that every gap entry contains a `role` and required skill tags — not a headcount number. M3 measures whether 100% of gaps have this specificity; this story makes that rate structurally 100% because the skill will not write a gap entry without the required fields. Profile-match entries also count toward M2 pre-GM coverage.

## Architecture Constraints

- Plain Node.js, CommonJS — consistent with all repo scripts (architecture-guardrails.md).
- No external npm dependencies not already in `package.json`.
- Profile-match is tag-intersection only. The operator supplies the required-tags list; the skill does not infer tags from squad composition or any other source. This is explicitly resolved in the discovery artefact.
- Portfolio files (`portfolio/[slug].json`) are read-only — the skill must not write to them.
- Writes all allocation modes (direct, profile-match, net-new) to `workforce/initiative-map.json` in a single invocation. The file is overwritten atomically at the end of the run — it is not appended to between invocations. Running wfp.3 and wfp.4 logic as part of the same `workforce-map` invocation is the expected flow.

## Dependencies

- **Upstream:** wfp.3 (workforce-map core) must be DoD-complete — this story's extended modes run in the same `workforce-map` invocation and write to the same `initiative-map.json` that wfp.3 produces. **Implementation note:** wfp.4 extends the same `workforce-map` script file — it does not produce a separate script. wfp.3 implements direct-allocation processing; wfp.4 adds the profile-match and net-new branches to the same entrypoint. The DoD dependency means wfp.3 code must be merged before wfp.4 development begins, not that they run as separate commands.
- **Downstream:** wfp.7 (dashboard hiring gap view) reads the net-new entries from initiative-map.json.

## Acceptance Criteria

**AC1:** Given an `allocation-input.json` entry for an initiative specifies `allocationMode: "profile-match"` and a `requiredTags` array (e.g. `["java", "platform", "chapter-lead"]`), when I invoke `workforce-map`, then the skill searches `workforce/teams.json` for teams whose collective member skill union covers all required tags (i.e. the union of all `skills` arrays across the team's non-retired roster members contains every tag in `requiredTags`). A team may still be profile-matched to initiative Y even if it appears in a direct-allocation for a different initiative X — cross-initiative allocation is permitted. The initiative entry in `initiative-map.json` is written with `allocationMode: "profile-match"` and an `allocatedTeams` array listing all matching team entries from `teams.json`. For each matched team, an `allocatedPeople` sub-array lists all roster members of that team whose individual `skills` array contains at least one required tag — this is the secondary drill-down, not the primary match criteria. A person who is not already present in the direct-allocation entry for that same initiative in the current invocation may still be profile-matched via a team.

**AC2:** Given a profile-match search for an initiative returns zero matching people (nobody satisfies all required tags or all matches are already allocated), when I invoke `workforce-map`, then the initiative entry in `initiative-map.json` includes `profileMatchResult: "no-match"` and a `hiringGap: true` flag, and the gap report output includes the initiative slug and the required tags that found no match.

**AC3:** Given an `allocation-input.json` entry for an initiative specifies `allocationMode: "net-new"` with a `requiredRole` string and a `requiredTags` array, when I invoke `workforce-map`, then the skill adds an entry to `initiative-map.json` with `allocationMode: "net-new"`, `requiredRole`, `requiredTags`, `computedFTE: 0`, and `hiringGap: true`. No roster search is performed for net-new entries — they are explicitly flagged as capacity that does not exist in current headcount.

**AC4:** Given I run `workforce-map` with a mix of direct (from wfp.3), profile-match, and net-new entries across different initiatives, then `initiative-map.json` contains all entry types correctly per initiative and the `computedFTE` for each initiative counts only direct and profile-match allocations (net-new contributes 0 to FTE count).

**AC5:** Given I run `workforce-map` and at least one net-new entry exists, then the human-readable gap report printed to stdout includes for each net-new gap: the initiative slug, required role, required skill tags, and the text "No current roster capacity — hiring required".

## Out of Scope

- Automatically inferring a required-tags list from a squad's existing skills or portfolio description — the operator always provides the required-tags list explicitly. Auto-inference is out of scope for Phase 1.
- Ranking or scoring profile-match results by match quality — any person satisfying all required tags is a match; no ranking is produced.
- Partial allocation (e.g. person contributing 0.5 FTE to a profile-match initiative) — Phase 1 treats each matched person as 1 FTE.
- Gap closure recommendations (e.g. "hire from external agency X") — out of scope; the skill flags the gap, it does not prescribe a solution.

## NFRs

- **Performance:** Profile-match search across a 200-person roster with up to 20 initiatives completes as part of the overall `workforce-map` run — no separate invocation required; total run time remains under 15 seconds.
- **Security:** No PII beyond person names (which are already in allocation input) is written to stdout or logs.

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
