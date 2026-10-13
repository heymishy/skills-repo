# Review Report: jcx-s6 — Restructure the Customer experience tab into a real timeline + swimlane grid

**Story:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s6.md
**Run:** 1
**Date:** 2026-10-13
**Reviewer:** Claude Sonnet 5 (session continuation)

Reviewing 1 story, all 5 categories (A–E).

---

## FINDINGS

**1-M1 (MEDIUM, Category C):** AC3's second clause ("the chart fills its row's available width proportionally to stage count, no longer leaving a large empty region when there are few stages") and AC6 ("visually distinguishable at a glance") both use soft/subjective qualifiers ("large," "at a glance") rather than a precisely testable outcome. Neither names a concrete hook (a CSS class, a measurable threshold, a snapshot baseline) an automated test could assert against directly. This is expected to be resolved at `/test-plan`/DoR time via the B2 classification the story's own NFR section already anticipates (automated visual-regression test or RISK-ACCEPT + manual smoke script) — not a structural defect in the AC itself, but DoR must not let this slide to "implicitly fine," per CLAUDE.md's own B2 rule. Recommend: at test-plan time, pin AC3 to a concrete assertion (e.g., curve SVG width ≥ N% of container width for a given stage count) and AC6 to a concrete, testable marker (e.g., a distinct CSS class or background-color token on the CX-tab-only container) rather than leaving "at a glance" as the test's own target.

**1-L1 (LOW, Category A):** `benefit-metric.md`'s own Metric Coverage Matrix (M1 row) does not yet list `jcx-s6` alongside `jcx-s3`/`jcx-s4` — the story's own Benefit Linkage field correctly names M1 and gives a real mechanism sentence, but the matrix itself is stale. Update at `/definition-of-ready` or alongside this review.

**1-L2 (LOW, Category E):** This story touches CSS/visual work directly (domain tag includes `design`), but the repo has no `DESIGN.md` design-token file and no established token system — every prior UI story in this codebase (`jcx-s1`, `jcx-s3`, `jcx-s4`) used literal CSS values with no token layer, and that pattern is unchanged here. `hasDesignSystemTrack` should correctly remain `false`/absent for this story (setting it `true` would fire `H-DESIGN` against a nonexistent `DESIGN.md`, a false gate). Named so this isn't mistaken for an oversight — it's consistent with the codebase's existing, repo-wide absence of a token system, not a gap this story introduces.

No HIGH findings.

---

## SCORE

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS — epic/discovery/benefit-metric/spike all referenced correctly; one LOW (coverage matrix staleness) |
| Scope integrity | 5 | PASS — 4 explicit out-of-scope items, each with a stated reason (data-model-affecting, deferred not dropped); scope addition has an approved `decisions.md` entry |
| AC quality | 4 | PASS — 6 ACs, all Given/When/Then, all describe observable behaviour; one MEDIUM (AC3/AC6 soft qualifiers need tightening at test-plan time) |
| Completeness | 5 | PASS — named persona (consistent with the rest of the epic), benefit linkage populated, out-of-scope populated, NFRs populated (including an explicit B2 CSS-layout-AC call-out), complexity + scope stability both rated |

**Verdict:** PASS — all criteria scored 3 or above.

### Category E: Architecture compliance

- Architecture Constraints field populated (4 bullets: no data-model change, no new chart dependency, Delivery tab out of scope, Canvas out of scope) ✓
- No violation of a named guardrail or anti-pattern — reuses `handleGetJourneyCanvas`/`checkPlaceholderConversions`/persona routes unchanged, consistent with ADR-026 (reuse an existing entity/primitive) ✓
- All applicable Active ADRs respected: ADR-025 (multi-tenancy — no new routes/queries), ADR-026 (reuse, explicitly cited), ADR-029 (local filesystem canonical — not applicable, no artefact-handoff change) ✓
- Story NFRs align with mandatory constraints — see 1-L2 above (not a violation, a correctly-absent track flag)

No Category E HIGH findings.

---

**Review PASSED ✅ — Run 1**

0 HIGH, 1 MEDIUM (1-M1, to acknowledge/resolve at test-plan), 2 LOW (1-L1, 1-L2)

Ready to run `/test-plan` for jcx-s6.
