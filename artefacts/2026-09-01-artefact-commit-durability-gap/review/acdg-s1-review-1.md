# Review Report: Fix the Silent Artefact-Commit Failure in Stage-Completion (AC2 Guard) — Run 1

**Story reference:** artefacts/2026-09-01-artefact-commit-durability-gap/stories/acdg-s1.md
**Date:** 2026-09-02
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** AC quality — AC1's own call-site wrapper (the `try { commitArtefact(...) } catch (_dasCommitErr) { res.writeHead(502, ...); return; }` block in `journey.js`, read directly during discovery) already appears structurally correct today — a `commitArtefact` throw already returns a 502 and does not call `completeStage()`. AC1 as written may test pre-existing, already-passing behaviour rather than the actual fix. However, this session has NOT read `artefact-commit-writer.js`'s own internals — if `commitArtefact` silently swallows a real GitHub API failure internally instead of throwing, AC1's premise (a failure reaching `journey.js`'s catch block at all) would not hold, and AC1 would in fact be testing a real gap one layer deeper than currently described.
  Risk if proceeding: `/test-plan` may write a test for AC1 that trivially passes against unchanged code, giving false confidence that "the fix" is covered, when the actual root cause (once found in implementation) may live in AC2's scenario, or in `commitArtefact.js` itself, neither of which AC1 currently names.
  To acknowledge: run /decisions, category RISK-ACCEPT — or amend AC1 during implementation once `commitArtefact.js`'s internals are read, to explicitly state which layer the AC is protecting.

- **[1-M2]** AC quality — AC2 only covers a *thrown* `ownerRepoForFeature` resolution failure ("a simulated transient resolution error"). It does not explicitly cover the structurally distinct case where `ownerRepoForFeature` returns falsy *without throwing* for a feature that genuinely has a valid repo link (a resolution-logic bug, not a resolution exception) — in the current code, `if (_dasOwnerRepo)` would evaluate false and silently take the same skip-path as AC3's genuine no-repo case, with no catch block ever entered. This is equally consistent with the discovery's own open assumption about which failure sub-mode actually occurred for `new-feature-af17f555`, and currently has zero AC coverage.
  Risk if proceeding: if implementation confirms this non-throwing-falsy-return case is the actual root cause, `/test-plan` has no AC to write a test against, and the fix could ship without a regression test for the specific bug that caused the original incident.
  To acknowledge: run /decisions, category RISK-ACCEPT — or add an AC4a covering this specific sub-mode before /test-plan.

---

## LOW findings — note for retrospective

- **[1-L1]** Architecture compliance — `.github/architecture-guardrails.md`'s registry (Mandatory Constraints, Active ADRs, Approved Patterns, Anti-Patterns) is entirely scoped to `dashboards/pipeline-viz.html` and `.github/scripts/` — it explicitly states skill/template files are "governed by pipeline process, not these guardrails," and does not mention `src/web-ui/` at all. Category E has no applicable guardrail to check this story's actual touched files (`src/web-ui/routes/journey.js` and adapters) against. This is a repo-level gap, not a story defect — the guardrails file itself would benefit from an `src/web-ui/` section, but that is out of scope for this story to fix.

---

## Post-review resolution (2026-09-02, same session, before /test-plan)

Both MEDIUM findings resolved by revising `acdg-s1.md` directly rather than deferring:
- **1-M1** — AC1 now explicitly states the implementation must first confirm whether `commitArtefact` genuinely throws (making AC1 a regression-protection test) or swallows failures internally (making it the actual fix site, in `artefact-commit-writer.js`), rather than presenting AC1 as if it already tests the fix.
- **1-M2** — added AC2a, covering the non-throwing falsy-return failure sub-mode that AC2 didn't reach, which is equally consistent with the discovery's own open assumption about the real root cause.

## Summary

0 HIGH, 2 MEDIUM (both resolved same session, see Post-review resolution above), 1 LOW.
**Outcome:** PASS

---

## Score Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 3 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 4 | PASS |

**Traceability (5):** Epic, discovery, and benefit-metric references all present and correct; benefit linkage names the real metric with a genuine mechanism sentence; metric appears in the coverage matrix as Covered.

**Scope integrity (5):** Story implements nothing outside the epic's or discovery's out-of-scope items; its own out-of-scope section names two genuinely excluded behaviours.

**AC quality (3):** 4 ACs, all Given/When/Then, all independently testable, no "should" language — but AC1 and AC2 both have real, specific coverage gaps (see 1-M1, 1-M2) that should be resolved or explicitly acknowledged before /test-plan writes tests against them.

**Completeness (5):** Every template field populated with real content — named persona, genuine benefit linkage, populated NFRs, complexity and scope stability both rated.

**Architecture compliance (4):** Architecture Constraints field populated and consistent with the story's actual scope; no violation of any named guardrail — the guardrails registry simply has no coverage of the touched code area (1-L1, informational only).
