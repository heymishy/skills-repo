## Review: mds-s1 — Add a richer mock-gateway scenario covering every diagram type a skill session can legitimately emit

**Story:** artefacts/2026-08-10-mock-diagram-showcase-fixtures/stories/mds-s1-diagram-showcase-mock-scenario.md
**Reviewer:** Claude (agent), operator-directed — found while live-validating drh-s1 on staging
**Date:** 2026-08-10

---

### Category A: Traceability

PASS. Directly traces to the operator's own observation while validating `drh-s1` live ("mocked responses likely need more data with markers"), and grounds every fixture's proposed content in the ACTUAL skill instructions (`skills/ideate/SKILL.md`, `skills/design/SKILL.md`, `skills/definition/SKILL.md`) rather than an arbitrary assortment of diagram types — confirmed by direct source read of each SKILL.md's own marker-emission instructions.

### Category B: Scope discipline

PASS. Explicitly protects the existing `success` fixtures (AC4's byte-identical guarantee) after discovering a real hard constraint (`check-a3-ideate-artefact-disk-match.js`'s exact-one-marker assertion) that would have made direct modification unsafe. Correctly excludes `drift-signal` (a different code path — as-built comparison, not live-session emission) and correctly excludes building true per-turn response cycling (a materially larger mock-gateway change) in favour of the simpler, bounded "multiple markers in one response" approach.

### Category C: AC quality

PASS. 6 ACs, Given/When/Then, each independently testable. AC4 is an explicit non-regression guarantee for the exact risk this story's own investigation surfaced. AC6 directly addresses the operator's follow-up instruction (ensure design/definition coverage AND that it works with resuming) by validating the new fixture data through the actual `drh-s1` resume-history view, not just the extraction layer in isolation — the right level to prove the fixtures are useful, not just present.

### Category D: Completeness

PASS. NFRs correctly identify test isolation (protecting the existing exact-match test) as the primary risk this story must not create, alongside basic parseability correctness. Complexity rated 1, appropriately — purely additive fixture data, zero changes to rendering/parsing/extraction code already proven correct by `drh-s1`.

### Category E: Architecture compliance

PASS. Reuses the existing `scenarioName` extensibility point (`success`/`failure` already exist as siblings; `diagram-showcase` is a natural third) rather than inventing a new mechanism. Correctly identifies `inventoryFixtures()` as already designed to accommodate new scenario names without modification.

---

### Verdict

**PASS — 0 HIGH findings.** A well-grounded, low-risk test-infrastructure story that turns a real, just-discovered constraint (the exact-marker-count test) into an explicit protection (AC4) rather than a silent risk. AC6's resume-view validation directly closes the loop the operator asked for. Cleared to proceed to `/test-plan`.
