## Story: Lockfile structure, pinning, and transparency

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e2-distribution-model.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As a **consumer (Craig, Thomas, or any adopter)**,
I want to **have a lockfile that records exactly which skills I am governed by, at which upstream version, with which content hashes — in a schema-validated JSON format that `verify` can re-check without network access**,
So that **I have a transparent, auditable record of my governance state and I can trust that the skills I run are the skills I pinned**.

## Benefit Linkage

**Metric moved:** M1 — Distribution sync; M2 — Consumer confidence
**How:** The lockfile is the transparency mechanism that makes both M1 and M2 measurable. Without a lockfile, neither heymishy nor the consumer can verify what version of the governance model is in use, and M1 sync success has no objective check. The lockfile is also the primary trust signal for M2 — a consumer who can read the lockfile and see a hash that matches what the assurance gate records has a concrete basis for confidence in the governance model.

## Architecture Constraints

- C5: hash verification is the lockfile's primary purpose — the lockfile must record a content hash for each pinned skill; `verify` must re-compute the hash and compare to the lockfile without the network; a mismatch must produce a named, non-ambiguous error
- MC-CORRECT-02: the lockfile format must be defined as a JSON Schema before the first `init` writes a lockfile; all lockfile fields must match the schema; the CI test suite must validate any lockfile fixture against the schema
- ADR-004: the upstream source URL recorded in the lockfile must match the `skills_upstream.repo` value in context.yml at pin time — the lockfile is a snapshot of the config state, not an override of it
- Spike C output: lockfile field names, schema version, and minimum required fields are specified in the Spike C verdict — this story implements that specification; it does not redesign the lockfile independently

## Dependencies

- **Upstream:** p4.dist-install — the lockfile is written by `init`; p4.spike-c must have a verdict specifying the lockfile schema
- **Downstream:** p4.dist-upgrade depends on reading and writing the lockfile schema (upgrade reads the current lockfile and writes the new one); p4.dist-registry records lockfile version per consumer; p4.dist-migration validates lockfile state post-migration

## Acceptance Criteria

**AC1:** Given `skills-repo init` or `skills-repo pin` completes, When the lockfile is read, Then it contains at minimum these fields (as defined in the Spike C schema): `upstreamSource` (URL string), `pinnedRef` (upstream git ref or tag), `pinnedAt` (ISO 8601 timestamp), `platformVersion` (string), and `skills` (an array where each entry has `skillId`, `skillFile`, and `contentHash` as SHA-256 hex string).

**AC2:** Given a lockfile exists with correct hashes, When `skills-repo verify` runs, Then it re-computes the SHA-256 hash of each skill file listed in the lockfile and compares to the recorded `contentHash` — any mismatch produces an error: "Hash mismatch for skill <skillId>: expected <expected_hash>, got <actual_hash>".

**AC3:** Given two separate `pin` runs against identical upstream content (same ref, same skill files), When the two resulting lockfiles are compared field by field, Then every field except `pinnedAt` is byte-for-byte identical — hash computation is deterministic for identical content and identical inputs.

**AC4:** Given a lockfile with a recorded `contentHash` and the underlying skill file is modified in the sidecar after pinning, When `skills-repo verify` runs, Then verify fails and identifies the specific skill with the tampered hash — verify does not pass on a tampered sidecar.

## Out of Scope

- Lockfile encryption or access control — the lockfile records hashes and metadata, not secrets; consumers who require access control on the lockfile manage it through their own repo settings
- Multiple lockfiles per consumer repo — Phase 4 MVP supports one lockfile per sidecar directory; multi-environment or multi-profile lockfiles are Phase 5
- Lockfile migration tooling (converting from an older lockfile schema version) — if the schema evolves after Phase 4, a migration tool is a Phase 5 concern

## NFRs

- **Security:** Lockfile must not contain API keys, tokens, credentials, or personal data (MC-SEC-02); the hash algorithm is SHA-256 minimum (C5)
- **Correctness:** Schema-first definition enforced by CI test — `check-archive.js` or a dedicated lockfile schema check validates that no `init` or `pin` writes a lockfile that fails the JSON Schema (MC-CORRECT-02)
- **Performance:** `verify` completes within 5 seconds for a typical skill set (all current skills in heymishy/skills-repo); hash computation is synchronous and not network-dependent

## Complexity Rating

**Rating:** 2
**Scope stability:** Unstable — lockfile schema is determined by the Spike C output; if Spike C produces a REDESIGN, the schema fields may differ from the above AC1 minimums

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

---

## Capture Block

### Metadata

| Field | Value |
|-------|-------|
| experiment_id | exp-phase4-sonnet-vs-opus-20260419 |
| model_label | claude-sonnet-4-6 |
| cost_tier | fast |
| skill_name | definition |
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-lockfile.md |
| run_timestamp | 2026-04-19 |

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 14 |
| constraints_inferred_count | 4 |
| intermediates_prescribed | 4 |
| intermediates_produced | 9 |
