# Definition of Done: Fix /design and /definition canvas rendering + story-extraction, both broken by the same stale mock fixtures

**PR:** https://github.com/heymishy/skills-repo/pull/613 | **Merged:** 2026-07-26 (commits `dd249930`, `01ebe78d`)
**Story:** artefacts/2026-07-26-canvas-render-and-story-extraction-fix/stories/r-canvas-render-and-story-extraction-fix.md
**Test plan:** not written as a separate artefact — `tests/e2e/design-definition-canvas-render.spec.js` and `tests/check-icrh-s1-ideate-canvas-resume-hydration.js` are the test coverage (retrospective story convention)
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — `/design` session renders its System Architecture diagram | ✅ ALREADY-MET | `tests/e2e/design-definition-canvas-render.spec.js`, first test case | E2E test, real browser/streaming path | None |
| AC2 — `/definition` session renders its Program Design diagram | ✅ ALREADY-MET | Same file, second test case | E2E test | None |
| AC3 — `/definition`'s story list is extractable and the auto-skip-to-review logic can act on it | ⚠️ COMPLETE WITH DEVIATION | See below | Manual verification only at original merge time | Regression test and 400-error investigation deferred to follow-up story `csgc-s1` |
| AC4 — No regression to existing canvas/artefact rendering behaviour | ✅ ALREADY-MET | `check-icrh-s1-ideate-canvas-resume-hydration.js` 15/15 (re-run fresh 2026-08-17, unchanged from the 15/15 cited at merge), `bri-s3.2` journey spec unaffected, `csd-s1`/`csd-s2` specs unaffected, full suite 414 files/38 failed matching documented baseline | Automated test, re-run fresh | None |

**AC3 detail:** at original merge (2026-07-26), `extractStoryIdsFromDefinitionArtefact()` was manually verified (not via an automated test) to correctly find `["mock-fixture.1"]` against the corrected fixture, and a debug check of the real streaming path surfaced an unexplained 400 on `POST /api/journey/:id/gate-confirm` immediately after a real `/definition` turn — never chased to root cause. Both gaps were explicitly self-documented as open in the story's own "Open Questions" section at merge time; neither is a new finding from this DoD pass. This DoD pass created follow-up story `csgc-s1` (`artefacts/2026-08-17-canvas-story-extraction-gate-confirm-gap/`) to close both: AC1/AC2 of `csgc-s1` cover writing the missing regression test, AC3 covers root-causing or explicitly ruling out the 400.

---

## Scope Deviations

**AC3 not fully closed at merge, now tracked via follow-up story.** The story's own text was honest about this at the time (`NEEDS-TESTS` status, explicit Open Questions) — this is not a newly-discovered gap, it is the story's self-documented deviation finally being formally tracked and scheduled for closure via `csgc-s1`, created 2026-08-17 during this DoD pass.

**Outer-loop process deviation (story's own Open Question, self-flagged):** this fix touched real `src/web-ui/` production code but was delivered as a live bug-fix + retrospective rather than through the full discovery → benefit-metric → definition → review chain, or even a pre-implementation DoR. The story itself raises whether the Artefact-first rule's letter wanted a DoR-signed-off story before implementation. Not re-litigated in this pass — consistent with how the parent epic's own follow-up (`csd-s7`) was handled, and how this entire cluster's sibling stories (`alrf-s1`/`s2`/`s4`) were delivered under the same convention.

---

## Test Plan Coverage

**Tests passing:** `design-definition-canvas-render.spec.js` (2/2 E2E scenarios, AC1/AC2), `check-icrh-s1-ideate-canvas-resume-hydration.js` (15/15, re-run fresh 2026-08-17), full suite baseline (414 files, 38 failed, matching documented baseline — not independently re-run in full during this pass, cited as-is from merge-time record).
**Gaps:** AC3's story-extraction regression coverage — tracked via `csgc-s1`, not a gap left open without a plan.

---

## NFR Status

No dedicated NFRs named beyond the correctness ACs above. Story's own "Notes" section identifies a standing process gap worth naming: `tests/e2e/fixtures/llm-gateway/*.success.json` fixtures are the *only* thing staging's `MOCK_LLM_GATEWAY=true` configuration ever exercises for a given skill — no amount of unit-level SKILL.md-instruction-text testing catches a stale fixture. This is a durable observation, not an action item with an owner; noted here for visibility, not converted into a new story in this pass (no concrete recurrence since 2026-07-26).

---

## Metric Signal

**Metrics:** P1 (Time-to-drift-determination), P2 (Diagram completion rate), from `artefacts/2026-07-25-code-shape-diagrams/benefit-metric.md`.
**Status:** AC1/AC2 (the actual diagram-rendering mechanism both metrics depend on) are ALREADY-MET and confirmed via real E2E tests — the metrics are observable again as of this fix, closing the silent-non-functional gap the story's own Benefit Linkage section describes. No fresh metric-value reading taken in this pass (would require live usage data, out of scope for a DoD bookkeeping pass).

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. Follow-up story `csgc-s1` (`artefacts/2026-08-17-canvas-story-extraction-gate-confirm-gap/`) created 2026-08-17 to close AC3's regression-test gap and investigate the gate-confirm 400 — needs `/test-plan` → `/definition-of-ready` → dispatch.
2. The outer-loop process deviation (bug-fix delivered without a pre-implementation DoR) is not being retroactively corrected — noted as an accepted, self-documented deviation consistent with this cluster's established convention.

---

## DoD Observations

1. ~3 weeks live in production, no incidents reported for the ALREADY-MET ACs (AC1/AC2/AC4).
2. This DoD write-up completes the 4-artefact `2026-07-26-canvas-render-and-story-extraction-fix` cluster (this story plus `alrf-s1`/`alrf-s2`/`alrf-s4`, all four DoDs written in this same session pass) and produces exactly one new follow-up story (`csgc-s1`) — the third follow-up story created during this whole backlog pass, alongside `ibg-s1` and `sbrc-s1`.
3. Distinguishing this story's honest self-reported `NEEDS-TESTS` status from a DoD-pass "new finding" mattered here: the right action was to formalize and schedule closure via a story, not to treat it as an emergency or silently mark it COMPLETE without acknowledgment.
