# Definition of Ready: dmcb-s2 — multi-artefact cell blows out its column width

**Track:** Short-track
**Test plan:** artefacts/2026-09-09-doc-matrix-column-bugs/test-plans/dmcb-s2-test-plan.md
**Complexity:** 1 (well understood, clear path — root cause precisely located, one-line fix)
**Human oversight:** Low

## Readiness checks

- [x] Scope is testable without ambiguity — T1-T3 above, all HTML string assertions.
- [x] Out of scope declared: no CSS changes, no change to the "every entry renders, none dropped" multi-artefact behaviour itself (cat-s4's own regression guard), no change to which artefacts land in a shared cell.
- [x] No dependency on an incomplete upstream story — dmcb-s1 is already merged and DoD-complete; this is a genuinely separate defect surfaced while verifying it live, not a re-opening of dmcb-s1's own scope.
- [x] NFRs identified: none beyond the regression coverage itself.
- [x] H-ADAPTER check: no adapter changes — N/A.

## Coding Agent Instructions

1. `src/web-ui/routes/features.js`'s `renderArtefactMatrix` cell-rendering (~line 668-680): change `.join(' ')` to join multiple entries with `<br>` when `artefactsForCell.length > 1`, keeping the single-entry case unchanged.
2. Add T1-T2 to `tests/check-fadm-s1-document-matrix.js` (it already owns matrix-rendering assertions) or `tests/check-cat-s4-features-page-integration.js` (it already owns the multi-artefact-cell test this fix touches) — extend whichever file's existing test most directly covers the multi-artefact-cell case, matching this repo's own convention.
3. Run T3: confirm the existing multi-artefact-cell regression test still passes with the new separator.
4. Full suite regression check.
5. After merge and live deploy, re-verify on the exact reported page (`skills-framework.fly.dev/features/2026-06-22-wuce-multi-tenancy`) via Chrome: confirm the Ref column's width is no longer disproportionate, via `getBoundingClientRect()` on the header cell, not just visual inspection.

## Sign-off

**Proceed:** Yes — signed off directly (short-track, complexity 1, low oversight, root cause independently confirmed against live production data before any code was written).
