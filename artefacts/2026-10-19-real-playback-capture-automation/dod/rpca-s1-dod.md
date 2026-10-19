# Definition of Done: CLI entrypoint authenticates against staging and captures one real screenshot end to end

**PR:** https://github.com/heymishy/skills-repo/pull/1002 (feature) + https://github.com/heymishy/skills-repo/pull/1003 (hotfix, see DoD Observations) | **Merged:** 2026-10-18 (both)
**Story:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s1-cli-entrypoint-and-first-real-capture.md
**Test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-s1-test-plan.md
**DoR artefact:** artefacts/2026-10-19-real-playback-capture-automation/dor/rpca-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session)
**Date:** 2026-10-19

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — real authentication against `wuce-staging` | ✅ | Integration test (mock server) + a real operator-run scenario: retrieved the real secret via `fly ssh console -a wuce-staging` (first waking the suspended machine with a plain HTTP GET), ran the CLI directly, real auth succeeded in ~5-6s with no browser login prompt | `tests/check-rpca-s1-cli-entrypoint-and-first-real-capture.js` (integration) + `live-verified` | None |
| AC2 — real screenshot captured and saved | ✅ | Unit test (path construction) + the same real operator-run scenario: a real 144670-byte PNG saved to the exact expected path, viewed directly and confirmed legible (real sidebar nav, Scope/Benefit card, `fpd-s6`'s own live coverage summary all visible) | unit test + `live-verified` | None |
| AC3 — missing env var fails with a clear error | ✅ | Unit test | unit test | None |
| AC4 — secret value never appears in output | ✅ | Unit test + direct observation from the real run (CLI printed nothing at all on success, so the real secret trivially never appeared) | unit test + `live-verified` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

None across either merged PR. `#1002`'s 6 commits (4 implementation tasks + plan artefact + task-state write) all map to the locked touch points (`scripts/playback-capture.js`, one new test file). `#1003` (the hotfix) touched the same single file plus one new test file, exactly matching its own DoR contract.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4 (`rpca-s1`'s own test plan)
**Tests passing in CI:** 4 / 4; full regression suite 762/762 at `rpca-s1`'s own merge, 763/763 after the hotfix

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC2 (unit): save-path construction | ✅ | ✅ | |
| AC1 (integration): mock-server auth | ✅ | ✅ | |
| AC3 (unit): missing-secret error | ✅ | ✅ | |
| AC4 (unit): no secret leak | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Secrets management (never hardcoded/logged) | ✅ | AC4's own test + real-run observation |
| Authentication (reuses existing route, no widened blast radius) | ✅ | Confirmed at `/clarify`, re-confirmed by the real run |
| Input validation (path-traversal guard on the CLI's own feature-slug argument) | ✅ **— initially missing, found and fixed at this DoD** | Originally committed to in the NFR profile but not implemented in `#1002`. Found during this DoD's own first pass (2026-10-19), fixed via a short-track follow-up (`rpca-s1-hotfix1`, PR #1003, 2 unit tests, merged same day). See DoD Observations below. |
| Audit logging | ✅ (N/A) | No new mutating action against the staging app |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Real capture coverage on new DoD-complete features | ✅ (0%, confirmed) | Not yet | The mechanism is now proven to work for real against a real deployed instance — but this was a deliberate proof exercise against `journey-cx-redesign` (an already-DoD-complete feature), not a new feature reaching DoD and using the mechanism in its own natural workflow. Same reasoning `feature-playback-demo`'s own `fpd-s5` used for its own M1 signal. |
| M2 — Manual capture time per feature | ⚠️ Not yet fully measured | Promising early signal | The real run itself took the operator a few minutes total (secret retrieval + one command), strongly consistent with the ≤5-minute target — but this captured only one AC of one feature, not a full feature's own playback package, so it doesn't yet count as a full M2 measurement. |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None remaining from `rpca-s1` itself — the one real gap found at this DoD (`rpca-s1-hotfix1`) is already fixed and merged, not deferred.

---

## DoD Observations

1. **A real NFR gap was found at this DoD's own first pass, not glossed over.** `rpca-s1`'s own NFR profile committed to following the existing path-traversal guard convention (`web-ui-patterns.md`) for the CLI's own `featureSlug` argument — but the merged `#1002` never actually implemented it. `buildScreenshotPath` interpolated the CLI argument directly into a file path with zero validation. Real-world exploitability was low (a local CLI the operator invokes themselves, not a network-facing route), but it was a genuine deviation from what the story committed to. Fixed same-day via a short-track story (`rpca-s1-hotfix1`, discovery-through-review skipped per CLAUDE.md's own Short-track process, test-plan → DoR → build → PR #1003, merged). **`/improve` candidate:** `/definition`'s own NFR-writing step should perhaps cross-check that a named convention (like a path-traversal guard) is actually implemented before the DoR contract locks the touch points, rather than catching the gap only at DoD.
2. **A real CI infrastructure finding, also resolved same-day:** `rpca-s1-hotfix1`'s own PR (#1003) had its `Scenario A E2E (staging)` check cancelled on first run — not a test failure, but a `deploy-group` concurrency-lock pre-emption (this repo only allows one staging-dependent E2E job to run at a time across the whole repo). Confirmed via `gh run view`'s own cancellation annotation, re-ran cleanly once the contention cleared (2m39s, all green).
3. `rpca-s1`'s own CLI prints nothing at all on success — no confirmation message. None of the 4 ACs require one, so this is not a gap against the story as written, but it's a real usability rough edge, logged in `decisions.md` as a follow-up polish item, not fixed in this story or its hotfix.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for rpca-s1 (CLI entrypoint authenticates against staging and captures one real screenshot end to end).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
