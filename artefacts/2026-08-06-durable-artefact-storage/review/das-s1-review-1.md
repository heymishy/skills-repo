# Review Report: Commit completed-stage artefacts to the product's connected repo, with git-fallback on Resume conversation — Run 1

**Story reference:** artefacts/2026-08-06-durable-artefact-storage/stories/das-s1-commit-artefact-to-repo-with-git-fallback.md
**Date:** 2026-08-06
**Categories run:** A, B, C, D, E
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category E (Architecture compliance) — The story's Architecture Constraints direct implementers to "generalise or directly reuse" `sign-off-writer.js`'s `commitSignOff` pattern, but that function is a plain exported function whose internal `fetch()` calls are mocked at the global level in tests (`tests/check-prc-s1.3-sign-off-write-back.js`) — it does **not** follow the D37 injectable-adapter pattern (`let _x = defaultFn; function setX(fn){...}`, throw-on-unwired stub). Meanwhile `mtrr-s2`'s `realListRepos`/`setListReposAdapter` — a structurally similar "call GitHub on behalf of the user" function built this same session — **does** follow D37. The story doesn't resolve which convention the new artefact-commit function should follow, leaving a real design ambiguity for the coding agent to guess at.
  Risk if proceeding: the coding agent could reasonably pick either convention; picking the non-D37 path means the new commit path can't be swapped/mocked the way every other adapter-style GitHub call in this codebase's newer stories (`mtrr-s2`, `prc-s2.1`, `rb-s4`) can, which is a minor but real inconsistency for future maintainers.
  To acknowledge: run /decisions, category RISK-ACCEPT — or resolve now by adding an explicit Architecture Constraint stating which convention to follow.

---

## LOW findings — note for retrospective

- **[1-L1]** Category C (AC quality) — AC5's "Then the page shows a clear, honest 'artefact not found' message" uses soft, subjective language ("clear, honest") rather than a concretely testable assertion. Two reviewers could disagree on whether a given error message satisfies this. Tighten to something like: "Then the page displays an error message stating the artefact could not be retrieved, with no blank or broken-looking panel."

---

## Summary

0 HIGH, 1 MEDIUM, 1 LOW.
**Outcome:** PASS

---

## Score Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 4 | PASS |

**Verdict:** PASS — all criteria scored 3 or above. The one MEDIUM (1-M1) is a real, unresolved design-convention ambiguity worth acknowledging via /decisions or resolving before /definition-of-ready, not a blocker to /test-plan.
