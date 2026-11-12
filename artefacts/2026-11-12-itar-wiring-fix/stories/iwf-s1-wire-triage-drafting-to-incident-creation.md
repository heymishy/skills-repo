## Story: Wire triage drafting to incident creation, so a created incident gets a triage summary

**Epic reference:** None — short-track (bounded wiring fix closing an INCOMPLETE definition-of-done, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery; scope stated directly below. Parent: `artefacts/2026-11-08-incident-triage-and-respond/` (story itar-s2), whose DoD (`dod/itar-s2-triage-drafting-dod.md`) was re-graded INCOMPLETE on 2026-11-12.
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [pipeline-tooling, data]

## User Story

As **a delivery engineer who has just identified a production incident**,
I want **one command that records the incident and immediately attaches a triage summary drawn from similar earlier incidents**,
So that **the triage drafting built in itar-s2 actually runs for real incidents instead of existing only as a function nothing calls**.

## Benefit Linkage

**Metric moved:** None formal — short-track convention. Directly closes the first gap in itar-s2's own definition-of-done: AC1 says triage drafting runs when a record is created, but a repo-wide search found no caller of `draftTriageSummary` outside its own test.
**How:** the search for callers also found that nothing outside tests creates an incident record at all (`createIncidentRecord` and `appendIncidentRecord` have no production caller). So the fix is one entry point that creates the record, stores it and drafts its summary, plus a command-line wrapper a person can run. It also stops the drafter treating the `deferred-item` records now sharing `workspace/incidents.json` as "prior incidents".

## Architecture Constraints

- **Use the shipped modules, do not duplicate them.** The entry point composes `createIncidentRecord`, `appendIncidentRecord` (`scripts/lib/incident-store.js`) and `draftTriageSummary` (`src/modules/triage-drafter.js`). No second matching implementation, no second storage path.
- **Not an injectable adapter.** The entry point calls the real modules directly; there is no `setX()` stub to wire (CLAUDE.md D37 does not apply).
- **Append-only, never truncate.** Existing records in the file are never overwritten or dropped, including the two `deferred-item` records.
- **The incident is stored before it is triaged.** A failure while drafting must never lose the incident record.
- **No tenant data, no credentials.** Not tenant-scoped; ADR-025 does not apply. Free-text `trigger` and `summary` must avoid credentials, per the itar-s1 security NFR.
- **Zero new npm dependencies.**

## Dependencies

- **Upstream:** itar-s1 and itar-s2 (merged, PRs #1065 and #1066), ddft-s1 and dsrf-s1 (merged, so `workspace/incidents.json` exists).
- **Downstream:** itar-s3 (web UI rendering) and itar-s4 (handoff and post-fix confirmation) both read records that this path produces.

## Acceptance Criteria

**AC1:** Given a new incident's trigger, summary and tags, When the entry point `recordIncident` runs, Then it appends one `type: "incident"` record to the target file without disturbing any existing record, runs `draftTriageSummary` on it, and returns the stored record with its `triageSummary` and `priorIncidentLinks` populated (and the same values persisted on disk).

**AC2:** Given a person at a terminal, When they run `node scripts/create-incident.js --trigger <text> --summary <text> --tags <a,b,c>` (with an optional `--file <path>` override), Then the incident is recorded through `recordIncident`, the command prints the new record id and its triage summary, and exits 0; and when required input is missing or the tags exceed the bounded length, it prints a clear error, writes nothing, and exits non-zero.

**AC3:** Given `workspace/incidents.json` holds both `incident` and `deferred-item` records, When a new incident is triaged, Then only records of type `incident` (a record with no `type` counts as `incident`) are candidates for prior-incident links; a `deferred-item` record is never linked or described as a prior incident, even when its tags overlap.

**AC4:** Given the draft step throws after the incident has been stored, When `recordIncident` runs, Then the stored incident record remains on disk with its fields intact and `triageSummary: null`, and the failure is reported to the caller rather than swallowed.

**AC5:** Given two incidents recorded in sequence through the real command with overlapping tags, When the second is created, Then its stored `priorIncidentLinks` contains the first incident's id and its `triageSummary` names that earlier incident, proved end to end through the real command line against a temporary file, and the real `workspace/incidents.json` is never touched by the test.

## Out of Scope

- Pinning `INCIDENT_JACCARD_THRESHOLD` against real data. No real `type: "incident"` record exists anywhere yet, so there is nothing to tune against; the threshold stays provisional and that DoD follow-up stays open.
- Automated alert-to-record creation (initiative 2's integration point) and any Teams-dependent work (on hold).
- Web UI rendering of records (itar-s3) and handoff or post-fix confirmation (itar-s4).
- Changing the scoring algorithm or the summary wording in `triage-drafter.js`, beyond the type filter in AC3.
- Seeding any real incident record. A test incident must never be written to the real file.

## NFRs

- **Security:** No credentials, tenant identifiers or PII are written by the command or the tests. The test never writes to `workspace/incidents.json`.
- **Performance:** None — a read-modify-write of a small JSON file.
- **Correctness:** The end-to-end test (AC5) must go through the real command-line entry point, not call `recordIncident` directly, so an unwired entry point fails it.

## Complexity Rating

**Rating:** 1 — well understood: all the pieces exist and are tested; this composes them behind one entry point and adds a type filter.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic
