## Test Plan: Feed as-built Data Model / System Architecture into /design's system prompt

**Story reference:** artefacts/2026-07-25-code-shape-diagrams/stories/alrf-s9-design-as-built-context-injection.md
**Epic reference:** csd-e1-code-shape-diagrams
**Test plan author:** Claude (agent) — retrospective backfill, 2026-08-21
**Date:** 2026-08-21

**Backfill note:** this test plan is reconstructed after the fact — the implementation and its test file (`tests/check-alrf-s9-design-as-built-context.js`) already existed and were merged (PR #620, 2026-07-26); this artefact documents the coverage that already exists, per `templates/retrospective-story.md`'s convention, rather than designing new tests.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `/design` system prompt includes the real product's as-built Data Model | 1 test | — | — | — | — | 🟢 |
| AC2 | `/design` system prompt includes the real product's as-built System Architecture | 1 test | — | — | — | — | 🟢 |
| AC3 | Scoped to `/design` only; other skills unaffected | 1 test | — | — | — | — | 🟢 |
| AC4 | A product with no migrations yet degrades gracefully (no throw, session still builds) | 1 test | — | — | — | — | 🟢 |
| AC5 | Read-only: building a `/design` system prompt never writes a new versioned artefact as a side effect | 1 test | — | — | — | — | 🟢 |
| AC6 | No regression to existing `buildSystemPrompt` behaviour for other skills/scenarios | — | 7 regression suites | — | — | — | 🟢 |

---

## Coverage gaps

None. All 6 ACs have direct test coverage.

---

## Test Data Strategy

**Source:** This repo's own real migrations and codebase — the implementation deliberately reads the actual product's real `scripts/migrate-schema-*.js` files, so its own test uses this repo as the real fixture (no synthetic data needed).
**PCI/sensitivity in scope:** No
**Availability:** Available now — self-contained, no external dependency.
**Owner:** Self-contained.

---

## Unit Tests

Tests live in `tests/check-alrf-s9-design-as-built-context.js` (8 assertions total, covering AC1–AC5):

- **AC1:** `/design` system prompt section 3.6 includes generated Data Model mermaid output from `generateAsBuiltDataModelDiagram({repoRoot})`, verified against this repo's real migrations.
- **AC2:** Same section includes generated System Architecture mermaid output from `generateAsBuiltSystemArchitectureDiagram({repoRoot})`.
- **AC3:** `buildSystemPrompt()` for `skillName !== 'design'` (e.g. `/discovery`) does not include section 3.6.
- **AC4:** A product with no migrations/services yet: both generator calls wrapped in try/catch, no throw, session still builds without the section.
- **AC5:** Building a `/design` system prompt never calls `writeAsBuiltDiagramArtefact` — no new versioned artefact directory created as a side effect.

---

## Integration Tests

**AC6 (regression):** 7 existing regression suites confirmed unchanged by this change (re-run fresh 2026-08-17 during the retroactive DoD pass): `check-icv-s1-ideate-canvas-turn2-render-fix.js` (3/3), `check-iwu5-lens-complete.js`, `check-iwu6-skillmd.js` (15/15), `check-psh-s10-standards-injection.js` (8/8), `check-psh-s5-context-injection.js` (9/9), `check-sdg2-journey-persistence.js` (8/8), `check-wucp3-tool-executor.js` (21/21). Two pre-existing, unrelated failures (`check-ougl1-buildsystemprompt-handoff.js` T1.6, `check-wucp1-context-autoloader.js` 4 failures) confirmed via `git stash` to be identical with or without this change.

---

## E2E Tests

None — this is a system-prompt-construction feature, exercised at the module/integration level; no browser-rendered behaviour is involved.

---

## NFR Tests

None — no NFRs named beyond the correctness ACs above (LOW risk classification: additive, read-only, falls back to no-op).

---

## Out of Scope for This Test Plan

- Feeding the as-built snapshot into `/definition` or any other skill besides `/design` (story's own Out of Scope).
- A UI affordance showing what context was injected (story's own Out of Scope).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
