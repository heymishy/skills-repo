# Definition of Done: Add workspace/state.schema.json and document state file authority model as ADR-016/ADR-017

**PR:** https://github.com/heymishy/skills-repo/pull/247 | **Merged:** 2026-05-02
**Story:** artefacts/2026-05-02-state-file-authority-model/stories/sfa.1-state-file-schema-and-adr.md
**Test plan:** artefacts/2026-05-02-state-file-authority-model/test-plans/sfa.1-test-plan.md
**DoR artefact:** artefacts/2026-05-02-state-file-authority-model/dor/sfa.1-dor.md
**Assessed by:** GitHub Copilot (Claude Sonnet 4.6)
**Date:** 2026-05-02

**Outcome: COMPLETE ✅**

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Schema file exists and validates current state shape | ✅ | `workspace-state-schema-file-exists` + `workspace-state-schema-accepts-current-state-json` both pass on master | Automated: `tests/check-sfa1-state-schema.js` | None |
| AC2 — Schema enforces required top-level fields | ✅ | `workspace-state-schema-requires-current-phase`, `workspace-state-schema-requires-last-updated`, `workspace-state-schema-requires-checkpoint`, `workspace-state-schema-rejects-missing-required-field` all pass | Automated: `tests/check-sfa1-state-schema.js` | None |
| AC3 — ADR-016 documents the two-file authority model | ✅ | `architecture-guardrails-contains-adr-016`, `adr-016-names-pipeline-state-as-delivery-evidence`, `adr-016-names-workspace-state-as-session-state`, `adr-016-states-viz-reads-pipeline-state-only` all pass | Automated: `tests/check-sfa1-state-schema.js` | None |
| AC4 — ADR-017 documents the story-nesting migration path | ✅ | `architecture-guardrails-contains-adr-017`, `adr-017-names-flat-structure-for-new-features`, `adr-017-names-nested-as-legacy-not-migrated` all pass | Automated: `tests/check-sfa1-state-schema.js` | None |
| AC5 — Validation helper callable from /checkpoint skill | ✅ | `checkpoint-skill-references-schema-path` passes; SKILL.md now contains explicit `workspace/state.schema.json` reference and inline node validation command | Automated: `tests/check-sfa1-state-schema.js` | None |
| AC6 — Schema tolerates additional properties | ✅ | `workspace-state-schema-accepts-extra-properties` passes; schema has no `additionalProperties: false` constraint | Automated: `tests/check-sfa1-state-schema.js` | None |

**Deviations:** None

---

## Scope Deviations

None. All changes are within the file touchpoints declared in `sfa.1-dor-contract.md`: `workspace/state.schema.json` (new), `.github/architecture-guardrails.md` (append-only), `.github/skills/checkpoint/SKILL.md` (one-paragraph add), `package.json` (script entries), `tests/check-sfa1-state-schema.js` (new), `CHANGELOG.md` (entry). No files outside the contract were modified.

---

## Test Plan Coverage

**Tests from plan implemented:** 17 / 16 (plan stated 16 minimum; 1 additional NFR test `workspace-state-schema-currentphase-is-string-not-enum` added to cover NFR-SFA1-LIGHTWEIGHT)
**Tests passing in CI:** 17 / 17

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| workspace-state-schema-file-exists | ✅ | ✅ | |
| workspace-state-schema-is-valid-json-schema | ✅ | ✅ | |
| workspace-state-schema-requires-current-phase | ✅ | ✅ | |
| workspace-state-schema-requires-last-updated | ✅ | ✅ | |
| workspace-state-schema-requires-checkpoint | ✅ | ✅ | |
| workspace-state-schema-rejects-missing-required-field | ✅ | ✅ | |
| workspace-state-schema-accepts-current-state-json | ✅ | ✅ | AC1 compat check |
| workspace-state-schema-accepts-extra-properties | ✅ | ✅ | AC6 |
| architecture-guardrails-contains-adr-016 | ✅ | ✅ | |
| adr-016-names-pipeline-state-as-delivery-evidence | ✅ | ✅ | |
| adr-016-names-workspace-state-as-session-state | ✅ | ✅ | |
| adr-016-states-viz-reads-pipeline-state-only | ✅ | ✅ | |
| architecture-guardrails-contains-adr-017 | ✅ | ✅ | |
| adr-017-names-flat-structure-for-new-features | ✅ | ✅ | |
| adr-017-names-nested-as-legacy-not-migrated | ✅ | ✅ | |
| checkpoint-skill-references-schema-path | ✅ | ✅ | AC5 |
| workspace-state-schema-currentphase-is-string-not-enum | ✅ | ✅ | Extra test — NFR-SFA1-LIGHTWEIGHT |

**Gaps:** None. All 16 planned tests implemented; 1 additional NFR test added (non-breaking).

---

## NFR Verification

| NFR | Status | Evidence |
|-----|--------|----------|
| NFR-SFA1-COMPATIBILITY — schema must not reject existing `workspace/state.json` | Met | `workspace-state-schema-accepts-current-state-json` passes; schema has no `additionalProperties: false`; `workspace-state-schema-accepts-extra-properties` passes |
| NFR-SFA1-LIGHTWEIGHT — `currentPhase` must be `"type": "string"` not enum | Met | `workspace-state-schema-currentphase-is-string-not-enum` passes; schema confirmed as `"type": "string"` |
| NFR-SFA1-NODEPS — no new npm dependencies | Met | `package.json` lockfile unchanged; test file uses only Node.js built-ins (`fs`, `path`, `JSON.parse`); schema validation in tests is structural not library-based |

**NFR profile status:** All 3 NFRs verified — `nfr-profile.md` status updated to Verified.

---

## Metric Signal

No formal metrics are defined in the feature's `pipeline-state.json` metrics array. The story description notes this is a baseline-creating story ("this story creates the measurable baseline"). No metric signal to record at this time.

---

## npm test result (post-merge on master)

```
[sfa1-state-schema] Results: 17 passed, 0 failed
```

Pre-existing failures unchanged: 3 `[workspace-state]` failures confirmed present on clean master before this story; not caused by sfa.1.

---

## Summary

**Definition of done: COMPLETE ✅**

ACs satisfied: 6/6
Deviations: None
Test gaps: None
NFRs: 3/3 verified
Metrics: N/A (baseline story, no formal metric defined)
