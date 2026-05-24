# Review Report: Wire CLI validate to CI assurance gate — Run 1

**Story reference:** `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-03-cli-validate-ci.md`
**Date:** 2026-05-24
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** E / C — Architecture compliance + AC completeness — The story's architecture constraint states: "If H-gate logic currently lives only in `cli-outer-loop.js`, extracting it to `governance-package.js` is in scope for this story." At the time of writing, H1-H9 evaluation logic IS in `cli-outer-loop.js` and is NOT in `governance-package.js`. The constraint therefore activates, making the extraction in scope. However, no AC specifies this extraction — an implementer reading only the ACs would wire `skills validate --ci` to call `cli-outer-loop.js` directly without moving the H-gate logic to `governance-package.js`, violating ADR-013 ("no surface adapter reimplements governance logic independently; all gate evaluation routes through the shared governance package"). Without this AC, a compliant test suite can pass while the ADR-013 obligation is unmet, leaving the story unable to satisfy the architecture constraint at DoD.
  Fix: Add an AC covering the governance-package extraction. Suggested text: "Given `skills validate --ci` evaluates H1-H9 for a story, when the evaluation is complete, then the H-gate evaluation functions are exported from `governance-package.js` and `skills validate` calls them through the governance package — `cli-outer-loop.js` and `bin/skills` do not contain independent H-gate evaluation logic. A test asserts that the H1-H9 check functions are importable from `governance-package.js`."

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** C — AC quality — AC1 states CI "calls `node bin/skills validate --story <story-slug> --ci` for each story in the PR's feature" but does not specify how the CI workflow identifies which feature and stories are associated with the PR. The existing `extractPRSlug` function handles feature slug resolution from PR body content, but AC1 does not reference this mechanism or define an equivalent. An implementer must guess or discover the resolution strategy from the existing codebase. This gap is also related to assumption A3 (DoR path resolution for multi-story features), which AC6 acknowledges at a process level but AC1 does not address at implementation level.
  Risk if proceeding: the implementer may derive a feature-slug resolution strategy inconsistent with the existing `extractPRSlug` logic, causing A3 false-positives that AC6's RISK-ACCEPT path is supposed to catch — but only if the implementer notices the inconsistency.
  To acknowledge: run /decisions, category RISK-ACCEPT

---

## LOW findings — note for retrospective

- **[1-L1]** C — AC quality — AC5 ("Given SC-03 is deployed and 10 consecutive PRs pass skills validate --ci without false-positive rejections") and AC6 ("when the pattern is identified, then a RISK-ACCEPT entry is written") are deployment/process gates, not assertions verifiable by `npm test`. Both are valid DoD evidence conditions. Flag for test-plan author: AC5 maps to a post-deployment observation record, AC6 maps to a `/decisions` log entry, neither is a test file assertion.

---

## Category scores

| Category | Score (1–5) | Notes |
|----------|-------------|-------|
| A — Traceability | 5 | M2 named in user story "so that" clause with explicit before/after quantification (0 of 9 → 9 of 9). Discovery → benefit-metric → epic chain complete. Downstream M4 dependency noted. |
| B — Scope | 5 | Out-of-scope section correctly excludes historical story re-evaluation, replacing structural checks, automating dorStatus, and merge-blocking H-gates. |
| C — AC quality | 2 | AC2/AC3/AC4 precise and testable. AC1 missing feature slug resolution mechanism (M1). No AC for governance-package extraction required by architecture constraint (H1). AC5/AC6 are process/deployment gates (L1). |
| D — Completeness | 5 | All template fields populated. Named persona. Performance NFR (60s for ≤10 stories) and output format NFR both present. |
| E — Architecture compliance | 4 | ADR-013, ADR-009, ADR-011 all referenced. Output format references SC-04 standard. ADR-013 compliance obligation is identified in constraints, but the corresponding AC is missing (H1 above). |

---

## Summary

1 HIGH, 1 MEDIUM, 1 LOW across 1 story.
**Outcome:** FAIL
