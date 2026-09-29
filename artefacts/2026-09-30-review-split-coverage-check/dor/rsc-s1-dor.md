# Definition of Ready: Deterministic story-coverage check on the review-artefact splitter

**Story reference:** artefacts/2026-09-30-review-split-coverage-check/stories/rsc-s1.md
**Test plan reference:** artefacts/2026-09-30-review-split-coverage-check/test-plans/rsc-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-30

---

## Contract Proposal

**What will be built:**
1. `src/web-ui/utils/review-artefact-splitter.js`: a new pure function (e.g. `computeReviewSplitCoverageGaps(splitResults, knownStorySlugs)`) returning the known-list story slugs absent from `splitResults`, in known-list order. Exported alongside `splitReviewArtefact`.
2. `src/web-ui/routes/skills.js`: after the existing per-story-file write loop in the `session.skillName === 'review'` branch (~line 5584-5608), read `_journeyStore.getJourney(session.journeyId).storyList`; when present and non-empty, call the new function and `console.warn` a structured `{event: 'review_split_incomplete', featureSlug, journeyId, missingStorySlugs, foundStorySlugs}` payload when the result is non-empty.

**What will NOT be built:**
No UI-visible surfacing of the warning. No change to `splitReviewArtefact`'s own parsing logic. No blocking of stage completion. No retroactive audit of other features.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Direct function call with a shuffled-order split result | Unit |
| AC2 | Direct function call with full coverage | Unit |
| AC3 | Direct function call with an empty split result | Unit |
| AC4 | Real turn completion, spy on `console.warn` | Integration |
| AC5 | Real turn completion, spy on `console.warn` | Integration |
| AC6 | Real turn completion, no known story list, spy on `console.warn` | Integration |

**Assumptions:**
`journey.storyList` (not `journey.stories`, confirmed dead code via the earlier `wsap-s2` investigation) is the correct, real field to read. The wiring point sits inside the existing `if (session.skillName === 'review')` branch, itself inside the existing `if (!_existingStageEntry)` first-completion guard — this story does not change when the check runs relative to existing logic, only adds a comparison after the existing split-write loop completes.

**Estimated touch points:**
Files: `src/web-ui/utils/review-artefact-splitter.js` (~20 lines added), `src/web-ui/routes/skills.js` (~10 lines added), `tests/check-rsc-s1-review-split-coverage.js` (new).
Services: None new.
APIs: None new.

## Contract Review

✅ **Contract review passed** — proposed implementation directly satisfies AC1–AC6; no mismatch between the contract and the stated ACs or test plan.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is As/Want/So with a named persona | ✅ | "platform owner running a /review session through the deployed web UI" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 6 ACs |
| H3 | Every AC has ≥1 test in the test plan | ✅ | 6/6 tests, 0 gaps |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage names a metric | ✅ N/A-adapted | Short-track hardening fix, not a metric-tracked feature — benefit linkage instead cites the exact real gap (wuar-s1's own decisions.md Decision 1) this fix directly closes |
| H6 | Complexity rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — no review ran by design |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: "None" — schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Names the exact real module/function and wiring point, cites the existing non-blocking design intent it preserves |
| H-E2E | CSS-layout-dependent gap without E2E/RISK-ACCEPT | ✅ N/A | No layout-dependent ACs — backend logging only |
| H-NFR | NFR profile exists | ✅ N/A | Story's own NFR section states all 4 categories Not Applicable |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No NFR profile required (see H-NFR) |
| H-NFR-profile | NFR profile presence | ✅ N/A | Story's own NFR section is Not Applicable for all 4 |
| H-GOV | Governance approval (discovery `## Approved By`) | ✅ N/A | Short-track skips `/discovery` by design — satisfied via the operator's own direct in-session instruction to scope this as a new short-track story after the review-split fragility question was raised live. Same pattern as `gcw-s1`, `jasb-s1`, `jgls-s1`, `asa-s1`, `wuar-s1`. |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No injectable adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |
| H-DESIGN | Design-token compliance | ✅ N/A | `hasDesignSystemTrack` not set |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | Short-track — no review ran | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ RISK-ACCEPT | Pure function + a single new log line in an already-well-tested wiring path (the same `session.skillName === 'review'` block `defs-revs-s1`/`asf-s1` already cover); low risk surface | Operator directed this fix directly following a live question about the splitter's reliance on model-emitted markers; logged in this story's own decisions.md follow-up note |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table: None | — |

---

## Standards Injection

Story has no `domain` field — skipped silently.

---

## Oversight Level

**Oversight:** Low — an additive, non-blocking logging check on an already-shipped, well-tested mechanism.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Deterministic story-coverage check on the review-artefact splitter
Story artefact: artefacts/2026-09-30-review-split-coverage-check/stories/rsc-s1.md
Test plan: artefacts/2026-09-30-review-split-coverage-check/test-plans/rsc-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- src/web-ui/utils/review-artefact-splitter.js: add a pure function
  (suggested name: computeReviewSplitCoverageGaps(splitResults,
  knownStorySlugs)) that returns the knownStorySlugs entries with no
  matching storySlug in splitResults, in knownStorySlugs's own order.
  Export it alongside splitReviewArtefact. Do NOT change
  splitReviewArtefact's own parsing/extraction logic.
- src/web-ui/routes/skills.js: in the streaming turn handler's
  `session.skillName === 'review'` branch, immediately after the existing
  per-story-file write loop (the `for (var _ri = 0; ...)` loop), read
  _journeyStore.getJourney(session.journeyId).storyList. When it is a
  non-empty array, call computeReviewSplitCoverageGaps(_revSplit,
  storyList) and, if the result is non-empty, console.warn a JSON payload:
  {event: 'review_split_incomplete', featureSlug: slug, journeyId:
  session.journeyId, missingStorySlugs: <result>, foundStorySlugs:
  _revSplit.map(r => r.storySlug)}. When storyList is absent or empty,
  skip the check entirely -- do not call the function with an empty
  known-list array and rely on it coincidentally returning [].
- Do NOT block stage completion, throw, or change any existing return
  value/control flow based on the check's result -- log only.
- New test file tests/check-rsc-s1-review-split-coverage.js covering all
  6 ACs. Follow tests/check-defs-revs-s1-wiring-into-turn-completion.js's
  own established pattern for the AC4-AC6 wiring tests (real journeyStore,
  mocked streaming LLM adapter, spy on console.warn).
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests, add a PR
  comment describing the specific blocker and stop -- do not improvise.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight, DoR PROCEED: Yes)
