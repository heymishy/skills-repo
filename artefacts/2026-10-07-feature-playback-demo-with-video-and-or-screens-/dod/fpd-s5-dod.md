# Definition of Done: Close the real-capture loop

**PR:** https://github.com/heymishy/skills-repo/pull/999 (code, AC1-AC3) + direct-to-master commits `52e078fb`/`5f8ba1fa` (real capture + verification, AC4 — artefact-only, no PR required per CLAUDE.md's bookkeeping-path rule) | **Merged:** 2026-10-18
**Story:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s5-close-the-real-capture-loop.md
**Test plan:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/test-plans/fpd-s5-test-plan.md
**DoR artefact:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/dor/fpd-s5-dor.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-10-18

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — `parseDodAcCoverage` also parses `## AC Verification` tables | ✅ | `AC1 (unit)` test passes against a `pmf.3-dod.md`-modelled fixture. **Live-confirmed 2026-10-18**: `pmf.3`'s own real DoD file, previously unparseable, now renders its real AC1 row at `/playback/2026-06-14-web-ui-pm-flow` | `unit`, `live-verified` | None |
| AC2 — Screenshot/video paths namespaced by story, no cross-story collision | ✅ | `AC2 (unit)` x2 + `AC2 (integration)` tests pass, deliberately using two stories sharing an AC id. **Live-confirmed 2026-10-18**: the real capture resolved and rendered from the new story-namespaced path (`artefacts/.../playback/pmf.3/screenshots/AC1.png`) with no collision | `unit`, `integration-real-code`, `live-verified` (mechanism; full side-by-side two-real-story comparison still needs a second real capture — see DoD Observations) | None |
| AC3 — `staging-deploy.yml` still deploys for an `artefacts/*/playback/**`-only push | ✅ | `AC3 (unit)` test passes, asserting both set membership and pattern order. **Live-confirmed 2026-10-18**: commit `52e078fb` (artefact-only) triggered a real Staging Deploy run (39097608558) that completed successfully — before this story, this exact push would have been silently skipped | `unit`, `production-observed` | None |
| AC4 — Real capture, real deploy, real live-observed rendering | ✅ | Manual verification scenario executed for real: real capture via the operator's own authenticated Chrome session (Playwright-driven capture excluded per Out of Scope — needs its own non-local login), real push, real deploy watched to completion, real screenshot confirmed rendering inline | `production-observed`, `live-verified` | None — Playwright-driven capture itself remains out of scope, as planned, not a gap |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

**Verification strength summary:** 5 unit, 2 integration-real-code, 3 live-verified, 2 production-observed. The first `fpd-*` story this cycle to reach `live-verified`/`production-observed` on every single AC — every prior story (`fpd-s1`–`fpd-s4`) had at least one AC stuck at `unit`/`integration-real-code` only, blocked on exactly the gaps this story fixes.
**UI-evidence gate:** Fully closed by direct live observation — no RISK-ACCEPT carried forward. See `decisions.md`'s `[RESOLVED 2026-10-18]` note.

---

## Scope Deviations

**None.** 6 commits across the branch + 2 direct-to-master commits, all mapping to the plan's own 5 tasks (branch-setup checkpoint, Tasks 1-4 on the branch; Task 5 split across two direct-to-master commits — the real capture itself, then the verification-outcome write).

