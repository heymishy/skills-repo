# Review Report: Walking skeleton — tenant-scoped surface and single-AC capture via session-reuse auth — Run 1

**Story reference:** `artefacts/2026-10-20-production-playback-capture/stories/ppc-s1.md`
**Date:** 2026-10-21
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** AC quality / Architecture compliance — AC2 says the system "navigates to the AC's target screen" as if resolving an AC to a URL+selector were already solved by the reused `rpca` mechanism. It is not. `rpca-s2`'s selector-derivation mechanism (`artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s2-selector-derivation-from-e2e-specs.md`) works by parsing `tests/e2e/*.spec.js` files **in this repo** for AC-naming comments plus `page.locator(...)` calls, with a manual-fallback JSON sidecar as backup. For `production-playback-capture`'s corrected frame, the target is an **external tenant's own arbitrary feature living in their own connected repo** — there is no guarantee that repo has any E2E spec files at all, let alone ones following this repo's exact AC-comment convention, and the manual-fallback file's location (`artefacts/[feature-slug]/playback/[story-slug]/selectors-manual.json`) was defined relative to *this* repo's artefact layout, not a tenant's. `discovery.md`'s own claim that this MVP is "mostly an auth-scoping and UI-surfacing change... not a new architectural layer" is not true for this piece specifically — selector/target-screen derivation for an arbitrary tenant's arbitrary feature is an unsolved problem this story (and `ppc-s2`, which extends the same unaddressed AC) silently assumes away.
  Fix: Either (a) scope `ppc-s1`'s AC2 down to a narrower, explicitly-stated mechanism that doesn't require generalised selector derivation (e.g. the Product Owner supplies the target URL/selector manually per AC for this MVP, with auto-derivation named as fast-follow), or (b) add a new prerequisite story/spike that designs how AC→screen resolution works for an arbitrary external tenant repo before `ppc-s1` can be built as currently written. Either way, this needs to go back through `/definition` (or at minimum a `decisions.md` SCOPE entry) before `/test-plan` — it is not a line-edit fix to the existing AC.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Completeness — AC1 asserts the surface lists ACs for a "DoD-complete feature" but never names how "DoD-complete" is actually determined for a tenant's own feature. Confirmed by direct code read that the mechanism does exist (`journeys.data.completedStages`, keyed by `skillName`, in `src/web-ui/modules/journey-store.js`/`journey-store-pg.js` — a `definition-of-done` entry would signal completion) — so this is a documentation/completeness gap, not a fundamental blocker like 1-H1, but a developer picking up this story has no way to know this without independently re-deriving it.
  Risk if proceeding: an implementer could invent a different, inconsistent "DoD-complete" check (e.g. a new column, or trusting a client-supplied flag) rather than reading the real `completedStages` signal.
  To acknowledge: run /decisions, category RISK-ACCEPT — or add the mechanism to AC1/Architecture Constraints directly (preferred, since this is a cheap fix).

- **[1-M2]** Architecture compliance — `discovery.md`'s ADR-026 reuse claim ("reusing the proven `rpca` mechanism") is valid for `captureAcScreenshots`'s own screenshot-taking logic and the session-reuse auth design, but not for the selector-derivation half (see 1-H1) — the story's Architecture Constraints section doesn't distinguish which parts of "the proven mechanism" actually transfer and which don't, so the reuse claim reads as broader than it is.
  Risk if proceeding: future readers (reviewers, `/trace`) may assume the entire `rpca` mechanism is a drop-in reuse, masking 1-H1's real gap.
  To acknowledge: resolved automatically once 1-H1 is fixed — the corrected Architecture Constraints should state explicitly which `rpca` pieces are reused as-is and which are not.

---

## LOW findings — note for retrospective

<!-- None. -->

---

## Summary

1 HIGH, 2 MEDIUM, 0 LOW.
**Outcome:** FAIL

---

## Category E detail (architecture compliance)

| Check | Result |
|---|---|
| Architecture Constraints field populated | ✓ |
| Implementation path doesn't violate a named approved pattern | ✗ — see 1-M2 (ADR-026 reuse claim overstated) |
| Implementation path doesn't use a listed anti-pattern | ✓ |
| Applicable repo-level ADRs referenced/respected | Partial — ADR-018 correctly respected (real session reuse, not `NODE_ENV=test` bypass); ADR-025 (app-layer `tenant_id` scoping) correctly respected via the `tenant_id`+`product_id` filter requirement |
| Story NFRs align with mandatory constraints in guardrails | ✓ (registry's mandatory constraints are scoped to the pipeline viz, not applicable here; no conflict) |
