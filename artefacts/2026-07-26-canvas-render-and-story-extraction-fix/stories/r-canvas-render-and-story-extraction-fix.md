# Retrospective Story: Fix /design and /definition canvas rendering + story-extraction, both broken by the same stale mock fixtures

**Story ID:** r-canvas-render-and-story-extraction-fix
**Retrospective audit date:** 2026-07-26
**Committed in:** PR #613 (merged 2026-07-26), commits `dd249930` and `01ebe78d`
**Risk classification:** MEDIUM (real production code changes to `src/web-ui/routes/skills.js`, `src/web-ui/server.js`, `src/web-ui/views/chat-view.js` — user-visible rendering behaviour for two of three skills that use the canvas mechanism)

**Epic reference:** `artefacts/2026-07-25-code-shape-diagrams/epics/csd-e1-code-shape-diagrams.md` — this retrospective covers a real gap in that epic's own delivered functionality, found via manual staging testing after the epic's DoD pass
**Discovery reference:** no discovery — found live via operator manual testing on staging, not a planned story
**Benefit-metric reference:** `artefacts/2026-07-25-code-shape-diagrams/benefit-metric.md` — this fix is what makes P1/P2 (Time-to-drift-determination, Diagram completion rate) actually observable for `/design` and `/definition`, which were silently non-functional despite csd-s3/csd-s4's own DoD marking them COMPLETE

## What was delivered

An operator reported that after testing on staging, no design/architecture diagram was visible during a `/design` or `/definition` session, despite csd-s3/csd-s4 (already DoD-COMPLETE) having taught those skills to emit CANVAS-JSON markers. Investigation found **three independent, compounding causes**, all traced back to the same root: `tests/e2e/fixtures/llm-gateway/design.success.json` and `definition.success.json` (the canned responses staging serves via `MOCK_LLM_GATEWAY=true`) predated csd-s3/csd-s4 by two weeks and were never updated to match either the marker-emission convention or the story-ID extraction format those later stories' downstream logic depends on.

