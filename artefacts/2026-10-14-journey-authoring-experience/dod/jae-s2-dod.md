# Definition of Done: Collapse stage creation into one guided action

**PR:** https://github.com/heymishy/skills-repo/pull/989 | **Merged:** 2026-10-14
**Story:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s2.md
**Test plan:** artefacts/2026-10-14-journey-authoring-experience/test-plans/jae-s2-test-plan.md
**DoR artefact:** artefacts/2026-10-14-journey-authoring-experience/dor/jae-s2-dor.md
**Assessed by:** Claude Sonnet 5 (session continuation)
**Date:** 2026-10-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Panel opens automatically after a successful stage-name save, confirmed via real DOM-interaction test | `unit` | None |
| AC2 | ✅ | Focus genuinely moves to `#sw-stage-field-description`, confirmed via `document.activeElement` | `unit` | None |
| AC3 | ✅ | Closing the auto-opened panel leaves the stage saved with just its name; no extra PATCH fired | `unit` | None |
| AC4 | ✅ | Active view unchanged, `window.location.reload()` never called — no regression to `jcx-s7`'s own AC2 | `unit` | None |
| AC5 | ✅ | `openPanel` resets the save-indicator's stale text/classes on every open — resolves review finding 1-H1, dedicated regression test | `unit` | None |

### Verification strength summary
- `unit`: 5 (real jsdom DOM interaction, mocked `fetch`)
- `live-verified`: 0 — not yet performed this session

---

## Scope Deviations

None. All 5 ACs implemented exactly as scoped. AC5 was added during `/review` (resolving finding 1-H1) before any code was written, not discovered post-implementation — the story and test plan reflect the final, correct scope from the start of the coding loop.

---

## Test Plan Coverage

**Tests from plan implemented:** 5/5
**Tests passing in CI:** confirmed via PR #989 — all CI checks green

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 | ✅ | ✅ | |
| AC2 | ✅ | ✅ | |
| AC3 | ✅ | ✅ | |
| AC4 | ✅ | ✅ | |
| AC5 | ✅ | ✅ | Resolves review finding 1-H1 |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ N/A | Sequencing change to already-executing client-side code, no new network calls |
| Security | ✅ N/A | No new input surface; reuses the already-tenant-scoped POST response |
| Accessibility | ✅ | AC2's focus-move verified directly via `document.activeElement`, not assumed |
| Audit | ✅ N/A | No new mutating action |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Time-to-first-complete stage | Not yet established | Not yet | This story is the primary mechanism M1 measures — the panel auto-open directly removes the separate edit-panel-discovery step |
| M3 — Operator CX judgment of the authoring flow | Operator-stated gap, 2026-10-14 | Not yet | This IS the headline "guided creation" mechanism named in discovery.md |

**Measurement-ready gate:** Not yet — needs real post-release usage time and the pre-release baseline timing instrument (not yet built; named as a future action).
**Signal:** `not-yet-measured`
**Date measured:** null

---

## Outcome

**COMPLETE — NO DEVIATIONS**

**Follow-up actions:**
1. **Owner: future session.** Live-verify this story on staging (click "+ Add stage," name it, confirm the panel opens automatically with focus in Description) once convenient — not yet performed this session.
2. **Owner: future session.** Build the session-timing instrument M1's own benefit-metric row names (stage-creation-to-first-complete-save sequence) — does not exist yet; needed before M1 can be measured at all.

---

## DoD Observations

1. The review-caught defect (1-H1) this story fixed is a good example of a story's own AC1 (auto-open) making a PRE-EXISTING, low-frequency defect in a DIFFERENT story's own code (`jcx-s7`'s `openPanel`) into something hit routinely. Worth a standing habit: when a story increases the FREQUENCY or VISIBILITY of an existing code path (not just adding new behavior), explicitly check that path's own edge cases don't get newly exposed — not just review the new code in isolation.
2. The fix chosen (remove the auto-hide timer entirely, rather than add a sequence-token guard around it) is a reminder that the simplest fix for a race condition is sometimes removing the thing that creates the race, not making the race safer.
