## Test Plan: Artefact Resolution and HANDOFF CONTEXT Population

**Story reference:** artefacts/new-feature-af17f555/stories/ep1-s2.md
**Epic reference:** artefacts/new-feature-af17f555/epics/cross-channel-feature-continuity.md
**Test plan author:** Claude Code (agent-authored, operator-directed)
**Date:** 2026-09-01 (original) — **revised 2026-09-02**

> ⚠️ **Revised 2026-09-02.** The original test plan below (targeting a new `resolveArtefacts()` function) is superseded — investigation before `/implementation-plan` found the mechanism already exists (`_KEY_DIRS` disk-scan in `buildSystemPrompt()`, `skills.js` ~line 1946-1982). See `decisions.md` and `stories/ep1-s2.md`'s Revision Note 2. Actual test plan for the real, much smaller change (adding `'epics'` and `'dor'` to `_KEY_DIRS`) is below the superseded content, in the **Revised Test Plan (2026-09-02)** section.

---

## Entry Condition Check ✅

- Story artefact exists: `artefacts/new-feature-af17f555/stories/ep1-s2.md` ✅
- Review report shows PASS: `artefacts/new-feature-af17f555/review/ep1-s2-review-1.md` (0 HIGH, 0 MEDIUM, 1 LOW-mitigated) ✅
- Story has 2 ACs in Given/When/Then format — below the 3-AC convention minimum. Same mitigation as ep1-s1 and the review's own [1-L1] finding: the design artefact (`design.md` Component 2, revised 2026-09-01) supplies the detailed resolution table and process this test plan covers. Proceeding per established precedent for this epic. ⚠️

**Proceeding with test plan for ep1-s2.**

---

## Test Environment and Framework

**Confirmed from `package.json` scripts:** `npm test` runs the Node.js assert-based custom test helper (`tests/unit/test-helper.js`), matching every other story in this feature and this repo's own `tests/check-*.js` convention. No UI-rendering behaviour is described by either AC (pure server-side artefact resolution and HANDOFF CONTEXT construction) — no E2E/Playwright test is required.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, no real data involved

**Mechanism:**
- Mock `fs.readdirSync()` / `fs.readFileSync()` to return synthetic directory listings and file contents for both single-file stages (e.g. `discovery.md`) and multi-file stages (`epics/*.md`, `stories/*.md`, `review/*-review-*.md`)
- Fixture directories mirror this feature's own real layout (`epics/`, `stories/`, `review/`, `test-plans/`, `dor/`) so the tests exercise the exact shape `darc-s1`/`wsap-s1` now produce

**Sensitivity:** None — synthetic test data, no real credentials or PII.

**Data Availability:** Ready — no external dependencies; generated in test setup.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap Type | Risk |
|----|---|---|---|---|---|---|---|
| AC1 | Single-file stages resolve via known path/subdirectory, not a singular `*Artefact` field | 3 | 1 | — | — | None | 🟢 |
| AC2 | Multi-file stages (`definition`, `review`) resolve every file in the directory, not just the first | 4 | 2 | — | — | None | 🟢 |

---

## Unit Tests

### resolveArtefacts returns single file for an unsplit stage
- **Verifies:** AC1
- **Precondition:** Fixture feature with `discovery.md` present, no `epics/`/`stories/`/`review/` directories
- **Action:** Call `resolveArtefacts(featureSlug, 'discovery')`
- **Expected result:** Returns `[{ path: 'artefacts/[feature]/discovery.md', content: '...' }]` — exactly one entry
- **Edge case:** No

### resolveArtefacts never trusts a singular pipeline-state.json `*Artefact` field for a split stage
- **Verifies:** AC1, AC2
- **Precondition:** Fixture `pipeline-state.json` entry includes a (deliberately wrong/absent) `storyArtefact` field alongside a real `stories/` directory with 3 files
- **Action:** Call `resolveArtefacts(featureSlug, 'definition')`
- **Expected result:** Result set is derived from the directory listing (3 files), not from the `storyArtefact` field — proves the singular-field model is not consulted for split stages
- **Edge case:** Yes — this is the exact regression this story exists to prevent

### resolveArtefacts treats a missing directory as zero artefacts, not an error
- **Verifies:** AC1, AC2
- **Precondition:** Fixture feature has not yet reached `review` stage — no `review/` directory exists
- **Action:** Call `resolveArtefacts(featureSlug, 'review')`
- **Expected result:** Returns `[]`, no thrown error
- **Edge case:** Yes

### resolveArtefacts finds every file for a multi-file stage — epics/ and stories/ combined
- **Verifies:** AC2
- **Precondition:** Fixture `epics/` has 1 file, `stories/` has 6 files
- **Action:** Call `resolveArtefacts(featureSlug, 'definition')`
- **Expected result:** Returns 7 entries — 1 epic + 6 stories — not truncated to the first file found
- **Edge case:** No

### resolveArtefacts finds every review run across multiple stories
- **Verifies:** AC2
- **Precondition:** Fixture `review/` contains `ep1-s1-review-1.md`, `ep1-s2-review-1.md`, `ep1-s3-review-2.md` (one story with 2 runs)
- **Action:** Call `resolveArtefacts(featureSlug, 'review')`
- **Expected result:** Returns 3 entries — all runs included, none silently dropped or deduplicated
- **Edge case:** Yes — the multi-run-per-story case

### resolveArtefacts excludes an unreadable file and logs a warning
- **Verifies:** AC1, AC2
- **Precondition:** Fixture directory has 2 valid files and 1 file that throws on read (simulated encoding error)
- **Action:** Call `resolveArtefacts(featureSlug, 'definition')`
- **Expected result:** Returns 2 entries (the readable ones); a warning is logged naming the excluded file; no exception propagates
- **Edge case:** Yes

