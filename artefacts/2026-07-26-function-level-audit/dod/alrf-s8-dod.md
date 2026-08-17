# Definition of Done: Journey featureSlug priority over response SLUG marker; mock-gateway toggle nav link

**PR:** https://github.com/heymishy/skills-repo/pull/620 | **Merged:** 2026-07-26
**Story:** artefacts/2026-07-26-function-level-audit/stories/alrf-s8-*.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| All ACs (journey `featureSlug` priority over response `SLUG` marker, mock-gateway toggle nav link) | ✅ | `check-alrf-s8-journey-slug-priority.js`, 4/4 assertions | Automated test, re-run fresh on current master 2026-08-17 | None |

---

## Scope Deviations

**Bundled PR, cross-feature:** this PR's own title reads `"fix(alrf-s8): journey slug priority + mock-gateway nav; feat(alrf-s9): design as-built context"` — it bundles `alrf-s9` (a separate feature-cluster's story, `2026-07-25-code-shape-diagrams`'s `alrf-s9-design-as-built-context-injection`) into the same PR/commit as this story. This is a real instance of the "bundling changes from story B into story A's PR" anti-pattern named in `architecture-guardrails.md`. Not re-litigated or reverted at this point (already merged and stable for 3.5 weeks) — flagged here for traceability accuracy, since `alrf-s9`'s own DoD (if/when done) should note the same bundling from its side.

---

## Test Plan Coverage

**Tests passing in CI:** 4/4, re-run fresh 2026-08-17.
**Gaps:** None identified for this story's own scope.

---

## NFR Status

No red flags found in this pass.

---

## Metric Signal

No formal benefit-metric artefact traced for this feature. No metric signal to record.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required now — the bundling is historical and stable. If `alrf-s9`'s own DoD is done separately, cross-reference this note.

---

## DoD Observations

1. **Bundled-PR anti-pattern instance found** (see Scope Deviations) — worth a mention if `/improve` is ever run against this repo's own PR-hygiene patterns, as a real (if minor, already-stable) example alongside `architecture-guardrails.md`'s existing documented rule.
2. ~3.5 weeks live in production, no incidents reported for either bundled story's functionality.
