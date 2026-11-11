## Story: Persist the two seeded deferred-item records that ddft-s1 promised but never shipped

**Epic reference:** None — short-track (bounded data fix closing an INCOMPLETE definition-of-done, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery; scope stated directly below. Parent: `artefacts/2026-11-08-deferred-decision-follow-through/` (story ddft-s1), whose DoD (`dod/ddft-s1-deferred-item-record-mechanism-dod.md`) was re-graded INCOMPLETE on 2026-11-12.
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [pipeline-tooling, data]

## User Story

As **a platform maintainer relying on the deferred-decision-follow-through epic**,
I want **the two real deferred items that ddft-s1 was written around, the unfixed `tfhc-s1` integrity failure and the C1-versus-Option-C distribution contradiction, to exist as real persisted records in `workspace/incidents.json`**,
So that **the epic's first metric, "both seeded real cases exist as structured records", is actually met on master instead of being proven only against temporary files, and the later stories in the epic have real data to build on**.

## Benefit Linkage

**Metric moved:** None formal — short-track convention. Directly closes the unmet binary target of ddft-s1's own benefit linkage (both seeded cases exist as structured, correctly-typed records), found at its definition-of-done on 2026-11-12.
**How:** ddft-s1 shipped the mechanism that can create `deferred-item` records and tested it only against temp files, so zero records are persisted: `workspace/incidents.json` does not exist on master and is not tracked in git. This story writes the two real records and adds a read-only check that fails if they are ever missing.

## Architecture Constraints

- **Use the shipped mechanism, do not bypass it.** Records are built with `createDeferredItemRecord` and persisted with `appendIncidentRecord` from `scripts/lib/incident-store.js`, so they pass the same `validateRecord` check (`source` is required) any future record will.
- **Real data, not synthetic.** The `tfhc-s1` record states the real, currently-failing check (`scripts/check-pipeline-state-integrity.js` rule C3: `testPlan.passing (4) < testPlan.totalTests (5)` with `prStatus: merged`). The contradiction record uses the real text logged in `workspace/capture-log.md` on 2026-11-08 and the real logged deferral as its `revisitCondition`.
- **The new check is read-only.** The ddft-s1 test plan's "never mutates the real file" constraint is what caused its tests to use temp files and prove nothing about the real file. The check added here reads the committed `workspace/incidents.json` and never writes to it.
- **No tenant data, no secrets.** The records hold pipeline-tooling facts only. Not tenant-scoped; ADR-025 does not apply.
- **Zero new npm dependencies.**

## Dependencies

- **Upstream:** ddft-s1's merged `incident-store.js` mechanism (PR #1067). Nothing else.
- **Downstream:** itar-s2's follow-up (pinning the Jaccard threshold against real tag data) and the later ddft stories (ddft-s2 to ddft-s5) all want real records in this file. Note the itar-s1 story (already DoD-complete) names `workspace/incidents.json` as one of its own deliverables and also never shipped it; this story creates the file but does not retroactively fix itar-s1's DoD, which is logged separately.

## Acceptance Criteria

**AC1:** Given `workspace/incidents.json` does not exist on master, When this story is merged, Then the file exists, is tracked in git, and parses as a JSON array.

**AC2:** Given the real unfixed `tfhc-s1` finding, When the file is read, Then it contains exactly one record with `type: "deferred-item"`, `source: "risk-accept"`, `linkedFeature: "2026-10-30-test-fixture-hardening-continuation"`, `linkedStory: "tfhc-s1"`, a `summary` stating the real C3 failure, and a `revisitCondition` naming what would need to be true to act on it (the story's `testPlan.passing` corrected to the confirmed count, or the C3 check changed).

**AC3:** Given the real C1-versus-Option-C contradiction logged in `workspace/capture-log.md` on 2026-11-08, When the file is read, Then it contains exactly one record with `type: "deferred-item"`, `source: "backlog-thread"`, a `summary` stating the contradiction between `.github/architecture-guardrails.md` constraint C1 and `skills/bootstrap/SKILL.md` Option C, and a `revisitCondition` of "deferred to a broader `product/` refresh later".

**AC4:** Given the committed `workspace/incidents.json`, When the repo's test suite runs, Then a read-only check reads that real file (not a temp file) and fails if either record is missing, duplicated, or typed anything other than `deferred-item`.

**AC5:** Given the two new records, When the existing loaders (`loadRecords`, `loadIncidentRecords`) read the file, Then they return both records without error and no record of `type: "incident"` is introduced.

## Out of Scope

- Fixing the `tfhc-s1` integrity failure itself, or changing the C3 check. This story only records that it is deferred.
- Resolving the C1-versus-Option-C contradiction. Same: record only.
- Changing the ddft-s1 mechanism (`incident-store.js`).
- Wiring `draftTriageSummary` or tuning the itar-s2 Jaccard threshold. Separate story.
- Correcting itar-s1's DoD for the same missing data file. Logged separately for the operator to decide.
- Any Teams-dependent work (on hold, see `workspace/state.json` pendingActions).

## NFRs

- **Security:** No credentials, tenant identifiers or PII in the records.
- **Performance:** None — two records in a small JSON file. The file-fetch-at-scale concern in the incident-triage `nfr-profile.md` is unchanged and not addressed here.
- **Correctness:** The check in AC4 must read the real committed file, so a deleted or emptied file fails CI instead of passing silently.

## Complexity Rating

**Rating:** 1 — well understood: the mechanism exists and is tested; this is two records plus one read-only check.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic
