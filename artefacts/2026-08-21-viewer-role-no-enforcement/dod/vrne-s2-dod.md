# Definition of Done: Wire the viewer-write-block gate to Skill session routes

**PR:** https://github.com/heymishy/skills-repo/pull/757 | **Merged:** 2026-08-23
**Story:** artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s2-skill-sessions.md
**Test plan:** artefacts/2026-08-21-viewer-role-no-enforcement/test-plans/vrne-s2-test-plan.md
**DoR artefact:** artefacts/2026-08-21-viewer-role-no-enforcement/dor/vrne-s2-dor.md
**Assessed by:** Claude (agent) + Hamish King (Founder/Operator)
**Date:** 2026-08-23

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | 2/2 session-start call sites (form + JSON path) return 403 for a viewer-role session | `tests/check-vrne-s2-skill-session-gate.js` (AC1 unit tests) | None |
| AC2 | ✅ | 4/4 turn/turn-stream/answers/answer call sites return 403; gate confirmed placed before `creditsGuard`/model dispatch (no cost incurred) | `tests/check-vrne-s2-skill-session-gate.js` (AC2 unit tests), final reviewer's live-code read | None |
| AC3 | ✅ | 3/3 commit-form/commit-json/execute call sites return 403 | `tests/check-vrne-s2-skill-session-gate.js` (AC3 unit tests) | None |
| AC4 | ✅ | `engineer`/`product`/`admin` roles proceed with no regression on 3 representative routes | `tests/check-vrne-s2-skill-session-gate.js` (AC4 regression tests) | None |
| AC5 | ✅ | 2/2 canvas-edit/assumption-confirm call sites return 403 | `tests/check-vrne-s2-skill-session-gate.js` (AC5 unit tests) + real `router()`-dispatch integration test | None |
| AC6 | ✅ | Denial logged with `personId`, `tenantId`, `timestamp`, `route` | `tests/check-vrne-s2-skill-session-gate.js` (AC6 unit test), observed firing correctly in all 3 real-dispatch integration tests | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

No deviations. All 6 ACs shipped exactly as written — unlike `vrne-s1`, this story's ACs did not need a role-enumeration correction, since AC4's regression-guard text ("engineer/product/admin roles unaffected") never claimed to be an exhaustive role list the way `vrne-s1`'s AC4 did.

---

## Scope Deviations

None. Test coverage was extended beyond the written test plan (16 planned → 18 shipped: +1 Pattern-B real-dispatch integration test, +1 AC5-specific real-dispatch integration test) — this is additive coverage, not a scope deviation, and is fully documented in `decisions.md`'s 2026-08-23 entries (the AC5 extension was driven by a code-quality review flagging that AC5's own NFR-designated "highest-value security gate" routes had no real-dispatch proof in the original 2-test plan).

---

## Test Plan Coverage

**Tests from plan implemented:** 18 / 18 (16 planned + 2 added during implementation, both logged in `decisions.md`)
**Tests passing in CI:** 18 / 18, plus full suite 536/536 files passing on PR #757's final CI run

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 — 2 session-start tests | ✅ | ✅ | `tests/check-vrne-s2-skill-session-gate.js` |
| AC2 — 4 turn/turn-stream/answers/answer tests | ✅ | ✅ | Gate ordering (before `creditsGuard`) verified by final reviewer |
| AC3 — 3 commit/execute tests | ✅ | ✅ | |
| AC4 — 3 non-viewer regression tests | ✅ | ✅ | |
| AC5 — 2 canvas-edit/assumption-confirm tests | ✅ | ✅ | |
| AC6 — 1 denial-logging test | ✅ | ✅ | |
| Integration — 3 real `server.js` dispatch tests (Pattern A `/turn`, Pattern B `/answers`, AC5 `/canvas-edit`) | ✅ | ✅ | Original plan had 2; a 3rd (AC5) was added mid-story — see Scope Deviations |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no new query pattern beyond `vrne-s1`'s existing adapter call | ✅ | Reuses `requireNonViewer`/`resolveRole` unmodified |
| Security — deny by default; this story's own NFR names AC5 (canvas-edit/assumption-confirm) "the highest-value security gate in the epic," since a viewer could otherwise drive real LLM cost or produce real governed artefacts | ✅ | All 11 call sites gated; AC5 given real-dispatch proof beyond the original plan specifically because of this NFR framing |
| Audit — every denial logged with person ID, tenant ID, timestamp, route | ✅ | AC6 test + observed in integration test console output |
| Data residency | N/A | No new persisted data |
| Availability | N/A | Synchronous in-process check |
| Accessibility | N/A | Server-side authorization change, no UI surface |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 (Metric 1 — Viewer role actually enforces read-only access) | ✅ | 2026-08-23 | Now 44/44 routes enforced across Products + Features/journeys (33, `vrne-s1`) + Skill sessions (11, `vrne-s2`). Epic-wide target (all 5 route groups) not yet reached — `vrne-s3`/`vrne-s4` still pending. Signal: **on-track**. |
| M2 (Metric 2 — Enumerated viewer-role write actions blocked, Tier 3 risk-reduction) | ✅ | 2026-08-23 | Same evidence as M1: 44 of the epic's total enumerated routes now enforced. Epic-wide target of 0 remaining unenforced routes not yet reached. Signal: **on-track**. |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required for this story. Epic-level follow-up: `vrne-s3` (Credits/billing) and `vrne-s4` (edge cases) remain at DoR-signed-off, not yet started.

---

## DoD Observations

1. **This story served as the first real post-fix measurement of the `loop-design.md` process-optimization pass (PR #756).** All 4 Tier-2 meta-metrics were measured against `vrne-s1`'s own pre-fix numbers as the provisional anchor: commits-per-task ratio 2.8 → 1.0 (target ≤2.0, beaten), false-wait incidents 6-in-10-days → 0, local full-suite runs 7 → 4 (target ≤4, met — and one of those 4 runs caught a genuine regression, not ceremony), wall-clock/task ~11-16 min → ~11 min excluding a genuine session-limit interruption. Full writeup: `workspace/capture-log.md`, 2026-08-23 entry. Both metrics with a hard target cleared it on the first sample; the other two remain provisional (n=1, need n≥4 per `loop-design.md`'s own threshold).
2. **A real cross-story regression was caught and fixed within this story's own inner loop, not by CI after the fact.** Wiring the gate into `POST /api/skills/:name/sessions` broke 3 pre-existing, unrelated test files (`tests/skill-launcher.test.js`, `tests/artefact-preview.test.js`, `tests/artefact-writeback.test.js`) whose mock session fixtures never set a `role` field. Fixed by adding `role: 'user'` to those mocks (the real production default), not by weakening the gate — matching this repo's own established "seed a real role, don't weaken the gate" precedent from `jsvr-s1` and `vrne-s1`. Full root-cause in `decisions.md` and commit `5694195f`. `/improve` candidate: any future story that wires a new access-control gate into an existing route should proactively grep for pre-existing test files exercising that route with an incomplete session mock, rather than discovering the gap only at `/verify-completion`'s full-suite run.
3. **A documentation-sync process gap was found and fixed mid-story.** Two rounds of hand-editing the implementation plan artefact (`plans/vrne-s2-plan.md`) from the wrong git worktree (the main repo's `master`-checked-out copy instead of the `feature/vrne-s2` worktree copy) caused a partial edit to clobber an earlier one, leaving stale "2 integration tests"/"17 passed" text in the plan after a 3rd test was added. Caught by the final reviewer, not by the earlier per-task reviewers (who were scoped to code diffs, not plan-artefact prose). Fixed directly in the correct worktree; no test content was ever wrong, only the plan's own narrative text. `/improve` candidate: when a mid-story plan amendment is needed, edit the artefact file from inside the story's own worktree, not the main repo checkout, to avoid this exact class of cross-worktree edit mistake.
4. Full root-cause analysis for observations 2 and 3 is recorded in `artefacts/2026-08-21-viewer-role-no-enforcement/decisions.md` (2026-08-23 entries).

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Wire the viewer-write-block gate to Skill session routes" (vrne-s2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
