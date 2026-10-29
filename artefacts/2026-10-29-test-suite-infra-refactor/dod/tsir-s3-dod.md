# Definition of Done: Add a structural /review check flagging hand-rolled mockReq on journey.js-touching test files

**PR:** https://github.com/heymishy/skills-repo/pull/1040 | **Merged:** 2026-10-29
**Story:** artefacts/2026-10-29-test-suite-infra-refactor/stories/tsir-s3-structural-review-check-fixture-usage.md
**Test plan:** artefacts/2026-10-29-test-suite-infra-refactor/test-plans/tsir-s3-structural-review-check-fixture-usage-test-plan.md
**DoR artefact:** artefacts/2026-10-29-test-suite-infra-refactor/dor/tsir-s3-dor.md
**Assessed by:** Claude Sonnet 5
**Date:** 2026-10-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `scanFileForHandRolledFixture('tests/fixtures/tsir-s3-hand-rolled-mockreq.js')` returns a non-empty finding naming the file and `tests/helpers/journey-fixture.js` as the fix (`tests/check-tsir-s3-journey-fixture-usage-check.js`) | `unit` | None |
| AC2 | ✅ | `scanFileForHandRolledFixture('tests/fixtures/tsir-s3-shared-fixture-usage.js')` returns `[]` | `unit` | None |
| AC3 | ✅ | `skills/review/SKILL.md` source references `check-journey-fixture-usage.js` and contains a distinct "### Category F: Journey.js fixture hygiene" heading — not folded into an existing category's prose | `integration-real-code` (real `SKILL.md` source, not mocked) | None |
| AC4 | ✅ | Mutation-test, fully automated: temp copy of the AC1 fixture checked (fails, non-zero), edited in place to use `journeyFixture(...)`, re-checked (passes, exit 0) — proving the signal tracks the real pattern, not a cached answer (`tests/check-tsir-s3-journey-fixture-usage-check.js`) | `unit` (mutation-test, per `.github/standards/testing/test-design-patterns.md`) | None |

**UI-evidence gate:** N/A — no AC in this story describes browser-observable behaviour (a CLI check script plus a SKILL.md text wiring).

**Verification strength mismatch check:** AC3's claim is about `/review`'s own documented flow, not an external/live system — `integration-real-code` evidence (reading the real edited `SKILL.md` source) is the correct and sufficient class; no live-verified or production-observed tier is needed here.

---

## Scope Deviations