### resolveArtefacts test-plan/dor stages resolve via story-scoped subdirectory
- **Verifies:** AC1
- **Precondition:** Fixture `test-plans/ep1-s1-test-plan.md` and `dor/ep1-s1-dor.md` exist (the `wsap-s1` convention)
- **Action:** Call `resolveArtefacts(featureSlug, 'test-plan')` and `resolveArtefacts(featureSlug, 'definition-of-ready')`
- **Expected result:** Each returns the one matching file from its subdirectory
- **Edge case:** No

---

## Integration Tests

### HANDOFF CONTEXT is populated end-to-end from a mixed-stage feature
- **Verifies:** AC1, AC2
- **Components involved:** `resolveArtefacts`, `priorArtefacts` mechanism, `buildSystemPrompt()`
- **Precondition:** Fixture feature at `review` stage with real-shaped `discovery.md`, `benefit-metric.md`, `design.md`, `epics/*.md` (1), `stories/*.md` (6), `review/*.md` (6)
- **Action:** Start a session for this feature and inspect the constructed HANDOFF CONTEXT
- **Expected result:** HANDOFF CONTEXT contains all 3 single files plus all 13 split files (1 epic + 6 stories + 6 reviews) — 16 artefacts total, none omitted
- **Edge case:** Yes — this is the exact af17f555 shape this story was written against

### Session still starts when every artefact read fails
- **Verifies:** AC1, AC2
- **Components involved:** `resolveArtefacts`, session start path
- **Precondition:** All fixture reads throw
- **Action:** Start a session for the fixture feature
- **Expected result:** Session starts successfully with empty prior context; no 500 or crash
- **Edge case:** Yes

---

## NFR Tests

### Handoff success rate — no artefact silently dropped when present and readable
- **NFR addressed:** Reliability (feeds Metric 3 — Feature Continuity: Handoff Context Load Success, target ≥98%)
- **Measurement method:** Integration test asserts artefact count returned equals artefact count present on disk across both single-file and multi-file stage fixtures
- **Pass threshold:** 100% of present, readable artefacts returned (test-time deterministic check; production ≥98% is measured via ep1-s6's PostHog instrumentation, out of this story's scope)
- **Tool:** Node.js assert-based test helper

---

## Out of Scope for This Test Plan

- Journey record backfill (ep1-s3) — this plan covers artefact resolution only, not journey creation
- PostHog/logging assertions (ep1-s6) — covered in that story's own test plan
- End-to-end browser rendering of HANDOFF CONTEXT in the chat UI — no AC in this story describes UI rendering; the mechanism under test is server-side artefact construction only

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |

---

*Written 2026-09-01 as part of getting the whole `new-feature-af17f555` feature to DoR-ready level, following the merge of `darc-s1` (PR #807) which fixed the Web UI write-side split this story's read-side resolution depends on.*

---

## Revised Test Plan (2026-09-02)

**Scope:** A 2-item addition to `_KEY_DIRS` in `buildSystemPrompt()` (`src/web-ui/routes/skills.js`) — add `'epics'` and `'dor'`. No new module. See `decisions.md` (2026-09-02) for the full rationale.

### Test Environment and Framework

`npm test` (Node.js assert-based test helper), matching existing tests for this same function — see `tests/check-jcn-s1-journey-page-nav-products.js` for the established `mockReq`/fixture pattern this test will follow. No E2E required — server-side prompt construction only.

### AC Coverage

| AC | Description | Unit/Integration | Risk |
|----|---|---|---|
| AC2 | `epics/*.md` files are now injected into HANDOFF CONTEXT (the one confirmed gap) | 1 | 🟢 |
| AC2 (adjacent) | `dor/*.md` files are now injected (backstop for the CLI-backfill flow's bogus flat `definition-of-ready.md` entry) | 1 | 🟢 |
| AC1, AC2 (regression) | `stories/`, `review/`, `test-plans/`, `verification-scripts/` behaviour unchanged | 1 | 🟢 |

### Tests

**`epics/*.md` is now injected into the FEATURE ARTEFACTS block**
- Precondition: fixture feature directory with one `epics/cross-channel-feature-continuity.md` file, `_featureSlug` set, no matching entry in `priorArtefacts`
- Action: call `buildSystemPrompt()` (or the relevant internal helper directly, whichever `/implementation-plan` scopes as the test seam) for this fixture
- Expected result: the output contains `--- ARTEFACT: artefacts/[slug]/epics/cross-channel-feature-continuity.md ---` followed by the file's content

**`dor/*.md` is now injected into the FEATURE ARTEFACTS block**
- Precondition: fixture feature directory with one `dor/ep1-s1-dor.md` file
- Action: same as above
- Expected result: output contains the corresponding `--- ARTEFACT: .../dor/ep1-s1-dor.md ---` block

**Regression: existing `_KEY_DIRS` entries unaffected**
- Precondition: fixture feature directory with files under `stories/`, `review/`, `test-plans/`, `verification-scripts/`
- Action: same as above, before and after the `_KEY_DIRS` change
- Expected result: identical output for these directories — the addition is purely additive, no existing behaviour changes

### Out of Scope for This Revised Test Plan

- Any test of `priorArtefacts`' own population logic in `journey.js` — unchanged by this story
- Any test of the pre-existing `_KEY_DIRS` mechanism's dedup (`_priorSet`) or gating (`if (_featureSlug)`) logic — already covered by whatever pre-existing tests cover `buildSystemPrompt()`, not re-verified here beyond the regression test above

### Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
