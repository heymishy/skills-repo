# Definition of Done: Artefact-list repo-root fallback (close the artefact-listing mismatch)

**PR:** https://github.com/heymishy/skills-repo/pull/614 | **Merged:** 2026-07-26
**Story:** artefacts/2026-07-26-canvas-render-and-story-extraction-fix/stories/alrf-s1-artefact-list-repo-root-fallback.md
**Test plan:** `tests/check-alrf-s1-artefact-list-repo-root-fallback.js` (no separate test-plan.md — retrospective story convention)
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — `listArtefacts` finds real local artefacts via `repoRoot` when `WUCE_REPOSITORIES` is unset | ✅ | `check-alrf-s1-artefact-list-repo-root-fallback.js` AC1 | Automated test, re-run fresh 2026-08-17 | None |
| AC2 — existing-but-empty local artefacts directory returns `noArtefacts: true`, not a silent fall-through | ✅ | Same file, AC2 | Automated test, re-run fresh | None |
| AC3 — no regression to the GitHub-API path when no local directory exists or `repoRoot` is omitted | ✅ | Same file, AC3/AC4 | Automated test, re-run fresh | None |
| AC4 — repo-relative artefact paths use forward slashes on all platforms | ✅ | AC1's path assertions | Automated test, re-run fresh | None |

---

## Scope Deviations

None identified in this retroactive pass. Story's own "Out of Scope" section (reconciling the third, Postgres-based artefact-count mechanism) is explicitly handled by the sibling story `alrf-s4`, not a gap in this story.

---

## Test Plan Coverage

**Tests passing:** 8/8 (`check-alrf-s1-artefact-list-repo-root-fallback.js`), re-run fresh 2026-08-17.
**Regression suites cited by the story** (`check-wuce6-feature-navigation.js`, `check-wuce20-artefact-index-html.js`, `check-kfd1-kanban-card-and-detail-page-cx.js`, 139/139 combined at merge time) — not re-run individually in this pass; superseded by `alrf-s4`'s own AC7 regression sweep (2026-07-26), which re-confirmed `check-wuce6`/`check-wuce20`/`check-kfd1` plus `alrf-s1` itself all unchanged as of that later story's merge.
**Gaps:** None identified.

---

## NFR Status

No dedicated NFRs named in the story beyond the correctness ACs above. The fix is additive (local-disk-first, GitHub-API fallback preserved) — no new failure mode introduced for the multi-repo/no-local-checkout deployment case.

---

## Metric Signal

No formal benefit-metric artefact traced for this retrospective fix directly. Story links to `artefacts/2026-07-25-code-shape-diagrams/benefit-metric.md` (P1/P2) as the parent epic whose trust this fix restores — the artefact-listing mismatch this story fixes would otherwise have made every staging user believe completed work was missing, undermining the parent epic's own diagram-inspection benefit.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None for this story specifically. The story's own Open Question (a systemic "shared source of truth across storage layers" mechanism, floated by the operator 2026-07-26 per `workspace/capture-log.md`) was not implemented as a follow-up story and remains open — not a defect in this story's own delivered scope, since it explicitly framed the systemic question as future work, not a gap in what it shipped.

---

## DoD Observations

1. ~3 weeks live in production, no incidents reported.
2. This story's own retrospective format (found live via operator staging testing, no discovery/DoR before implementation) is the same short-track-adjacent pattern already accepted for its parent (`r-canvas-render-and-story-extraction-fix`) and siblings (`alrf-s2`, `alrf-s4`) in this same directory — all four stories in this cluster share the identical delivery pattern and risk profile, closing together as one retroactive DoD batch.