None. PR #1040's file list (`.github/pipeline-state.json`, `artefacts/2026-10-29-test-suite-infra-refactor/plans/tsir-s3-plan.md`, `scripts/check-journey-fixture-usage.js`, `skills/review/SKILL.md`, `tests/check-rssp-s1-review-skill-no-selection-prompts.js`, `tests/check-tsir-s3-journey-fixture-usage-check.js`, `tests/fixtures/tsir-s3-hand-rolled-mockreq.js`, `tests/fixtures/tsir-s3-shared-fixture-usage.js`) touches nothing from the story's or epic's out-of-scope sections — no `/definition-of-ready` hard-block promotion, no extension to `skills.js`/`products.js`/`journeys.js` consumers. The `check-rssp-s1-...` edit is an in-scope consequence of AC3's own category-count change (see DoD Observations below), not a scope expansion.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4 coded Unit/Integration tests (AC1–AC4).
**Tests passing in CI:** 4 / 4 (confirmed via PR #1040's CI checks, and re-confirmed by a fresh standalone run of `node tests/check-tsir-s3-journey-fixture-usage-check.js` at this DoD: 4 passed, 0 failed)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: flags hand-rolled mockReq | ✅ | ✅ | |
| AC2: passes shared-fixture usage | ✅ | ✅ | |
| AC4: mutation-test flip (fail→pass) | ✅ | ✅ | Fully automated, unlike `tsir-s2`'s AC2 |
| AC3: wired into `/review` as Category F | ✅ | ✅ | |
| NFR: no network/DB calls in script source | ⚠️ not coded as a standing test | ✅ verified manually at this DoD | See gap note below |

**Gaps (tests not implemented):** The test plan's own "NFR Tests" section described a dedicated source-text assertion that `scripts/check-journey-fixture-usage.js` contains no `require('http'/'https')` and no DB/connection-pool usage. This specific test was not coded as a standing assertion in `tests/check-tsir-s3-journey-fixture-usage-check.js`. Verified manually at this DoD by reading the script's source directly: only `fs` and `path` are required, and the scan is a synchronous `fs.readFileSync` + regex match — no network or DB access exists. **RISK-ACCEPT (recorded here, not separately in `decisions.md` — low severity, single-file script, same minimal-surface pattern as the precedent `check-design-tokens.js`):** accept the gap as-is rather than reopening the PR for a one-line structural test; if this script grows additional logic in a future story, add the standing test at that point.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — check completes well under 1 second per file | ✅ | Synchronous single-file read + regex match, no network/DB access (confirmed by source inspection at this DoD; same precedent as `check-design-tokens.js`) |
| Security — reads local file content only | ✅ | Script only requires `fs`/`path`; same threat model as the existing `check-design-tokens.js` precedent |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Fixture duplication (m1) | ✅ (17/42, audit-confirmed) | Not yet — the structural measurement mechanism (`check-journey-fixture-usage.js`) itself just shipped in this story; it has not yet been run against a new `journey.js`-touching consumer story to produce a first real measurement | not-yet-measured |
| Adoption (m3) | ✅ (0/42 baseline) | Not yet — same reason as m1: the enforcement mechanism exists now, but no new consumer story has been through `/review` with it yet | not-yet-measured |

**Fixture duplication (m1):**
Signal: not-yet-measured
Evidence note: `tsir-s3` shipped the structural measurement mechanism itself (`check-journey-fixture-usage.js`, wired into `/review` Category F) — the mechanism to measure this metric now exists, but it has not yet been exercised against a new `journey.js`-touching consumer story, so there is no first real signal yet.
Date measured: null

**Adoption (m3):**
Signal: not-yet-measured
Evidence note: Same reason as m1 — the enforcement mechanism (`/review` Category F) just shipped; the first adoption signal requires a future `journey.js`-touching story to pass (or fail and fix) through it.
Date measured: null

(`tsir-s3` is not listed in `m2`'s `contributingStories` — no signal assessment required for that metric at this story's DoD.)

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None blocking. One minor non-blocking item carried forward informally (not a tracked follow-up story): the next `journey.js`-touching consumer story will be the first real test of this epic's enforcement mechanism end-to-end (both `/review` Category F firing correctly in a live story, and the first non-`not-yet-measured` signal for m1/m3).

---

## DoD Observations

1. **Feature-completion check:** This is the third and final story in the `test-suite-infra-refactor` epic's walking-skeleton sequence. All 3 stories (`tsir-s1`, `tsir-s2`, `tsir-s3`) now show `dodStatus: "complete"` — epic `status` updated to `"complete"` as part of this DoD's state write (see below).
2. **A real, expected consequence was found and fixed during implementation, not at this DoD:** adding Category F changed `/review`'s own category count from 5 to 6, which broke a pre-existing test (`tests/check-rssp-s1-review-skill-no-selection-prompts.js`) that hardcoded the literal string "all 5 categories". Already fixed in PR #1040 by making the assertion count-agnostic (`all \d+ categories`) — re-confirmed passing at this DoD.
3. All three metrics (m1, m2, m3) in this feature remain `not-yet-measured` at epic completion. This is expected and was anticipated in `benefit-metric.md`'s own minimum validation signal (a window of the next 3 `journey.js`-touching *consumer* stories) — this epic delivered only the infrastructure (fixture module, self-test, enforcement mechanism), not any consumer-facing story that would generate a first real signal. Flagging this explicitly so a future `/trace` or `/improve` run does not mistake "epic complete" for "benefit realized."

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Add a structural /review check flagging hand-rolled mockReq on journey.js-touching test files" (tsir-s3).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Is the NFR test gap (no dedicated no-network-call test) reasonably RISK-ACCEPTed, or should it block?
4. Does the metric signal row name a real measurement event, or just say "TBD"?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Is the epic-completion observation (all 3 metrics still not-yet-measured) an acceptable state to close the epic on, given this was an infrastructure-only walking skeleton?
Report findings as HIGH / MEDIUM / LOW.
```
