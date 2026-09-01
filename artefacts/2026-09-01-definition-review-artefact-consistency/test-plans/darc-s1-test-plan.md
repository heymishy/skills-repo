## Test Plan: Split the Web UI's consolidated definition and review artefacts into individual files matching the CLI convention

**Story reference:** artefacts/2026-09-01-definition-review-artefact-consistency/stories/darc-s1-split-definition-and-review-into-individual-files.md
**Test plan author:** Claude (agent)
**Date:** 2026-09-01

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Definition stage: flat file unchanged + individual epic/story files written+committed | 3 tests | 1 test | — | — | — | 🟢 |
| AC2 | Review stage: flat file unchanged + individual per-story review file written+committed, run-numbered correctly | 6 tests | 1 test | — | — | — | 🟢 |
| AC3 | Real-world field-order independence (against af17f555's actual content) | 9 tests | — | — | — | — | 🟢 |
| AC4 | Repo-less product: split files written locally, never committed | — | 1 test | — | — | — | 🟢 |
| AC5 | Every prior skills.js/journey.js-touching story's own suite still passes | — | 7 full-file runs | — | — | — | 🟢 |

---

## Coverage gaps

None. The definition splitter is tested directly against real, byte-accurate backfilled production content (`artefacts/new-feature-af17f555/definition.md`, this session's own earlier work) rather than only synthetic fixtures — this is what actually surfaced the field-order-independence requirement (the splitter's first draft assumed a fixed field order that turned out not to match real content).

---

## Unit Tests

### Definition splitter (`tests/check-defs-s1-definition-artefact-splitter.js`)

- **af17f555 fixture extraction:** 1 epic + 6 stories extracted in document order, matching the real production content exactly.
- **Field-order independence:** Dependencies/NFR/Architecture Constraints correctly extracted even though the real fixture orders them differently than the splitter's own first-draft assumption.
- **Out of Scope completeness:** all 4 original bullets present, not truncated.
- **Acceptance Criteria block:** contains the real Given/When/Then text, not a fallback placeholder.
- **Deterministic reference links:** every story references the correct epic/discovery/benefit-metric paths (server-computed, not model-dependent).
- **Epic story list:** epic file lists all 6 stories with correct paths.
- **Graceful degradation:** unrecognised format returns `{epics:[], stories:[]}`, never throws (matches `extractStoryIdsFromDefinitionArtefact`'s own contract).
- **Missing-field fallback:** a minimal story with only Persona/Complexity still produces a complete, non-broken file with placeholder text, never `undefined`/`null` leaking into output.
- **CRLF handling:** CRLF-normalised af17f555 fixture (this repo's own git-checkout line-ending convention) produces identical results to the LF version.

### Review splitter (`tests/check-revs-s1-review-artefact-splitter.js`)

- **Two-story split:** two `## Story:` sections produce two isolated results in document order.
- **Findings isolation:** each story's own findings are correctly isolated, never bled from an adjacent story's section.
- **HIGH findings + FAIL verdict:** correctly captured for a failing story.
- **Run number:** supplied by the caller (disk-based lookup), not hardcoded.
- **Legacy format graceful degradation:** an artefact with no `## Story:` markers (the pre-upgrade flat/severity-grouped format) returns `[]`, never throws.
- **CRLF handling:** CRLF version produces identical results to the LF version.

---

## Integration Tests (`tests/check-defs-revs-s1-wiring-into-turn-completion.js`)

### AC1/AC5: Definition stage completion

- Drive a `definition` turn through `handlePostTurnStreamHtml` for a connected-repo journey with a 2-story consolidated response.
- **Verify:** `commitArtefact` is called for the flat `definition.md` (unchanged `dcuf-s1` behaviour), plus `epics/test-epic.md`, `stories/ep1-s1.md`, `stories/ep1-s2.md`.
- **Verify:** the story file exists on local disk with its real title, not a placeholder.

### AC2/AC5: Review stage completion

- Drive a `review` turn with a 1-story `## Story: ep1-s1` consolidated response.
- **Verify:** `commitArtefact` is called for the flat `review.md` (unchanged), plus `review/ep1-s1-review-1.md` (run number 1, correctly derived from an empty existing directory).
- **Verify:** the review file exists on local disk and records the real PASS verdict.

### AC4: Repo-less product

- Same definition-turn scenario, but the mock DB pool has no matching journey/product row.
- **Verify:** `commitArtefact` is never called.
- **Verify:** the story file is still written to local disk (matches CLI behaviour — file writes never depended on a repo connection).

---

## NFR Tests

- Path-traversal guard reused unchanged from the existing `res-s2` pattern — no new test needed, covered by inspection (every new path is built from the same `slug` + sanitised-slug construction already validated elsewhere in this function).

---

## Out of Scope for This Test Plan

- Live-staging/production re-verification — deferred to the operator's own post-merge smoke check (run `/definition` or `/review` on a real repo-connected feature and confirm the individual files appear on GitHub), following the same pattern used to validate `dcuf-s1` earlier this session.
- The `af17f555`-specific backfill and design revision — separate follow-on work using this splitter, not itself a code change requiring its own test plan.

---

## Test Gaps and Risks

None.