**Two DoR contract amendments during implementation, both logged as they happened, not retroactively:** (1) found during planning, before any code was written, that `fpd-s1`'s/`fpd-s2`'s own existing tests would break under AC2's path change — both added as explicit touch points and fixed forward. (2) found during Task 4's own implementation that `sdsb-s1`'s own existing test asserted the old 3-entry `paths-ignore` shape — same pattern, same fix-forward treatment. Neither is scope creep: both are the direct, foreseeable consequence of this story's own ACs, caught before merge rather than shipped broken.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6 (4 unit + 2 integration, as planned; AC4's manual scenario executed for real, not just written)
**Tests passing in CI:** 6 / 6 in the story's own new test file; full regression suite 760/760, 0 failures, confirmed fresh at `/verify-completion` and again after the real-capture commits

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (unit): `## AC Verification` table parses to the same shape | ✅ | ✅ | |
| AC2 (unit) x2 + (integration): story-namespaced paths, no collision | ✅ | ✅ | |
| AC3 (unit): `paths-ignore` negation present and correctly ordered | ✅ | ✅ | |
| AC4 (manual): real capture/deploy/render | ✅ | ✅ | Executed for real, not RISK-ACCEPTed |

**Test gaps:** None. Two pre-existing test files (`fpd-s1`'s, `fpd-s2`'s own) and one more (`sdsb-s1`'s own) were fixed forward mid-implementation, not left broken or silently excluded — see Scope Deviations above.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ (N/A) | No new request-path computation — confirmed by code review |
| Security — tenant-scoping | ✅ (clarified) | Same finding as `fpd-s3`'s/`fpd-s4`'s own DoD — `pipeline-state.json`'s `features[]` has no tenant dimension anywhere in this codebase; unaffected by this story |
| Accessibility | ✅ (N/A) | No new UI surface |
| Audit | ✅ (N/A) | No new mutating action |

**Guardrail updates:** `ADR-026` (reuse, don't duplicate) genuinely satisfied — `parseDodAcCoverage` widened in place, not forked; `captureAcScreenshots`/`resolveScreenshotPathForAc` modified together per the Architecture Constraints, not left to drift. The `ADR-027`/`ADR-028` registry gap named at `fpd-s3`'s/`fpd-s4`'s own DoD remains open — unrelated to this story's own scope, not re-litigated here.

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Acceptance loop closure rate | ✅ (0%, confirmed) | Not yet, honestly | The capture *mechanism* is now proven to work end to end for the first time — but the real target ("a package produced and shared within 5 business days of DoD") isn't what just happened: `pmf.3`'s own DoD was 2026-06-15, this capture happened 2026-10-18, four months later, as a deliberate fix-validation exercise, not a real feature's own natural workflow. Recording this honestly as `not-yet-measured` rather than claiming a false positive — the mechanism working is a necessary precondition for M1 to ever move, not evidence that it has |
| M2 — Sponsor feedback re-entry rate | ⚠️ Not yet established | Not yet | No real sponsor-sharing or feedback event has occurred — unaffected by this story |

---

## Outcome: COMPLETE ✅

ACs satisfied: 4/4
Scope deviations: None (two DoR contract amendments, both logged live, both fix-forward not scope creep — see above)
Test gaps: None

**Follow-up actions:**
1. **Real video/caption/transcript capture is still never-run, for any feature.** Explicitly out of scope for this story (needs a real Playwright session with its own non-local login this session cannot perform) — the next natural increment once an operator is available to drive it directly.
2. **A second real capture, against a second real feature, would close AC2's own remaining gap** — a genuine side-by-side comparison of two different real stories' own screenshots, not just the collision-proof unit/integration tests plus one real story's own successful resolution.
3. **M1/M2 still have no real-world data point**, honestly — the mechanism now works, but no feature has used it within its own real DoD-to-share timeframe. This is the natural state until a feature's own delivery team uses the capture skill as part of their real workflow, not a gap in this story.
4. `ADR-027`/`ADR-028` guardrail registry gap — still open, unrelated to this story, not re-litigated.

---

## DoD Observations

1. **This story found and fixed three separate pre-existing test regressions during its own implementation** (`fpd-s1`'s, `fpd-s2`'s, and `sdsb-s1`'s own test files), none named in the original DoR contract — each found live, during implementation, by actually running the full regression suite rather than assuming the touch-point list was complete. All three are the textbook shape this session's own established practice exists to catch: a path/shape convention changing underneath an existing passing test, not a behavioural regression.
2. **The honest metric-signal nuance above (M1/M2 still `not-yet-measured` despite a successful real capture) is itself worth naming explicitly**, since it would be easy to over-claim here: proving the mechanism works is necessary but not sufficient for the benefit metrics this whole feature exists to move. Recorded accurately rather than claiming a premature win.
3. **This is the first `fpd-*` story this cycle to close its own UI-evidence gate for real, not via RISK-ACCEPT** — every one of the prior four stories carried at least one live-rendering claim forward unverified. Worth noting as the actual point of this story's own existence: not new product scope, but closing the verification debt the first four stories could not close themselves.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Close the real-capture loop" (fpd-s5) -- the fix-forward story that finally let the Feature Playback viewer render real evidence for a real feature.
Check:
1. Does every AC row have a concrete evidence reference distinguishing unit/integration evidence from the real, live-observed evidence?
2. Is the M1/M2 metric-signal honesty (mechanism works, but no real feature has used it in its own workflow yet) actually correct, or does the real capture against pmf.3 arguably deserve more credit than "not-yet-measured"?
3. Were the three mid-implementation DoR contract amendments (fpd-s1/fpd-s2/sdsb-s1 test fixes) handled appropriately -- fixed forward and logged, not silently absorbed or treated as unplanned scope creep?
4. Is AC2's own "live-verified (mechanism)" distinction from "live-verified (full two-story comparison)" a fair characterisation, or does it understate/overstate what was actually proven?
5. Given this closes the verification debt from fpd-s1 through fpd-s4, should this trigger a dedicated feature-level retrospective before more fpd-* stories are scoped?
Report findings as HIGH / MEDIUM / LOW.
```
