# Definition of Done: Audit and fix the navigation path into `/features/:slug`

**PR:** https://github.com/heymishy/skills-repo/pull/837 | **Merged:** 2026-09-05 (commit `14ddb68ed3fc882e2701aad1a374b1e66a69fe74`)
**Story:** artefacts/2026-09-05-feature-page-ux-redesign/stories/fpux.2-audit-and-fix-nav-path.md
**Test plan:** artefacts/2026-09-05-feature-page-ux-redesign/test-plans/fpux.2-test-plan.md
**DoR artefact:** artefacts/2026-09-05-feature-page-ux-redesign/dor/fpux.2-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-05

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Story artefact records the real audit result: 4 confirmed entry points via `grep -rn "features/" src/web-ui/routes/*.js src/web-ui/views/*.js` — one more than discovery's original 3 (kanban board card) | manual audit, documented | None — the 4th entry point was explicitly pre-authorized as in-scope by the discovery's own Clarification log Q4, not a scope violation |
| AC2 | ✅ | Entry points 1–3: existing `frsr-s1` E2E + `kcrs-s1` integration suite (7/7 passing); entry point 4: `check-fpux.2-nav-entry-points.js` (2/2 passing — direct href, correct escaping) | automated (mixed: existing E2E/integration coverage + new unit test) | None |
| AC3 | ✅ | Story artefact records: no dead-end, broken, or confusing hop found across any of the 4 entry points — AC3 closes as "no defect found," not applicable to fix | manual audit + automated confirmation (AC2's own tests) | None |
| AC4 | ✅ | `check-fpux.2-benefit-metric-updated.js` (3/3 passing) — `benefit-metric.md`'s M3 row updated with real baseline (4 entry points, 0 dead-ends) and target (maintained at 0) | automated unit test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by `/trace`.

---

## Scope Deviations

None. The 4th entry point (kanban board card) was not named in the original discovery, but its inclusion was explicitly pre-authorized by the discovery's own Clarification log (Q4: "worth a quick audit during `/definition`... a newly-found entry point is in-scope, not scope creep").

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5 (differs from the implementation plan's own original design — see Deviation note below)
**Tests passing in CI:** 5 / 5 — confirmed via PR #837's own green CI run (`Lint, typecheck, test, build`: pass, 3m14s) and directly, locally, before merge

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `check-fpux.2-nav-entry-points.js` — kb-card href direct, correctly escaped | ✅ | ✅ | 2/2 |
| `check-fpux.2-benefit-metric-updated.js` — M3 row updated, no placeholder text | ✅ | ✅ | 3/3 |

**Implementation-plan deviation (documented in the PR, not a gap):** the plan originally called for a new E2E Playwright spec exercising all 4 entry points end-to-end. Investigation during implementation found entry points 1–3 already have real, passing coverage elsewhere (`frsr-s1` E2E, `kcrs-s1` integration suite) — writing new E2E tests for those would have duplicated existing coverage and inherited `frsr-s1`'s own pre-existing local `ANTHROPIC_API_KEY` dependency for no benefit. Replaced with a fast, local, no-API-key-needed unit test for the one genuinely uncovered entry point (#4). This is a stronger, more honest test design than the original plan, not a reduction in coverage — the same AC2 claim (all 4 entry points lead directly to `/features/:slug`) is fully covered, just via a mix of existing + new tests rather than one new redundant spec file.

**Coverage gap audit (Step 4):** No AC in this story is `CSS-layout-dependent` (confirmed in the test plan's own Step 3a note — routing/link correctness only, no visual rendering). Not applicable.

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — none identified | ✅ N/A | Routing/link correctness only, no new queries |
| Security — existing auth-guard unchanged | ✅ | No route/handler files touched by this diff (confirmed via `git diff --stat master..HEAD -- src/` at verify-completion, zero output) |
| Accessibility — existing `<a>` elements remain keyboard-navigable | ✅ | No new custom interactive control introduced |
| Audit — not applicable | ✅ N/A | No new state-changing action |

`nfr-profile.md` status: no NFRs specific to this story beyond the above — all confirmed addressed or not applicable.

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M3: Navigation path clarity into `/features/:slug` | ✅ (established 2026-09-05 via this story's own AC1 audit) | ✅ 2026-09-05 | Real baseline (4 entry points) and target (0 dead-ends, maintained) both set in the same story that measured them |

**M3 signal: on-track** — evidence: `benefit-metric.md` M3 row, updated 2026-09-05 — "4 real entry points confirmed... 0 dead-end hops found across all 4," target "Maintained at 0 dead-end hops... met on first measurement."

---

## Outcome

**COMPLETE**

All 4 ACs satisfied. The audit this story exists to perform found a real, previously-unknown 4th entry point (pre-authorized as in-scope) and confirmed zero defects across all four — a genuinely clean result, not an unexamined assumption. M3's benefit-metric signal is fully measured and on-track as of this same story's own delivery.

**Follow-up actions:**
None outstanding from this story's own scope.

---

## DoD Observations

1. **The discovery's own Clarification log Q4 ("a newly-found entry point is in-scope, not scope creep") worked exactly as designed.** When the audit found a 4th real entry point (kanban board card) not named at discovery time, this story absorbed it directly rather than treating it as an unplanned scope expansion requiring a separate decision — a clean example of a discovery-time contingency plan being used correctly at implementation time.
2. **Reusing existing test coverage instead of duplicating it is a legitimate implementation-plan deviation, not a shortcut.** Task 2's actual execution (a targeted unit test for the one genuinely uncovered entry point, citing existing `frsr-s1`/`kcrs-s1` coverage for the other three) produces the same AC2 guarantee as the originally-planned new E2E spec, with less redundant test-maintenance surface and no new local-environment dependency. Worth citing as a positive pattern: before writing a new test for an AC, check whether existing test suites already cover the exact behaviour.
3. Same `/improve` candidate as `fpux.1`'s own DoD: `metrics[].contributingStories` was empty in `pipeline-state.json` at `/definition` time despite the benefit-metric artefact's own Coverage Matrix correctly mapping M3 → `fpux.2` — backfilled here.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Audit and fix the navigation path into /features/:slug" (fpux.2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
