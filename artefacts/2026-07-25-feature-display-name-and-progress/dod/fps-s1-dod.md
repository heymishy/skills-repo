# Definition of Done: Show pipeline progress instead of a bare "Unknown" for features with no test data yet

**PR:** https://github.com/heymishy/skills-repo/pull/594 (bundled with `fdn-s1`) | **Merged:** 2026-07-25
**Story:** artefacts/2026-07-25-feature-display-name-and-progress/stories/fps-s1-progress-proxy-for-unknown-health.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — `unknown` health + resolvable `journeyId` + N>0 artefacts → `"<stage> · N artefacts"` | ✅ | `check-fps-s1-progress-proxy.js` | Automated test, re-run fresh 2026-08-17 | None |
| AC2 — `unknown` health + resolvable `journeyId` + 0 artefacts → `"<stage> · no artefacts yet"` | ✅ | Same file | Automated test, re-run fresh | None |
| AC3 — `unknown` health + no resolvable `journeyId` → falls back to plain `"No test data yet"` | ✅ | Same file, "unknownHealthWithJourneyIdNotInCountsMapFallsBackToPlainText (AC3/AC4)" | Automated test, re-run fresh | None |
| AC4 — bulk artefact-count read failure degrades gracefully, page still renders | ✅ | Same file, "bulkReadFailureDoesNotBreakPageRender (AC4)" | Automated test, re-run fresh | None |
| AC5 — green/amber/red health rows completely unchanged | ✅ | Same file, "realHealthRowsUnchanged (AC5)" | Automated test, re-run fresh | None |
| AC6 — exactly one batched call per render, never N+1 | ✅ | Same file, "exactlyOneBatchedCallPerRender (AC6)" | Automated test, re-run fresh | None |

---

## Scope Deviations

**Bundled PR with sibling story `fdn-s1`:** see `fdn-s1-dod.md`'s Scope Deviations section — same reasoning applies here (explicit, intentional sequencing dependency stated in both stories' own Dependencies sections, not an undocumented violation).

None of the health-computation logic itself was touched (confirmed by AC5's explicit unchanged-rows test) — story stayed scoped to the `unknown` case's display text only, exactly as its Architecture Constraints required.

---

## Test Plan Coverage

**Tests passing:** 7/7 (`check-fps-s1-progress-proxy.js`), re-run fresh 2026-08-17.
**Gaps:** None identified.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: exactly one additional batched query per render, no N+1 | ✅ | AC6, re-run fresh, passing |
| Reliability: failed/unavailable artefact-count read degrades to existing text, never surfaces an error | ✅ | AC4, re-run fresh, passing |
| Accessibility: text-label-always-present convention unchanged (health never colour-only) | ✅ | Story's own framing — no new visual surface, text-only change |

---

## Metric Signal

No formal benefit-metric artefact — short-track UX-gap fix, real live-usage finding (every brand-new feature showed a "broken-looking" `? Unknown` / `No test data yet` state by default before this fix).

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required. Story's own Out of Scope item (applying this same enrichment to the kanban board view) is correctly excluded — `s2.2` already covers that surface with its own artefact-count badge, not a gap.

---

## DoD Observations

1. ~3 weeks live in production, no incidents reported.
2. Reused an already-proven batching mechanism (`s2.2`'s `_getArtefactCountsBulk`) end-to-end rather than building a second implementation — good example of cross-story reuse discipline.
3. Closes the 2-story `2026-07-25-feature-display-name-and-progress` cluster (`fdn-s1`/`fps-s1`, both DoDs written in this same session pass).
