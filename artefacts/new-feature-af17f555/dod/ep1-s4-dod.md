# Definition of Done: ep1-s4 — Stage-Based Skill Routing and Navigation

**PR:** https://github.com/heymishy/skills-repo/pull/810 | **Merged:** 2026-09-01
**Story:** artefacts/new-feature-af17f555/stories/ep1-s4.md
**Test plan:** artefacts/new-feature-af17f555/test-plans/ep1-s4-test-plan.md
**DoR artefact:** artefacts/new-feature-af17f555/dor/ep1-s4-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-02

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — routing table determines next skill; stage selector visible with backward nav, confirm step, forward-nav restricted, keyboard-accessible | ✅ | 23/23 unit/integration tests + 3/3 E2E scenarios passing (local `NODE_ENV=test`) | `tests/check-ep1-s4-stage-routing.js`, `tests/e2e/ep1-s4-stage-selector.spec.js`, CI's staging E2E jobs (Scenario A/B) | None against this story's own scope — see Scope Deviations for a related, disclosed cross-story fix |

---

## Scope Deviations

**Two real bugs found and fixed during implementation, both necessary preconditions for this story's own AC to be achievable — not silently expanded scope, but disclosed here per this repo's convention:**

1. `backfillJourneyFromPipelineState` (`ep1-s3`, PR #808) set `activeSkill` to the *last completed* stage instead of the *next* one — this story's own `getNextSkill` routing function is what makes the fix possible, and the fix is directly required for `getValidBackwardTargets`/the stage selector to show sensible state for a CLI-backfilled journey. Fixed within this PR; `ep1-s3`'s own DoD (already closed) has not been retroactively amended — flagging the cross-reference here instead, per this repo's traceability standard.
2. `journey-disk.js`'s `updateStage()` silently threw for any journey created via the normal `journey-store.js` API, meaning `completedStages` was never actually persisted to disk after journey creation — confirmed empirically, and directly blocking, since this story's stage selector reads exactly that field. Fixed within this PR (`journey-disk.js` defensive init + `journey-store.js`'s `completeStage()` explicit `saveJourney()`).

Neither fix touches behaviour outside what this story's own AC required to be demonstrably true; both are covered by this PR's own test suite (23 tests including a dedicated disk-persistence regression test) and the full local suite (590 files, re-run twice after the shared-module change, 0 new failures both times) and by CI's real-staging E2E scenarios (which exercise real `completeStage()` calls via mock-gateway-driven turns) passing cleanly.

---

## Test Plan Coverage

**Tests from plan implemented:** 23 unit/integration + 3 E2E (test plan speced ~10 unit/integration + 3 E2E; expanded during implementation to cover the two bug fixes above)
**Tests passing in CI:** 23/23 unit + 3/3 E2E (local) + CI's staging E2E scenarios (which exercise the same code paths in a real deployed environment)

| Test area | Implemented | Passing | Notes |
|-----------|-------------|---------|-------|
| `getNextSkill` routing table (all entries + 2 conditional branches) | ✅ | ✅ | |
| `getValidBackwardTargets` | ✅ | ✅ | |
| CLI-backfill `activeSkill` bug fix (+ fallback regression) | ✅ | ✅ | |
| `handleGetStageConfirmBack` confirm interstitial | ✅ | ✅ | |
| Disk-persistence bug fix regression | ✅ | ✅ | |
| E2E Scenario 1 — selector visible, backward nav + confirm | ✅ | ✅ | |
| E2E Scenario 2 — forward nav disabled | ✅ | ✅ | |
| E2E Scenario 3 — keyboard accessibility | ✅ | ✅ | Scoped to what the existing `/test/seed-durable-stage` fixture can produce (single-dot group) — see the spec's own inline note; full multi-dot arrow-key traversal not independently exercised |

**Gaps (tests not implemented):** Multi-dot arrow-key traversal (moving focus between two or more nav dots in the same card) is not independently E2E-tested — the existing test-seeding infrastructure (`/test/seed-durable-stage`) cannot produce one journey with two completed stages in a single call. The handler's own bounds-check logic is unit-covered in spirit (single-dot boundary case, tested), but real multi-dot arrow movement is unverified. Low risk (simple, symmetric array-index logic) but disclosed rather than silently assumed correct.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Routing table deterministic, covers all valid transitions | ✅ | 14 unit tests across every table entry + both conditional branches |
| Backward nav keyboard-accessible | ⚠️ | Tab/Enter fully verified; arrow-key movement verified only for the single-dot boundary case — see Test Plan Coverage gap above |
| No UI block if a prior stage is missing from `completedStages` | ✅ | `getValidBackwardTargets` unit tests cover a gap in `completedStages`; disk-persistence fix ensures this data is now reliably present in the first place |
| Stage selector updates on every skill transition | ✅ | Server-rendered on every `/journey` page load — no client-side caching to go stale |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Web UI Session Start Share | ❌ | Not yet — `ep1-s6` (PostHog instrumentation) has not shipped; no measurement infrastructure exists yet | Signal: not-yet-measured |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. Consider a dedicated E2E test for multi-dot arrow-key traversal once test-seeding infrastructure supports creating a journey with 2+ completed stages in one call (owner: platform team, low priority).
2. Optional: consider whether the disk-persistence bug fix (item 2 under Scope Deviations) warrants its own retrospective story artefact for standalone bug-tracking purposes, given its severity (affected every journey created via the normal API path) and that it predates this session entirely. Not required — already covered by this story's own governed chain — but flagged in case the operator wants a dedicated paper trail.
3. Metric signal will remain `not-yet-measured` until `ep1-s6` ships.

---

## DoD Observations

1. **Severity worth flagging explicitly:** the disk-persistence bug (journey.completedStages never actually reaching disk after the initial journey creation) affected every journey ever created through `journey-store.js`'s normal API — not a narrow edge case. It went undetected because nothing previously depended on `progressDots()` being interactive; this story's own E2E spec is what surfaced it (first attempt: "element not found," traced to root cause via a standalone empirical repro before writing any workaround).
2. Cross-reference: item 1 under Scope Deviations is a fix to `ep1-s3`'s own code. `ep1-s3`'s DoD (already closed, COMPLETE WITH DEVIATIONS) was not retroactively reopened or amended — this DoD's cross-reference is the traceability record instead, consistent with how this repo treats already-closed DoD artefacts (see `wsm.3`/D40's own precedent for not re-opening resolved records).
3. Same `/improve` feedback candidate as `ep1-s1-dod.md`/`ep1-s3-dod.md`: a story's UI-visible AC can depend on a completely different subsystem's data-persistence correctness in ways not discoverable from any artefact — only from reading the actual code paths involved. This is the third time this pattern has surfaced in one epic (`ep1-s1`/`ep1-s3` coupling, now this).

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for ep1-s4 — Stage-Based Skill
Routing and Navigation.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Given this DoD documents fixing bugs in TWO other subsystems (ep1-s3's backfill, and disk persistence), is the cross-story disclosure clear enough for a future reader to find via ep1-s3's own artefacts too?
Report findings as HIGH / MEDIUM / LOW.
```