**Key files already committed:**
- `tests/e2e/fixtures/llm-gateway/design.success.json` / `definition.success.json` — now embed a real CANVAS-JSON marker matching each skill's documented worked example, and `definition.success.json`'s artefact body now uses the H1 Epic/Story header format with a dot-separated story ID, matching what `extractStoryIdsFromDefinitionArtefact` (dtra-s1/dsda-s1, PR #587, merged 2026-07-24) actually requires.
- `src/web-ui/views/chat-view.js` — added a `#canvas-panel` "Diagrams" section to the artefact-pane branch (used by every non-`/ideate` skill), alongside the pre-existing Artefact Draft/Story Map panel (confirmed still working correctly on its own).
- `src/web-ui/routes/skills.js` — introduced a shared `supportsCanvas` flag (`isIdeate || design || definition`) extending three previously `/ideate`-only gates: the `mermaid.min.js` asset script tag, the server-side `session.canvasBlocks` init-hydration script, and the client-side `SUPPORTS_CANVAS` re-hydration check on page load/resume.
- `src/web-ui/server.js` — the `NODE_ENV=test` local-dev stub adapter (a separate hardcoded canned response, distinct from the fixture-file mock gateway) also had no CANVAS-JSON markers; added both marker types since the stub is skill-agnostic.
- `tests/check-icrh-s1-ideate-canvas-resume-hydration.js` — AC3/AC4 updated to test the new `supportsCanvas` boundary (a genuinely canvas-unsupported skill, and the renamed `SUPPORTS_CANVAS` gate) instead of the old ideate-only assumptions this fix deliberately superseded.
- `tests/e2e/design-definition-canvas-render.spec.js` — new E2E test driving a real `/design` and a real `/definition` session through the actual streaming chat UI, asserting the canvas renders a real mermaid SVG.

**Observed behaviour:** A real `/design` or `/definition` session (via the mock gateway, matching staging's configuration) now renders its diagram in a "Diagrams" panel alongside the existing artefact/story-map content. Completing `/definition` now correctly finds its story list and (per the already-existing, separately-merged dtra-s1/dsda-s1 logic) can auto-proceed into review rather than always falling back to the manual story-list confirmation page.

## Benefit Linkage

**Metric moved:** P1 — Time-to-drift-determination; P2 — Diagram completion rate (both from the parent epic's benefit-metric.md).
**How:** csd-s3/csd-s4 were marked DoD-COMPLETE with passing tests, but those tests only verified the SKILL.md instruction text and module logic in isolation — none exercised the real end-to-end rendering path for `/design`/`/definition` specifically (all rendering tests used `/ideate`). This meant the epic's own primary benefit mechanism was silently non-functional for 2 of 3 diagram-emission points despite every existing test passing. This retrospective closes that gap for real, verified via a new E2E test that exercises the actual browser/streaming path a staging operator uses.

## User Story

As a **Developer/engineer using the SaaS product on staging**,
I want **a `/design` or `/definition` session's diagram to actually render, and `/definition`'s story list to carry forward automatically**,
So that **the epic's own stated benefit (visual inspection of intended shape, reduced manual re-entry) is real, not just passing in isolated unit tests**.

## Acceptance Criteria

**AC1 — `/design` session renders its System Architecture diagram**
Status: ALREADY-MET
Evidence: `tests/e2e/design-definition-canvas-render.spec.js` — real browser/streaming test, passing reliably across repeated runs (each test on its own isolated tenant to avoid a pre-existing 30-turns/min-per-tenant rate limiter interaction observed during this investigation).

**AC2 — `/definition` session renders its Program Design diagram**
Status: ALREADY-MET
Evidence: same test file, second test case.

**AC3 — `/definition`'s story list is extractable and the existing auto-skip-to-review logic (dtra-s1/dsda-s1) can act on it**
Status: NEEDS-TESTS
Evidence: `extractStoryIdsFromDefinitionArtefact`'s logic, run directly against the corrected fixture, finds `["mock-fixture.1"]` (manually verified this session, not yet captured as an automated regression test). A direct debug check of the real streaming path additionally surfaced an unexplained 400 on `POST /api/journey/:id/gate-confirm` immediately after a real (not JSON-API-driven) `/definition` turn — not chased to a root cause in this session; may be an artifact of the debug script's construction rather than a real production issue, but this is NOT confirmed either way.

**AC4 — No regression to existing canvas/artefact rendering behaviour**
Status: ALREADY-MET
Evidence: `tests/check-icrh-s1-ideate-canvas-resume-hydration.js` (15/15, updated for the new boundary), `bri-s3.2`'s own journey spec (4/4, unaffected), `csd-s1`/`csd-s2`'s own specs (unaffected), full suite (414 files, 38 failed — matches documented baseline exactly).

## Out of Scope

- Root-causing the AC3 400-error observation — flagged as an open question, not chased further in this session given diminishing returns; a future session should investigate directly rather than assume it's benign.
- A full DoD re-pass on csd-s3/csd-s4 themselves (their own DoD artefacts are not amended by this retrospective) — this retrospective documents the NEW fix, not a retroactive edit of already-closed DoD records.
- Extending automated test coverage for the AC3 story-extraction boundary via the real journey flow (only manually verified this session) — see Open Questions.

## Open Questions

- [ ] Add an automated regression test asserting `extractStoryIdsFromDefinitionArtefact` finds the expected story ID(s) from the `definition.success.json` fixture directly (AC3's NEEDS-TESTS gap) — currently only manually verified via a one-off script.
- [ ] Investigate the AC3 400-error observation on `gate-confirm` after a real streaming `/definition` turn to a firm root cause (confirm whether it's a genuine production bug or a debug-script artifact).
- [ ] Consider whether this retrospective should have gone through the full outer-loop chain (discovery → benefit-metric → definition → review) rather than landing as a live bug-fix + retrospective, given it touches real `src/web-ui/` production code, not just bookkeeping or scripts. This session treated it as a short-track bug fix (test-plan-equivalent verification + PR + CI), consistent with how the epic's own follow-up (csd-s7) was handled, but the Artefact-first rule's letter arguably wanted a DoR-signed-off story before implementation, not after.

## Traceability Linkage

**DoR artefact:** not yet written — this retrospective itself stands in for pre-implementation DoR review, retroactively, per the retrospective-story convention
**Test plan:** not yet written as a separate artefact — test coverage is real (`design-definition-canvas-render.spec.js`, `icrh-s1` updates) but not organized into a formal test-plan.md
**Verification script:** not yet written
**DoD artefact:** not yet written — recommend writing one once the AC3 test-coverage gap and 400-error question are resolved

## Notes

- This retrospective exists because the underlying fix was investigated and merged live, in direct response to the operator's own staging observation, rather than through a scheduled retrospective audit.
- Both real bugs (canvas rendering, story extraction) trace to the exact same root cause: `tests/e2e/fixtures/llm-gateway/*.success.json` fixtures were never updated when csd-s3/csd-s4 changed what `/design` and `/definition` actually produce. Worth a standing convention: whenever a story changes a skill's documented output format (new markers, new header/ID conventions), check whether any `tests/e2e/fixtures/llm-gateway/*.json` fixture needs a matching update, since staging's `MOCK_LLM_GATEWAY=true` configuration means these fixtures are the ONLY thing staging ever actually exercises for that skill — no amount of unit-level SKILL.md-instruction-text testing catches a stale fixture.
