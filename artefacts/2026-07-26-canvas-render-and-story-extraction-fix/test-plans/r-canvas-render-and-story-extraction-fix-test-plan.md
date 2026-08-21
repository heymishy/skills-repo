## Test Plan: Fix /design and /definition canvas rendering + story-extraction, both broken by the same stale mock fixtures

**Story reference:** artefacts/2026-07-26-canvas-render-and-story-extraction-fix/stories/r-canvas-render-and-story-extraction-fix.md
**Epic reference:** csd-e1-code-shape-diagrams
**Test plan author:** Claude (agent) — retrospective backfill, 2026-08-21
**Date:** 2026-08-21

**Backfill note:** this test plan is reconstructed after the fact — the implementation was merged (PR #613, 2026-07-26) as a live bug-fix; this artefact documents the coverage that already exists, per `templates/retrospective-story.md`'s convention. AC3's gap below is genuine and was already independently found and logged as **F3** (`workspace/dod-backlog-findings.md`) with its own follow-up story (`csgc-s1`, `artefacts/2026-08-17-canvas-story-extraction-gate-confirm-gap/`) — not re-fixed here.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `/design` session renders its System Architecture diagram | — | — | 1 test | — | — | 🟢 |
| AC2 | `/definition` session renders its Program Design diagram | — | — | 1 test | — | — | 🟢 |
| AC3 | `/definition`'s story list is extractable and the auto-skip-to-review logic can act on it | — | — | — | 1 (manual only) | Untested | 🔴 |
| AC4 | No regression to existing canvas/artefact rendering behaviour | — | 4 regression suites | — | — | — | 🟢 |

---

## Coverage gaps

**AC3** — `extractStoryIdsFromDefinitionArtefact`'s logic was only manually verified against the corrected fixture (found `["mock-fixture.1"]` correctly), never captured as an automated regression test. A separate, unexplained `400` on `POST /api/journey/:id/gate-confirm` immediately after a real streaming `/definition` turn was also observed but never root-caused. **This gap is already tracked separately as F3 / `csgc-s1`** — not re-scoped into this backfill.

---

## Test Data Strategy

**Source:** Mocked external services — `tests/e2e/fixtures/llm-gateway/design.success.json` and `definition.success.json` (the same fixtures this fix corrected) drive both E2E tests via `MOCK_LLM_GATEWAY=true`.
**PCI/sensitivity in scope:** No
**Availability:** Available now — fixtures already exist and are the subject of the fix itself.
**Owner:** Self-contained.

---

## Unit Tests

None directly for AC1/AC2 (E2E-only, real browser rendering).

---

## Integration Tests

**AC4 (regression):** `tests/check-icrh-s1-ideate-canvas-resume-hydration.js` (15/15, updated for the new `supportsCanvas` boundary), `bri-s3.2`'s own journey spec (4/4, unaffected), `csd-s1`/`csd-s2`'s own specs (unaffected), full suite (414 files, 38 failed at merge time — matched the then-documented baseline exactly).

---

## E2E Tests

### AC1: `/design` session renders its System Architecture diagram

- **Verifies:** AC1.
- **Test:** `tests/e2e/design-definition-canvas-render.spec.js`, first test case — real browser/streaming `/design` session via the mock gateway, asserts the canvas renders a real mermaid SVG. Each test uses its own isolated tenant to avoid a pre-existing rate-limiter interaction.
- **Expected result:** Passes reliably across repeated runs.

### AC2: `/definition` session renders its Program Design diagram

- **Verifies:** AC2.
- **Test:** Same file, second test case.
- **Expected result:** Passes reliably across repeated runs.

---

## NFR Tests

None named.

---

## Out of Scope for This Test Plan

- Root-causing the AC3 400-error observation — already tracked under F3/`csgc-s1`.
- A full DoD re-pass on `csd-s3`/`csd-s4` themselves.
- Whether this retrospective should have gone through the full outer-loop chain — noted in the story's own Open Questions, not a test-coverage question.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC3: `extractStoryIdsFromDefinitionArtefact` has no automated regression test; the gate-confirm 400 is unroot-caused | Only manually verified at merge time; not chased further given diminishing returns in that session | Tracked separately as F3 / `csgc-s1` — run `/test-plan` there to close this gap for real |
