# Definition of Done: Deterministic story-coverage check on the review-artefact splitter

**PR:** https://github.com/heymishy/skills-repo/pull/930 | **Merged:** 2026-09-29
**Story:** artefacts/2026-09-30-review-split-coverage-check/stories/rsc-s1.md
**Test plan:** artefacts/2026-09-30-review-split-coverage-check/test-plans/rsc-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-30-review-split-coverage-check/dor/rsc-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — gap detection returns missing slugs, in known-list order | ✅ | Confirmed on master post-merge: `node tests/check-rsc-s1-review-split-coverage.js` → 11/11 pass; `computeReviewSplitCoverageGaps` confirmed present in `src/web-ui/utils/review-artefact-splitter.js` | `unit` | None |
| AC2 — no false positives when coverage is complete | ✅ | Same run, AC2 test case | `unit` | None |
| AC3 — fully-missing split returns the full known list | ✅ | Same run, AC3 test case — the exact `web-ui-learnings-and-improvements` scenario | `unit` | None |
| AC4 — wiring: gap logged with correct structured payload | ✅ | Same run, AC4 test case — real `handlePostTurnStreamHtml` turn, real `journeyStore`, mocked LLM response only | `integration-real-code` | None |
| AC5 — wiring: no false alarm when coverage is complete | ✅ | Same run, AC5 test case | `integration-real-code` | None |
| AC6 — wiring: no known list → check skipped cleanly | ✅ | Same run, AC6 test case; also confirms turn still completes (`session.done === true`) | `integration-real-code` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None recorded.

**Verification strength note:** all 6 ACs describe backend logging/comparison behaviour with no browser-observable component — the UI-evidence gate does not apply. AC4–AC6 use `integration-real-code` (a real turn through the real handler and a real in-memory journey store, only the LLM call itself mocked) rather than `unit`, matching this repo's own established convention for this exact wiring path (`check-defs-revs-s1-wiring-into-turn-completion.js`).

---

## Scope Deviations

None. The merged PR is exactly what the DoR contract described: a pure function in `review-artefact-splitter.js` plus a `console.warn`-only wiring point in `skills.js`. No UI surfacing was added (explicitly out of scope), and `splitReviewArtefact`'s own parsing logic was not touched.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6
**Tests passing in CI:** 6 / 6 (11 assertions total across the 6 test cases — some ACs assert multiple fields)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| Gap detection returns missing slugs in known-list order (AC1) | ✅ | ✅ | |
| No false positives, split order-independent (AC2) | ✅ | ✅ | |
| Fully-missing split returns full known list (AC3) | ✅ | ✅ | |
| Wiring logs `review_split_incomplete` on a real gap (AC4) | ✅ | ✅ | 3 assertions: event fires once, `missingStorySlugs` correct, `featureSlug`/`journeyId` correct |
| Wiring logs nothing when complete (AC5) | ✅ | ✅ | |
| Wiring skips cleanly with no known list (AC6) | ✅ | ✅ | 3 assertions: no throw, no warning, turn still completes |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| All 4 categories (Performance/Security/Accessibility/Audit) | ✅ N/A | Story's own NFR section states all 4 as Not Applicable — a small array comparison and a log line, no new input surface, no UI |

---

## Metric Signal

This is a short-track hardening fix, not a metric-tracked feature (no `metrics[]` entries reference `rsc-s1`). No metric signal applicable.

---

## Outcome

**COMPLETE**

---

## DoD Observations

1. **Real test-pollution bug found and fixed within this same story, before merge.** The first version of `tests/check-rsc-s1-review-split-coverage.js` drove real turns through `handlePostTurnStreamHtml` without isolating `COPILOT_REPO_PATH` to a temp directory — the handler's own real, best-effort `git commit` (`stis-s1`) fired for real against the actual `rsc-s1` worktree, committing 3 fixture files (`artefacts/rsc-repro-feature*/review.md`) directly onto the branch. CI's trace validation correctly caught this (`discovery_exists: rsc-repro-feature is missing discovery.md`). Fixed by adding the same `COPILOT_REPO_PATH` temp-dir isolation `check-defs-revs-s1-wiring-into-turn-completion.js` already established; re-confirmed clean (11/11 pass, zero new files in `git status`) both before merge and again just now during this DoD, in the main checkout. **/improve candidate:** any new test that drives `handlePostTurnStreamHtml` or similar real-turn-completion handlers should be checked at `/implementation-review` time for this exact isolation setup — it's easy to copy the wiring-test *shape* from an existing test file while missing this one non-obvious setup line, since the test still passes correctly without it (the bug is a side effect, not a test failure).
2. This story's ACs were designed directly from a live architectural finding during `wuar-s1`'s own implementation (see `wuar-s1`'s DoD Observation 1) rather than from a fresh discovery pass — the user explicitly asked for a "deterministic in code" mechanism rather than trusting the model's own marker-emission compliance, which shaped AC1/AC3's specific framing (comparing against a *known* story list, not just re-parsing the model's output more strictly). No governance concern — flagged here only so `/trace` can see the provenance is a direct user technical question, not a self-generated backlog item.
3. Two `.github/pipeline-state.json` merge conflicts against master were resolved during this story's PR cycle (see `wuar-s1`'s DoD Observation 2 for the full mechanical detail — identical pattern, not repeated here).

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for rsc-s1 (Deterministic
story-coverage check on the review-artefact splitter).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
