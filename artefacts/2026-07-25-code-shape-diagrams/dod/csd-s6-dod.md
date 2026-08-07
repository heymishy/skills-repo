# Definition of Done: Drift signal — as-designed vs as-built comparison

**PR:** [#611](https://github.com/heymishy/skills-repo/pull/611) | **Merged:** 2026-07-26
**Story:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s6-drift-signal.md
**Test plan:** artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s6-test-plan.md
**DoR artefact:** artefacts/2026-07-25-code-shape-diagrams/dor/csd-s6-dor.md
**Assessed by:** Copilot
**Date:** 2026-07-26

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `src/modules/drift-comparator.js` flags add/remove/rename for Data Model, plus a dedicated ADR-026 non-optimal-design check (Jaccard-similarity-based duplicate-entity detection) | 3 dedicated unit tests including the duplicate-entity edge case, plus a real integration test using csd-s5's real Data Model generator output against a real migration file | None |
| AC2 | ✅ | Program Design drift restricted to call-stack/file-tree structural changes; a renamed local variable within an unchanged file structure does not trigger a flag | Dedicated tests for both directions (structural change flags, variable rename doesn't) | None |
| AC3 | ⚠️ | Drift-comparison logic for System Architecture (new/removed service-call edges) is implemented and tested against fixture inputs | 2 dedicated unit tests (new/removed service call), both passing | **Deviation, inherited from csd-s5's own recorded gap, not a new one introduced here**: csd-s5 never built a real System Architecture as-built generator, so this AC's comparison LOGIC works and is tested, but the full real-usage path (real as-designed vs real as-built System Architecture diagram for an actual feature) cannot run end-to-end yet. The one integration test in this story necessarily uses Data Model (the type with a real generator) rather than System Architecture. |
| AC4 | ✅ | Explicit "Matches" signal shown per diagram type when no drift is detected — never silence | Dedicated test + the accessibility test below | None |
| AC5 | ✅ | Diverged signal names the specific difference (e.g. table/column/relationship name, or the specific call-stack change) — never a bare "diverged" label | 3 dedicated tests, one per diagram type, each asserting the specific named difference appears in the signal | None |

---

## Scope Deviations

None beyond AC3's inherited gap (recorded against csd-s5, not this story — this story correctly implemented everything askable given what csd-s5 actually built). Fully-automated safe/unsafe verdicts and auto-remediation were correctly left out, matching declared out-of-scope.

---

## Test Plan Coverage

**Tests from plan implemented:** 18 / 18 (the test plan's own detailed list totals 18 even though its summary line states "17" — the implementing agent used the real, authoritative detailed count rather than the summary line, and reported the discrepancy rather than silently picking one)
**Tests passing in CI:** 18 / 18

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `check-csd-s6-drift-signal.js` | ✅ | ✅ | 18/18 (14 unit, 1 integration, 3 NFR), independently re-run at merge verification |
| csd-s1 non-regression (`check-csd-s1-derisk-canvas-mermaid.js`) | ✅ | ✅ | 8/8 — confirmed unaffected by this story's `skills.js` edit |
| csd-s2 non-regression (`check-csd-s2-canvas-diagram-rendering.js`) | ✅ | ✅ | 9/9 — confirmed unaffected after a mid-task regression (see DoD Observations) was caught and fixed |

**Gaps (tests not implemented):** None against the test plan as written.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — completes within normal session time budget | ✅ | Dedicated NFR test |
| Security (inherits csd-s4/csd-s5, structure only) | ✅ | No new data source introduced — compares already-generated diagram structures only |
| Accessibility — match/diverged conveyed by more than colour alone (WCAG 2.1 AA) | ✅ | Dedicated NFR test confirms an aria-hidden icon plus explicit "Matches"/"Diverged" text label, never colour alone |
| Audit — drift results logged | ✅ | Dedicated NFR test confirms an audit event per comparison |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| P1 — Time-to-drift-determination | ❌ | Once a real feature runs the full cycle (as-designed → as-built → this drift check) and an operator's actual determination time is observed | This is the direct mechanism — the comparison itself completes fast (NFR-verified), but the METRIC is about operator time-to-determination, which requires a real operator using it on a real feature |
| P3 — Diverged-flag true-positive rate | ❌ | Requires multiple real drift events over time to establish a true-positive rate | Cannot be established from a single measurement or synthetic tests alone |
| M1 — Drift caught before it became a problem | ❌ | Requires a real incident where this mechanism catches drift before it causes a problem | Inherently requires real operational usage over time, per the metric's own definition |

**Measurement-ready gate:** Not yet — see epic-level consolidated note below.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. Same as csd-s5's follow-up #1: System Architecture as-built generation needs a `decisions.md` ARCH entry and a follow-up story before AC3's full real-usage path can be exercised end-to-end. This story's own comparison logic for System Architecture is ready and waiting for that upstream gap to close.
2. Once a real feature exists that has gone through `/design`→`/definition`→`/verify-completion`→this drift check, revisit all 4 epic-level metrics (P1, P2, P3, M1) for their first real measurement.

---

## DoD Observations

1. **Real regression caught and fixed mid-implementation, not after the fact.** The implementing agent's first version of a code comment in `skills.js` pushed a pre-existing, unrelated test's fixed 800-character slice window (`check-csd-s1-derisk-canvas-mermaid.js`) past its boundary, breaking that test plus `check-csd-s2-canvas-diagram-rendering.js` — neither of which is in the documented baseline. The agent caught this itself, shortened its own comment rather than touching the other stories' tests, reran both standalone to confirm the fix, then reran the full suite to confirm zero new regressions. This is exactly the kind of self-caught regression the "verify independently" convention exists to make more likely — worth noting as a genuine success case, not just citing the convention when things go wrong.
2. **A pre-existing column-type-token mismatch between csd-s4's design convention and csd-s5's `mapType()` function** was discovered during this story's implementation. csd-s6 correctly sidestepped it since AC1 only requires name-level add/remove/rename comparison, not type-token comparison — but this latent inconsistency between the as-designed and as-built sides should be tracked. Candidate for a small follow-up story if type-level drift detection is ever wanted.
3. The ADR-026 duplicate-entity Jaccard-similarity threshold (0.5) used in the non-optimal-design check is a documented judgment call with no artefact-specified value — flagged transparently in the PR rather than presented as a fully-specified requirement. Worth a `decisions.md` entry if this threshold ever needs tuning based on real false-positive/negative experience.
4. This is the final story in the epic. All 6 stories are now merged. Epic-level metrics remain `not-yet-measured` across the board — expected and honest, given the feature literally just shipped with zero real-feature usage so far.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Drift signal — as-designed vs as-built comparison" (csd-s6).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
