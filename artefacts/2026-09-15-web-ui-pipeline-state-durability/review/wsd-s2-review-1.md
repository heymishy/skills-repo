# Review Report: wsd-s2 — Run 1

**Story reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/stories/wsd-s2.md
**Date:** 2026-09-15
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

1. **M1 — AC1 implies a live GitHub API test.** "Verifiable by fetching `.github/pipeline-state.json` from the repository afterward" reads as requiring a real, live call against an actual GitHub repo — inconsistent with AC3/AC4, which correctly specify a mocked Contents API, and inconsistent with this repo's own established testing convention for this exact class of code (`check-s6.1-*`, `check-pla-s2-*`: mock `https.request`/`fetch`, never a live external call in the automated suite).
   Risk if proceeding: a test-plan author could reasonably interpret AC1 as requiring network access in CI, which this repo's test suite never does elsewhere.
   **Resolved in this same pass** — AC1 amended to explicitly specify a mocked Contents API, matching AC3/AC4's own phrasing. Not carried forward as an open finding.

---

## LOW findings — note for retrospective

None.

---

## Scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 5 | PASS |

- **AC quality (4, not 5):** M1 above — resolved during this review pass, scored 4 to reflect the gap existed at review time.
- **Architecture compliance (5):** notably strong — the Architecture Constraints section correctly reasons through a real race condition (why chaining `pipeline-state-github-writer.js`'s own GET with `artefact-commit-writer.js`'s `realCommitArtefact`'s separate internal GET-for-sha would silently defeat optimistic concurrency) rather than assuming reuse is automatically safe. This is exactly the kind of scrutiny Category E exists to check for.

---

## Summary

0 HIGH, 1 MEDIUM (resolved in-pass), 0 LOW across 1 story.
**Outcome:** PASS
