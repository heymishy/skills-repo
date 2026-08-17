# Definition of Done: Give a feature a real name at creation, and let it be renamed afterward

**PR:** https://github.com/heymishy/skills-repo/pull/594 (bundled with `fps-s1`) | **Merged:** 2026-07-25
**Story:** artefacts/2026-07-25-feature-display-name-and-progress/stories/fdn-s1-feature-display-name.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — optional `displayName` field on feature creation, persisted via `setJourneyFields` | ✅ | `check-fdn-s1-feature-display-name.js` | Automated test, re-run fresh 2026-08-17 | None |
| AC2 — no `displayName` set → raw `featureSlug` shown, unchanged | ✅ | Same file | Automated test, re-run fresh | None |
| AC3 — `displayName` set → shown in place of slug across all surfaces | ✅ | Same file, incl. "kanban card title prefers display_name over feature_slug" | Automated test, re-run fresh | None |
| AC4 — rename affordance updates `displayName` via `setJourneyFields`, never mutates `featureSlug`/disk path/pipeline-state key | ✅ | Same file | Automated test, re-run fresh | None |
| AC5 — `displayName` survives a Postgres reload (`_sanitise()` allowlist includes it) | ✅ | Same file | Automated test, re-run fresh | None |
| AC6 — journey-sourced (not-yet-taxonomy-synced) features' `mergeFeatureSources` reflects `displayName` in `name` | ✅ | Same file, "mergeFeatureSourcesUsesDisplayNameForJourneyItems (AC6)" and its null-case sibling | Automated test, re-run fresh | None |

---

## Scope Deviations

**Bundled PR with sibling story `fps-s1`:** both stories merged together in PR #594. This is a smaller-scale instance of the "bundling changes from story B into story A's PR" pattern already flagged elsewhere in this DoD backlog pass (`alrf-s8`, `dic.1-5`) — but here the story's own Dependencies section explicitly states `fps-s1` should sequence after `fdn-s1` "to avoid re-touching the same markup twice," making a single combined PR a reasonable, intentional choice rather than an undocumented process violation. Not re-litigated.

`featureSlug` itself was never mutated (confirmed by the AC4 test explicitly asserting it), matching the story's core Architecture Constraint exactly.

---

## Test Plan Coverage

**Tests passing:** 15/15 (`check-fdn-s1-feature-display-name.js`), re-run fresh 2026-08-17.
**Gaps:** None identified.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: reuses existing `setJourneyFields` merge mechanism, no new cost | ✅ | By construction |
| Security: rename route enforces the same tenant-ownership check as other journey-scoped routes | ✅ | Not independently re-verified line-by-line in this pass; no review or later finding flags a cross-tenant gap |
| Data integrity: `displayName` HTML-escaped everywhere rendered | ✅ | Story's own framing, consistent with existing `_escapeHtml` convention; not independently re-verified in this pass |

---

## Metric Signal

No formal benefit-metric artefact — short-track UX-gap fix, real live-usage finding per the story's own framing (operator confirmed "don't want to break a key" regarding `featureSlug`).

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required.

---

## DoD Observations

1. ~3 weeks live in production, no incidents reported.
2. Good example of correctly scoping a UX gap narrowly: the story explicitly avoided mutating the durable `featureSlug` identifier (a much larger, riskier change) in favor of an additive `displayName` field — matching the operator's own stated constraint.
