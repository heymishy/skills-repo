## Test Plan: Fix storyId drift in Web UI DoR/test-plan artefact saves, and prefer the last unambiguous verdict line in review-artefact-splitter

**Story reference:** artefacts/2026-10-08-web-ui-outer-loop-artefact-integrity/stories/wuai-s1-storyid-drift-and-verdict-splitter-fix.md
**Epic reference:** None — short-track
**Test plan author:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`.

**Real architecture grounding (confirmed by direct code read, 2026-10-08):**
- `src/web-ui/routes/skills.js:2384-2390`: `computeArtefactSavePath(slug, skillName, storyId)` — unchanged by this story; a new helper resolves the real `storyId` argument passed into it.
- `src/web-ui/routes/skills.js:2529-2558`: `linkSessionToJourney()` — sets `session.currentStoryId` once; unchanged by this story (left as the fallback).
- `src/web-ui/routes/skills.js:2690-2697` and `:5478-5495`: the two call sites to update, replacing `session.currentStoryId` with the new resolver's return value.
- `src/web-ui/modules/journey-store.js:369-375` (`advanceToNextStory`, confirmed zero call sites outside its own module) and `:383-387` (`setStoryList`, used by the new tests to set up a known `storyList` for validation).
- `src/web-ui/utils/review-artefact-splitter.js:60-68`: `extractVerdict(block)` — the function to change from first-match to last-unambiguous-match.
- `tests/check-srar-s1-idempotent-turn-reconnect.js`'s own `mockRes()`/`_setHtmlSession` harness, and `tests/check-revs-s1-review-artefact-splitter.js`'s existing `splitReviewArtefact` test harness — both extended rather than duplicated.

**E2E/browser-layout detection (Step 3a):** N/A — pure server-side artefact-path resolution and string-parsing logic, no UI.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | storyId resolved from content's Story field when valid | 1 test | — | — | — | — | 🟢 |
| AC2 | Falls back to session.currentStoryId when field absent/invalid | 1 test | — | — | — | — | 🟢 |
| AC3 | No journey linked: unchanged fallback behaviour | 1 test | — | — | — | — | 🟢 |
| AC4 | Splitter returns last unambiguous verdict, not null | 1 test | — | — | — | — | 🟢 |
| AC5 | Single-verdict-line behaviour unchanged | 1 test | — | — | — | — | 🟢 (regression) |
| AC6 | Both lines ambiguous: still returns null, still warns | 1 test | — | — | — | — | 🟢 |
| AC7 | Existing suites pass unmodified | — | — | — | — | — | 🟢 (regression — reruns existing suites unchanged) |

---

## Coverage gaps

None. All 7 ACs are directly, deterministically unit-testable against real exported functions with no external dependencies (no DB, no LLM, no filesystem beyond what the existing harnesses already use).

---

## Test Data Strategy

**Source:** Synthetic — plain mock session/journey objects via the existing `_setHtmlSession`/`createJourney`/`setStoryList` functions already used by sibling test files.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A session linked to a journey with `storyList: ['ep1-s1', 'ep5-s1']`, and artefact content containing `**Story:** ep5-s1` | Synthetic | None | Assert the resolved storyId used in the computed save path is `ep5-s1`, not the session's stale `currentStoryId` of `ep1-s1` |
| AC2 | Same journey, artefact content with no `**Story:**` field (or one saying `**Story:** not-a-real-story`) | Synthetic | None | Assert fallback to `session.currentStoryId` |
| AC3 | A session with `journeyId` unset | Synthetic | None | Assert resolver returns `session.currentStoryId` unconditionally, no journey lookup attempted |
| AC4 | A review block string with two `**Verdict:**` lines: `FAIL (...PASS...)` then `PASS` | Synthetic (inline string) | None | Assert `extractVerdict` / `splitReviewArtefact` resolves to `PASS` |
| AC5 | A review block string with exactly one `**Verdict:** FAIL` line | Synthetic (inline string) | None | Assert unchanged `FAIL` result |
| AC6 | A review block string with two ambiguous `**Verdict:**` lines (both contain FAIL and PASS) | Synthetic (inline string) | None | Assert `null` result and the `review_split_verdict_unparseable` console.warn still fires |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### storyId resolved from artefact content's own Story field

- **Verifies:** AC1
- **Action:** Create a journey via `createJourney`, `setStoryList(journeyId, ['ep1-s1', 'ep5-s1'])`, link a session to it (so `session.currentStoryId` becomes `ep1-s1`), then drive a turn whose model response's ARTEFACT block contains `**Story:** ep5-s1`
- **Expected result:** `session.artefactPath` ends with `ep5-s1-dor.md` (or the relevant suffix), not `ep1-s1-*`
- **Edge case:** No — the core bug reproduction

### Falls back to session.currentStoryId when the field is absent or unknown

- **Verifies:** AC2
- **Action:** Same journey setup; artefact content with no `**Story:**` field, and a second case with `**Story:** not-a-real-story`
- **Expected result:** Both cases resolve to `session.currentStoryId` (`ep1-s1`), unchanged from current behaviour
- **Edge case:** Yes — an unknown/unvalidatable parsed value must not be trusted

### No journey linked: resolver is a no-op

- **Verifies:** AC3
- **Action:** A session with `journeyId` left unset, artefact content containing a `**Story:**` field
- **Expected result:** Resolved storyId is still `session.currentStoryId`'s own value (undefined/whatever was set) — no journey lookup attempted, no behaviour change for standalone/CLI-style sessions
- **Edge case:** No

### Splitter returns the last unambiguous verdict line

- **Verifies:** AC4
- **Action:** Call `splitReviewArtefact` with a block containing `**Verdict:** FAIL (...PASS threshold met...)` followed later by a clean `**Verdict:** PASS`
- **Expected result:** The split result's content has `**Outcome:** PASS`, not `null`/skipped
- **Edge case:** Yes — this is the exact real-world case found on `ep1-s2`

### Single verdict line: unchanged behaviour

- **Verifies:** AC5
- **Action:** Call `splitReviewArtefact` with a block containing exactly one `**Verdict:** FAIL` line
- **Expected result:** Result is `FAIL`, identical to pre-fix behaviour
- **Edge case:** No — regression guard

### Both verdict lines ambiguous: still null, still warns

- **Verifies:** AC6
- **Action:** Call `splitReviewArtefact` with a block containing two lines, each itself containing both "FAIL" and "PASS"
- **Expected result:** No split result is produced for that story; `console.warn` is called with `review_split_verdict_unparseable`
- **Edge case:** Yes — confirms the `asf-s1` fail-safe contract survives this change

### Existing suite regression

- **Verifies:** AC7
- **Action:** Run `node tests/check-srar-s1-idempotent-turn-reconnect.js`, `node tests/check-revs-s1-review-artefact-splitter.js`, `node tests/check-asf-s1-splitter-parity-bugs.js`, `node tests/check-rsc-s1-review-split-coverage.js`, then `npm test`
- **Expected result:** All pre-existing tests pass unmodified; no new failures anywhere else in the suite
- **Edge case:** No
