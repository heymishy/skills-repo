# Definition of Done: Classify every divergence case the audit found, not just the common one

**PR:** https://github.com/heymishy/skills-repo/pull/844 | **Merged:** 2026-09-06
**Story:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s3-divergence-classification.md
**Test plan:** artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s3-divergence-classification-test-plan.md
**DoR artefact:** artefacts/2026-09-06-canonical-artefact-trace/dor/cat-s3-dor.md
**Assessed by:** Copilot (Claude)
**Date:** 2026-09-07

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1: Unregistered + inferred grouping, never left ungrouped when a reasonable inference exists | ✅ | `inferGroups` groups by shared filename prefix within the same type, requires ≥2 members, never fabricates a single-member group; tested against a synthetic 3-file fixture and the real 205-file `phase4` fixture | automated test: `tests/check-cat-s3-divergence-classification.js` | None |
| AC2: Orphaned-registration, distinct from unregistered | ✅ | Story-level `hasMatchingArtefact` check; explicit non-conflation test asserting the two values differ | automated test | None |
| AC3: not-yet-synced precedence over per-document classification | ✅ | Structural precedence — `buildArtefactTrace`'s early return happens before `classifyDivergence` is ever reached on that path; independently traced by 3 separate reviewer passes | automated test + code trace | None |
| AC4: Correctly-matched document → registered, no extra flag | ✅ | `divergence: 'registered'`, no `inferredGroup` key added | automated test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None recorded. The one real defect-shaped finding during delivery (a test-coverage gap on `cat-s1`'s own bare-slug fixture through the newly-wired pipeline) was caught and closed by the mandatory final-review step before merge — the underlying behavior was already correct, so it does not appear here as a shipped deviation.

---

## Scope Deviations

None. The merged PR touches exactly 3 files: `src/web-ui/adapters/artefact-trace.js` (the extension), its own new test file, and one comment-only line in `cat-s1`'s existing test file (`tests/check-cat-s1-core-trace-builder.js`) added as part of closing the coverage gap below. No UI rendering of these classifications (confirmed — `cat-s4`'s scope, not touched), no auto-correction/write-back for `orphaned-registration` (confirmed — read-only classification only).

---

## Test Plan Coverage

**Tests from plan implemented:** 10 planned at `/test-plan` time / 12 actually implemented in `cat-s3`'s own file, plus 3 additional regression assertions added to `cat-s1`'s existing file (23 → 26) during final review to close a genuine coverage gap
**Tests passing in CI:** 12/12 (own) + 26/26 (regression) confirmed via `gh pr checks 844` — all 7 CI jobs pass

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (inference, synthetic + real fixture) | ✅ | ✅ | 5 tests |
| AC2 (orphaned-registration + non-conflation) | ✅ | ✅ | 3 tests |
| AC3 (not-yet-synced precedence) | ✅ | ✅ | 2 tests |
| AC4 (registered, no flag) | ✅ | ✅ | 2 tests |
| Cross-story regression (cat-s1's own suite) | ✅ | ✅ | 26/26, including 3 new assertions closing the gap-closure finding |

**Gaps (tests not implemented):** None remaining. One gap was found and closed pre-merge (see DoD Observations).

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — classification adds no additional directory traversal | ✅ | Runs within `cat-s1`'s own single-pass walk; NFR test in `cat-s1`'s own suite (post-wiring) still confirms <50ms for the 205-file fixture |
| Security | N/A | None identified — read-only classification, no new input surface |
| Accessibility | N/A | Data-layer only |
| Audit | N/A | Read-only, no state-changing action |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| m3: Unregistered documents visible without a bug report | ✅ (0%) | Not yet — `cat-s3` implements the classification logic only; the visible "Unregistered" flag itself is `cat-s4`'s scope | Measurement becomes possible once `cat-s4` renders the classification as a real UI flag |

`cat-s3` is not listed as a contributing story for m1 or m2 in the benefit-metric artefact's own coverage matrix — only m3. Not assessed for those two here.

**Signal recorded for m3:** `not-yet-measured`, evidence note: "cat-s3 implements the classification logic (registered/unregistered/orphaned-registration/not-yet-synced) but no UI renders it yet — cat-s4 is the story that turns this into a visible flag an operator can see without a bug report."

---

## Outcome

**COMPLETE**

All 4 ACs satisfied with concrete test evidence, zero scope deviations, zero test gaps remaining (one found and closed pre-merge), applicable NFR confirmed, all 7 CI checks green. The mandatory final-review step's specific focus on cross-story interaction (this story's new logic against `cat-s1`'s own bare-slug regression fix) is exactly what caught the one real gap — a pattern worth repeating for `cat-s4`/`cat-s5`, which will have similar cross-story interaction surfaces with both `cat-s1` and `cat-s3`'s code.

**Follow-up actions:**
1. `cat-s4` must wire the classification into real UI rendering before m3 becomes measurable — tracked via the epic's own Benefit Metrics Addressed table, not a new action.
2. The vacuous-`doesNotThrow` test pattern recurred twice in this epic (once in `cat-s1`, once here) — logged as an `/improve` candidate in `workspace/capture-log.md`; worth a coding-standard or skill-checklist addition if it recurs a third time.

---

## DoD Observations

1. **The mandatory final-review step justified its own existence a second time in this epic.** Just as `cat-s1`'s final review caught a real, would-have-shipped regression that all per-task reviews missed, `cat-s3`'s final review — explicitly briefed to probe the interaction between new and existing code — found a genuine test-coverage gap in exactly the kind of cross-story seam per-task reviews structurally can't see (each task review only looks at that task's own diff). Both catches happened in the same epic, on the same underlying file (`artefact-trace.js`), reinforcing that this step earns its keep specifically for stories that extend already-shipped code.
2. **A test-quality defect (vacuous `doesNotThrow`) recurred independently across two different subagent dispatches in this epic**, despite both dispatches having no shared context. This suggests the defect is a generic pattern the coding-agent role is prone to, not a one-off mistake — worth addressing at the skill/standards level rather than relying on code-quality review to catch it every time. Tagged as an `/improve` candidate.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Classify every divergence case the audit found, not just the common one" (cat-s3).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
