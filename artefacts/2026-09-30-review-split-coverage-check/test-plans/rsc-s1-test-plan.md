## Test Plan: Deterministic story-coverage check on the review-artefact splitter

**Story reference:** artefacts/2026-09-30-review-split-coverage-check/stories/rsc-s1.md
**Test plan author:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-30

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Gap detection returns missing slugs, in known-list order | 1 test | — | — | — | — | 🟢 |
| AC2 | No false positives when coverage is complete | 1 test | — | — | — | — | 🟢 |
| AC3 | Fully-missing split returns all known slugs | 1 test | — | — | — | — | 🟢 |
| AC4 | Wiring: gap logged with correct structured payload | — | 1 test | — | — | — | 🟢 |
| AC5 | Wiring: no false alarm when coverage is complete | — | 1 test | — | — | — | 🟢 |
| AC6 | Wiring: no known list → check skipped cleanly | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. The pure function (AC1-AC3) needs no real fs/network; the wiring tests (AC4-AC6) follow the same real-turn-completion pattern already established in `tests/check-defs-revs-s1-wiring-into-turn-completion.js` (mocked LLM stream response, real in-memory session, real journey, asserting on `console.warn` calls / commit-adapter calls).

---

## Test Data Strategy

**Source:** Synthetic — small hand-written story-slug arrays and `splitReviewArtefact`-shaped result arrays for AC1-AC3; a real in-memory journey (`journeyStore.createJourney` + `setStoryList`) and a mocked streaming LLM response for AC4-AC6, matching `check-defs-revs-s1-wiring-into-turn-completion.js`'s own established convention.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | `splitResults` covering 2 of 3 known slugs, in a shuffled order | Synthetic | None | Confirms return order follows the known list, not the split output's own order |
| AC2 | `splitResults` covering all 3 known slugs | Synthetic | None | — |
| AC3 | `splitResults = []`, 3 known slugs | Synthetic | None | The real corruption scenario |
| AC4 | Real journey with `storyList` set to 2 stories; mocked review turn whose response covers only 1 | Real in-memory journeyStore + mocked LLM stream | None | Asserts the exact `console.warn` JSON payload shape |
| AC5 | Same as AC4 but the mocked response covers both stories | Real in-memory journeyStore + mocked LLM stream | None | Confirms no `'review_split_incomplete'` warning fires |
| AC6 | Real journey with `storyList` never set (or empty) | Real in-memory journeyStore + mocked LLM stream | None | Confirms the check is skipped, not treated as "0 known, 0 found → 0 missing" by coincidence — the wiring must not even attempt the comparison when there's no known list to compare against |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Coverage-check returns exactly the missing slugs, in known-list order

- **Verifies:** AC1
- **Precondition:** `splitResults` array covering `ep1-s2` and `ep1-s3` (in that order); known list `['ep1-s1', 'ep1-s2', 'ep1-s3']`
- **Action:** Call the new coverage-check function with `(splitResults, knownList)`
- **Expected result:** Returns `['ep1-s1']`
- **Edge case:** No

### Coverage-check returns empty array when the split fully covers the known list

- **Verifies:** AC2
- **Precondition:** `splitResults` covering all of `['ep1-s3', 'ep1-s1', 'ep1-s2']` (deliberately out of order vs. the known list)
- **Action:** Call the coverage-check function
- **Expected result:** Returns `[]`
- **Edge case:** Yes — split output order must not affect the result

### Coverage-check returns the full known list when the split is entirely empty

- **Verifies:** AC3
- **Precondition:** `splitResults = []`; known list `['ep1-s1', 'ep1-s2', 'ep1-s3']`
- **Action:** Call the coverage-check function
- **Expected result:** Returns `['ep1-s1', 'ep1-s2', 'ep1-s3']` — the real `web-ui-learnings-and-improvements` scenario
- **Edge case:** Yes — this is the story's own primary motivating case

---

## Integration Tests

### Real review-turn completion logs a structured warning when a known story is missing from the split

- **Verifies:** AC4
- **Precondition:** Real journey created via `journeyStore.createJourney`, `setStoryList(journeyId, ['ep1-s1', 'ep1-s2'])`; mocked streaming LLM adapter returns review content containing only `"## Story: ep1-s1"`
- **Action:** Drive a real turn through `handlePostTurnStreamHtml` for `skillName: 'review'`, spying on `console.warn`
- **Expected result:** Exactly one `console.warn` call whose parsed JSON has `event: 'review_split_incomplete'`, `missingStorySlugs: ['ep1-s2']`, and the correct `featureSlug`/`journeyId`
- **Edge case:** No

### Real review-turn completion logs nothing when the split fully covers the known story list

- **Verifies:** AC5
- **Precondition:** Same setup as above, but the mocked response contains `"## Story: ep1-s1"` and `"## Story: ep1-s2"`
- **Action:** Drive the same real turn, spying on `console.warn`
- **Expected result:** No `console.warn` call has `event: 'review_split_incomplete'` in its payload (other unrelated `console.warn` calls, if any, are not asserted against)
- **Edge case:** No

### Real review-turn completion with no known story list skips the check cleanly

- **Verifies:** AC6
- **Precondition:** Real journey created, but `setStoryList` never called (or called with `[]`)
- **Action:** Drive the same real turn, spying on `console.warn`
- **Expected result:** No `console.warn` call has `event: 'review_split_incomplete'` in its payload; the turn completes successfully with no thrown error; the flat `review.md` write is unaffected
- **Edge case:** Yes — must not misinterpret "no known list" as "0 missing out of 0 known" via some coincidental empty-array comparison that happens to also skip correctly for the wrong reason — the wiring itself must gate on the list being present and non-empty before calling the coverage-check function at all

---

## NFR Tests

None — confirmed with story owner. Story's own NFR section states all 4 categories as Not Applicable.

---

## Out of Scope for This Test Plan

- Any UI-visible surfacing of the warning — out of this story's scope entirely (see story's Out of Scope section).
- Any test of `splitReviewArtefact`'s own existing parsing logic — unchanged, already covered by `tests/check-revs-s1-review-artefact-splitter.js` and `tests/check-asf-s1-splitter-parity-bugs.js`.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
