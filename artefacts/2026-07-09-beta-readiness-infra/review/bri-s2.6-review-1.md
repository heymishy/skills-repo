# Review Report: Add staging smoke test + manual promote gate to prod — Run 1

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.6-smoke-test-promote-gate.md
**Date:** 2026-07-09
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** A — The Epic 3 dependency, while disclosed honestly within this story's own Dependencies and Architecture Constraints sections, is not reflected at all in `epic-2-staging-environment.md`, whose "Stories in This Epic" checklist implies Epic 2 is self-contained and independently completable. It is not: this story, the terminal story of Epic 2, cannot be verified as written without at least S3.1 (Epic 3) existing. This also inverts discovery's explicit "hard constraint, not a preference" sequencing rule ("sub-feature 2 must pass its own smoke test before sub-feature 3's specs are written against it"), since this story's own smoke-test gate depends on an Epic 3 artefact existing first.
  Fix: Update `epic-2-staging-environment.md`'s Goal/Stories section to explicitly note this story's dependency on S3.1, and/or re-examine whether discovery's stated sequencing (2 before 3) actually holds given this reverse-dependency — this may need a `/decisions` entry acknowledging the sequencing is not as strictly linear as discovery implied.
- **[1-H2]** C — AC1 states the gate runs "the smoke test + full regression/Playwright suite" and reports "a clear pass/fail result," but the Architecture Constraints section immediately concedes "this story's AC1 assumes at least the `@mocked` suite exists; full richness grows as Epic 3 stories land." The AC's literal wording promises a "full regression + Playwright suite" that will not exist at this story's actual implementation/DoD point.
  Fix: Rewrite AC1 to match what is actually deliverable at this story's DoD (e.g. "the currently-available `@mocked` suite," growing over time) rather than asserting "full regression + Playwright suite" as if complete.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** E — ADR-018 (Playwright is the sole E2E framework) is directly applicable — it is the gate that decides when the Playwright suite is "green" — yet it is not referenced in Architecture Constraints.
  Risk if proceeding: low, but should be cited given how central Playwright is to this story's own gate logic.
  To acknowledge: add the citation.

---

## LOW findings — note for retrospective

- **[1-L1]** E — The Neon 30-second cold-start timeout budget is re-cited here without re-flagging that the source figure is itself ungrounded (see bri-s2.2 finding 1-H1) — this story inherits that unresolved risk into its own smoke-test tolerance logic.

---

## Summary

2 HIGH, 1 MEDIUM, 1 LOW.
**Outcome:** FAIL

Scores — A-Traceability: 3, B-ScopeIntegrity: 4, C-ACQuality: 3, D-Completeness: 5. This is the weakest story in Epic 2 — the undisclosed cross-epic dependency and the AC1/constraints mismatch should be resolved before DoR, in addition to the resolution of 1-H1.
